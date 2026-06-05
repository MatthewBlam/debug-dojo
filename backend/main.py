from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time as _time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analysis.complexity import analyze_complexity, complexity_is_acceptable
from auth import require_user_id
from db.client import get_supabase
from env_loader import load_env
from judge0.client import RunResult, run_python
from judge0.config import get_judge0_url
from llm.feedback import generate_feedback_card
from rate_limit import RateLimiter

load_env(Path(__file__).resolve().parent / ".env")

logging.basicConfig(
    format="%(asctime)s %(levelname)-8s %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

app = FastAPI()

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
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


_rate_limiter = RateLimiter(max_requests=20, window_seconds=60)
_judge0_semaphore = asyncio.Semaphore(4)


class ProblemListItem(BaseModel):
    id: str
    short_id: str
    title: str
    difficulty: str
    bug_category: str
    target_complexity: str
    tags: list[str]


class VisibleTestCase(BaseModel):
    input: dict[str, Any]


class ProblemDetail(ProblemListItem):
    description: str
    function_signature: str
    slop_code: str
    visible_test_cases: list[VisibleTestCase]


class RunRequest(BaseModel):
    problem_id: str
    code: str


class SubmissionRequest(BaseModel):
    problem_id: str
    code: str


class TestCaseResultModel(BaseModel):
    passed: bool
    input: dict[str, Any] | None = None
    expected: str | None = None
    actual: str | None = None
    hidden: bool = False


class JudgeResult(BaseModel):
    verdict: Literal["pass", "partial", "fail"]
    stdout: str
    cases_passed: int
    cases_total: int
    test_case_results: list[TestCaseResultModel]
    complexity_detected: str | None = None
    feedback_card: str | None = None


class SubmissionCreateResponse(BaseModel):
    submission_id: str
    verdict: Literal["pending"] = "pending"


class SubmissionStatusResponse(BaseModel):
    id: str
    problem_id: str
    problem_title: str | None = None
    problem_short_id: str | None = None
    verdict: Literal["pending", "pass", "partial", "fail"]
    cases_passed: int
    cases_total: int
    complexity_detected: str | None = None
    feedback_card: str | None = None
    test_case_results: list[TestCaseResultModel] = []
    created_at: str


class ProgressDifficulty(BaseModel):
    total: int = 0
    solved: int = 0


class ProgressResponse(BaseModel):
    total_problems: int
    solved_problems: int
    attempts: int
    passed_submissions: int
    partial_submissions: int
    failed_submissions: int
    accuracy: float | None
    by_difficulty: dict[str, ProgressDifficulty]
    by_bug_category: dict[str, int]


_FUNC_NAME_RE = re.compile(r"def\s+(\w+)\s*\(")


def _extract_function_name(signature: str) -> str:
    match = _FUNC_NAME_RE.search(signature)
    if not match:
        raise ValueError(f"Cannot extract function name from: {signature}")
    return match.group(1)


def _build_wrapper(code: str, function_name: str) -> str:
    return "\n".join(
        [
            "import json, sys",
            "",
            code,
            "",
            "_input = json.loads(sys.stdin.read())",
            f"_result = {function_name}(**_input)",
            'print(json.dumps(_result, separators=(",", ":"), sort_keys=True))',
        ]
    )


def _normalize_output(value: str) -> Any:
    stripped = value.strip()
    try:
        return json.loads(stripped)
    except (json.JSONDecodeError, ValueError):
        return stripped


def _input_to_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("Test case input must be a JSON object")


def _input_to_stdin(value: Any) -> str:
    return json.dumps(_input_to_dict(value), separators=(",", ":"), sort_keys=True)


def _rate_limit_key(request: Request, user_id: str | None) -> str:
    if user_id:
        return user_id
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "")
    )
    return f"anon:{client_ip}" if client_ip else "anon:global"


def _safe_problem(row: dict[str, Any], tags: list[str]) -> ProblemListItem:
    return ProblemListItem(
        id=str(row["id"]),
        short_id=str(row["short_id"]),
        title=str(row["title"]),
        difficulty=str(row["difficulty"]),
        bug_category=str(row["bug_category"]),
        target_complexity=str(row["target_complexity"]),
        tags=tags,
    )


def _load_tags(problem_ids: list[str]) -> dict[str, list[str]]:
    if not problem_ids:
        return {}
    sb = get_supabase()
    rows = (
        sb.table("problem_tags")
        .select("problem_id, tag, position")
        .in_("problem_id", problem_ids)
        .order("position")
        .execute()
        .data
        or []
    )
    tags: dict[str, list[str]] = {pid: [] for pid in problem_ids}
    for row in rows:
        tags.setdefault(str(row["problem_id"]), []).append(str(row["tag"]))
    return tags


