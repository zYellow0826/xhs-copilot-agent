from typing import TypedDict

from langgraph.graph import StateGraph, START, END
from openai import OpenAI

from prompts.system import SYSTEM_PROMPT
from schemas import GenerationInput, GenerationOutput
from settings import settings

client = OpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url=settings.DEEPSEEK_BASE_URL,
)


class CreationState(TypedDict):
    input: GenerationInput
    output: GenerationOutput | None


SUBMIT_TOOL = {
    "type": "function",
    "function": {
        "name": "submit_notes",
        "description": "提交生成的小红书笔记",
        "parameters": GenerationOutput.model_json_schema(),
    },
}


def generate_node(state: CreationState) -> CreationState:
    response = client.chat.completions.create(
        model=settings.DEEPSEEK_MODEL_CHAT,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": state["input"].model_dump_json()},
        ],
        tools=[SUBMIT_TOOL],
        tool_choice={"type": "function", "function": {"name": "submit_notes"}},
    )

    tool_call = response.choices[0].message.tool_calls[0]
    output = GenerationOutput.model_validate_json(tool_call.function.arguments)

    usage = response.usage
    cache_hit = getattr(usage, "prompt_cache_hit_tokens", 0)
    print(f"[cache] hit={cache_hit}/{usage.prompt_tokens}")

    return {**state, "output": output}


def build_graph():
    g = StateGraph(CreationState)
    g.add_node("generate", generate_node)
    g.add_edge(START, "generate")
    g.add_edge("generate", END)
    return g.compile()
