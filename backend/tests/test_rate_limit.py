from __future__ import annotations

import time
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from rate_limit import MAX_KEYS, RateLimiter


def test_allows_requests_within_limit():
    rl = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        rl.check("user1")


def test_rejects_over_limit():
    rl = RateLimiter(max_requests=2, window_seconds=60)
    rl.check("user1")
    rl.check("user1")
    with pytest.raises(HTTPException) as exc_info:
        rl.check("user1")
    assert exc_info.value.status_code == 429


def test_expired_hits_are_pruned():
    rl = RateLimiter(max_requests=2, window_seconds=1)
    rl.check("user1")
    rl.check("user1")

    with patch.object(time, "monotonic", return_value=time.monotonic() + 2):
        rl.check("user1")


def test_empty_key_removed_after_expiry():
    rl = RateLimiter(max_requests=5, window_seconds=1)
    rl.check("user1")
    assert "user1" in rl._hits

    future = time.monotonic() + 2
    with patch.object(time, "monotonic", return_value=future):
        rl.check("user1")
    assert "user1" in rl._hits


def test_eviction_cleans_stale_keys_at_capacity():
    rl = RateLimiter(max_requests=100, window_seconds=1)
    base = time.monotonic()

    with patch.object(time, "monotonic", return_value=base):
        for i in range(5):
            rl.check(f"old-{i}")

    future = base + 2
    with patch.object(time, "monotonic", return_value=future):
        for i in range(MAX_KEYS - 5):
            rl.check(f"new-{i}")
        assert len(rl._hits) == MAX_KEYS
        rl.check("trigger-eviction")

    assert "old-0" not in rl._hits
    assert "trigger-eviction" in rl._hits
    assert len(rl._hits) <= MAX_KEYS
