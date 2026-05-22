# 单人店铺小红书运营 Copilot

给单人店铺老板用的小红书内容生成 + 账号诊断工具。内置运营老师的引流方法论，输入商品/场景即出可发布的笔记，粘贴账号即出改进诊断。

## 当前状态

- 阶段：**v0.1 开发前**（架构与规划已完成）
- 下一步：按 `docs/V0.1-SPEC.md` 搭建项目骨架

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
