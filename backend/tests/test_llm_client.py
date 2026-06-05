from __future__ import annotations

import asyncio
import types
from typing import Any
from unittest.mock import MagicMock

import pytest

from llm.client import GeminiClient, get_gemini_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _patch_genai(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Replace the google.generativeai module used by llm.client with a mock."""
    mock_genai = MagicMock()
    # GenerativeModel returns a mock model instance
    mock_model_instance = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model_instance
    # GenerationConfig just needs to be callable
    mock_genai.types.GenerationConfig = MagicMock()

    import llm.client as client_mod

    monkeypatch.setattr(client_mod, "genai", mock_genai)
    return mock_genai


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_missing_api_key_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    """GeminiClient must raise RuntimeError when no key is provided."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    _patch_genai(monkeypatch)

    with pytest.raises(RuntimeError, match="GEMINI_API_KEY must be set"):
        GeminiClient()


def test_generate_returns_model_text(monkeypatch: pytest.MonkeyPatch) -> None:
    """generate() should return the text attribute of the model response."""
    mock_genai = _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    client = GeminiClient()

    # Arrange: model.generate_content returns an object with .text
    mock_response = MagicMock()
    mock_response.text = "Hello from Gemini"
    mock_genai.GenerativeModel.return_value.generate_content.return_value = mock_response

    result = asyncio.run(client.generate("Say hello"))

    assert result == "Hello from Gemini"
    mock_genai.GenerativeModel.return_value.generate_content.assert_called_once()


def test_429_triggers_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    """generate() should retry on 429 rate-limit errors."""
    mock_genai = _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    client = GeminiClient()

    # First call raises a 429, second call succeeds
    mock_response = MagicMock()
    mock_response.text = "success after retry"
    mock_model = mock_genai.GenerativeModel.return_value
    mock_model.generate_content.side_effect = [
        Exception("429 Resource has been exhausted"),
        mock_response,
    ]

    # Patch asyncio.sleep so the test doesn't actually wait
    real_sleep = asyncio.sleep

    async def instant_sleep(_seconds: float) -> None:
        pass

    monkeypatch.setattr(asyncio, "sleep", instant_sleep)

    result = asyncio.run(client.generate("test prompt"))

    assert result == "success after retry"
    assert mock_model.generate_content.call_count == 2


def test_non_retryable_error_raised_immediately(monkeypatch: pytest.MonkeyPatch) -> None:
    """Non-429 errors should propagate immediately without retry."""
    mock_genai = _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    client = GeminiClient()

    mock_model = mock_genai.GenerativeModel.return_value
    mock_model.generate_content.side_effect = ValueError("bad input")

    with pytest.raises(ValueError, match="bad input"):
        asyncio.run(client.generate("test prompt"))

    assert mock_model.generate_content.call_count == 1


def test_get_gemini_client_returns_singleton(monkeypatch: pytest.MonkeyPatch) -> None:
    """get_gemini_client() should return the same instance on repeated calls."""
    _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    # Reset the module-level singleton before testing
    import llm.client as client_mod

    monkeypatch.setattr(client_mod, "_default_client", None)

    first = get_gemini_client()
    second = get_gemini_client()

    assert first is second
