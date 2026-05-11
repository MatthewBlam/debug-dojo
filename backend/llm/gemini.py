"""
Gemini LLM wrapper using the google-genai SDK.

Requires:
    GEMINI_API_KEY environment variable set to your key from aistudio.google.com.
"""

import asyncio
import logging
import os

from google import genai
from google.genai import types
from google.api_core.exceptions import ResourceExhausted

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash"
_MAX_RETRIES = 3
_BACKOFF_BASE = 2  # seconds; doubles each retry: 2s, 4s, 8s


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)


async def chat(prompt: str, system: str | None = None) -> str:
    """Send a prompt to Gemini and return the text response.

    Args:
        prompt: The user message.
        system: Optional system instruction for the model.

    Returns:
        The model's response as a plain string.

    Raises:
        ResourceExhausted: If the 429 rate limit persists after all retries.
        EnvironmentError: If GEMINI_API_KEY is not set.
    """
    client = _get_client()
    config = types.GenerateContentConfig(system_instruction=system) if system else None

    for attempt in range(_MAX_RETRIES + 1):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=_MODEL,
                contents=prompt,
                config=config,
            )
            return str(response.text)

        except ResourceExhausted:
            if attempt >= _MAX_RETRIES:
                logger.error("Gemini 429: all %d retries exhausted.", _MAX_RETRIES)
                raise
            wait = _BACKOFF_BASE ** (attempt + 1)
            logger.warning(
                "Gemini 429 rate-limited (attempt %d/%d). Retrying in %ds...",
                attempt + 1,
                _MAX_RETRIES,
                wait,
            )
            await asyncio.sleep(wait)

    # Unreachable, but satisfies mypy's strict return check
    raise RuntimeError("Exited retry loop unexpectedly.")