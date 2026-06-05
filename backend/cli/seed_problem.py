"""CLI tool to seed problems into Supabase from YAML specs.

Usage:
    python -m cli.seed_problem seeds/001_two_sum.yaml
    python -m cli.seed_problem seeds/*.yaml          # seed all
    python -m cli.seed_problem seeds/001_two_sum.yaml --dry-run  # preview without inserting
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import yaml


async def _seed_one(spec_path: Path, *, dry_run: bool = False) -> dict[str, Any] | None:
    """Seed a single problem from a YAML spec file."""
    from cli.gen_tests import generate_test_cases
    from cli.slopify import generate_slop

    spec = yaml.safe_load(spec_path.read_text())
    title = spec["title"]
    print(f"\n{'='*60}")
    print(f"Seeding: {title} ({spec.get('difficulty', 'Easy')})")
    print(f"{'='*60}")

    # Step 1: Generate buggy code
    print("  [1/4] Generating slop code...")
    slop_code = await generate_slop(
        reference_solution=spec["reference_solution"],
        function_signature=spec["function_signature"],
        bug_category=spec.get("bug_category", "off-by-one"),
        difficulty=spec.get("difficulty", "Easy"),
    )
    print(f"  Slop code generated ({len(slop_code)} chars)")

    # Step 2: Generate test cases
    print("  [2/4] Generating test cases...")
    test_cases = await generate_test_cases(
        function_signature=spec["function_signature"],
        description=spec["description"],
        difficulty=spec.get("difficulty", "Easy"),
        num_cases=spec.get("num_test_cases", 8),
    )
    print(f"  Generated {len(test_cases)} test cases")

    # Step 3: Verify slop fails at least one test (optional — requires Judge0)
    print("  [3/4] Verification skipped (requires Judge0 runtime)")

    if dry_run:
        print("  [4/4] DRY RUN — not inserting into Supabase")
        print(f"\n  Slop code:\n{slop_code}")
        print(f"\n  Test cases: {json.dumps(test_cases, indent=2)}")
        return None

    # Step 4: Insert into Supabase
    print("  [4/4] Inserting into Supabase...")
    from db.client import get_supabase

    sb = get_supabase()

    problem_row = (
        sb.table("problems")
        .insert({
            "title": title,
            "description": spec["description"],
            "difficulty": spec.get("difficulty", "Easy"),
            "tags": spec.get("tags", []),
            "function_signature": spec["function_signature"],
            "reference_solution": spec["reference_solution"],
            "slop_code": slop_code,
            "target_complexity": spec.get("target_complexity"),
            "status": "draft",
        })
        .execute()
    )

    rows: list[dict[str, Any]] = problem_row.data or []
    if not rows:
        print("  ERROR: Failed to insert problem")
        return None

    problem_id = rows[0]["id"]
    print(f"  Problem inserted: {problem_id}")

    tc_rows = [
        {
            "problem_id": problem_id,
            "input": tc["input"],
            "expected_output": tc["expected_output"],
            "is_hidden": i >= 3,
        }
        for i, tc in enumerate(test_cases)
    ]
    try:
        sb.table("test_cases").insert(tc_rows).execute()
    except Exception as exc:
        print(f"  ERROR: Test case insert failed: {exc}", file=sys.stderr)
        print(f"  Rolling back problem {problem_id}...", file=sys.stderr)
        try:
            sb.table("problems").delete().eq("id", problem_id).execute()
            print(f"  Rolled back problem {problem_id}", file=sys.stderr)
        except Exception as rollback_exc:
            print(f"  ERROR: Rollback also failed: {rollback_exc}", file=sys.stderr)
        raise

    print(f"  Inserted {len(tc_rows)} test cases ({min(3, len(tc_rows))} visible, {max(0, len(tc_rows)-3)} hidden)")

    return {"problem_id": problem_id, "title": title}


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed problems into Supabase from YAML specs")
    parser.add_argument("specs", nargs="+", type=str, help="Paths to YAML problem spec files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without inserting into Supabase")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    spec_paths = [Path(s) for s in args.specs]

    for p in spec_paths:
        if not p.exists():
            print(f"Error: {p} does not exist", file=sys.stderr)
            sys.exit(1)

    async def run_all() -> list[dict[str, Any] | None]:
        results = []
        for p in spec_paths:
            result = await _seed_one(p, dry_run=args.dry_run)
            results.append(result)
        return results

    results = asyncio.run(run_all())

    seeded = [r for r in results if r is not None]
    print(f"\n{'='*60}")
    print(f"Done. Seeded {len(seeded)}/{len(spec_paths)} problems.")
    if seeded:
        for r in seeded:
            print(f"  - {r['title']} ({r['problem_id']})")


if __name__ == "__main__":
    main()
