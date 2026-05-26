"""Supabase persistence — entirely optional.

If `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` aren't configured the helpers below
become no-ops, so the app can run in pure-local mode without a database.
"""

from __future__ import annotations

import logging
from typing import Any

from schemas import GenerationInput, GenerationOutput
from settings import settings

log = logging.getLogger(__name__)

_client: Any | None = None


def get_client() -> Any | None:
    global _client
    if not settings.supabase_enabled:
        return None
    if _client is not None:
        return _client
    try:
        from supabase import create_client  # imported lazily so the dep is optional at runtime
    except ImportError:
        log.warning("supabase-py not installed; persistence disabled")
        return None
    try:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except Exception as exc:
        log.warning("supabase client init failed: %s", exc)
        return None
    return _client


async def save_generation(
    payload: GenerationInput,
    output: GenerationOutput,
    model: str = "deepseek-chat",
) -> None:
    """Persist one generation row. Silently skipped if Supabase isn't configured."""
    client = get_client()
    if client is None:
        return
    try:
        client.table("generations").insert(
            {
                "input": payload.model_dump(),
                "output": output.model_dump(),
                "model": model,
            }
        ).execute()
    except Exception as exc:
        log.warning("save_generation failed: %s", exc)