def _load_problem_for_judge(problem_id: str) -> dict[str, Any]:
    sb = get_supabase()
    problem = (
        sb.table("problems")
        .select(
            "id, short_id, title, description, difficulty, bug_category, target_complexity, "
            "slop_code, reference_solution, function_signature"
        )
        .eq("id", problem_id)
        .eq("status", "published")
        .maybe_single()
        .execute()
        .data
    )
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    cases = (
        sb.table("test_cases")
        .select("id, input, is_hidden, position")
        .eq("problem_id", problem_id)
        .order("position")
        .execute()
        .data
        or []
    )
    if not cases:
        raise HTTPException(status_code=500, detail="Problem has no test cases")
    problem["test_cases"] = cases
    return problem


async def _run_wrapped_code(wrapper_code: str, stdin: str) -> RunResult:
    async with _judge0_semaphore:
        return await run_python(wrapper_code, stdin)


def _result_output(result: RunResult) -> tuple[bool, str]:
    if result.status == "Accepted":
        return True, result.stdout.strip()
    if result.status == "Internal Error":
        return False, result.stderr or "internal error"
    return False, result.stderr or result.status


async def _run_single_case(
    *,
    user_wrapper: str,
    reference_wrapper: str,
    test_case: dict[str, Any],
    include_io: bool,
) -> TestCaseResultModel:
    stdin = _input_to_stdin(test_case["input"])
    input_dict = _input_to_dict(test_case["input"])
    hidden = bool(test_case.get("is_hidden"))

    try:
        user_result, reference_result = await asyncio.gather(
            _run_wrapped_code(user_wrapper, stdin),
            _run_wrapped_code(reference_wrapper, stdin),
        )
    except (httpx.HTTPError, ValueError, TimeoutError):
        actual = "execution error" if include_io and not hidden else None
        if hidden:
            actual = "hidden"
        return TestCaseResultModel(
            passed=False,
            input=input_dict if include_io and not hidden else None,
            expected="reference execution error" if include_io and not hidden else None,
            actual=actual,
            hidden=hidden,
        )

    user_ok, user_out = _result_output(user_result)
    ref_ok, ref_out = _result_output(reference_result)
    passed = user_ok and ref_ok and _normalize_output(user_out) == _normalize_output(ref_out)

    return TestCaseResultModel(
        passed=passed,
        input=input_dict if include_io and not hidden else None,
        expected=ref_out if include_io and not hidden else None,
        actual=user_out
        if include_io and not hidden
        else ("hidden" if hidden and not passed else None),
        hidden=hidden,
    )


def _fallback_feedback(
    *,
    verdict: str,
    complexity: str | None,
    target_complexity: str | None,
    cases_passed: int,
    cases_total: int,
) -> str:
    if verdict == "pass":
        return (
            f"All {cases_total} cases passed and the solution met the target complexity "
            f"of {target_complexity or 'the problem'}."
        )
    if verdict == "partial":
        return (
            f"Correctness is there: {cases_passed}/{cases_total} cases passed. "
            f"The detected complexity was {complexity or 'unknown'}, so there is still room "
            f"to reach the target of {target_complexity or 'the problem'}."
        )
    return (
        f"{cases_passed}/{cases_total} cases passed. Compare the failing behavior against "
        "the examples and edge cases, then try another fix."
    )


async def _build_feedback(problem: dict[str, Any], result: JudgeResult) -> str:
    try:
        return await generate_feedback_card(
            title=str(problem["title"]),
            difficulty=str(problem["difficulty"]),
            verdict=result.verdict,
            complexity=result.complexity_detected,
            target_complexity=problem.get("target_complexity"),
            cases_passed=result.cases_passed,
            cases_total=result.cases_total,
        )
    except Exception:
        logger.exception("Gemini feedback failed; using fallback")
        return _fallback_feedback(
            verdict=result.verdict,
            complexity=result.complexity_detected,
            target_complexity=problem.get("target_complexity"),
            cases_passed=result.cases_passed,
            cases_total=result.cases_total,
        )


