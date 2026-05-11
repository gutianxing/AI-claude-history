# Claude History Viewer

Claude Code 会话历史查看器 — 浏览、搜索和分析 Claude Code 对话记录的 Web 仪表盘。

## 功能特性

- **仪表盘** - 项目/会话/消息/命令统计，模型使用图表，每日活动趋势
- **项目管理** - 项目列表、项目详情、会话统计
- **会话管理** - 会话列表、搜索、收藏、标签、命名、AI 总结
- **消息管理** - 消息列表、搜索、角色过滤、内容预览
- **命令历史** - 命令列表、命令统计、仅显示 /xx 和 @xx 命令
- **会话详情** - Markdown 渲染、代码高亮、工具调用折叠、Token 统计、分批加载
- **统计图表** - 每日活动趋势、模型使用分布、项目使用频率、常用命令
- **配置信息** - MCP 服务器、Agents、Skills、插件、环境变量
- **运行中窗口** - 当前活动的 Claude Code 窗口监控
- **导入导出** - 会话导入 (JSON)、导出 (JSON/Markdown)
- **主题切换** - 浅色/深色/跟随系统三种模式

## 快速开始

```bash
npm install        # 安装依赖
npm start          # 启动前端 (Vite, 端口 5173)
npm run server     # 启动后端 API (Express, 端口 3001)
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Vite, Tailwind CSS, Ant Design |
| 状态 | React Query, React Router |
| 后端 | Express, TypeScript (tsx) |
| 数据 | JSONL 文件 (`~/.claude/`) |

## 项目结构

```
src/
├── main.tsx, App.tsx     # 入口和路由
├── types.ts              # TypeScript 接口定义
├── hooks/
│   ├── useClaudeData.ts  # React Query API hooks
│   └── useTheme.tsx      # 主题切换 Provider
├── components/
│   ├── DataTable.tsx     # 数据表格组件
│   └── ThemeToggle.tsx   # 主题切换组件
└── pages/                # 页面组件

server/
├── index.ts              # Express API 服务
├── .env                  # 环境变量
└── data/                 # 服务端数据存储
```

## 环境变量

```bash
# server/.env
ANTHROPIC_API_KEY=required
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选
ANTHROPIC_MODEL=claude-sonnet-4-20250514      # 可选
```

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/stats` | 统计数据 |
| `GET /api/projects` | 项目列表 |
| `GET /api/projects/:name/sessions` | 项目下的会话列表 |
| `GET /api/sessions/:id` | 会话详情 |
| `GET /api/all-sessions` | 所有会话 |
| `GET /api/all-messages` | 所有消息（分页） |
| `GET /api/history` | 命令历史 |
| `GET /api/active-sessions` | 运行中窗口 |
| `POST /api/summarize-session` | AI 总结 |
| `POST /api/import-session` | 导入会话 |

## 许可证

MIT
