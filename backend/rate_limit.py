from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException


class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60) -> None:
        self._max = max_requests
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        window_start = now - self._window
        hits = self._hits[key]

        while hits and hits[0] < window_start:
            hits.popleft()

        if len(hits) >= self._max:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded — max 10 submissions per minute",
            )

        hits.append(now)
