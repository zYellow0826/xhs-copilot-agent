# apps/web — 前端

Next.js 15 + App Router 表单页：填店铺信息 → 流式展示 agent 进度 → 渲染生成的小红书笔记卡片。

---

## 技术栈

- **Next.js 15** (App Router)
- **React 18** + **TypeScript 5**
- **Tailwind CSS 3** — 样式
- **@supabase/supabase-js** — 浏览器侧 Supabase 客户端（v1.4 登录用，当前可不配）
- **零额外依赖**做 SSE：手解 `ReadableStream` + 按 `\n\n` 切包

---

## 项目结构

```
apps/web/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主表单页（client component，含 SSE 解析）
│   ├── globals.css             # Tailwind directives + CSS 变量
│   └── api/
│       └── generate/
│           └── route.ts        # 透传 SSE → 后端 /generate
├── components/
│   ├── GenerationForm.tsx      # 输入表单
│   ├── NoteCard.tsx            # 单篇笔记卡 + 一键复制
│   └── AgentProgress.tsx       # 流式期间显示当前 agent 阶段
├── lib/
│   └── supabase.ts             # 浏览器 Supabase client（懒加载）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── .eslintrc.json
└── .env.local.example
```

---

## 本地开发

```bash
cd apps/web
npm install
cp .env.local.example .env.local       # 填 API_BASE_URL=http://localhost:8000
npm run dev                            # http://localhost:3000
```

需要后端先在 `http://localhost:8000` 起好（见 [apps/api/README.md](../api/README.md)）。

---

## 开发命令

```bash
npm run dev            # 开发服务器
npm run build          # 生产构建
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
```

---

## 环境变量

见 [.env.local.example](.env.local.example)。

| 变量 | 必填 | 用途 |
|---|---|---|
| `API_BASE_URL` | ✓ | 后端地址。开发 `http://localhost:8000`，部署后填 Railway 域名。**仅服务端读取**，不暴露到浏览器 |
| `NEXT_PUBLIC_SUPABASE_URL` | | v1.4 多账号 Auth 用，当前可空 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | | 同上 |

---

## SSE 流式处理

后端 `/generate` 返回 `text/event-stream`，每条事件是 LangGraph `astream_events(v2)` 的 JSON。出错时后端会发送一帧 `{"event":"error", "name":"...", "message":"..."}`。

前端的处理在 [app/page.tsx](app/page.tsx)：

1. `fetch('/api/generate', { method: 'POST', body })` → 拿到 `ReadableStream`
2. 用 `TextDecoder` 解码 + 维护 buffer
3. 按 `\n\n` 切 SSE event；每个 event 内取 `data: ` 那行 → `JSON.parse`
4. 看到 `event === "error"` → 抛错进入错误 UI
5. 否则根据 `event.event` 字段更新进度
6. 从 `event.event === 'on_chain_end' && event.name === 'LangGraph'` 抓最终 `output`

[app/api/generate/route.ts](app/api/generate/route.ts) 是 Next.js Route Handler，把请求透传给后端并把流原样回传给浏览器，加了 `x-accel-buffering: no` 防止反向代理缓冲。后端不可达时返回 502 + JSON `{error}`。

---

## 关键组件

- **`GenerationForm`** — 受控表单，字段对齐后端 `GenerationInput`。风格用 chip 按钮（种草/测评/教程/故事）
- **`NoteCard`** — 渲染单篇笔记。标题加粗、正文 `whitespace-pre-line` 保段落、tag 用灰底 chip、封面文案虚线框包起来。一键复制把标题 + 正文 + tags 拼成可粘贴文本
- **`AgentProgress`** — 流式期间显示 pulse 点 + 当前事件标签 + 累计事件数

---

## 部署（Vercel）

1. 在 Vercel 连接 GitHub repo
2. **Root Directory** 设为 `apps/web`
3. Framework Preset 自动识别 Next.js
4. 加环境变量（同 `.env.local.example`），其中 `API_BASE_URL` 填后端域名
5. SSE 在 Vercel Edge / Node Runtime 都可以，本仓库使用 Node Runtime（`runtime = "nodejs"`，见 [route.ts](app/api/generate/route.ts)）

---

## 开发提示

- Tailwind v3 的 `tailwind.config.ts` 已经把 `app/**` 和 `components/**` 都加到 `content`，新建目录记得追加
- SSE 调试：浏览器 DevTools → Network → 选请求 → EventStream tab 看每条 event
- `next lint` 默认走 `.eslintrc.json`（仓库内置 `next/core-web-vitals`）
