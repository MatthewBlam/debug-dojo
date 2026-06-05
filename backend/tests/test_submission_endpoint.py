from __future__ import annotations

import os
import time

import pytest
from fastapi.testclient import TestClient

import main
from judge0.client import RunResult

TWO_SUM_PROBLEM_ID = "2da798cf-79a9-4741-8382-f96dff10efce"


def _make_accepted_result(stdout: str) -> RunResult:
    return RunResult(stdout=stdout, stderr="", status="Accepted", time_ms=12)


def test_submission_passes_when_all_test_cases_match(monkeypatch: pytest.MonkeyPatch) -> None:
    outputs = iter(["[0,1]\n", "[0,1]\n", "[]\n"])

    async def fake_run_python(code: str, stdin: str) -> RunResult:
        return _make_accepted_result(next(outputs))

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return [0,1]"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "pass"
    assert data["cases_passed"] == 3
    assert data["cases_total"] == 3
    assert len(data["test_case_results"]) == 3
    assert all(tc["passed"] for tc in data["test_case_results"])
    assert "complexity_detected" in data


def test_submission_returns_partial_when_complexity_exceeds_target(monkeypatch: pytest.MonkeyPatch) -> None:
    """O(n^2) code that passes all tests should get 'partial' verdict."""
    outputs = iter(["[0,1]\n", "[0,1]\n", "[]\n"])

    async def fake_run_python(code: str, stdin: str) -> RunResult:
        return _make_accepted_result(next(outputs))

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    brute_force_code = (
        "def two_sum(nums, target):\n"
        "    for i in range(len(nums)):\n"
        "        for j in range(i + 1, len(nums)):\n"
        "            if nums[i] + nums[j] == target:\n"
        "                return [i, j]\n"
        "    return []\n"
    )

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": brute_force_code},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "partial"
    assert data["cases_passed"] == 3
    assert data["cases_total"] == 3
    assert data["complexity_detected"] is not None


def test_submission_fails_when_output_mismatches(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_run_python(code: str, stdin: str) -> RunResult:
        return _make_accepted_result("[9,9]\n")

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return [9,9]"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "fail"
    assert data["cases_passed"] < data["cases_total"]


def test_submission_returns_404_for_invalid_problem_id() -> None:
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": "does-not-exist", "code": "print('hi')"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Problem not found"


def test_submission_maps_judge0_failures_to_fail(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_run_python(code: str, stdin: str) -> RunResult:
        raise ValueError("bad Judge0 payload")

    monkeypatch.setattr(main, "run_python", fake_run_python)
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": TWO_SUM_PROBLEM_ID, "code": "def two_sum(nums, target): return []"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "fail"
    assert data["cases_passed"] == 0


def test_submission_maps_judge0_internal_error_to_fail(
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

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "fail"
    assert data["cases_passed"] == 0


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
            "code": (
                "def two_sum(nums, target):\n"
                "    seen = {}\n"
                "    for i, n in enumerate(nums):\n"
                "        if target - n in seen:\n"
                "            return [seen[target - n], i]\n"
                "        seen[n] = i\n"
                "    return []\n"
            ),
        },
    )
    elapsed = time.perf_counter() - started

    assert response.status_code == 200
    assert elapsed < 30
    data = response.json()
    assert data["verdict"] == "pass"
    assert data["cases_passed"] == data["cases_total"]
