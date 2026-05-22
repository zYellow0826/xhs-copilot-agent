import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from db import save_generation
from graphs.creation import build_graph
from schemas import GenerationInput
from settings import settings

app = FastAPI(title="xhs-copilot api", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
async def generate(payload: GenerationInput):
    async def stream():
        final_state = None
        async for event in graph.astream_events(
            {"input": payload, "output": None}, version="v2"
        ):
            yield f"data: {json.dumps(event, default=str, ensure_ascii=False)}\n\n"
            if event["event"] == "on_chain_end" and event["name"] == "LangGraph":
                final_state = event["data"]["output"]

        if final_state and final_state.get("output"):
            await save_generation(
                payload, final_state["output"], model=settings.DEEPSEEK_MODEL_CHAT
            )

    return StreamingResponse(stream(), media_type="text/event-stream")