async def _judge_code(
    *,
    problem: dict[str, Any],
    code: str,
    include_hidden: bool,
    include_io: bool,
    include_feedback: bool,
) -> JudgeResult:
    function_name = _extract_function_name(str(problem["function_signature"]))
    user_wrapper = _build_wrapper(code, function_name)
    reference_wrapper = _build_wrapper(str(problem["reference_solution"]), function_name)

    all_cases: list[dict[str, Any]] = problem["test_cases"]
    cases = all_cases if include_hidden else [tc for tc in all_cases if not tc.get("is_hidden")]
    if not cases:
        raise HTTPException(status_code=500, detail="Problem has no visible test cases")

    results = await asyncio.gather(
        *[
            _run_single_case(
                user_wrapper=user_wrapper,
                reference_wrapper=reference_wrapper,
                test_case=tc,
                include_io=include_io,
            )
            for tc in cases
        ]
    )
    cases_passed = sum(1 for result in results if result.passed)
    cases_total = len(results)

    complexity_detected: str | None = None
    if cases_passed < cases_total:
        verdict: Literal["pass", "partial", "fail"] = "fail"
    else:
        complexity_detected = analyze_complexity(code)
        target = problem.get("target_complexity")
        verdict = (
            "partial"
            if target and not complexity_is_acceptable(complexity_detected, str(target))
            else "pass"
        )

    result = JudgeResult(
        verdict=verdict,
        stdout=results[0].actual or "" if results else "",
        cases_passed=cases_passed,
        cases_total=cases_total,
        test_case_results=results,
        complexity_detected=complexity_detected,
    )
    if include_feedback:
        result.feedback_card = await _build_feedback(problem, result)
    return result


def _submission_response(row: dict[str, Any]) -> SubmissionStatusResponse:
    problem = row.get("problems")
    if isinstance(problem, list):
        problem = problem[0] if problem else None
    results = row.get("test_case_results") or []
    return SubmissionStatusResponse(
        id=str(row["id"]),
        problem_id=str(row["problem_id"]),
        problem_title=problem.get("title") if isinstance(problem, dict) else None,
        problem_short_id=problem.get("short_id") if isinstance(problem, dict) else None,
        verdict=row["verdict"],
        cases_passed=int(row.get("cases_passed") or 0),
        cases_total=int(row.get("cases_total") or 0),
        complexity_detected=row.get("complexity_detected"),
        feedback_card=row.get("feedback_card"),
        test_case_results=[TestCaseResultModel(**result) for result in results],
        created_at=str(row["created_at"]),
    )


async def _judge_submission_task(submission_id: str, problem_id: str, code: str) -> None:
    try:
        problem = _load_problem_for_judge(problem_id)
        result = await _judge_code(
            problem=problem,
            code=code,
            include_hidden=True,
            include_io=False,
            include_feedback=True,
        )
        update_data = {
            "verdict": result.verdict,
            "cases_passed": result.cases_passed,
            "cases_total": result.cases_total,
            "complexity_detected": result.complexity_detected,
            "feedback_card": result.feedback_card,
            "test_case_results": [r.model_dump() for r in result.test_case_results],
            "judged_at": datetime.now(UTC).isoformat(),
        }
    except Exception:
        logger.exception("Failed to judge submission %s", submission_id)
        update_data = {
            "verdict": "fail",
            "cases_passed": 0,
            "cases_total": 0,
            "feedback_card": "The judging service failed while processing this submission.",
            "judged_at": datetime.now(UTC).isoformat(),
        }

    try:
        get_supabase().table("submissions").update(update_data).eq("id", submission_id).execute()
    except Exception:
        logger.exception("Failed to update submission %s", submission_id)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/deep")
async def health_deep() -> dict[str, Any]:
    checks: dict[str, bool] = {}

    try:
        get_supabase().table("problems").select("id", count="exact").limit(1).execute()
        checks["supabase"] = True
    except Exception:
        checks["supabase"] = False

    try:
        async with httpx.AsyncClient(base_url=get_judge0_url(), timeout=5.0) as client:
            resp = await client.get("/statuses")
            checks["judge0"] = resp.status_code == 200
    except Exception:
        checks["judge0"] = False

    status = "ok" if all(checks.values()) else "degraded"
    return {"status": status, **checks}


@app.get("/api/v1/problems", response_model=list[ProblemListItem])
def list_problems() -> list[ProblemListItem]:
    rows = (
        get_supabase()
        .table("problems")
        .select("id, short_id, title, difficulty, bug_category, target_complexity")
        .eq("status", "published")
        .order("short_id")
        .execute()
        .data
        or []
    )
    tags = _load_tags([str(row["id"]) for row in rows])
    return [_safe_problem(row, tags.get(str(row["id"]), [])) for row in rows]


@app.get("/api/v1/problems/{problem_id}", response_model=ProblemDetail)
def get_problem(problem_id: str) -> ProblemDetail:
    problem = _load_problem_for_judge(problem_id)
    tags = _load_tags([problem_id]).get(problem_id, [])
    visible_cases = [
        VisibleTestCase(input=_input_to_dict(tc["input"]))
        for tc in problem["test_cases"]
        if not tc.get("is_hidden")
    ]
    safe = _safe_problem(problem, tags)
    return ProblemDetail(
        **safe.model_dump(),
        description=str(problem["description"]),
        function_signature=str(problem["function_signature"]),
        slop_code=str(problem["slop_code"]),
        visible_test_cases=visible_cases,
    )


