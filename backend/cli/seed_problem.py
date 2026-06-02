"""
DD-019: End-to-end problem seeder CLI.

Usage:
    python -m backend.cli.seed_problem --spec backend/seeds/problems/two_sum.yaml

Pipeline:
    1. Parse spec YAML
    2. Generate slop via Gemini (DD-017)
    3. Generate 8 test cases via Gemini (DD-018)
    4. Oracle verify  — reference solution must pass all test cases
    5. Slop verify    — slop must fail at least one test case
    6. Upsert into Supabase as status='draft' (idempotent on title)

If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set, the CLI prints
what it would insert and exits cleanly — useful for local testing.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import pathlib
import re
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass

import yaml

from backend.cli.slopify import _build_prompt as _slop_prompt
from backend.cli.slopify import _strip_fences, _validate_python
from backend.db.client import get_client
from backend.llm.gemini import chat

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


@dataclass
class Spec:
    title: str
    description: str
    difficulty: str
    bug_category: str
    target_complexity: str
    function_signature: str
    reference_solution: str


@dataclass
class SeedResult:
    spec: Spec
    slop_code: str
    test_cases: list[str]  # one stdin string per case


# ---------------------------------------------------------------------------
# Spec parsing
# ---------------------------------------------------------------------------


def load_spec(path: pathlib.Path) -> Spec:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    required = [
        "title", "description", "difficulty", "bug_category",
        "target_complexity", "function_signature", "reference_solution",
    ]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Spec is missing required fields: {missing}")
    return Spec(**{k: data[k] for k in required})


# ---------------------------------------------------------------------------
# Local code runner
# ---------------------------------------------------------------------------

_HARNESS = textwrap.dedent("""\
    import sys as _sys

    {code}

    _line = _sys.stdin.readline().strip()
    _args = eval(_line)
    if not isinstance(_args, tuple):
        _args = (_args,)
    _fn_name = "{fn_name}"
    print(eval(_fn_name)(*_args))
