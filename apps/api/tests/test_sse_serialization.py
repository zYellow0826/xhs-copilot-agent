"""Regression: SSE frames must serialize Pydantic models to dicts, not str().

If `_sse` falls back to `default=str` for a `BaseModel`, the browser receives
`evt.data.output.output` as a Python `repr()` string and crashes on
`output.notes.map`. We assert the JSON round-trips into nested dicts.
"""

import json

from main import _sse
from schemas import GenerationInput, GenerationOutput, XhsNote


def _frame_payload(s: str) -> dict:
    assert s.startswith("data: ")
    assert s.endswith("\n\n")
    return json.loads(s[len("data: "):-2])


def test_sse_serializes_generation_output_as_dict():
    note = XhsNote(
        title="3 个习惯让指甲不脱",
        body="正文内容" * 30,
        tags=["美甲", "夏季美甲", "上海美甲推荐"],
        cover_copy="半年不脱的秘密",
    )
    output = GenerationOutput(notes=[note], reasoning="痛点切入。")

    event = {
        "event": "on_chain_end",
        "name": "LangGraph",
        "data": {
            "output": {
                "input": GenerationInput(
                    shop_type="美甲店",
                    product_info="夏季果冻甲",
                    target_audience="20-30 岁女性",
                ),
                "output": output,
            }
        },
    }

    parsed = _frame_payload(_sse(event))

    final_state = parsed["data"]["output"]
    assert isinstance(final_state["input"], dict)
    assert final_state["input"]["shop_type"] == "美甲店"

    final_output = final_state["output"]
    assert isinstance(final_output, dict), (
        "regression: GenerationOutput leaked as a string into the SSE frame"
    )
    assert isinstance(final_output["notes"], list)
    assert final_output["notes"][0]["title"].startswith("3 个习惯")
    assert final_output["reasoning"] == "痛点切入。"


def test_sse_error_frame_is_valid_json():
    parsed = _frame_payload(
        _sse({"event": "error", "name": "GenerationError", "message": "boom"})
    )
    assert parsed == {"event": "error", "name": "GenerationError", "message": "boom"}
