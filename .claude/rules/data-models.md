---
name: data-models
description: Data types and file locations
globs: ["src/types.ts", "**/*.ts"]
---

# Data Models

## 核心类型

### Message
```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
  model?: string
  usage?: { input_tokens: number; output_tokens: number }
}
```

### ContentBlock
```typescript
type ContentBlock =
  | { type: 'text'; text?: string }
  | { type: 'thinking'; thinking?: string }
  | { type: 'tool_use'; name?: string; input?: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id?: string; content?: string; is_error?: boolean }
```

### Session
```typescript
interface Session {
  sessionId: string
  project: string
  startedAt?: number
  messageCount: number
  firstMessage?: string
}
```

## 文件位置

### Claude 数据目录 (`~/.claude/`)
```
~/.claude/
├── history.jsonl      # 命令历史
├── settings.json      # 设置
├── projects/          # 项目目录
│   └── {hash}/        # 如 d--workspace-project
│       └── {session-id}.jsonl
├── sessions/          # 活动会话
├── agents/            # 自定义代理
└── skills/            # 技能目录
```

### 服务端数据 (`server/data/`)
```
server/data/
├── session-descriptions.json  # 会话描述
└── session-analysis/          # AI 分析报告 (.md)
```

## 路径转换

```typescript
// D:\workspace\project → d--workspace-project
const dirName = path
  .replace(/:\\/g, '--')
  .replace(/\\/g, '-')
  .replace(/\//g, '-')
  .toLowerCase()
```