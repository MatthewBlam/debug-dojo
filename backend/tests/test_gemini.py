"""Unit tests for backend/llm/gemini.py — all SDK calls are mocked."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.api_core.exceptions import ResourceExhausted

from llm.gemini import chat


def _response(text: str) -> MagicMock:
    mock = MagicMock()
    mock.text = text
    return mock


@pytest.fixture(autouse=True)
def api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


@patch("llm.gemini.asyncio.to_thread")
@patch("llm.gemini.genai.Client")
async def test_returns_string(mock_client: MagicMock, mock_thread: MagicMock) -> None:
    mock_thread.return_value = _response("Hello!")
    result = await chat("Say hello")
    assert result == "Hello!"
    assert isinstance(result, str)


@patch("llm.gemini.asyncio.to_thread")
@patch("llm.gemini.genai.Client")
async def test_no_system_passes_no_config(mock_client: MagicMock, mock_thread: MagicMock) -> None:
    mock_thread.return_value = _response("ok")
    await chat("prompt")
    _, kwargs = mock_thread.call_args
    assert kwargs.get("config") is None


@patch("llm.gemini.asyncio.to_thread")
@patch("llm.gemini.genai.Client")
async def test_system_prompt_creates_config(
    mock_client: MagicMock, mock_thread: MagicMock
) -> None:
    mock_thread.return_value = _response("aye")
    await chat("prompt", system="You are a pirate.")
    _, kwargs = mock_thread.call_args
    assert kwargs.get("config") is not None


# ---------------------------------------------------------------------------
# 429 / retry logic
# ---------------------------------------------------------------------------


@patch("llm.gemini.asyncio.sleep", new_callable=AsyncMock)
@patch("llm.gemini.asyncio.to_thread")
@patch("llm.gemini.genai.Client")
async def test_retries_on_429_then_succeeds(
    mock_client: MagicMock, mock_thread: MagicMock, mock_sleep: AsyncMock
) -> None:
    """Should retry twice on 429, then succeed on the third attempt."""
    mock_thread.side_effect = [
        ResourceExhausted("rate limit"),
        ResourceExhausted("rate limit"),
        _response("finally ok"),
    ]
    result = await chat("prompt")
    assert result == "finally ok"
    assert mock_sleep.call_count == 2
    # Exponential backoff: 2s then 4s
    assert mock_sleep.call_args_list[0].args[0] == 2
    assert mock_sleep.call_args_list[1].args[0] == 4


@patch("llm.gemini.asyncio.sleep", new_callable=AsyncMock)
@patch("llm.gemini.asyncio.to_thread")
@patch("llm.gemini.genai.Client")
async def test_raises_after_max_retries(
    mock_client: MagicMock, mock_thread: MagicMock, mock_sleep: AsyncMock
) -> None:
    """Should raise ResourceExhausted once all 3 retries are exhausted."""
    mock_thread.side_effect = ResourceExhausted("rate limit")
    with pytest.raises(ResourceExhausted):
        await chat("prompt")
    assert mock_sleep.call_count == 3


# ---------------------------------------------------------------------------
# Missing API key
# ---------------------------------------------------------------------------


@patch("llm.gemini.genai.Client")
async def test_raises_if_no_api_key(
    mock_client: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("GEMINI_API_KEY")
    with pytest.raises(EnvironmentError, match="GEMINI_API_KEY"):
        await chat("prompt")