# Claude Code Chat Log Viewer

Claude Code 会话历史查看器 - 浏览、搜索和分析 Claude Code 对话记录的 Web 仪表盘。

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
    ├── Stats.tsx         # 统计首页
    ├── Projects.tsx      # 项目列表
    ├── Sessions.tsx      # 会话列表
    ├── SessionDetail.tsx # 会话详情 (核心页面)
    └── ...

server/
├── index.ts              # Express API 服务
├── .env                  # 环境变量
└── data/                 # 服务端数据存储
    ├── session-descriptions.json  # 会话描述
    ├── session-names.json         # 会话命名
    ├── imported-sessions.json     # 导入会话记录
    └── session-analysis/          # AI 分析报告 (.md)
```

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/stats` | 统计数据 |
| `GET /api/projects` | 项目列表 |
| `GET /api/sessions/:id` | 会话详情 |
| `GET /api/all-sessions` | 所有会话 |
| `POST /api/summarize-session` | AI 总结 |
| `POST /api/import-session` | 导入会话 |
| `DELETE /api/sessions/:id` | 删除导入的会话 |
| `PUT /api/sessions/:id/name` | 重命名会话 |

## 环境变量

```bash
# server/.env
ANTHROPIC_API_KEY=required
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选
ANTHROPIC_MODEL=claude-sonnet-4-20250514      # 可选
```

## 核心功能

1. **统计仪表盘** - 项目/会话/消息数量，模型使用图表
2. **会话查看器** - Markdown 渲染、代码高亮、工具调用折叠、Token 统计
3. **AI 总结** - 调用 Claude API 生成会话摘要
4. **会话导入** - 从 JSON 文件导入会话
5. **会话管理** - 导入会话可删除，支持会话命名
6. **主题切换** - 支持浅色/深色/跟随系统三种模式

## 编码规范

- TypeScript 严格模式
- 函数式组件 + Hooks
- React Query 数据获取
- Tailwind CSS + Ant Design
- 中文界面文本
- 默认导出组件

## 相关规则

详细规则见 `.claude/rules/` 目录：
- `typescript-react.md` - React/TS 编码规范
- `api-patterns.md` - API 模式
- `ui-styling.md` - UI 样式规范
- `data-models.md` - 数据模型