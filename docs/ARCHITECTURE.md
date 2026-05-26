# 架构设计

## 总体拓扑

前后端分离，所有 agent 编排都在后端 LangGraph 里完成。

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Next.js    │  HTTPS  │  FastAPI         │  HTTPS  │  DeepSeek    │
│  (Vercel)   ├────────►│  + LangGraph     ├────────►│  API         │
│             │   SSE   │  (Railway)       │         │  (V3 / R1)   │
└─────┬───────┘         └────────┬─────────┘         └──────────────┘
      │                          │
      │  Auth + 读历史            │  pgvector / SQL
      ▼                          ▼
   ┌──────────────────────────────────┐
   │       Supabase (Postgres)        │
   └──────────────────────────────────┘
```

**为什么前后端分离**
- LangGraph 的 Python 版生态远比 JS 成熟，文档/教程/案例几乎都是 Python
- Vercel 的 Python serverless 对 LangGraph 这种长链路任务不友好（冷启动 + 超时）
- Railway 月费 $5 起，部署体验和 Vercel 类似
- 分离后能锻炼 API 边界设计，是简历加分项

---

## 共享基础设施

### 方法论知识库 (v1.1+)

```sql
create table methodology_chunks (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  embedding   vector(1024) not null,    -- voyage-3 是 1024 维
  category    text,                      -- 选题/标题/封面/数据等
  source_doc  text,                      -- 来源文档名，便于回溯
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index on methodology_chunks using ivfflat (embedding vector_cosine_ops);
```

- **写入**：后台管理页（对象用），Markdown 文件按规则切分
- **读取**：LangGraph retriever 节点，top-k = 5-8

### 店铺 Memory (v1.4+)

```sql
create table shops (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users not null,
  shop_type          text,
  target_audience    text,
  voice_preferences  jsonb,         -- 喜欢什么语气、回避什么词
  history_summary    text,          -- 异步 LLM 总结的店铺画像
  updated_at         timestamptz default now()
);
```

---

## 创作 Workflow（v1.2 完整版预览）

```
            ┌─────────────────┐
            │  intake_node    │  规范化用户输入
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │  retrieve_node  │  RAG 方法论 + 对标爆款
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │  topic_node     │  生成 3-5 个选题方向
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │  writer_node    │  写笔记（标题+正文+标签+封面）
            └────────┬────────┘
                     │
            ┌────────▼────────┐◄────┐
            │  judge_node     │     │  retry (max 3)
            └────────┬────────┘     │
                     │              │
                ┌────▼────┐         │
                │ 合格?    │── No ──┘
                └────┬────┘
                     │ Yes
                     ▼
                  return
```

**v1.0 缩水版**：intake → writer → return，retrieve 用 prompt 硬编码替代，没有 judge。

---

## 诊断 Workflow（v1.3）

```
parse_notes          ─►  从粘贴文本里结构化提取笔记
analyze_patterns     ─►  统计标题/标签/选题分布
retrieve_methodology ─►  RAG 出相关方法论 + 对标爆款
diagnose             ─►  对比分析，找问题
generate_report      ─►  输出可执行建议
```

**关键 trick**：让 diagnose 节点同时拿到"学员笔记"和"RAG 出的同类爆款"，要求它**对比说明**——"为什么 A 帖能爆而你的不行"，而不是空泛地评价。

---

## 关键设计决策

| 决策 | 选择 | 理由 |
|---|---|---|
| State 管理 | LangGraph `StateGraph` + `TypedDict` | 节点输入输出可追踪，调试友好 |
| 结构化输出 | DeepSeek function calling（OpenAI 兼容，不是 JSON mode） | function calling 在 deepseek-chat 上已稳定，强制 `tool_choice` 比 JSON mode 更可控 |
| Streaming | `graph.astream_events(version="v2")` + SSE | 前端能展示"当前 agent 在做什么"，体验和教育属性都拉满 |
| 数据获取（诊断） | 手动粘贴 → 后期浏览器插件 | 反爬绕不过去，先把核心价值交付 |
| 模型策略 | DeepSeek V3 (`deepseek-chat`) 主力 + R1 (`deepseek-reasoner`) 备用 | V3 便宜快(~¥2/M)，适合主创作；R1 留给 v1.2 judge / 复杂推理场景。Context Caching 自动命中长 prefix(方法论)，无需手动 `cache_control` 标记 |
| Embedding | voyage-3 (1024d) | 中文质量好于 OpenAI，价格便宜 |
| 部署 | Vercel (web) + Railway (api) + Supabase (db) | 零运维副业最优解 |

---

## 数据流（v1.0 创作流为例）

```
1. 用户在 Next.js 页面填表单
2. POST /api/generate (Next.js route) → 转发到 FastAPI
3. FastAPI 拿到 GenerationInput → 调 LangGraph.astream_events()
4. 每个 event → 序列化为 SSE → 流回 Next.js route → 流到浏览器
5. 浏览器边收边渲染（每个 agent 的进度 + 最终笔记）
6. 完成后异步写一条 generations 表记录
```
