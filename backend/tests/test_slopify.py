"""
Tests for DD-017: slop-generation prompt + CLI.

Run with:  pytest backend/tests/test_slopify.py -v
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

REFERENCE_PATH = pathlib.Path(__file__).parent.parent / "seeds" / "two_sum.py"
REFERENCE_CODE = REFERENCE_PATH.read_text(encoding="utf-8")


def test_valid_categories_count() -> None:
    assert len(VALID_CATEGORIES) == 6


def test_valid_categories_match_database() -> None:
    expected = {
        "incorrect_data_structure",
        "wrong_condition",
        "missing_edge_case",
        "bad_complexity",
        "state_mutation",
        "other",
    }
    assert set(VALID_CATEGORIES) == expected


def test_build_prompt_contains_category() -> None:
    prompt = _build_prompt(REFERENCE_CODE, "wrong_condition")
    assert "wrong_condition" in prompt
    assert "two_sum" in prompt


def test_build_prompt_contains_reference_code() -> None:
    prompt = _build_prompt(REFERENCE_CODE, "bad_complexity")
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
    _validate_python("def foo():\n    return 1")


def test_validate_python_exits_on_syntax_error(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit):
        _validate_python("def foo(\n    return 1")


MOCK_SLOP = textwrap.dedent("""\
    def two_sum(nums: list[int], target: int) -> list[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []
""")


@pytest.mark.asyncio
@pytest.mark.parametrize("category", VALID_CATEGORIES)
async def test_all_categories_produce_valid_python(category: str) -> None:
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=MOCK_SLOP)):
        from backend.cli.slopify import _run
        await _run(REFERENCE_PATH, category, out_path=None)


@pytest.mark.asyncio
async def test_invalid_python_from_model_causes_exit() -> None:
    bad_output = "def two_sum(\n    return ???"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=bad_output)):
        from backend.cli.slopify import _run
        with pytest.raises(SystemExit):
            await _run(REFERENCE_PATH, "wrong_condition", out_path=None)


@pytest.mark.asyncio
async def test_out_flag_writes_file(tmp_path: pathlib.Path) -> None:
    out_file = tmp_path / "slop.py"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=MOCK_SLOP)):
        from backend.cli.slopify import _run
        await _run(REFERENCE_PATH, "bad_complexity", out_path=out_file)
    assert out_file.exists()
    ast.parse(out_file.read_text(encoding="utf-8"))


@pytest.mark.asyncio
async def test_model_fence_output_is_stripped_and_accepted() -> None:
    fenced = f"```python\n{MOCK_SLOP}\n```"
    with patch("backend.cli.slopify.chat", new=AsyncMock(return_value=fenced)):
        from backend.cli.slopify import _run
        await _run(REFERENCE_PATH, "state_mutation", out_path=None)
        