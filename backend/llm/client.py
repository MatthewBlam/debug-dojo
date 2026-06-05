from __future__ import annotations

import asyncio
import os

import google.generativeai as genai


class GeminiClient:
    """Async wrapper around Google Gemini 2.5 Flash."""

    def __init__(self, api_key: str | None = None, model: str = "gemini-2.5-flash") -> None:
        key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise RuntimeError("GEMINI_API_KEY must be set")
        genai.configure(api_key=key)
        self._model = genai.GenerativeModel(model)

    async def generate(self, prompt: str, *, temperature: float = 0.7, max_retries: int = 3) -> str:
        """Send prompt to Gemini and return text response.

        Retries on 429 (rate limit) with exponential backoff.
        """
        last_error: Exception | None = None
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self._model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                    ),
                )
                return response.text
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                if "429" in error_str or "resource" in error_str or "rate" in error_str:
                    wait = 2**attempt
                    await asyncio.sleep(wait)
                    continue
                raise
        raise last_error  # type: ignore[misc]


_default_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Get or create the default Gemini client singleton."""
    global _default_client
    if _default_client is None:
        _default_client = GeminiClient()
    return _default_client
