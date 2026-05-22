# 小红书运营 Copilot

> 给单人店铺老板用的小红书内容生成 + 账号诊断工具。输入店铺信息与商品场景，自动产出 1-3 篇可直接发布的笔记；粘贴账号笔记，给出可执行的改进建议。

内置一套小红书引流方法论作为系统约束，模型在硬规则下创作，避开常见的违禁词、套路化、流量低效问题。

---

## 功能

| 版本 | 能力 | 状态 |
|---|---|---|
| **v0.1** | 创作流：表单输入 → 1-3 篇小红书笔记（标题 + 正文 + 标签 + 封面文案）+ 选题思路解释 | ✅ 骨架完成，待真实方法论上线 |
| v0.2 | 方法论从 prompt 搬到向量库，支持后台维护条目 | 规划中 |
| v0.3 | 生成结果自动评分 + 不及格自动改写（Reflection 循环） | 规划中 |
| v0.4 | 账号诊断流：粘贴笔记 → 出诊断报告 + 改进建议 | 规划中 |
| v0.5 | 多账号 Memory：每个店铺独立画像与历史 | 规划中 |

---

## 技术栈

- **前端**：Next.js 15 (App Router) + React 18 + Tailwind v3 + TypeScript — 部署 Vercel
- **后端**：FastAPI + LangGraph (Python 3.12) — 部署 Railway
- **数据**：Supabase (Postgres + Auth)，v0.2 起启用 pgvector
- **模型**：DeepSeek V3 (`deepseek-chat`) 主力 + R1 (`deepseek-reasoner`) 备用；依赖 DeepSeek Context Caching 自动命中长 prefix（方法论），无需手动 `cache_control`
- **流式**：FastAPI `StreamingResponse` + LangGraph `astream_events(version="v2")` + 浏览器手解 SSE

---

## 项目结构

```
xhs-copilot/
├── apps/
│   ├── api/          # FastAPI + LangGraph 后端（详见 apps/api/README.md）
│   └── web/          # Next.js 前端（详见 apps/web/README.md）
├── .gitignore
└── README.md
```

子项目各自的 README 包含完整本地开发、部署、环境变量说明。

---

## 快速开始

需要：Python 3.12+、Node 20+、DeepSeek API Key、Supabase 项目（URL + Service Key + Anon Key）。

```bash
# 1. 启动后端
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # 填入 DeepSeek + Supabase
uvicorn main:app --reload --port 8000

# 2. 启动前端（另开终端）
cd apps/web
npm install
cp .env.local.example .env.local                    # 填入 Supabase + API_BASE_URL
npm run dev                                         # http://localhost:3000
```

健康检查：`curl http://localhost:8000/health` 应返回 `{"ok":true}`。

更多细节查 [apps/api/README.md](apps/api/README.md) 和 [apps/web/README.md](apps/web/README.md)。

---

## 关键设计决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 前后端分离 | Next.js + FastAPI | LangGraph 的 Python 生态最成熟；前端纯展示层易部署 Vercel |
| 编排 | LangGraph `StateGraph` + `TypedDict` | 节点输入输出可追踪，调试友好 |
| 结构化输出 | DeepSeek function calling + `tool_choice` 强制锁定 | 比 JSON mode 更可控 |
| Streaming | `astream_events(v2)` + SSE | 前端能展示"当前 agent 在做什么"，体验更好 |
| 方法论加载 | v0.1 硬编码进 prompt + DeepSeek 自动 Context Caching | 简单、缓存命中率高；v0.2 起搬到 pgvector |

---

## 贡献

欢迎 Issue / PR。在动手大改之前建议先开 Issue 讨论方向，避免和路线图撞车。

代码风格：Python 走 `ruff` + `mypy`（未来强制），TypeScript 走 Next.js 默认 ESLint。提交前请保证：

```bash
# 后端
cd apps/api && python -m pytest               # 测试（v0.1 暂未补齐）

# 前端
cd apps/web && npm run typecheck && npm run lint
```

---

## License

[MIT](LICENSE) © 2026 ZhangSH
