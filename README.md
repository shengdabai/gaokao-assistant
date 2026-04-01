# 青海高考报考教练

AI 对话式志愿填报助手，基于 2025 年青海省招生计划数据，帮助考生和家长精准选择院校和专业。

## 功能特性

### 核心对话能力
- **精准筛选**：按城市、科目(物理/历史)、批次、专业、学费、招生类型等多维度筛选
- **学校详情**：查看任意学校的完整招生专业 + 宿舍/食堂/校园口碑
- **学校对比**：多校并排对比（专业数/计划数/学费/口碑）
- **数据统计**：按城市/专业/批次/学费的分布分析
- **宿舍排名**：按宿舍设施质量(空调/独卫/热水等)评分排序
- **专业培养方案**：查询具体专业时，提供学校官网链接和重点课程概括

### 数据来源
| 数据源 | 内容 | 覆盖 |
|--------|------|------|
| 2025年青海省招生计划 | 13,764条记录，1,342所院校 | 完整 |
| colleges.chat | 宿舍/食堂/校园生活口碑 | 1,045所学校 |
| laosheng.top | 985/211/双一流标识 | 1,263所学校 |

### 智能搜索
- **地区别名**：江浙沪、长三角、珠三角、京津冀、东北、西北、西南、华中、华东、华南、华北
- **学校性质**：支持按民办/公办筛选
- **青海特色**：藏文班、民族班、预科、军事类等特殊招生类型
- **按学校分组**：搜索结果自动按学校归类，985/211优先排序

### 多模型支持
| 提供商 | 模型 |
|--------|------|
| 智谱 GLM | glm-4-plus, glm-4-flash, glm-4-long |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1 |
| Claude | claude-sonnet-4, claude-opus-4 |
| Gemini | gemini-2.5-flash, gemini-2.5-pro |
| Kimi (月之暗面) | moonshot-v1-auto, moonshot-v1-128k |
| OpenRouter | 多模型聚合 |
| DeepSeek | deepseek-chat, deepseek-reasoner |

### 界面功能
- **暗色/亮色主题**：支持亮色、暗色、跟随系统三种模式
- **字体大小**：小/中/大三档可调
- **对话历史**：自动保存到浏览器本地(localStorage)
- **导出记录**：一键导出对话为 .txt 文件
- **交互式追问**：每次回答后显示可点击的追问建议
- **设置面板**：全中文界面，模型/API Key/主题/字体一站式配置

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/adamchangshun-rgb/gaokao-assistant.git
cd gaokao-assistant

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev -- -p 6688

# 4. 打开浏览器
# http://localhost:6688

# 5. 配置 AI 模型
# 点击右上角 ⚙️ 设置 → 选择模型 → 填入 API Key → 保存
```

### 首次使用需要导入外部数据

```bash
# 先访问一次页面触发数据库创建，然后运行：
npx tsx scripts/import-external.ts
```

## 技术架构

- **前端**：Next.js 16 + Tailwind CSS 4 + TypeScript
- **数据库**：SQLite (better-sqlite3)，本地文件存储
- **AI 集成**：OpenAI SDK (兼容所有 OpenAI-compatible API)
- **Tool Calling**：5 个工具函数（搜索/详情/对比/统计/宿舍排名）

## 安全说明

- API Key 仅保存在浏览器 localStorage，不经过服务端存储
- `.env.local` 和数据库文件已加入 `.gitignore`
- API 路由包含输入验证和长度限制
- 错误信息不泄露内部细节

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # 对话 API（多模型 + Tool Calling）
│   │   └── providers/route.ts # 模型提供商列表
│   ├── page.tsx               # 主页面（对话 UI + 设置）
│   ├── layout.tsx             # 布局（暗色主题支持）
│   └── globals.css            # 全局样式（暗色模式变量）
├── lib/
│   └── db.ts                  # SQLite 数据层（查询 + 口碑解析）
data/
├── data_raw.json              # 招生计划原始数据
├── schools_raw.json           # 学校列表
├── laosheng_tags.json         # 985/211 标识
├── colleges_chat.json         # 口碑数据（需自行获取）
scripts/
└── import-external.ts         # 外部数据导入脚本
```
