from __future__ import annotations

import time
from collections import deque

from fastapi import HTTPException

MAX_KEYS = 10_000


class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60) -> None:
        self._max = max_requests
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = {}

    def check(self, key: str) -> None:
        now = time.monotonic()
        window_start = now - self._window

        hits = self._hits.get(key)
        if hits is None:
            if len(self._hits) >= MAX_KEYS:
                self._evict(window_start)
            hits = deque()
            self._hits[key] = hits

        while hits and hits[0] < window_start:
            hits.popleft()

        if not hits:
            del self._hits[key]
            hits = deque()
            self._hits[key] = hits

        if len(hits) >= self._max:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded — max 10 submissions per minute",
            )

        hits.append(now)

    def _evict(self, window_start: float) -> None:
        stale = [k for k, v in self._hits.items() if not v or v[-1] < window_start]
        for k in stale:
            del self._hits[k]
        if len(self._hits) >= MAX_KEYS:
            oldest_key = min(self._hits, key=lambda k: self._hits[k][-1])
            del self._hits[oldest_key]
