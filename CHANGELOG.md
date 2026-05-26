# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-05-26

首个开源版本。

### 新增
- 创作流：表单输入 → 1-3 篇结构化小红书笔记 + 选题思路
- 内置约 300 行通用方法论（硬规则 / 套路 / 反面案例三段式），覆盖选题、标题、正文、标签、封面、违禁词
- LangGraph 单节点 `StateGraph`，DeepSeek function calling 强制结构化
- SSE 流式事件，前端实时展示 agent 进度
- 标签 / 字段 / 数量等约束在 Pydantic schema 里硬绑定
- DeepSeek Context Caching 自动命中长 prefix，日志输出 `cache_hit` 比例

### 工程化
- Supabase 改为**可选依赖**，未配置时持久化自动 no-op
- DeepSeek 调用带超时 + 校验失败重试（默认 2 次，注入纠错消息）
- SSE 异常被序列化为 `event: error` 帧而非中断连接
- 后端 `pytest` 测试套（schema 校验 / 图构建 / 健康检查）
- `ruff` + `pyproject.toml` + GitHub Actions CI
- 前端错误状态 / 空状态 / 后端不可达 502 提示
- CONTRIBUTING / CODE_OF_CONDUCT / Issue & PR 模板
