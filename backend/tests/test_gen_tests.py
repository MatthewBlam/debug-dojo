"""Unit tests for backend.cli.gen_tests — all Gemini calls are mocked."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from cli.gen_tests import generate


EIGHT_CASES = "\n".join(
    [
        "[2,7,11,15] 9",
        "[3,2,4] 6",
        "[3,3] 6",
        "[] 0",
        "[1] 2",
        "[-1,-2,-3,-4,-5] -8",
        "[1000000000,1000000000] 2000000000",
        "[1,2,3,4,5,6,7,8,9,10] 15",
    ]
)


@pytest.mark.asyncio
async def test_returns_eight_lines() -> None:
    with patch("cli.gen_tests.chat", new=AsyncMock(return_value=EIGHT_CASES)):
        result = await generate("def two_sum(nums, target):", "Return indices of two numbers that add to target.")
    assert len(result.splitlines()) == 8


@pytest.mark.asyncio
async def test_output_is_string() -> None:
    with patch("cli.gen_tests.chat", new=AsyncMock(return_value=EIGHT_CASES)):
        result = await generate("def two_sum(nums, target):", "Return indices of two numbers that add to target.")
    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_no_markdown_fences() -> None:
    fenced = "```\n" + EIGHT_CASES + "\n```"
    with patch("cli.gen_tests.chat", new=AsyncMock(return_value=fenced)):
        # fenced output has more than 8 non-empty lines → should raise
        with pytest.raises(ValueError, match="Expected 8 test cases"):
            await generate("def two_sum(nums, target):", "desc")


@pytest.mark.asyncio
async def test_raises_if_wrong_count() -> None:
    with patch("cli.gen_tests.chat", new=AsyncMock(return_value="only one line")):
        with pytest.raises(ValueError, match="Expected 8 test cases"):
            await generate("def two_sum(nums, target):", "desc")


@pytest.mark.asyncio
async def test_strips_blank_lines() -> None:
    padded = "\n" + EIGHT_CASES + "\n\n"
    with patch("cli.gen_tests.chat", new=AsyncMock(return_value=padded)):
        result = await generate("def two_sum(nums, target):", "desc")
    assert len(result.splitlines()) == 8