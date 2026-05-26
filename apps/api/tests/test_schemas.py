import pytest
from pydantic import ValidationError

from schemas import GenerationInput, GenerationOutput, XhsNote


def test_generation_input_defaults_style():
    payload = GenerationInput(
        shop_type="美甲店",
        product_info="夏季果冻甲",
        target_audience="20-30 岁女性",
    )
    assert payload.style_preference == "种草"
    assert payload.extra_context is None


def test_generation_input_rejects_unknown_style():
    with pytest.raises(ValidationError):
        GenerationInput(
            shop_type="美甲店",
            product_info="x",
            target_audience="y",
            style_preference="不存在的风格",  # type: ignore[arg-type]
        )


def test_xhs_note_title_max_length():
    with pytest.raises(ValidationError):
        XhsNote(
            title="一二三四五六七八九十一二三四五六七八九十一",  # 21 chars
            body="正文" * 100,
            tags=["a", "b", "c"],
            cover_copy="封面",
        )


def test_xhs_note_tag_bounds():
    # too few
    with pytest.raises(ValidationError):
        XhsNote(
            title="测试标题",
            body="正文" * 100,
            tags=["only-one", "only-two"],
            cover_copy="封面",
        )
    # too many
    with pytest.raises(ValidationError):
        XhsNote(
            title="测试标题",
            body="正文" * 100,
            tags=[f"t{i}" for i in range(11)],
            cover_copy="封面",
        )


def test_generation_output_notes_bounds():
    valid_note = XhsNote(
        title="测试钩子标题",
        body="正文" * 100,
        tags=["a", "b", "c"],
        cover_copy="封面短句",
    )
    GenerationOutput(notes=[valid_note], reasoning="为什么")

    with pytest.raises(ValidationError):
        GenerationOutput(notes=[], reasoning="why")

    with pytest.raises(ValidationError):
        GenerationOutput(notes=[valid_note] * 4, reasoning="why")
