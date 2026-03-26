# Claude Code 对话历史查看器 - 架构文档

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| UI 样式 | Tailwind CSS |
| 图表库 | Recharts |
| 状态管理 | @tanstack/react-query |
| 路由 | react-router-dom |
| Markdown 渲染 | react-markdown |
| 代码高亮 | highlight.js |
| 后端 | Express.js |
| 运行时 | Node.js 20 |

---

## 项目结构

```
chat_log/
├── server/
│   └── index.ts              # 后端 API 服务
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # 仪表盘
│   │   ├── Projects.tsx      # 项目列表
│   │   ├── ProjectDetail.tsx # 项目详情
│   │   ├── Sessions.tsx      # 会话列表
│   │   ├── SessionDetail.tsx # 会话详情
│   │   ├── Messages.tsx      # 消息列表
│   │   ├── Commands.tsx      # 命令历史
│   │   ├── Stats.tsx         # 统计图表
│   │   └── Config.tsx        # 配置信息
│   ├── hooks/
│   │   └── useClaudeData.ts  # 数据获取 hooks
│   ├── types.ts              # TypeScript 类型定义
│   ├── App.tsx               # 主应用组件
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/history` | GET | 获取命令历史列表 |
| `/api/projects` | GET | 获取项目列表 |
| `/api/projects/:name/sessions` | GET | 获取项目的会话列表 |
| `/api/sessions/:id` | GET | 获取会话详情 |
| `/api/all-sessions` | GET | 获取所有会话列表 |
| `/api/all-messages` | GET | 获取所有消息列表 |
| `/api/config` | GET | 获取配置信息 |
| `/api/mcp-servers` | GET | 获取 MCP 服务器列表 |
| `/api/agents` | GET | 获取 Agent 列表 |
| `/api/skills` | GET | 获取 Skill 列表 |
| `/api/stats` | GET | 获取统计数据汇总 |

---

## 数据源

数据来自 `~/.claude/` 目录：

| 文件/目录 | 内容 |
|-----------|------|
| `history.jsonl` | 命令历史 |
| `projects/` | 各项目对话详情 |
| `sessions/` | 会话元数据 |
| `settings.json` | 配置信息 |
| `mcp-configs/mcp-servers.json` | MCP 服务器配置 |
| `agents/` | Agent 定义文件 |
| `skills/` | Skill 定义目录 |
| `metrics/costs.jsonl` | 成本统计 |
| `telemetry/` | 遥测数据 |

---

## 运行方式

```bash
# 安装依赖
npm install

# 启动后端服务 (端口 3001)
npm run server

# 启动前端开发服务器 (端口 5173)
npm run dev

# 构建生产版本
npm run build
```

访问 http://localhost:5173 查看应用。