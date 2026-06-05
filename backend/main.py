from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time as _time
from pathlib import Path
from typing import Any, Literal

logging.basicConfig(
    format="%(asctime)s %(levelname)-8s %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from env_loader import load_env

load_env(Path(__file__).resolve().parent / ".env")

from analysis.complexity import analyze_complexity, complexity_is_acceptable
from auth import get_optional_user_id
from judge0.client import run_python
from judge0.config import get_judge0_url
from rate_limit import RateLimiter

app = FastAPI()

_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "").split(",")
    if o.strip()
] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

logger.info("CORS origins: %s", _cors_origins)


@app.middleware("http")
async def log_requests(request: Request, call_next):  # type: ignore[no-untyped-def]
    start = _time.monotonic()
    response = await call_next(request)
    elapsed_ms = (_time.monotonic() - start) * 1000
    logger.info(
        "%s %s %d %.0fms",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)
_judge0_semaphore = asyncio.Semaphore(4)

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class SubmissionRequest(BaseModel):
    problem_id: str
    code: str
    mode: Literal["run", "submit"] = "submit"


class TestCaseResultModel(BaseModel):
    passed: bool
    input: str | None = None
    expected: str | None = None
    actual: str | None = None


class SubmissionResponse(BaseModel):
    verdict: str
    stdout: str
    cases_passed: int
    cases_total: int
    test_case_results: list[TestCaseResultModel]
    submission_id: str | None = None
    complexity_detected: str | None = None

# ---------------------------------------------------------------------------
# Practice problem (works without Supabase)
# ---------------------------------------------------------------------------

PRACTICE_PROBLEM_ID = "2da798cf-79a9-4741-8382-f96dff10efce"

