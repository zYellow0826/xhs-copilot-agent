# 路线图

原则：每个版本控制在 1-2 周，每两周必须产出能让真实用户试用的功能。

---

## v1.0 — 创作流 MVP ✅

**功能**：表单输入（店铺类型 / 商品 / 目标人群 / 风格）→ 生成 1-3 篇小红书笔记（标题 + 正文 + 标签 + 封面文案）+ 选题思路解释

**实现**：LangGraph 单节点 StateGraph，方法论硬编码进 system prompt + DeepSeek Context Caching

**已包含**
- LangGraph `StateGraph` + `TypedDict`
- DeepSeek function calling 强制结构化输出（`tool_choice` 锁定）
- DeepSeek Context Caching（方法论是大段稳定上下文，自动命中长 prefix）
- FastAPI `StreamingResponse` + SSE
- 失败重试 + schema 校验 + 结构化错误流
- Supabase 可选持久化

---

## v1.1 — 方法论 RAG 化（计划中）

**功能**：方法论从 prompt 搬到向量库；后台可增/删/改条目

**实现**：Supabase pgvector + LangGraph retriever 节点

**学习重点**
- Embedding 选型（voyage-3 / text-embedding-3-large / bge-m3）
- Chunking 策略：按方法论条目切分 vs 滑窗
- 检索质量评估：hit rate, MRR
- LangGraph 双节点编排（retrieve → generate）

---

## v1.2 — Reflection 循环（计划中）

**功能**：生成后自动评分，不及格自动改写，最多 3 轮

**实现**：加 evaluator 节点 + LangGraph conditional edges

**学习重点**
- LLM-as-judge prompt 设计（rubric 怎么写才稳定）
- LangGraph `add_conditional_edges` + 循环防爆控制
- Reflexion / Self-refine 论文中的关键技巧
- 评分维度结构化建模（不是一个分数，是多维度 rubric）

---

## v1.3 — 诊断 Workflow（计划中）

**功能**：用户粘贴自己的小红书笔记 → 出诊断报告 + 具体改进建议

**实现**：第二个 LangGraph workflow，复用 v1.1 的方法论 RAG

**学习重点**
- 多 workflow 在一个项目里的组织方式
- 分析型 prompt（vs v1.0 的生成型 prompt）的设计差异
- "对标爆款"策略：用 RAG 拉相似主题的成功案例，对比说明
- 前端展示：雷达图 / 评分卡 / diff 视图

---

## v1.4 — Memory + 多账号（计划中）

**功能**：每个店铺有独立的偏好和历史，不再是无状态工具

**实现**：Supabase Auth + LangGraph checkpointer + 异步 summary

**学习重点**
- LangGraph persistence layer (checkpointers, store)
- Long-term memory 设计：episodic vs semantic
- Supabase Row Level Security 配合 LangGraph
- 异步任务（生成完后台 summarize）

---

## 候选（按反馈排序）

- 浏览器插件抓小红书笔记（解决手动粘贴痛点）
- 商品图 → 小红书风格图（接入 Flux/SD）
- 多模型 fallback（Claude / Qwen 容灾）
- 团队/机构版（运营老师管理多个学员账号）
- 数据看板（笔记效果追踪）
