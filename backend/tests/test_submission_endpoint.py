from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi.testclient import TestClient

import main
from judge0.client import RunResult


def _make_accepted_result(stdout: str) -> RunResult:
    return RunResult(stdout=stdout, stderr="", status="Accepted", time_ms=12)


def _problem() -> dict[str, Any]:
    return {
        "id": "problem-1",
        "short_id": "001",
        "title": "Two Sum",
        "description": "Find a pair.",
        "difficulty": "easy",
        "bug_category": "bad_complexity",
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
        "slop_code": "def two_sum(nums, target): return []",
        "target_complexity": "O(n)",
        "test_cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "is_hidden": False},
            {"input": {"nums": [3, 3], "target": 6}, "is_hidden": True},
        ],
    }


async def _fake_two_sum_runner(code: str, stdin: str) -> RunResult:
    if "return [9, 9]" in code:
        return _make_accepted_result("[9,9]\n")
    return _make_accepted_result("[0,1]\n")


def test_run_uses_visible_tests_and_does_not_create_submission(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[str] = []

    async def fake_run_python(code: str, stdin: str) -> RunResult:
        calls.append(stdin)
        return await _fake_two_sum_runner(code, stdin)

    monkeypatch.setattr(main, "run_python", fake_run_python)
    monkeypatch.setattr(main, "_load_problem_for_judge", lambda problem_id: _problem())
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/runs",
        json={"problem_id": "problem-1", "code": "def two_sum(nums, target): return [0, 1]"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "pass"
    assert data["cases_passed"] == 1
    assert data["cases_total"] == 1
    assert len(calls) == 2


def test_differential_judging_compares_user_and_reference_outputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(main, "run_python", _fake_two_sum_runner)

    result = asyncio.run(
        main._judge_code(
            problem=_problem(),
            code="def two_sum(nums, target): return [9, 9]",
            include_hidden=True,
            include_io=True,
            include_feedback=False,
        )
    )

    assert result.verdict == "fail"
    assert result.cases_passed == 0
    assert result.test_case_results[0].expected == "[0,1]"
    assert result.test_case_results[0].actual == "[9,9]"
    assert result.test_case_results[1].input is None


def test_complexity_produces_partial_after_correctness_passes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(main, "run_python", _fake_two_sum_runner)
    brute_force_code = (
        "def two_sum(nums, target):\n"
        "    for i in range(len(nums)):\n"
        "        for j in range(i + 1, len(nums)):\n"
        "            if nums[i] + nums[j] == target:\n"
        "                return [i, j]\n"
        "    return []\n"
    )

    result = asyncio.run(
        main._judge_code(
            problem=_problem(),
            code=brute_force_code,
            include_hidden=True,
            include_io=False,
            include_feedback=False,
        )
    )

    assert result.verdict == "partial"
    assert result.cases_passed == result.cases_total
    assert result.complexity_detected == "O(n^2)"


def test_submit_requires_authentication(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "_load_problem_for_judge", lambda problem_id: _problem())
    client = TestClient(main.app)

    response = client.post(
        "/api/v1/submissions",
        json={"problem_id": "problem-1", "code": "def two_sum(nums, target): return [0, 1]"},
    )

    assert response.status_code == 401


class _FakeInsertTable:
    def __init__(self) -> None:
        self.inserted: dict[str, Any] | None = None

    def insert(self, data: dict[str, Any]) -> _FakeInsertTable:
        self.inserted = data
        return self

    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=[{"id": "submission-1"}])


class _FakeSupabase:
    def __init__(self) -> None:
        self.submissions = _FakeInsertTable()

    def table(self, name: str) -> _FakeInsertTable:
        assert name == "submissions"
        return self.submissions


def test_submit_creates_pending_submission(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_supabase = _FakeSupabase()

    async def fake_background_task(submission_id: str, problem_id: str, code: str) -> None:
        return None

    main.app.dependency_overrides[main.require_user_id] = lambda: "user-1"
    monkeypatch.setattr(main, "_load_problem_for_judge", lambda problem_id: _problem())
    monkeypatch.setattr(main, "get_supabase", lambda: fake_supabase)
    monkeypatch.setattr(main, "_judge_submission_task", fake_background_task)
    client = TestClient(main.app)

    try:
        response = client.post(
            "/api/v1/submissions",
            json={"problem_id": "problem-1", "code": "def two_sum(nums, target): return [0, 1]"},
        )
    finally:
        main.app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"submission_id": "submission-1", "verdict": "pending"}
    assert fake_supabase.submissions.inserted is not None
    assert fake_supabase.submissions.inserted["verdict"] == "pending"
    assert fake_supabase.submissions.inserted["user_id"] == "user-1"


def test_gemini_failure_uses_fallback_feedback(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_feedback(**kwargs: Any) -> str:
        raise RuntimeError("no gemini")

    monkeypatch.setattr(main, "generate_feedback_card", fake_feedback)
    result = main.JudgeResult(
        verdict="fail",
        stdout="",
        cases_passed=0,
        cases_total=2,
        test_case_results=[],
        complexity_detected=None,
    )

    feedback = asyncio.run(main._build_feedback(_problem(), result))

    assert "0/2 cases passed" in feedback
