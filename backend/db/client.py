"""
Supabase client for the backend.

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment.
Returns None if either is missing so callers can degrade gracefully.
"""

import logging
import os

logger = logging.getLogger(__name__)

try:
    from supabase import Client, create_client
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False
    logger.warning("supabase package not installed — DB operations will be skipped.")


def get_client() -> "Client | None":
    """Return a Supabase service-role client, or None if not configured."""
    if not _SUPABASE_AVAILABLE:
        return None

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB operations will be skipped."
        )
        return None

    return create_client(url, key)  # type: ignore[return-value]