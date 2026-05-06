from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx

from .config import get_judge0_url

PYTHON_3_LANGUAGE_ID = 71
_POLL_INTERVAL_SECONDS = 0.2
_TERMINAL_STATUS_IDS = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}


@dataclass(slots=True)
class RunResult:
    stdout: str
    stderr: str
    status: str
    time_ms: int | None


async def run_python(
    code: str,
    stdin: str,
    client: httpx.AsyncClient | None = None,
) -> RunResult:
    if client is not None:
        return await _run_python_with_client(client=client, code=code, stdin=stdin)

    async with httpx.AsyncClient(base_url=get_judge0_url(), timeout=30.0) as managed_client:
        return await _run_python_with_client(client=managed_client, code=code, stdin=stdin)


async def _run_python_with_client(
    *,
    client: httpx.AsyncClient,
    code: str,
    stdin: str,
) -> RunResult:
    submission_response = await client.post(
        "/submissions",
        params={"base64_encoded": "false", "wait": "false"},
        json={
            "language_id": PYTHON_3_LANGUAGE_ID,
            "source_code": code,
            "stdin": stdin,
        },
    )
    submission_response.raise_for_status()

    submission_token = submission_response.json()["token"]

    while True:
        result_response = await client.get(
            f"/submissions/{submission_token}",
            params={
                "base64_encoded": "false",
                "fields": "stdout,stderr,compile_output,message,status,time",
            },
        )
        result_response.raise_for_status()

        payload = result_response.json()
        status = payload.get("status") or {}
        status_id = status.get("id")

        if status_id in _TERMINAL_STATUS_IDS:
            return RunResult(
                stdout=payload.get("stdout") or "",
                stderr=_extract_stderr(payload),
                status=status.get("description") or "Unknown",
                time_ms=_parse_time_ms(payload.get("time")),
            )

        await asyncio.sleep(_POLL_INTERVAL_SECONDS)


def _extract_stderr(payload: dict[str, Any]) -> str:
    return (
        payload.get("stderr")
        or payload.get("compile_output")
        or payload.get("message")
        or ""
    )


def _parse_time_ms(value: Any) -> int | None:
    if value in (None, ""):
        return None

    try:
        return int(float(value) * 1000)
    except (TypeError, ValueError):
        return None
