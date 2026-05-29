"""
Tests for DD-020: LLM feedback card generator.

Run with: pytest backend/tests/test_feedback.py -v
"""

from unittest.mock import AsyncMock, patch

import pytest
from google.api_core.exceptions import ResourceExhausted

from backend.llm.feedback import Problem, generate_feedback

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_PROBLEM = Problem(
    title="Two Sum",
    description="Return indices of the two numbers that add up to target.",
    bug_category="off_by_one",
    target_complexity="O(n)",
)

MOCK_FEEDBACK = (
    "An **off_by_one** error in this kind of problem typically means the loop "
    "exits one iteration too early, missing the last element. "
    "Fixing the bound ensures every element is considered as a potential match."
)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_returns_string() -> None:
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=MOCK_FEEDBACK)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="pass",
            bug_category="off_by_one",
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
            bug_category="off_by_one",
            cases_passed=5,
            cases_total=5,
        )
    assert "off_by_one" in result


@pytest.mark.asyncio
async def test_returns_empty_string_on_quota_exhaustion() -> None:
    with patch(
        "backend.llm.feedback.chat",
        new=AsyncMock(side_effect=ResourceExhausted("quota")),
    ):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="fail",
            bug_category="off_by_one",
            cases_passed=2,
            cases_total=5,
        )
    assert result == ""


@pytest.mark.asyncio
async def test_does_not_pass_user_code_to_chat() -> None:
    """Verify chat() is called with a prompt that contains no user-supplied code."""
    captured_prompt: list[str] = []

    async def mock_chat(prompt: str, system: str | None = None) -> str:
        captured_prompt.append(prompt)
        return MOCK_FEEDBACK

    with patch("backend.llm.feedback.chat", new=mock_chat):
        await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict="pass",
            bug_category="off_by_one",
            cases_passed=5,
            cases_total=5,
        )

    assert len(captured_prompt) == 1
    # Prompt should contain metadata, not raw code blocks
    assert "def " not in captured_prompt[0]


@pytest.mark.asyncio
@pytest.mark.parametrize("verdict", ["pass", "partial", "fail"])
async def test_all_verdicts_accepted(verdict: str) -> None:
    with patch("backend.llm.feedback.chat", new=AsyncMock(return_value=MOCK_FEEDBACK)):
        result = await generate_feedback(
            problem=SAMPLE_PROBLEM,
            verdict=verdict,
            bug_category="off_by_one",
            cases_passed=3,
            cases_total=5,
        )
    assert isinstance(result, str)


@pytest.mark.asyncio
@pytest.mark.parametrize("category", [
    "complexity_degradation",
    "off_by_one",
    "wrong_base_case",
    "missing_edge_case",
    "subtle_logic_error",
    "redundant_work",
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