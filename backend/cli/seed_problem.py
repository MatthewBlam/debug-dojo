"""Seed deterministic Debug Dojo problems into Supabase from YAML specs.

Usage:
    python -m cli.seed_problem seeds/*.yaml
    python -m cli.seed_problem seeds/*.yaml --dry-run
    python -m cli.seed_problem seeds/*.yaml --reset
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from typing import Any

import yaml

from env_loader import load_env

load_env(Path(__file__).resolve().parents[1] / ".env")


def _load_spec(spec_path: Path) -> dict[str, Any]:
    spec = yaml.safe_load(spec_path.read_text())
    required = [
        "short_id",
        "title",
        "description",
        "difficulty",
        "bug_category",
        "tags",
        "function_signature",
        "reference_solution",
        "slop_code",
        "target_complexity",
        "test_cases",
    ]
    missing = [key for key in required if key not in spec]
    if missing:
        raise ValueError(f"{spec_path} is missing required keys: {', '.join(missing)}")
    if not spec["test_cases"]:
        raise ValueError(f"{spec_path} must include at least one test case")
    if not any(not tc.get("is_hidden", False) for tc in spec["test_cases"]):
        raise ValueError(f"{spec_path} must include at least one visible test case")
    return spec


async def _validate_spec(spec: dict[str, Any], *, skip_validation: bool) -> None:
    if skip_validation:
        print("  [1/3] Validation skipped")
        return

    print("  [1/3] Validating reference and slop with Judge0...")
    from main import _judge_code

    problem = {
        "title": spec["title"],
        "difficulty": spec["difficulty"],
        "target_complexity": spec["target_complexity"],
        "function_signature": spec["function_signature"],
        "reference_solution": spec["reference_solution"],
        "test_cases": spec["test_cases"],
    }
    reference = await _judge_code(
        problem=problem,
        code=spec["reference_solution"],
        include_hidden=True,
        include_io=False,
        include_feedback=False,
    )
    if reference.verdict != "pass":
        raise ValueError(
            f"Reference solution for {spec['short_id']} {spec['title']} got {reference.verdict}"
        )

    slop = await _judge_code(
        problem=problem,
        code=spec["slop_code"],
        include_hidden=True,
        include_io=False,
        include_feedback=False,
    )
    if slop.verdict == "pass":
        raise ValueError(f"Slop code for {spec['short_id']} {spec['title']} unexpectedly passed")
    print(f"       reference=pass, slop={slop.verdict}")


async def _seed_one(
    spec_path: Path,
    *,
    dry_run: bool,
    skip_validation: bool,
) -> dict[str, Any] | None:
    spec = _load_spec(spec_path)
    print(f"\n{'=' * 60}")
    print(f"Seeding {spec['short_id']}: {spec['title']} ({spec['difficulty']})")
    print(f"{'=' * 60}")

    await _validate_spec(spec, skip_validation=skip_validation)

    if dry_run:
        print("  [2/3] Dry run: not inserting")
        return None

    print("  [2/3] Inserting problem, tags, and test cases...")
    from db.client import get_supabase

    sb = get_supabase()
    existing_response = (
        sb.table("problems")
        .select("id")
        .eq("short_id", spec["short_id"])
        .maybe_single()
        .execute()
    )
    existing = existing_response.data if existing_response else None
    if existing:
        sb.table("problems").delete().eq("id", existing["id"]).execute()

    problem_row = (
        sb.table("problems")
        .insert(
            {
                "short_id": spec["short_id"],
                "title": spec["title"],
                "description": spec["description"],
                "difficulty": spec["difficulty"],
                "bug_category": spec["bug_category"],
                "function_signature": spec["function_signature"],
                "reference_solution": spec["reference_solution"],
                "slop_code": spec["slop_code"],
                "target_complexity": spec["target_complexity"],
                "status": "published",
            }
        )
        .execute()
    )
    rows: list[dict[str, Any]] = problem_row.data or []
    if not rows:
        raise RuntimeError(f"Failed to insert problem {spec['short_id']}")

    problem_id = rows[0]["id"]
    tag_rows = [
        {"problem_id": problem_id, "tag": tag, "position": i}
        for i, tag in enumerate(spec["tags"])
    ]
    if tag_rows:
        sb.table("problem_tags").insert(tag_rows).execute()

    test_case_rows = [
        {
            "problem_id": problem_id,
            "input": tc["input"],
            "is_hidden": bool(tc.get("is_hidden", False)),
            "position": i,
        }
        for i, tc in enumerate(spec["test_cases"])
    ]
    sb.table("test_cases").insert(test_case_rows).execute()
    print(
        "  [3/3] Inserted "
        f"{len(test_case_rows)} cases "
        f"({sum(1 for tc in test_case_rows if not tc['is_hidden'])} visible)"
    )
    return {"problem_id": problem_id, "title": spec["title"], "short_id": spec["short_id"]}


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed deterministic Debug Dojo problems")
    parser.add_argument("specs", nargs="+", type=str, help="Paths to YAML problem specs")
    parser.add_argument("--dry-run", action="store_true", help="Validate only")
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip Judge0 validation. Use only when Judge0 is unavailable.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing public app rows before seeding.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    spec_paths = [Path(s) for s in args.specs]
    for path in spec_paths:
        if not path.exists():
            print(f"Error: {path} does not exist", file=sys.stderr)
            sys.exit(1)

    async def run_all() -> list[dict[str, Any] | None]:
        if args.reset and not args.dry_run:
            from db.client import get_supabase

            print("Resetting public app rows...")
            sb = get_supabase()
            sentinel = "00000000-0000-0000-0000-000000000000"
            sb.table("submissions").delete().neq("id", sentinel).execute()
            sb.table("test_cases").delete().neq("id", sentinel).execute()
            sb.table("problem_tags").delete().neq("problem_id", sentinel).execute()
            sb.table("problems").delete().neq("id", sentinel).execute()

        results = []
        for path in sorted(spec_paths):
            results.append(
                await _seed_one(
                    path,
                    dry_run=args.dry_run,
                    skip_validation=args.skip_validation,
                )
            )
        return results

    results = asyncio.run(run_all())
    seeded = [result for result in results if result is not None]
    print(f"\n{'=' * 60}")
    print(f"Done. Seeded {len(seeded)}/{len(spec_paths)} problems.")
    for result in seeded:
        print(f"  - {result['short_id']} {result['title']} ({result['problem_id']})")


if __name__ == "__main__":
    main()
