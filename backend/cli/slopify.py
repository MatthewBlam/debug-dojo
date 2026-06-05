"""CLI tool to generate buggy ('slop') code from a reference solution.

Usage:
    python -m cli.slopify --solution "def two_sum(nums, target): ..." --signature "def two_sum(nums: list[int], target: int) -> list[int]" --bug-category off-by-one --difficulty Easy

Or read from a YAML problem spec:
    python -m cli.slopify --from-yaml seeds/001_two_sum.yaml
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

import yaml

from llm.client import get_gemini_client


def _load_prompt_template() -> str:
    template_path = Path(__file__).resolve().parent.parent / "prompts" / "slop_gen.txt"
    return template_path.read_text()


async def generate_slop(
    *,
    reference_solution: str,
    function_signature: str,
    bug_category: str,
    difficulty: str,
) -> str:
    """Generate a buggy variant of the reference solution."""
    template = _load_prompt_template()
    prompt = template.format(
        reference_solution=reference_solution,
        function_signature=function_signature,
        bug_category=bug_category,
        difficulty=difficulty,
    )
    client = get_gemini_client()
    response = await client.generate(prompt, temperature=0.7)

    # Extract code from response (may be wrapped in markdown code block)
    code = response.strip()
    if code.startswith("```python"):
        code = code[len("```python") :].strip()
    if code.startswith("```"):
        code = code[3:].strip()
    if code.endswith("```"):
        code = code[:-3].strip()

    return code


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate buggy code from a reference solution")
    parser.add_argument("--from-yaml", type=str, help="Path to a YAML problem spec file")
    parser.add_argument("--solution", type=str, help="The reference solution code")
    parser.add_argument("--signature", type=str, help="The function signature")
    parser.add_argument(
        "--bug-category",
        type=str,
        choices=[
            "off-by-one",
            "wrong-operator",
            "bad-variable",
            "missing-edge-case",
            "logic-inversion",
            "bad-complexity",
        ],
        help="Type of bug to introduce",
    )
    parser.add_argument(
        "--difficulty",
        type=str,
        default="Easy",
        choices=["Easy", "Medium", "Hard"],
        help="Problem difficulty level",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    if args.from_yaml:
        spec = yaml.safe_load(Path(args.from_yaml).read_text())
        reference_solution = spec["reference_solution"]
        function_signature = spec["function_signature"]
        bug_category = spec.get("bug_category", "off-by-one")
        difficulty = spec.get("difficulty", "Easy")
    elif args.solution and args.signature and args.bug_category:
        reference_solution = args.solution
        function_signature = args.signature
        bug_category = args.bug_category
        difficulty = args.difficulty
    else:
        print(
            "Error: provide --from-yaml or (--solution, --signature, --bug-category)",
            file=sys.stderr,
        )
        sys.exit(1)

    slop = asyncio.run(
        generate_slop(
            reference_solution=reference_solution,
            function_signature=function_signature,
            bug_category=bug_category,
            difficulty=difficulty,
        )
    )
    print(slop)


if __name__ == "__main__":
    main()
