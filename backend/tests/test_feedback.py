"""
Tests for DD-020: LLM feedback card generator.

Run with: pytest backend/tests/test_feedback.py -v
"""

from unittest.mock import AsyncMock, patch

import pytest
from google.api_core.exceptions import ResourceExhausted

from backend.llm.feedback import Problem, generate_feedback

SAMPLE_PROBLEM = Problem(
    title="Two Sum",
    description="Return indices of the two numbers that add up to target.",
    bug_category="bad_complexity",
    target_complexity="O(n)",
)

MOCK_FEEDBACK = (
    "A **bad_complexity** bug in this kind of problem typically means the solution "
    "uses a nested loop where a single pass with a hash map would suffice. "
    "Fixing it reduces the time complexity from O(n²) to O(n)."
)


@pytest.mark.asyncio
async def test_returns_string() -> None:
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=MOCK_FEEDBACK)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="pass",
            bug_category="bad_complexity",
            cases_passed=5,
            cases_total=5,
        )
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_mentions_bug_category() -> None:
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=MOCK_FEEDBACK)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="pass",
            bug_category="bad_complexity",
            cases_passed=5,
            cases_total=5,
        )
    assert "bad_complexity" in result


@pytest.mark.asyncio
async def test_returns_empty_string_on_quota_exhaustion() -> None:
    with patch(
        "backend.llm.feedback.chat",
        new=AsyncMock(side_effect=ResourceExhausted("quota")),
    ):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="fail",
            bug_category="bad_complexity",
            cases_passed=2,
            cases_total=5,
        )
    assert result == ""


@pytest.mark.asyncio
async def test_does_not_pass_user_code_to_chat() -> None:
    captured_prompt: list[str] = []

    async def mock_chat(prompt: str, system: str | None = None) -> str:
        captured_prompt.append(prompt)
        return MOCK_FEEDBACK

    with patch("backend.llm.feedback.chat", new=mock_chat):
        await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="pass",
            bug_category="bad_complexity",
            cases_passed=5,
            cases_total=5,
        )

    assert "def " not in captured_prompt[0]


@pytest.mark.asyncio
@pytest.mark.parametrize("verdict", ["pass", "partial", "fail"])
async def test_all_verdicts_accepted(verdict: str) -> None:
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=MOCK_FEEDBACK)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict=verdict,
            bug_category="bad_complexity",
            cases_passed=3,
            cases_total=5,
        )
    assert isinstance(result, str)


@pytest.mark.asyncio
@pytest.mark.parametrize("category", [
    "incorrect_data_structure",
    "wrong_condition",
    "missing_edge_case",
    "bad_complexity",
    "state_mutation",
    "other",
])
async def test_all_bug_categories_accepted(category: str) -> None:
    mock_response = f"A **{category}** bug was introduced here. Fixing it resolves the issue."
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=mock_response)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="fail",
            bug_category=category,
            cases_passed=0,
            cases_total=5,
        )
    assert category in result
    