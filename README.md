# 单人店铺小红书运营 Copilot

给单人店铺老板用的小红书内容生成 + 账号诊断工具。内置运营老师的引流方法论，输入商品/场景即出可发布的笔记，粘贴账号即出改进诊断。

## 当前状态

- 阶段：**v0.1 骨架已搭好**，待填真实方法论 + 跑通联调
- 下一步：替换 `apps/api/prompts/methodology.md` 占位 → 配 `.env` → 本地起服务

## 本地开发

```bash
# 1. 后端
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # 填入 DeepSeek + Supabase
uvicorn main:app --reload --port 8000

# 2. 前端（另开终端）
cd apps/web
npm install
cp .env.local.example .env.local                    # 填入 Supabase + API_BASE_URL
npm run dev                                         # http://localhost:3000
```

健康检查：`curl http://localhost:8000/health` 应返回 `{"ok":true}`。

## 文档导航

| 文件 | 内容 |
|---|---|
| `docs/ROADMAP.md` | v0.1 → v0.5 的版本路线图，每个版本对应一个 AI 工程能力点 |
| `docs/ARCHITECTURE.md` | 系统架构、agent workflow 设计、数据流 |
| `docs/V0.1-SPEC.md` | v0.1 详细实施规格——按这个直接开干 |

## 技术栈一览

- **前端**：Next.js (App Router) + Tailwind，部署 Vercel
- **后端**：FastAPI + LangGraph (Python)，部署 Railway
- **数据**：Supabase (Postgres + Auth)，v0.2 起启用 pgvector
- **模型**：DeepSeek V3 (`deepseek-chat`) 主力 + R1 (`deepseek-reasoner`) 备用，依赖 DeepSeek Context Caching 自动命中长 prefix

## 双重定位

1. **产品价值**：复用运营老师的精准客群（单人店铺老板），自带冷启动
2. **个人价值**：作为前端 → AI 应用工程师转型的练手项目，每个版本对应一个 AI 工程核心概念
