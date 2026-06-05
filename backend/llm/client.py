from __future__ import annotations

import asyncio
import logging
import os

from google import genai
from google.genai import errors, types

logger = logging.getLogger(__name__)

DEFAULT_PROVIDER_TIMEOUT: float = 60.0


class GeminiClient:
    """Async wrapper around Google Gemini 2.5 Flash."""

    def __init__(self, api_key: str | None = None, model: str = "gemini-2.5-flash") -> None:
        key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise RuntimeError("GEMINI_API_KEY must be set")
        self._client = genai.Client(api_key=key)
        self._model_name = model

    async def generate(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_retries: int = 3,
        timeout: float = DEFAULT_PROVIDER_TIMEOUT,
    ) -> str:
        """Send prompt to Gemini and return text response.

        Retries on 429 (rate limit) with exponential backoff.
        """
        last_error: Exception | None = None
        for attempt in range(max_retries):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._client.models.generate_content,
                        model=self._model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=temperature,
                        ),
                    ),
                    timeout=timeout,
                )
                return response.text
            except asyncio.TimeoutError:
                logger.error(
                    "Gemini call timed out after %.1fs (attempt %d/%d)",
                    timeout,
                    attempt + 1,
                    max_retries,
                )
                raise TimeoutError(
                    f"Gemini provider timed out after {timeout}s"
                )
            except errors.APIError as e:
                last_error = e
                if e.code == 429:
                    wait = 2**attempt
                    await asyncio.sleep(wait)
                    continue
                raise
            except Exception:
                raise
        raise last_error  # type: ignore[misc]


_default_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Get or create the default Gemini client singleton."""
    global _default_client
    if _default_client is None:
        _default_client = GeminiClient()
    return _default_client
