"""CLI: python -m backend.cli.gen_tests --signature "def two_sum(nums, target):" --description "..." """

from __future__ import annotations

import argparse
import asyncio
import pathlib
import sys

from llm.gemini import chat

PROMPT_PATH = pathlib.Path(__file__).parent.parent / "prompts" / "gen_tests.txt"


def build_prompt(signature: str, description: str) -> str:
    template = PROMPT_PATH.read_text()
    return template.replace("{signature}", signature).replace("{description}", description)


async def generate(signature: str, description: str) -> str:
    prompt = build_prompt(signature, description)
    result = await chat(prompt)
    lines = [line for line in result.strip().splitlines() if line.strip()]
    if len(lines) != 8:
        raise ValueError(f"Expected 8 test cases, got {len(lines)}")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 8 test case inputs for a Python function.")
    parser.add_argument("--signature", required=True, help='Function signature, e.g. "def two_sum(nums, target):"')
    parser.add_argument("--description", required=True, help="Plain-English description of the function")
    parser.add_argument("--out", help="Write output to this file instead of stdout")
    args = parser.parse_args()

    result = asyncio.run(generate(args.signature, args.description))

    if args.out:
        pathlib.Path(args.out).write_text(result + "\n")
        print(f"Wrote test cases to {args.out}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()