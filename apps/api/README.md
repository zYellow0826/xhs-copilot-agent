# apps/api — 后端

FastAPI + LangGraph 构建的创作流后端，调用 DeepSeek 生成结构化小红书笔记，通过 SSE 把执行进度流回前端。

---

## 技术栈

- **Python 3.12+**
- **FastAPI** — HTTP 框架 + SSE 流
- **LangGraph** — agent workflow 编排（v0.1 单节点，v0.2+ 多节点）
- **OpenAI SDK** — 兼容协议调 DeepSeek
- **Supabase** — 写入生成历史
- **pydantic-settings** — 环境变量配置

---

## 项目结构

```
apps/api/
├── main.py                 # FastAPI app + /generate SSE 端点
├── schemas.py              # Pydantic 模型（GenerationInput / XhsNote / GenerationOutput）
├── settings.py             # 环境变量（DeepSeek + Supabase）
├── db.py                   # Supabase 客户端 + save_generation
├── graphs/
│   └── creation.py         # 创作 workflow（v0.1 单节点 StateGraph）
├── prompts/
│   ├── system.py           # 组装 system prompt（拼方法论）
│   └── methodology.md      # 方法论原文，长 prefix 用于 DeepSeek 自动 Context Caching
├── requirements.txt
├── Dockerfile              # Railway / 任何容器平台部署
└── .env.example
```

---

## 本地开发

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                 # 填入 DeepSeek + Supabase
uvicorn main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
# {"ok":true}
```

调用生成端点（流式 SSE）：

```bash
curl -N -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shop_type":"美甲店",
    "product_info":"夏季果冻甲新品",
    "target_audience":"20-30岁女性，喜欢日系小清新",
    "style_preference":"种草"
  }'
```

---

## API

### `POST /generate`

请求体（`GenerationInput`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `shop_type` | string | ✓ | 店铺类型，如"美甲店"、"咖啡馆" |
| `product_info` | string | ✓ | 商品/服务描述 |
| `target_audience` | string | ✓ | 目标人群画像 |
| `style_preference` | enum | | `种草` / `测评` / `教程` / `故事`，默认 `种草` |
| `extra_context` | string | | 补充信息（活动、地点、特殊要求等） |

响应：`text/event-stream`，每条事件来自 LangGraph `astream_events(version="v2")`。前端从 `event=on_chain_end & name=LangGraph` 的 `data.output` 抓最终 `GenerationOutput`。

`GenerationOutput.notes[i]`：

| 字段 | 约束 |
|---|---|
| `title` | ≤ 20 字，包含钩子（数字/反差/痛点） |
| `body` | 200-500 字 |
| `tags` | 3-10 个，大词 + 长尾词混搭 |
| `cover_copy` | 封面图上的短文案 |

### `GET /health`

返回 `{"ok": true}`，用作部署探针。

---

## 环境变量

见 [.env.example](.env.example)。

| 变量 | 必填 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | ✓ | https://platform.deepseek.com 申请 |
| `DEEPSEEK_BASE_URL` | | 默认 `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL_CHAT` | | 默认 `deepseek-chat`（V3） |
| `DEEPSEEK_MODEL_REASONER` | | 默认 `deepseek-reasoner`（R1），留给 v0.3 judge |
| `SUPABASE_URL` | ✓ | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | ✓ | Service Role Key（**不要泄漏**） |

---

## Supabase Schema

最小 schema（v0.1 用一张表）：

```sql
create table generations (
  id          uuid primary key default gen_random_uuid(),
  input       jsonb not null,
  output      jsonb not null,
  model       text not null,
  created_at  timestamptz default now()
);
```

v0.2 起加 `methodology_chunks` 表 + pgvector 索引，v0.5 起加 `shops` 表 + Row Level Security。

---

## Prompt Caching

DeepSeek 对**重复的长 prefix** 自动应用 Context Caching，无需手动标记。`system` 消息把方法论放在第一位 → 同一会话/不同请求间 prefix 不变 → 高命中率。

观察命中率：每次 `/generate` 调用后日志打印 `[cache] hit=X/Y`，目标 v0.1 上线后 ≥ 80%。

---

## 部署（Railway）

1. 新建 Railway 项目，连接 GitHub repo
2. **Root Directory** 设为 `apps/api`
3. Build 用仓库内 `Dockerfile`（Railway 会自动识别）
4. 加环境变量（同 `.env.example`）
5. 暴露 `$PORT`，Dockerfile 的 CMD 已经处理

部署后把 Railway 域名填到前端的 `API_BASE_URL`。

---

## 开发提示

- LangGraph 调试：`pip install langgraph-cli && langgraph dev` 起一个本地 UI 看 graph 拓扑
- 单元测试：v0.1 暂未补，结构化输出可以先用 manual curl + JSON schema 校验
- DeepSeek 工具调用偶尔会返回不合 schema 的 JSON → `GenerationOutput.model_validate_json` 会抛 `ValidationError`，建议在 v0.3 加 retry
