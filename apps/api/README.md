# apps/api — 后端

FastAPI + LangGraph 构建的创作流后端，调用 DeepSeek 生成结构化小红书笔记，通过 SSE 把执行进度流回前端。

---

## 技术栈

- **Python 3.12+**
- **FastAPI** — HTTP 框架 + SSE 流
- **LangGraph** — agent workflow 编排（v1.0 单节点，后续多节点）
- **OpenAI SDK** — 兼容协议调 DeepSeek
- **Supabase**（可选）— 持久化生成历史
- **pydantic-settings** — 环境变量配置

---

## 项目结构

```
apps/api/
├── main.py                 # FastAPI app + /generate SSE 端点
├── schemas.py              # Pydantic 模型（GenerationInput / XhsNote / GenerationOutput）
├── settings.py             # 环境变量（DeepSeek + 可选 Supabase）
├── db.py                   # Supabase 客户端 + save_generation（无配置时 no-op）
├── graphs/
│   └── creation.py         # 创作 workflow（带重试 + schema 校验）
├── prompts/
│   ├── system.py           # 组装 system prompt（拼方法论）
│   └── methodology.md      # 内置通用方法论，长 prefix 用于 DeepSeek 自动 Context Caching
├── tests/                  # pytest
├── pyproject.toml          # ruff + pytest + mypy 配置
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile              # Railway / 任何容器平台部署
└── .env.example
```

---

## 本地开发

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt  # 生产可只装 requirements.txt

cp .env.example .env                 # 至少填 DEEPSEEK_API_KEY
uvicorn main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
# {"ok":true,"version":"1.0.0","supabase":false}
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

## 开发命令

```bash
# Lint + 格式化
ruff check .
ruff check --fix .
ruff format .

# 测试
pytest

# 类型检查（可选）
mypy .
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

响应：`text/event-stream`，每条事件来自 LangGraph `astream_events(version="v2")`。

**抓最终结果**：监听 `event=on_chain_end & name=LangGraph` 的 `data.output.output`。

**错误处理**：流式过程中任何异常会以 `{"event":"error","name":"...","message":"..."}` 一帧发出，HTTP 状态码保持 200（SSE 已开始）。前端只需识别 `event === "error"` 即可。

`GenerationOutput.notes[i]`：

| 字段 | 约束 |
|---|---|
| `title` | ≤ 20 字，包含钩子（数字/反差/痛点） |
| `body` | 200-500 字 |
| `tags` | 3-10 个，大词 + 长尾词混搭 |
| `cover_copy` | 封面图上的短文案 |

### `GET /health`

返回 `{"ok": true, "version": "1.0.0", "supabase": <bool>}`，可作为部署探针。`supabase` 字段反映是否已配置持久化。

---

## 环境变量

见 [.env.example](.env.example)。

| 变量 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | ✓ | | https://platform.deepseek.com 申请 |
| `DEEPSEEK_BASE_URL` | | `https://api.deepseek.com/v1` | |
| `DEEPSEEK_MODEL_CHAT` | | `deepseek-chat` | V3，主创作 |
| `DEEPSEEK_MODEL_REASONER` | | `deepseek-reasoner` | R1，留给后续 judge / 复杂推理 |
| `DEEPSEEK_MAX_TOKENS` | | `4096` | 单次响应最大 token |
| `DEEPSEEK_TIMEOUT_SECONDS` | | `60` | 单次 API 超时 |
| `DEEPSEEK_RETRY_MAX` | | `2` | schema 校验失败时重试次数 |
| `SUPABASE_URL` | | | 可选；不填就跳过持久化 |
| `SUPABASE_SERVICE_KEY` | | | 可选；同上（**不要泄漏**） |
| `CORS_ALLOW_ORIGINS` | | `*` | 生产环境建议填具体域名（逗号分隔） |

---

## Supabase Schema（可选）

如果想保存生成历史，在 Supabase 项目执行：

```sql
create table generations (
  id          uuid primary key default gen_random_uuid(),
  input       jsonb not null,
  output      jsonb not null,
  model       text not null,
  created_at  timestamptz default now()
);
```

不配置 Supabase 也能完整运行，写入会安静地 no-op。

---

## Prompt Caching

DeepSeek 对**重复的长 prefix** 自动应用 Context Caching，无需手动标记。`system` 消息把方法论放在第一位 → 同一会话/不同请求间 prefix 不变 → 高命中率。

观察命中率：每次 `/generate` 调用后 stderr 会打印 `deepseek usage: cache_hit=X prompt_tokens=Y completion_tokens=Z`，目标上线后 ≥ 80%。

---

## 重试与校验

`graphs/creation.py` 调用 DeepSeek 后：

1. 强制 `tool_choice` 锁定 `submit_notes` 工具
2. 用 `GenerationOutput.model_validate_json` 校验返回的 JSON
3. 校验失败（`ValidationError` / `JSONDecodeError`）→ 注入纠错消息重试，最多 `DEEPSEEK_RETRY_MAX` 次
4. 超时 / 限流（`APITimeoutError` / `RateLimitError`）→ 直接重试
5. 其它 API 错误 → 抛 `GenerationError`，main.py 转为 SSE error 帧

---

## 部署（Railway）

1. 新建 Railway 项目，连接 GitHub repo
2. **Root Directory** 设为 `apps/api`
3. Build 用仓库内 `Dockerfile`（Railway 会自动识别）
4. 加环境变量（同 `.env.example`）
5. 暴露 `$PORT`，Dockerfile 的 CMD 已经处理

部署后把 Railway 域名填到前端的 `API_BASE_URL`。也可以用任何能跑 `Dockerfile` 的平台（Fly.io、Render、自建服务器等）。

---

## 开发提示

- LangGraph 调试：`pip install langgraph-cli && langgraph dev` 起一个本地 UI 看 graph 拓扑
- 改了 `methodology.md` 不用重启，`uvicorn --reload` 会自动重载
- 调 prompt 时 watch 一下 `cache_hit` 比例，prefix 变动越大命中越低
