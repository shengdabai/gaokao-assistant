# Gaokao Assistant

AI-powered conversational college application assistant based on 2025 Qinghai Province enrollment data. Helps students and parents precisely select colleges and majors.

青海高考报考教练 -- AI 对话式志愿填报助手，基于 2025 年青海省招生计划数据，帮助考生和家长精准选择院校和专业。

## Features / 功能特性

### Core Conversation / 核心对话
- **Multi-dimensional Filtering** -- Filter by city, subject track (physics/history), batch, major, tuition, enrollment type
- **School Details** -- View complete enrollment majors + dorm/canteen/campus reviews
- **School Comparison** -- Side-by-side comparison (major count, enrollment quota, tuition, reviews)
- **Data Analytics** -- Distribution analysis by city/major/batch/tuition
- **Dormitory Rankings** -- Scored by facilities (AC, private bath, hot water, etc.)
- **Major Programs** -- Links to official school pages with key course summaries

### Data Sources / 数据来源

| Source | Content | Coverage |
|--------|---------|----------|
| 2025 Qinghai Enrollment Plan | 13,764 records, 1,342 institutions | Complete |
| colleges.chat | Dorm/canteen/campus reviews | 1,045 schools |
| laosheng.top | 985/211/Double First-Class tags | 1,263 schools |

### Smart Search / 智能搜索
- Regional aliases (Yangtze Delta, Pearl River Delta, etc.)
- School type filtering (public/private)
- Qinghai-specific: Tibetan classes, ethnic classes, preparatory, military programs
- Results grouped by school with 985/211 priority sorting

### Multi-Model AI Support / 多模型支持

| Provider | Models |
|----------|--------|
| Zhipu GLM | glm-4-plus, glm-4-flash, glm-4-long |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1 |
| Claude | claude-sonnet-4, claude-opus-4 |
| Gemini | gemini-2.5-flash, gemini-2.5-pro |
| Kimi | moonshot-v1-auto, moonshot-v1-128k |
| OpenRouter | Multi-model aggregation |
| DeepSeek | deepseek-chat, deepseek-reasoner |

### UI Features / 界面功能
- Light/dark/system theme support
- Adjustable font size (S/M/L)
- Chat history saved to localStorage
- Export conversations as .txt
- Suggested follow-up questions
- All-Chinese settings panel

## Getting Started / 快速开始

```bash
# Install dependencies
npm install

# Start dev server
npm run dev -- -p 6688

# Open http://localhost:6688

# Configure AI model in Settings (top-right gear icon)
```

### Import External Data / 导入外部数据

```bash
# Visit the page once to create the database, then run:
npx tsx scripts/import-external.ts
```

## Tech Stack / 技术架构

- **Frontend**: Next.js 16 + Tailwind CSS 4 + TypeScript
- **Database**: SQLite (better-sqlite3), local file storage
- **AI Integration**: OpenAI SDK (compatible with all OpenAI-compatible APIs)
- **Tool Calling**: 5 tool functions (search/detail/compare/stats/dorm ranking)

## Project Structure / 项目结构

```
src/
├── app/
│   ├── api/chat/route.ts      # Chat API (multi-model + Tool Calling)
│   ├── api/providers/route.ts # Model provider list
│   ├── page.tsx               # Main page (chat UI + settings)
│   ├── layout.tsx             # Layout (dark theme support)
│   └── globals.css            # Global styles (dark mode variables)
├── lib/db.ts                  # SQLite data layer
data/                          # Raw enrollment data
scripts/import-external.ts     # External data import script
```

## Security / 安全说明

- API keys stored only in browser localStorage, never on server
- `.env.local` and database files in `.gitignore`
- API routes include input validation and length limits
- Error messages do not leak internal details

## License

Private repository. All rights reserved.