@app.post("/api/v1/runs", response_model=JudgeResult)
async def run_code(payload: RunRequest, request: Request) -> JudgeResult:
    _rate_limiter.check(_rate_limit_key(request, None))
    problem = _load_problem_for_judge(payload.problem_id)
    return await _judge_code(
        problem=problem,
        code=payload.code,
        include_hidden=False,
        include_io=True,
        include_feedback=False,
    )


@app.post("/api/v1/submissions", response_model=SubmissionCreateResponse)
async def submit_code(
    payload: SubmissionRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(require_user_id),
) -> SubmissionCreateResponse:
    _rate_limiter.check(_rate_limit_key(request, user_id))
    _load_problem_for_judge(payload.problem_id)

    row = (
        get_supabase()
        .table("submissions")
        .insert(
            {
                "user_id": user_id,
                "problem_id": payload.problem_id,
                "code": payload.code,
                "verdict": "pending",
                "cases_passed": 0,
                "cases_total": 0,
            }
        )
        .execute()
    )
    rows = row.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Could not create submission")

    submission_id = str(rows[0]["id"])
    background_tasks.add_task(
        _judge_submission_task,
        submission_id,
        payload.problem_id,
        payload.code,
    )
    return SubmissionCreateResponse(submission_id=submission_id)


@app.get("/api/v1/submissions/{submission_id}", response_model=SubmissionStatusResponse)
def get_submission(
    submission_id: str,
    user_id: str = Depends(require_user_id),
) -> SubmissionStatusResponse:
    row = (
        get_supabase()
        .table("submissions")
        .select(
            "id, problem_id, verdict, cases_passed, cases_total, complexity_detected, "
            "feedback_card, test_case_results, created_at, problems(title, short_id)"
        )
        .eq("id", submission_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _submission_response(row)


@app.get("/api/v1/submissions", response_model=list[SubmissionStatusResponse])
def list_submissions(
    user_id: str = Depends(require_user_id),
) -> list[SubmissionStatusResponse]:
    rows = (
        get_supabase()
        .table("submissions")
        .select(
            "id, problem_id, verdict, cases_passed, cases_total, complexity_detected, "
            "feedback_card, test_case_results, created_at, problems(title, short_id)"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
        .data
        or []
    )
    return [_submission_response(row) for row in rows]


@app.get("/api/v1/progress/me", response_model=ProgressResponse)
def get_progress(user_id: str = Depends(require_user_id)) -> ProgressResponse:
    problems = (
        get_supabase()
        .table("problems")
        .select("id, difficulty, bug_category")
        .eq("status", "published")
        .execute()
        .data
        or []
    )
    submissions = (
        get_supabase()
        .table("submissions")
        .select("problem_id, verdict")
        .eq("user_id", user_id)
        .neq("verdict", "pending")
        .execute()
        .data
        or []
    )

    by_problem = {str(p["id"]): p for p in problems}
    by_difficulty = {
        "easy": ProgressDifficulty(),
        "medium": ProgressDifficulty(),
        "hard": ProgressDifficulty(),
    }
    for problem in problems:
        difficulty = str(problem.get("difficulty", "")).lower()
        if difficulty in by_difficulty:
            by_difficulty[difficulty].total += 1

    solved_ids = {
        str(row["problem_id"])
        for row in submissions
        if row.get("verdict") == "pass" and str(row["problem_id"]) in by_problem
    }
    by_bug_category: dict[str, int] = {}
    for problem_id in solved_ids:
        problem = by_problem[problem_id]
        difficulty = str(problem.get("difficulty", "")).lower()
        if difficulty in by_difficulty:
            by_difficulty[difficulty].solved += 1
        category = str(problem.get("bug_category") or "unknown")
        by_bug_category[category] = by_bug_category.get(category, 0) + 1

    attempts = len(submissions)
    passed = sum(1 for row in submissions if row.get("verdict") == "pass")
    partial = sum(1 for row in submissions if row.get("verdict") == "partial")
    failed = sum(1 for row in submissions if row.get("verdict") == "fail")
    accuracy = passed / attempts if attempts else None

    return ProgressResponse(
        total_problems=len(problems),
        solved_problems=len(solved_ids),
        attempts=attempts,
        passed_submissions=passed,
        partial_submissions=partial,
        failed_submissions=failed,
        accuracy=accuracy,
        by_difficulty=by_difficulty,
        by_bug_category=by_bug_category,
    )
