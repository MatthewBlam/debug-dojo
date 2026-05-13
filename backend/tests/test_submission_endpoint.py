from __future__ import annotations

import os
import time

import pytest
from fastapi.testclient import TestClient

import main
from judge0.client import RunResult

TWO_SUM_PROBLEM_ID = "2da798cf-79a9-4741-8382-f96dff10efce"


class _FailingJudge0Client:
    async def __call__(self, code: str, stdin: str) -> RunResult:
        raise RuntimeError("unreachable")


def test_submission_passes_when_output_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_run_python(code: str, stdin: str) -> RunResult:
        return RunResult(stdout="[0,1]\n", stderr="", status="Accepted", time_ms=12)

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return [0,1]"},
    )

    assert response.status_code == 200
    assert response.json() == {"verdict": "pass", "stdout": "[0,1]\n"}


def test_submission_returns_400_for_invalid_problem_id() -> None:
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": "does-not-exist", "code": "print('hi')"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid problem_id"


def test_submission_maps_judge0_failures_to_502(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_run_python(code: str, stdin: str) -> RunResult:
        raise ValueError("bad Judge0 payload")

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return []"},
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "Judge0 execution failed"


def test_submission_maps_judge0_internal_error_status_to_502(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_run_python(code: str, stdin: str) -> RunResult:
        return RunResult(stdout="", stderr="boom", status="Internal Error", time_ms=None)

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return []"},
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "Judge0 execution failed"


@pytest.mark.skipif(
    os.getenv("RUN_JUDGE0_INTEGRATION") != "1",
    reason="Set RUN_JUDGE0_INTEGRATION=1 to run real Judge0 integration tests.",
)
def test_submission_endpoint_integration_with_real_judge0() -> None:
    client = TestClient(main.app)

    started = time.perf_counter()
    response = client.post(
        "/api/v1/submissions",
        json={
            "problem_id": TWO_SUM_PROBLEM_ID,
            "code": "def two_sum(nums, target):\n    return [0, 1]",
        },
    )
    elapsed = time.perf_counter() - started

    assert response.status_code == 200
    assert elapsed < 10
    payload = response.json()
    assert payload["verdict"] == "pass"
    assert payload["stdout"].strip() == "[0,1]"
