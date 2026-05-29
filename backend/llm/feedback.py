"""
DD-020: LLM feedback card generator.

Generates a 2-3 sentence markdown explanation of a bug after a submission verdict.
Intentionally does NOT accept user code to prevent prompt injection.
"""

import logging
import pathlib

from google.api_core.exceptions import ResourceExhausted
from pydantic import BaseModel

from backend.llm.gemini import chat

logger = logging.getLogger(__name__)

_PROMPT_PATH = pathlib.Path(__file__).parent.parent / "prompts" / "feedback_card.txt"


class Problem(BaseModel):
    title: str
    description: str
    bug_category: str
    target_complexity: str


async def generate_feedback(
    problem: Problem,
    verdict: str,
    bug_category: str,
    cases_passed: int,
    cases_total: int,
) -> str:
    """Return a 2-3 sentence markdown feedback card explaining the bug.

    Args:
        problem: The problem metadata (title, description, bug_category).
        verdict: One of "pass", "partial", or "fail".
        bug_category: The bug category name (e.g. "off_by_one").
        cases_passed: Number of test cases the user passed.
        cases_total: Total number of test cases.

    Returns:
        A markdown string of 2-3 sentences, or "" if Gemini is quota-exhausted.
    """
    template = _PROMPT_PATH.read_text(encoding="utf-8")
    prompt = template.format(
        problem_title=problem.title,
        bug_category=bug_category,
        cases_passed=cases_passed,
        cases_total=cases_total,
        verdict=verdict,
    )

    try:
        return await chat(prompt)
    except ResourceExhausted:
        logger.warning("Gemini quota exhausted — feedback card skipped.")
        return ""