---
name: ui-styling
description: UI and styling conventions
globs: ["src/**/*.tsx", "src/**/*.css"]
---

# UI & Styling

## 语言

- 界面文本使用中文
- 使用中文标点（，。！？）
- 示例：`加载中...` 而非 `Loading...`

## 样式方案

| 场景 | 方案 |
|------|------|
| 布局/工具类 | Tailwind CSS |
| 复杂组件 | Ant Design (Table, Modal, Card, Spin, Button) |
| 特殊需求 | 自定义 CSS |

## Tailwind 常用类

```typescript
// 布局
<div className="max-w-7xl mx-auto py-6 px-4">
<div className="flex gap-3 justify-between items-center">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 颜色
indigo-600  // 主色（按钮、链接）
green-600   // 成功操作
yellow-*    // thinking 块
blue-*      // tool_use 块
gray-*      // 背景、边框
```

## Ant Design

```typescript
import { Button, Modal, Spin, Card, Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

// Table
<Table dataSource={data} columns={columns} rowKey="id" />

// Modal
<Modal title="标题" open={isOpen} onCancel={() => setIsOpen(false)}>
  内容
</Modal>
```

## Markdown 渲染

```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<style>{tableStyles}</style>
<div className="markdown-body prose prose-sm max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
</div>
```

## 代码高亮

```typescript
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

useEffect(() => {
  ref.current?.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block as HTMLElement)
  })
}, [content])
```

## 折叠区块

```typescript
<details className="bg-gray-50 border border-gray-200 rounded p-3">
  <summary className="cursor-pointer text-gray-800 font-medium">
    📄 标题
  </summary>
  <div className="mt-2">内容</div>
</details>
```