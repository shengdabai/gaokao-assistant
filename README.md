# 🎓 青海高考报考教练 Gaokao Assistant

[![Last Commit](https://img.shields.io/github/last-commit/shengdabai/gaokao-assistant)](https://github.com/shengdabai/gaokao-assistant/commits)
[![Stars](https://img.shields.io/github/stars/shengdabai/gaokao-assistant?style=social)](https://github.com/shengdabai/gaokao-assistant/stargazers)
[![Follow @shengdabai](https://img.shields.io/github/followers/shengdabai?style=social)](https://github.com/shengdabai)

> 基于 2025 年青海省招生计划数据的 AI 对话式志愿填报助手 —— 用一句话提问，帮考生和家长精准锁定院校与专业。

## 为什么做这个

每年高考出分后，考生和家长面对成千上万条招生计划，靠 Excel 翻查和零散搜索很难快速做出靠谱的志愿决策。这个项目把 **2025 青海省真实招生计划数据**（13,764 条记录、1,342 所院校）接入 AI 对话，让你像聊天一样问「西宁有哪些公办学校，物理类，学费一万以内」，它直接帮你筛选、对比、排序，并附上院校宿舍/食堂/校园的真实点评。

## 做什么

- 用自然语言提问，AI 自动调用工具在真实招生数据里检索、筛选、对比、统计
- 多维度筛选院校与专业：城市、科类（物理/历史）、批次、专业、学费、招生类型
- 查看院校完整招生专业，以及宿舍 / 食堂 / 校园的真实点评
- 院校对比、数据分析、宿舍条件排行，辅助做出志愿决策

## ✨ 功能特性

### 核心对话
- **多维度筛选** —— 按城市、科类（物理/历史）、批次、专业、学费、招生类型组合检索
- **院校详情** —— 查看完整招生专业 + 宿舍/食堂/校园点评
- **院校对比** —— 并排对比（专业数、招生计划、学费、点评）
- **数据分析** —— 按城市/专业/批次/学费做分布统计
- **宿舍排行** —— 按设施（空调、独卫、热水等）打分排序
- **专业速览** —— 链接官方院校页面 + 核心课程摘要

### 智能搜索
- 区域别名识别（长三角、珠三角等）
- 院校类型筛选（公办 / 民办）
- 青海特色：藏文班、民族班、预科、定向 / 军事类
- 结果按院校聚合，985 / 211 优先排序

### 真实数据来源

| 来源 | 内容 | 覆盖 |
|------|------|------|
| 2025 青海招生计划 | 13,764 条记录，1,342 所院校 | 完整 |
| colleges.chat | 宿舍 / 食堂 / 校园点评 | 1,045 所院校 |
| laosheng.top | 985 / 211 / 双一流标签 | 1,263 所院校 |

### 多模型 AI 支持

| 厂商 | 模型 |
|------|------|
| 智谱 GLM | glm-4-plus, glm-4-flash, glm-4-long |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1 |
| Claude | claude-sonnet-4, claude-opus-4 |
| Gemini | gemini-2.5-flash, gemini-2.5-pro |
| Kimi | moonshot-v1-auto, moonshot-v1-128k |
| OpenRouter | 多模型聚合 |
| DeepSeek | deepseek-chat, deepseek-reasoner |

### 界面功能
- 浅色 / 深色 / 跟随系统主题
- 字号可调（小 / 中 / 大）
- 对话历史保存在浏览器 localStorage
- 对话可导出为 .txt
- 智能推荐追问
- 全中文设置面板

## 🧱 技术栈

- **前端**：Next.js 16 + Tailwind CSS 4 + TypeScript
- **数据库**：SQLite（better-sqlite3，本地文件存储）
- **AI 集成**：OpenAI SDK（兼容所有 OpenAI 兼容 API）+ Anthropic SDK
- **工具调用**：5 个工具函数（检索 / 详情 / 对比 / 统计 / 宿舍排行）

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 6688）
npm run dev -- -p 6688

# 浏览器打开 http://localhost:6688

# 在设置面板（右上角齿轮图标）里配置 AI 模型与 API Key
```

### 导入外部数据

```bash
# 先访问一次页面以创建本地数据库，然后运行：
npx tsx scripts/import-external.ts
```

## 📖 使用说明

1. 启动后打开页面，点击右上角齿轮配置任意一个 AI 厂商的 API Key（密钥只存在你的浏览器 localStorage，不会上传服务器）。
2. 用自然语言提问，例如：
   - 「西宁有哪些公办本科，物理类，学费一万以内？」
   - 「对比一下青海大学和青海师范大学的宿舍条件」
   - 「计算机类专业在青海招生最多的前十所学校」
3. AI 会自动调用对应工具，在真实招生数据里检索并给出结构化结果，并推荐可继续追问的问题。
4. 满意的对话可一键导出为 .txt 留存。

## 🗺️ 项目状态

- 数据：已覆盖 2025 青海省招生计划完整数据 + 院校点评 + 985/211/双一流标签
- 形态：本地运行的对话式应用（SQLite 本地数据层，需自备 AI 模型 API Key）
- 适用：青海省考生与家长的志愿填报参考工具，专注中国境内高考报考场景

## 🤝 关于与连接

作者 **Tony（盛）** 是一名中文培训师（6000+ 学员），长期用 AI 打造中文教学与高考备考工具。这个项目是其中文教育 / 高考报考工具系列的一员。

如果它对你有帮助，欢迎 ⭐ **[Star 本仓库](https://github.com/shengdabai/gaokao-assistant)** 并关注 **[@shengdabai](https://github.com/shengdabai)** —— 你的关注是持续更新的动力。

相关项目：

- [gaokao-600](https://github.com/shengdabai/gaokao-600) —— 高考相关工具
- [college-major-selector](https://github.com/shengdabai/college-major-selector) —— 大学专业选择助手
- [gaokao-review](https://github.com/shengdabai/gaokao-review) —— 高考备考复习工具

## 安全说明

- API Key 仅存储在浏览器 localStorage，绝不上传服务器
- `.env.local` 与数据库文件已在 `.gitignore` 中忽略
- API 路由包含输入校验与长度限制
- 错误信息不泄露内部细节

## License

暂无开源协议（All rights reserved）。
