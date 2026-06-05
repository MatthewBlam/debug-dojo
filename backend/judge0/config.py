from __future__ import annotations

import os
from pathlib import Path

from env_loader import load_env

DEFAULT_JUDGE0_URL = "http://127.0.0.1:2358"


def get_judge0_url() -> str:
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    load_env(repo_root / ".env")
    load_env(backend_dir / ".env")
    return os.getenv("JUDGE0_URL", DEFAULT_JUDGE0_URL).rstrip("/")
