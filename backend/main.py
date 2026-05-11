from __future__ import annotations

import json
from typing import TypedDict

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from judge0.client import run_python

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datatypes for API requests and responses (temp)
class SubmissionRequest(BaseModel):
    problem_id: str
    code: str


class SubmissionResponse(BaseModel):
    verdict: str
    stdout: str


class TestInput(TypedDict):
    nums: list[int]
    target: int
    expected: list[int]


class ProblemConfig(TypedDict):
    test_input: TestInput


_PROBLEMS: dict[str, ProblemConfig] = {
    "2da798cf-79a9-4741-8382-f96dff10efce": {
        "test_input": {
            "nums": [2, 7, 11, 15],
            "target": 9,
            "expected": [0, 1],
        }
    }
}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/submissions", response_model=SubmissionResponse)
async def submit_code(payload: SubmissionRequest) -> SubmissionResponse:
    problem = _PROBLEMS.get(payload.problem_id)
    if problem is None:
        raise HTTPException(status_code=400, detail="Invalid problem_id")

    wrapper_code = _build_wrapper_code(payload.code)
    test_input = problem["test_input"]
    stdin = json.dumps(test_input)

    try:
        result = await run_python(wrapper_code, stdin)
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Judge0 execution failed") from exc
    if result.status == "Internal Error":
        raise HTTPException(status_code=502, detail="Judge0 execution failed")

    expected = json.dumps(test_input["expected"], separators=(",", ":"))
    actual = result.stdout.strip()
    verdict = "pass" if result.status == "Accepted" and actual == expected else "fail"

    return SubmissionResponse(verdict=verdict, stdout=result.stdout)


def _build_wrapper_code(user_code: str) -> str:
    return "\n".join(
        [
            "import json",
            "",
            user_code,
            "",
            "_case = json.loads(input())",
            '_result = two_sum(_case["nums"], _case["target"])',
            'print(json.dumps(_result, separators=(",", ":")))',
        ]
    ).strip()
