"""
Slop-generation CLI.

Usage:
    python -m backend.cli.slopify --reference path/to/file.py --category off_by_one
    python -m backend.cli.slopify --reference path/to/file.py --category off_by_one --out slop.py
"""

import argparse
import ast
import asyncio
import pathlib
import sys

from backend.llm.gemini import chat

VALID_CATEGORIES = [
    "complexity_degradation",
    "off_by_one",
    "wrong_base_case",
    "missing_edge_case",
    "subtle_logic_error",
    "redundant_work",
]

_PROMPT_PATH = pathlib.Path(__file__).parent.parent / "prompts" / "slop_gen.txt"


def _build_prompt(reference_code: str, category: str) -> str:
    template = _PROMPT_PATH.read_text(encoding="utf-8")
    return template.format(reference_solution=reference_code, bug_category=category)


def _strip_fences(text: str) -> str:
    """Remove markdown code fences if the model added them despite instructions."""
    lines = text.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _validate_python(code: str) -> None:
    """Raise SystemExit if code is not syntactically valid Python."""
    try:
        ast.parse(code)
    except SyntaxError as exc:
        print(f"ERROR: model returned unparseable Python — {exc}", file=sys.stderr)
        sys.exit(1)


async def _run(
    reference_path: pathlib.Path,
    category: str,
    out_path: pathlib.Path | None,
) -> None:
    reference_code = reference_path.read_text(encoding="utf-8")
    prompt = _build_prompt(reference_code, category)

    raw = await chat(prompt)
    slop = _strip_fences(raw)

    _validate_python(slop)

    if out_path:
        out_path.write_text(slop + "\n", encoding="utf-8")
        print(f"Wrote slop to {out_path}", file=sys.stderr)
    else:
        print(slop)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a buggy Python variant from a correct reference solution.",
    )
    parser.add_argument(
        "--reference",
        required=True,
        type=pathlib.Path,
        metavar="FILE",
        help="Path to the correct reference Python file.",
    )
    parser.add_argument(
        "--category",
        required=True,
        choices=VALID_CATEGORIES,
        metavar="CATEGORY",
        help=(
            "Bug category to introduce. "
            f"One of: {', '.join(VALID_CATEGORIES)}"
        ),
    )
    parser.add_argument(
        "--out",
        type=pathlib.Path,
        default=None,
        metavar="FILE",
        help="Write slop to this file instead of stdout.",
    )

    args = parser.parse_args()

    if not args.reference.exists():
        print(f"ERROR: reference file not found: {args.reference}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(_run(args.reference, args.category, args.out))


if __name__ == "__main__":
    main()