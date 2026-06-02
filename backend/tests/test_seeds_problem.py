"""
Tests for DD-019: seed_problem CLI.

Run with: pytest backend/tests/test_seed_problem.py -v

All Gemini and Supabase calls are mocked — no credentials needed.
"""

from __future__ import annotations

import pathlib
import textwrap
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import yaml

from backend.cli.seed_problem import (
    SeedResult,
    Spec,
    _extract_fn_name,
    _run_locally,
    load_spec,
    upsert_problem,
    verify_oracle,
    verify_slop,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

REFERENCE = textwrap.dedent("""\
    def two_sum(nums: list[int], target: int) -> list[int]:
        seen: dict[int, int] = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
""")

SLOP = textwrap.dedent("""\
    def two_sum(nums: list[int], target: int) -> list[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []
""")

TEST_CASES = [
    "([2, 7, 11, 15], 9)",
    "([3, 2, 4], 6)",
    "([3, 3], 6)",
    "([1, 2, 3, 4], 7)",
    "([-1, -2, -3, -4], -6)",
    "([0, 4, 3, 0], 0)",
    "([1], 2)",
    "([1000000, 999999, 1], 1000001)",
]

SAMPLE_SPEC = Spec(
    title="Two Sum",
    description="Return indices of two numbers that add up to target.",
    difficulty="easy",
    bug_category="complexity_degradation",
    target_complexity="O(n)",
    function_signature="def two_sum(nums: list[int], target: int) -> list[int]:",
    reference_solution=REFERENCE,
)

SPEC_PATH = pathlib.Path(__file__).parent.parent / "seeds" / "problems" / "two_sum.yaml"


# ---------------------------------------------------------------------------
# load_spec
# ---------------------------------------------------------------------------


def test_load_spec_parses_yaml() -> None:
    spec = load_spec(SPEC_PATH)
    assert spec.title == "Two Sum"
    assert spec.difficulty == "easy"
    assert spec.bug_category == "complexity_degradation"
    assert "def two_sum" in spec.reference_solution


def test_load_spec_missing_field_raises(tmp_path: pathlib.Path) -> None:
    bad = tmp_path / "bad.yaml"
    bad.write_text(yaml.dump({"title": "X", "difficulty": "easy"}))
    with pytest.raises(ValueError, match="missing required fields"):
        load_spec(bad)


# ---------------------------------------------------------------------------
# _extract_fn_name
# ---------------------------------------------------------------------------


def test_extract_fn_name_basic() -> None:
    assert _extract_fn_name("def two_sum(nums, target):") == "two_sum"


def test_extract_fn_name_with_annotations() -> None:
    assert _extract_fn_name("def two_sum(nums: list[int], target: int) -> list[int]:") == "two_sum"


def test_extract_fn_name_invalid_raises() -> None:
    with pytest.raises(ValueError):
        _extract_fn_name("not a function")


# ---------------------------------------------------------------------------
# _run_locally
# ---------------------------------------------------------------------------


def test_run_locally_correct_output() -> None:
    stdout, stderr, ok = _run_locally(REFERENCE, "two_sum", "([2, 7, 11, 15], 9)")
    assert ok
    assert "[0, 1]" in stdout


def test_run_locally_runtime_error() -> None:
    bad_code = "def two_sum(nums, target):\n    return 1 / 0"
    stdout, stderr, ok = _run_locally(bad_code, "two_sum", "([1, 2], 3)")
    assert not ok
    assert "ZeroDivisionError" in stderr


def test_run_locally_timeout() -> None:
    infinite = "def two_sum(nums, target):\n    while True: pass"
    stdout, stderr, ok = _run_locally(infinite, "two_sum", "([1, 2], 3)", timeout=1.0)
    assert not ok
    assert "Timed out" in stderr


# ---------------------------------------------------------------------------
# verify_oracle
# ---------------------------------------------------------------------------


def test_verify_oracle_passes_for_correct_reference() -> None:
    # Should not raise or exit
    verify_oracle(SAMPLE_SPEC, TEST_CASES[:3])


def test_verify_oracle_exits_on_bad_reference() -> None:
    bad_spec = Spec(
        **{**SAMPLE_SPEC.__dict__, "reference_solution": "def two_sum(n, t):\n    raise RuntimeError"}
    )
    with pytest.raises(SystemExit):
        verify_oracle(bad_spec, TEST_CASES[:1])


# ---------------------------------------------------------------------------
# verify_slop
# ---------------------------------------------------------------------------


def test_verify_slop_passes_when_slop_fails_a_case() -> None:
    # The nested-loop SLOP still produces correct results for two_sum,
    # so use a truly broken slop that always returns []
    broken_slop = "def two_sum(nums: list[int], target: int) -> list[int]:\n    return []"
    verify_slop(SAMPLE_SPEC, broken_slop, TEST_CASES[:3])  # should not exit


def test_verify_slop_exits_when_slop_passes_all_cases() -> None:
    # Slop that is actually correct — should be rejected
    with pytest.raises(SystemExit):
        verify_slop(SAMPLE_SPEC, REFERENCE, TEST_CASES[:3])


# ---------------------------------------------------------------------------
# upsert_problem — dry run (no Supabase)
# ---------------------------------------------------------------------------


def test_upsert_dry_run_prints_when_no_client(capsys: pytest.CaptureFixture[str]) -> None:
    with patch("backend.cli.seed_problem.get_client", return_value=None):
        upsert_problem(SeedResult(spec=SAMPLE_SPEC, slop_code=SLOP, test_cases=TEST_CASES))
    captured = capsys.readouterr()
    assert "DRY RUN" in captured.out
    assert "Two Sum" in captured.out


def test_upsert_calls_supabase_when_client_available() -> None:
    mock_client = MagicMock()
    mock_client.table.return_value.upsert.return_value.execute.return_value.data = [
        {"id": "test-uuid-1234"}
    ]

    with patch("backend.cli.seed_problem.get_client", return_value=mock_client):
        upsert_problem(SeedResult(spec=SAMPLE_SPEC, slop_code=SLOP, test_cases=TEST_CASES))

    # problems table was upserted
    mock_client.table.assert_any_call("problems")
    # test_cases table was populated
    mock_client.table.assert_any_call("test_cases")


# ---------------------------------------------------------------------------
# Full pipeline — mocked Gemini
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pipeline_end_to_end_mocked() -> None:
    """Full pipeline with mocked LLM — verifies wiring without real API calls."""
    broken_slop = "def two_sum(nums: list[int], target: int) -> list[int]:\n    return []"

    with (
        patch("backend.cli.seed_problem.chat", new=AsyncMock(side_effect=[broken_slop, "\n".join(TEST_CASES)])),
        patch("backend.cli.seed_problem._validate_python"),
        patch("backend.cli.seed_problem._strip_fences", side_effect=lambda x: x),
    ):
        from backend.cli.seed_problem import _pipeline
        result = await _pipeline(SAMPLE_SPEC)

    assert result.slop_code == broken_slop
    assert len(result.test_cases) == 8