_PRACTICE_PROBLEM: dict[str, Any] = {
    "id": PRACTICE_PROBLEM_ID,
    "function_signature": "def two_sum(nums: list[int], target: int) -> list[int]",
    "reference_solution": (
        "def two_sum(nums, target):\n"
        "    seen = {}\n"
        "    for i, n in enumerate(nums):\n"
        "        if target - n in seen:\n"
        "            return [seen[target - n], i]\n"
        "        seen[n] = i\n"
        "    return []\n"
    ),
    "target_complexity": "O(n)",
    "test_cases": [
        {
            "input": '{"nums": [2, 7, 11, 15], "target": 9}',
            "expected_output": "[0,1]",
        },
        {
            "input": '{"nums": [3, 3], "target": 6}',
            "expected_output": "[0,1]",
        },
        {
            "input": '{"nums": [], "target": 0}',
            "expected_output": "[]",
        },
    ],
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_FUNC_NAME_RE = re.compile(r"def\s+(\w+)\s*\(")


def _extract_function_name(signature: str) -> str:
    match = _FUNC_NAME_RE.search(signature)
    if not match:
        raise ValueError(f"Cannot extract function name from: {signature}")
    return match.group(1)


def _build_wrapper(user_code: str, function_name: str) -> str:
    return "\n".join([
        "import json, sys",
        "",
        user_code,
        "",
        "_input = json.loads(sys.stdin.read())",
        f"_result = {function_name}(**_input)",
        'print(json.dumps(_result, separators=(",", ":")))',
    ])


def _outputs_match(actual: str, expected: str) -> bool:
    try:
        return json.loads(actual) == json.loads(expected)  # type: ignore[no-any-return]
    except (json.JSONDecodeError, ValueError):
        return actual.strip() == expected.strip()


# ---------------------------------------------------------------------------
# Problem loading
# ---------------------------------------------------------------------------

def _load_problem(problem_id: str) -> dict[str, Any] | None:
    if problem_id == PRACTICE_PROBLEM_ID:
        return _PRACTICE_PROBLEM

    try:
        from db.client import get_supabase

        sb = get_supabase()
    except RuntimeError:
        return None

    try:
        resp = (
            sb.table("problems")
            .select("*")
            .eq("id", problem_id)
            .eq("status", "published")
            .maybe_single()
            .execute()
        )
    except Exception:
        logger.exception("Failed to load problem %s from Supabase", problem_id)
        return None
    problem_data: dict[str, Any] | None = resp.data if resp else None  # type: ignore[assignment]
    if not problem_data:
        return None

    tc_resp = (
        sb.table("test_cases")
        .select("input, expected_output, is_hidden")
        .eq("problem_id", problem_id)
        .execute()
    )

    problem_data["test_cases"] = tc_resp.data or []
    return problem_data


# ---------------------------------------------------------------------------
# Test-case execution
# ---------------------------------------------------------------------------

async def _run_single_test(
    wrapper_code: str,
    test_input: str,
    expected_output: str,
) -> TestCaseResultModel:
    try:
        result = await run_python(wrapper_code, test_input)
    except (httpx.HTTPError, ValueError, TimeoutError):
        return TestCaseResultModel(
            passed=False,
            input=test_input,
            expected=expected_output,
            actual="execution error",
        )

    if result.status == "Internal Error":
        return TestCaseResultModel(
            passed=False,
            input=test_input,
            expected=expected_output,
            actual=result.stderr or "internal error",
        )

    actual = result.stdout.strip()
    passed = result.status == "Accepted" and _outputs_match(actual, expected_output)

    return TestCaseResultModel(
        passed=passed,
        input=test_input,
        expected=expected_output,
        actual=actual if result.status == "Accepted" else (result.stderr or result.status),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/deep")
async def health_deep() -> dict[str, Any]:
    checks: dict[str, bool] = {}

    try:
        from db.client import get_supabase
        sb = get_supabase()
        sb.table("problems").select("id", count="exact").limit(1).execute()
        checks["supabase"] = True
    except Exception:
        checks["supabase"] = False

    try:
        async with httpx.AsyncClient(
            base_url=get_judge0_url(), timeout=5.0
        ) as client:
            resp = await client.get("/statuses")
            checks["judge0"] = resp.status_code == 200
    except Exception:
        checks["judge0"] = False

    status = "ok" if all(checks.values()) else "degraded"
    return {"status": status, **checks}


@app.post("/api/v1/submissions", response_model=SubmissionResponse)
async def submit_code(
    payload: SubmissionRequest,
    request: Request,
    user_id: str | None = Depends(get_optional_user_id),
) -> SubmissionResponse:
    if user_id:
        bucket_key = user_id
    else:
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or (request.client.host if request.client else "")
        )
        bucket_key = f"anon:{client_ip}" if client_ip else "anon:global"
    _rate_limiter.check(bucket_key)

    problem = _load_problem(payload.problem_id)
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")

    func_name = _extract_function_name(problem["function_signature"])
    wrapper = _build_wrapper(payload.code, func_name)

    test_cases: list[dict[str, Any]] = problem["test_cases"]
    if not test_cases:
        raise HTTPException(status_code=500, detail="Problem has no test cases")

    async def _bounded_test(tc: dict[str, Any]) -> TestCaseResultModel:
        async with _judge0_semaphore:
            return await _run_single_test(wrapper, tc["input"], tc["expected_output"])

    results = await asyncio.gather(*[_bounded_test(tc) for tc in test_cases])

    cases_passed = sum(1 for r in results if r.passed)
    cases_total = len(results)

    if cases_passed < cases_total:
        verdict = "fail"
        complexity_detected = None
    else:
        complexity_detected = analyze_complexity(payload.code)
        target = problem.get("target_complexity")
        if target and not complexity_is_acceptable(complexity_detected, target):
            verdict = "partial"
        else:
            verdict = "pass"

    first_stdout = results[0].actual or "" if results else ""

    submission_id: str | None = None
    if payload.mode == "submit" and user_id and payload.problem_id != PRACTICE_PROBLEM_ID:
        try:
            from db.client import get_supabase

            sb = get_supabase()
            insert_data: dict[str, Any] = {
                "user_id": user_id,
                "problem_id": payload.problem_id,
                "code": payload.code,
                "verdict": verdict,
                "cases_passed": cases_passed,
                "cases_total": cases_total,
            }
            if complexity_detected is not None:
                insert_data["complexity_detected"] = complexity_detected
            row = (
                sb.table("submissions")
                .insert(insert_data)
                .execute()
            )
            rows: list[Any] = row.data or []
            if rows:
                submission_id = str(rows[0]["id"])
        except Exception:
            logger.exception("Failed to persist submission for user %s", user_id)

    for tc, r in zip(test_cases, results):
        if tc.get("is_hidden"):
            r.input = None
            r.expected = None
            r.actual = "hidden" if not r.passed else None

    return SubmissionResponse(
        verdict=verdict,
        stdout=first_stdout,
        cases_passed=cases_passed,
        cases_total=cases_total,
        test_case_results=results,
        submission_id=submission_id,
        complexity_detected=complexity_detected,
    )
