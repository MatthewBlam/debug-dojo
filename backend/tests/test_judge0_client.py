from __future__ import annotations

import asyncio

from backend.judge0.client import RunResult, run_python


class MockResponse:
    def __init__(self, payload: dict[str, object], status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"mocked HTTP error: {self.status_code}")

    def json(self) -> dict[str, object]:
        return self._payload


class MockAsyncClient:
    def __init__(self) -> None:
        self.post_calls: list[tuple[str, dict[str, str], dict[str, object]]] = []
        self.get_calls: list[tuple[str, dict[str, str]]] = []
        self._poll_responses = [
            {"status": {"id": 1, "description": "In Queue"}},
            {
                "stdout": "3\n",
                "stderr": None,
                "compile_output": None,
                "message": None,
                "status": {"id": 3, "description": "Accepted"},
                "time": "0.042",
            },
        ]

    async def post(
        self,
        url: str,
        *,
        params: dict[str, str],
        json: dict[str, object],
    ) -> MockResponse:
        self.post_calls.append((url, params, json))
        return MockResponse({"token": "submission-token"})

    async def get(self, url: str, *, params: dict[str, str]) -> MockResponse:
        self.get_calls.append((url, params))
        return MockResponse(self._poll_responses.pop(0))


def test_run_python_polls_until_completion() -> None:
    client = MockAsyncClient()

    result = asyncio.run(run_python("print(input())", "3", client=client))

    assert result == RunResult(
        stdout="3\n",
        stderr="",
        status="Accepted",
        time_ms=42,
    )
    assert client.post_calls == [
        (
            "/submissions",
            {"base64_encoded": "false", "wait": "false"},
            {
                "language_id": 71,
                "source_code": "print(input())",
                "stdin": "3",
            },
        )
    ]
    assert client.get_calls == [
        (
            "/submissions/submission-token",
            {
                "base64_encoded": "false",
                "fields": "stdout,stderr,compile_output,message,status,time",
            },
        ),
        (
            "/submissions/submission-token",
            {
                "base64_encoded": "false",
                "fields": "stdout,stderr,compile_output,message,status,time",
            },
        ),
    ]
