from supabase import Client, create_client

from schemas import GenerationInput, GenerationOutput
from settings import settings

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


async def save_generation(
    payload: GenerationInput,
    output: GenerationOutput,
    model: str = "deepseek-chat",
) -> None:
    """写一条 generations 记录。失败不阻塞主流程。"""
    try:
        get_client().table("generations").insert(
            {
                "input": payload.model_dump(),
                "output": output.model_dump(),
                "model": model,
            }
        ).execute()
    except Exception as e:
        print(f"[db] save_generation failed: {e}")
