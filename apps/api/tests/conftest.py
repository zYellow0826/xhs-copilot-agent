"""Shared pytest configuration.

Set fake env vars so `settings.Settings()` can construct in CI without a
real DeepSeek key, and put `apps/api` on sys.path so tests can import the
top-level modules (`schemas`, `graphs.*`, etc.) the same way `uvicorn main:app`
does.
"""

import os
import sys
from pathlib import Path

os.environ.setdefault("DEEPSEEK_API_KEY", "sk-test-dummy")

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))