""")


def _extract_fn_name(signature: str) -> str:
    m = re.match(r"def\s+(\w+)", signature)
    if not m:
        raise ValueError(f"Cannot extract function name from signature: {signature!r}")
    return m.group(1)


def _run_locally(
    code: str,
    fn_name: str,
    stdin_str: str,
    timeout: float = 5.0,
) -> tuple[str, str, bool]:
    """Run code+stdin locally. Returns (stdout, stderr, success)."""
    harness = _HARNESS.format(code=code, fn_name=fn_name)
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
        f.write(harness)
        tmp = pathlib.Path(f.name)
    try:
        result = subprocess.run(
            [sys.executable, str(tmp)],
            input=stdin_str,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode == 0
    except subprocess.TimeoutExpired:
        return "", "Timed out", False
    finally:
        tmp.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Oracle + slop verification
# ---------------------------------------------------------------------------


def verify_oracle(spec: Spec, test_cases: list[str]) -> None:
    """Raise SystemExit if the reference solution fails any test case."""
    fn_name = _extract_fn_name(spec.function_signature)
    logger.info("Oracle verification: running reference solution on %d cases...", len(test_cases))
    for i, case in enumerate(test_cases):
        _, stderr, ok = _run_locally(spec.reference_solution, fn_name, case)
        if not ok:
            print(
                f"REJECTED: reference solution raised on test case {i + 1}:\n"
                f"  input:  {case!r}\n"
                f"  error:  {stderr}",
                file=sys.stderr,
            )
            sys.exit(1)
    logger.info("Oracle verification passed.")


def verify_slop(spec: Spec, slop_code: str, test_cases: list[str]) -> None:
    """Raise SystemExit if slop passes ALL test cases (bug isn't testable)."""
    fn_name = _extract_fn_name(spec.function_signature)
    ref_outputs: list[str] = []

    for case in test_cases:
        stdout, _, _ = _run_locally(spec.reference_solution, fn_name, case)
        ref_outputs.append(stdout)

    logger.info("Slop verification: checking slop fails at least one case...")
    failures = 0
    for i, (case, expected) in enumerate(zip(test_cases, ref_outputs)):
        stdout, _, ok = _run_locally(slop_code, fn_name, case)
        if not ok or stdout != expected:
            failures += 1
            logger.info("  case %d: slop failed (as expected).", i + 1)

    if failures == 0:
        print(
            "REJECTED: slop passes all test cases — the introduced bug is not detectable.\n"
            "Try a different bug_category or regenerate.",
            file=sys.stderr,
        )
        sys.exit(1)

    logger.info("Slop verification passed (%d/%d cases failed).", failures, len(test_cases))


# ---------------------------------------------------------------------------
# Gemini calls
# ---------------------------------------------------------------------------


async def _generate_slop(spec: Spec) -> str:
    prompt = _slop_prompt(spec.reference_solution, spec.bug_category)
    raw = await chat(prompt)
    slop = _strip_fences(raw)
    _validate_python(slop)
    return slop


async def _generate_tests(spec: Spec) -> list[str]:
    prompt_path = pathlib.Path(__file__).parent.parent / "prompts" / "gen_tests.txt"
    template = prompt_path.read_text(encoding="utf-8")
    prompt = (
        template
        .replace("{signature}", spec.function_signature)
        .replace("{description}", spec.description)
    )
    raw = await chat(prompt)
    lines = [line for line in raw.strip().splitlines() if line.strip()]
    if len(lines) != 8:
        raise ValueError(f"Expected 8 test cases from Gemini, got {len(lines)}")
    return lines


# ---------------------------------------------------------------------------
# Supabase upsert
# ---------------------------------------------------------------------------


def upsert_problem(result: SeedResult) -> None:
    """Insert or update the problem row + test_case rows. Idempotent on title."""
    client = get_client()
    if client is None:
        print("\n── DRY RUN (no Supabase credentials) ──────────────────────────────")
        print(json.dumps({
            "title": result.spec.title,
            "description": result.spec.description,
            "difficulty": result.spec.difficulty,
            "bug_category": result.spec.bug_category,
            "target_complexity": result.spec.target_complexity,
            "function_signature": result.spec.function_signature,
            "slop_code": result.slop_code[:120] + "...",
            "test_cases_count": len(result.test_cases),
            "status": "draft",
        }, indent=2))
        print("────────────────────────────────────────────────────────────────────\n")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable DB insert.")
        return

    spec = result.spec

    # Upsert problems row (idempotent on title)
    response = (
        client.table("problems")
        .upsert(
            {
                "title": spec.title,
                "description": spec.description,
                "difficulty": spec.difficulty,
                "bug_category": spec.bug_category,
                "target_complexity": spec.target_complexity,
                "function_signature": spec.function_signature,
                "reference_solution": spec.reference_solution,
                "slop_code": result.slop_code,
                "status": "draft",
            },
            on_conflict="title",
        )
        .execute()
    )

    problem_id = response.data[0]["id"]
    logger.info("Upserted problem row: id=%s", problem_id)

    # Delete existing test cases for this problem (idempotent re-seed)
    client.table("test_cases").delete().eq("problem_id", problem_id).execute()

    # Insert fresh test cases
    rows = [
        {"problem_id": problem_id, "input": case, "is_hidden": i >= 3}
        for i, case in enumerate(result.test_cases)
    ]
    client.table("test_cases").insert(rows).execute()
    logger.info("Inserted %d test cases.", len(rows))

    print(f"\n✓ Problem '{spec.title}' seeded as draft (id={problem_id}).")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


async def _pipeline(spec: Spec) -> SeedResult:
    logger.info("Generating slop for category '%s'...", spec.bug_category)
    slop = await _generate_slop(spec)

    logger.info("Generating test cases...")
    test_cases = await _generate_tests(spec)

    verify_oracle(spec, test_cases)
    verify_slop(spec, slop, test_cases)

    return SeedResult(spec=spec, slop_code=slop, test_cases=test_cases)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed a problem into Supabase from a spec YAML file."
    )
    parser.add_argument(
        "--spec",
        required=True,
        type=pathlib.Path,
        metavar="FILE",
        help="Path to the problem spec YAML file.",
    )
    args = parser.parse_args()

    if not args.spec.exists():
        print(f"ERROR: spec file not found: {args.spec}", file=sys.stderr)
        sys.exit(1)

    spec = load_spec(args.spec)
    logger.info("Loaded spec: %s (%s / %s)", spec.title, spec.difficulty, spec.bug_category)

    result = asyncio.run(_pipeline(spec))
    upsert_problem(result)


if __name__ == "__main__":
    main()
    