"""CLI tool to generate test cases for a problem using Gemini.

Usage:
    python -m cli.gen_tests --from-yaml seeds/001_two_sum.yaml --num-cases 8

Or provide arguments directly:
    python -m cli.gen_tests --signature "def two_sum(nums: list[int], target: int) -> list[int]" --description "Given an array..." --difficulty Easy --num-cases 8
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

import yaml

from llm.client import get_gemini_client


def _load_prompt_template() -> str:
    template_path = Path(__file__).resolve().parent.parent / "prompts" / "test_gen.txt"
    return template_path.read_text()


async def generate_test_cases(
    *,
    function_signature: str,
    description: str,
    difficulty: str,
    num_cases: int = 8,
) -> list[dict[str, str]]:
    """Generate test cases for a problem using Gemini.

    Returns a list of dicts with 'input' and 'expected_output' keys.
    """
    template = _load_prompt_template()
    prompt = template.format(
        function_signature=function_signature,
        description=description,
        difficulty=difficulty,
        num_cases=num_cases,
    )
    client = get_gemini_client()
    response = await client.generate(prompt, temperature=0.4)

    # Parse JSON from response (may be wrapped in markdown code block)
    text = response.strip()
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.startswith("```"):
        text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    try:
        cases = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse LLM response as JSON: {e}", file=sys.stderr)
        print(f"Raw response:\n{response}", file=sys.stderr)
        raise ValueError(f"LLM returned invalid JSON: {e}") from e

    if not isinstance(cases, list):
        raise ValueError(f"Expected JSON array, got {type(cases).__name__}")

    for i, case in enumerate(cases):
        if not isinstance(case, dict):
            raise ValueError(f"Test case {i} is not an object")
        if "input" not in case:
            raise ValueError(f"Test case {i} missing 'input' key")
        if "expected_output" not in case:
            raise ValueError(f"Test case {i} missing 'expected_output' key")
        if not isinstance(case["input"], (str, dict, list)):
            raise ValueError(
                f"Test case {i} 'input' must be str, dict, or list, "
                f"got {type(case['input']).__name__}"
            )
        if not isinstance(case["expected_output"], (str, dict, list, int, float, bool)):
            raise ValueError(
                f"Test case {i} 'expected_output' must be str, dict, list, or primitive, "
                f"got {type(case['expected_output']).__name__}"
            )

    return cases


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate test cases for a coding problem")
    parser.add_argument("--from-yaml", type=str, help="Path to a YAML problem spec file")
    parser.add_argument("--signature", type=str, help="The function signature")
    parser.add_argument("--description", type=str, help="Problem description")
    parser.add_argument("--difficulty", type=str, default="Easy",
                        choices=["Easy", "Medium", "Hard"])
    parser.add_argument("--num-cases", type=int, default=8, help="Number of test cases to generate")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    if args.from_yaml:
        spec = yaml.safe_load(Path(args.from_yaml).read_text())
        function_signature = spec["function_signature"]
        description = spec["description"]
        difficulty = spec.get("difficulty", "Easy")
    elif args.signature and args.description:
        function_signature = args.signature
        description = args.description
        difficulty = args.difficulty
    else:
        print("Error: provide --from-yaml or (--signature, --description)", file=sys.stderr)
        sys.exit(1)

    cases = asyncio.run(generate_test_cases(
        function_signature=function_signature,
        description=description,
        difficulty=difficulty,
        num_cases=args.num_cases,
    ))
    print(json.dumps(cases, indent=2))


if __name__ == "__main__":
    main()
