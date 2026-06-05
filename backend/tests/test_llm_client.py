from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import pytest

from llm.client import GeminiClient, get_gemini_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _patch_genai(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Replace the google.genai module used by llm.client with a mock."""
    mock_genai = MagicMock()
    # Client returns a mock client instance with models.generate_content
    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance

    import llm.client as client_mod

    monkeypatch.setattr(client_mod, "genai", mock_genai)
    # Mock types.GenerateContentConfig to be callable
    mock_types = MagicMock()
    monkeypatch.setattr(client_mod, "types", mock_types)
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

    # Arrange: client.models.generate_content returns an object with .text
    mock_response = MagicMock()
    mock_response.text = "Hello from Gemini"
    mock_genai.Client.return_value.models.generate_content.return_value = mock_response

    result = asyncio.run(client.generate("Say hello"))

    assert result == "Hello from Gemini"
    mock_genai.Client.return_value.models.generate_content.assert_called_once()


def test_429_triggers_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    """generate() should retry on 429 rate-limit errors."""
    mock_genai = _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    client = GeminiClient()

    # First call raises a 429 APIError, second call succeeds
    from google.genai import errors

    rate_limit_error = errors.APIError(
        429, {"error": {"message": "Resource has been exhausted", "status": "RESOURCE_EXHAUSTED"}},
    )

    mock_response = MagicMock()
    mock_response.text = "success after retry"
    mock_models = mock_genai.Client.return_value.models
    mock_models.generate_content.side_effect = [
        rate_limit_error,
        mock_response,
    ]

    # Patch asyncio.sleep so the test doesn't actually wait
    async def instant_sleep(_seconds: float) -> None:
        pass

    monkeypatch.setattr(asyncio, "sleep", instant_sleep)

    result = asyncio.run(client.generate("test prompt"))

    assert result == "success after retry"
    assert mock_models.generate_content.call_count == 2


def test_non_retryable_error_raised_immediately(monkeypatch: pytest.MonkeyPatch) -> None:
    """Non-429 errors should propagate immediately without retry."""
    mock_genai = _patch_genai(monkeypatch)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    client = GeminiClient()

    mock_models = mock_genai.Client.return_value.models
    mock_models.generate_content.side_effect = ValueError("bad input")

    with pytest.raises(ValueError, match="bad input"):
        asyncio.run(client.generate("test prompt"))

    assert mock_models.generate_content.call_count == 1


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
