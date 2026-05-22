from typing import Literal

from pydantic import BaseModel, Field


class GenerationInput(BaseModel):
    shop_type: str = Field(..., description="店铺类型，例如：美甲店、咖啡馆")
    product_info: str = Field(..., description="商品/服务描述")
    target_audience: str = Field(..., description="目标人群画像")
    style_preference: Literal["种草", "测评", "教程", "故事"] = "种草"
    extra_context: str | None = None


class XhsNote(BaseModel):
    title: str = Field(..., max_length=20, description="标题，<= 20字")
    body: str = Field(..., description="正文，建议 200-500 字")
    tags: list[str] = Field(..., min_length=3, max_length=10)
    cover_copy: str = Field(..., description="封面图上的文字")


class GenerationOutput(BaseModel):
    notes: list[XhsNote] = Field(..., min_length=1, max_length=3)
    reasoning: str = Field(..., description="选题思路解释，给学员看的'为什么这么写'")
