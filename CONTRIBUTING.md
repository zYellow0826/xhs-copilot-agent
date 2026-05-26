# 贡献指南

欢迎贡献！本项目目前由个人维护，所以在动大手术前请先开 Issue 沟通方向，避免和路线图撞车。

## 你可以贡献什么

- **Bug 修复**：直接开 PR，附复现步骤
- **功能补充**：先开 Issue 讨论，跟 [docs/ROADMAP.md](docs/ROADMAP.md) 对齐
- **方法论改进**：[apps/api/prompts/methodology.md](apps/api/prompts/methodology.md) 是 prompt 质量的核心，改它会显著影响生成结果。建议附 A/B 对比样例
- **文档/翻译**：README、注释、错误提示，欢迎 i18n
- **示例 / 教程**：放在 `examples/` 目录（按需新建）

## 本地开发

后端：

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate                  # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                       # 至少填 DEEPSEEK_API_KEY，Supabase 可空
uvicorn main:app --reload --port 8000
```

前端：

```bash
cd apps/web
npm install
cp .env.local.example .env.local           # 填 API_BASE_URL=http://localhost:8000
npm run dev
```

## 提交前自检

```bash
# 后端
cd apps/api
ruff check .
ruff format --check .
pytest

# 前端
cd apps/web
npm run typecheck
npm run lint
```

CI 会跑同一组检查，本地通过后再提 PR。

## 提交规范

- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`refactor/xxx`
- Commit 格式：`<type>: <短描述>`，建议遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- PR 标题简洁，body 写清楚「为什么」和「测了什么」
- 一个 PR 解决一类问题，别混杂多个无关改动

## 代码风格

- Python 3.12+，`ruff` 强制，类型注解能加则加
- TypeScript 5+，`strict: true`，避免 `any`
- 提交不要带 `print` 调试代码，用 `logging`
- 注释只写「为什么」（约束 / 坑），别写「做了什么」

## Issue 模板

仓库提供了 bug / feature 两种模板，新开 Issue 时会自动套用。

## 行为准则

参与本项目请遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## License

提交的代码默认按本仓库 [MIT License](LICENSE) 发布。
