"""
Tests for DD-017: slop-generation prompt + CLI.

Run with:  pytest backend/tests/test_slopify.py -v

The LLM calls are mocked so no GEMINI_API_KEY is needed in CI.
The integration test (marked slow) hits the real API and requires the key.
"""

import ast
import pathlib
import textwrap
from unittest.mock import AsyncMock, patch

import pytest

from backend.cli.slopify import (
    VALID_CATEGORIES,
    _build_prompt,
    _strip_fences,
    _validate_python,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

REFERENCE_PATH = pathlib.Path(__file__).parent.parent / "seeds" / "two_sum.py"
REFERENCE_CODE = REFERENCE_PATH.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Unit tests — no network calls
# ---------------------------------------------------------------------------


def test_valid_categories_count() -> None:
    assert len(VALID_CATEGORIES) == 6


def test_build_prompt_contains_category() -> None:
    prompt = _build_prompt(REFERENCE_CODE, "off_by_one")
    assert "off_by_one" in prompt
    assert "two_sum" in prompt  # reference code is embedded


def test_build_prompt_contains_reference_code() -> None:
    prompt = _build_prompt(REFERENCE_CODE, "subtle_logic_error")
    assert "def two_sum" in prompt


def test_strip_fences_removes_python_fence() -> None:
    fenced = "```python\ndef foo():\n    pass\n```"
    assert _strip_fences(fenced) == "def foo():\n    pass"


def test_strip_fences_removes_plain_fence() -> None:
    fenced = "```\ndef foo():\n    pass\n```"
    assert _strip_fences(fenced) == "def foo():\n    pass"


def test_strip_fences_noop_when_no_fences() -> None:
    clean = "def foo():\n    pass"
    assert _strip_fences(clean) == clean


def test_validate_python_passes_valid_code() -> None:
    _validate_python("def foo():\n    return 1")  # should not raise


def test_validate_python_exits_on_syntax_error(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit):
        _validate_python("def foo(\n    return 1")


# ---------------------------------------------------------------------------
# Mocked async tests — verifies wiring without hitting Gemini
# ---------------------------------------------------------------------------

MOCK_SLOP = textwrap.dedent("""\
    def two_sum(nums: list[int], target: int) -> list[int]:
        seen: dict[int, int] = {}
        for i in range(len(nums) - 1):  # off-by-one: misses last element
            complement = target - nums[i]
            if complement in seen:
                return [seen[complement], i]
            seen[nums[i]] = i
        return []
""")


@pytest.mark.asyncio
@pytest.mark.parametrize("category", VALID_CATEGORIES)
async def test_all_categories_produce_valid_python(category: str) -> None:
    """Each category: mock returns syntactically valid Python — CLI accepts it."""
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=MOCK_SLOP)):
        from backend.cli.slopify import _run

        # _run prints to stdout; just confirm it doesn't raise / exit
        await _run(REFERENCE_PATH, category, out_path=None)


@pytest.mark.asyncio
async def test_invalid_python_from_model_causes_exit() -> None:
    bad_output = "def two_sum(\n    return ???"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=bad_output)):
        from backend.cli.slopify import _run

        with pytest.raises(SystemExit):
            await _run(REFERENCE_PATH, "off_by_one", out_path=None)


@pytest.mark.asyncio
async def test_out_flag_writes_file(tmp_path: pathlib.Path) -> None:
    out_file = tmp_path / "slop.py"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=MOCK_SLOP)):
        from backend.cli.slopify import _run

        await _run(REFERENCE_PATH, "off_by_one", out_path=out_file)

    assert out_file.exists()
    written = out_file.read_text(encoding="utf-8")
    assert "def two_sum" in written
    ast.parse(written)  # must be valid Python


@pytest.mark.asyncio
async def test_model_fence_output_is_stripped_and_accepted() -> None:
    fenced = f"```python\n{MOCK_SLOP}\n```"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=fenced)):
        from backend.cli.slopify import _run

        # Should not raise — fences are stripped before validation
        await _run(REFERENCE_PATH, "redundant_work", out_path=None)