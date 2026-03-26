---
name: api-patterns
description: API and data fetching patterns
globs: ["server/**/*.ts", "src/hooks/*.ts"]
---

# API Patterns

## 后端 (Express)

### 路由结构

```typescript
app.get('/api/resource/:id', (req, res) => {
  try {
    const { id } = req.params
    // 处理逻辑
    res.json(data)
  } catch {
    res.status(500).json({ error: '处理失败' })
  }
})
```

### JSONL 读取

```typescript
function readJsonl(filePath: string): Record<string, unknown>[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.trim().split('\n').map(line => JSON.parse(line))
  } catch {
    return []
  }
}
```

### 路径转换

项目目录名是路径的哈希版本：
- `D:\workspace\project` → `d--workspace-project`

```typescript
const dirName = path
  .replace(/:\\/g, '--')
  .replace(/\\/g, '-')
  .replace(/\//g, '-')
  .toLowerCase()
```

## 前端 (React Query)

### Hook 模式

```typescript
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: async () => {
      const res = await fetch(`/api/resource/${id}`)
      if (!res.ok) throw new Error('获取失败')
      return res.json()
    },
    enabled: !!id,
  })
}
```

### 错误处理

- React Query 自动管理 `isLoading`、`error`、`data`
- 显示中文错误信息