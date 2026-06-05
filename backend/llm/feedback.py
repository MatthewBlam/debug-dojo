from __future__ import annotations

from llm.client import GeminiClient, get_gemini_client

_FEEDBACK_PROMPT = """You are a coding mentor for Debug Dojo.

A student just solved a problem. Generate a short, encouraging feedback card (3-5 sentences).

Problem: {title}
Difficulty: {difficulty}
Verdict: {verdict}
Complexity detected: {complexity}
Target complexity: {target_complexity}
Test cases passed: {cases_passed}/{cases_total}

Rules:
- Be encouraging but specific
- If verdict is "partial", explain that correctness is good but complexity could improve
- If verdict is "pass", congratulate and mention what made the solution efficient
- Never reference specific code — you don't have access to it
- Keep it under 100 words
- Use plain text, no markdown"""


async def generate_feedback_card(
    *,
    title: str,
    difficulty: str,
    verdict: str,
    complexity: str | None,
    target_complexity: str | None,
    cases_passed: int,
    cases_total: int,
    client: GeminiClient | None = None,
) -> str:
    """Generate a feedback card for a submission. Fire-and-forget safe."""
    gemini = client or get_gemini_client()
    prompt = _FEEDBACK_PROMPT.format(
        title=title,
        difficulty=difficulty,
        verdict=verdict,
        complexity=complexity or "unknown",
        target_complexity=target_complexity or "not specified",
        cases_passed=cases_passed,
        cases_total=cases_total,
    )
    return await gemini.generate(prompt, temperature=0.8)
