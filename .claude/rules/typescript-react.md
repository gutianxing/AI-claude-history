---
name: typescript-react-patterns
description: TypeScript and React coding patterns
globs: ["**/*.tsx", "**/*.ts"]
---

# TypeScript & React Patterns

## 组件规范

```typescript
// 推荐：内联类型
function MyComponent({ data }: { data: string }) {
  return <div>{data}</div>
}
export default MyComponent

// 复杂 props 使用接口
interface Props {
  data: string
  onSave: (value: string) => void
}
```

## React Fragment

**关键规则**：需要 key 时必须用 `React.Fragment`，不能用 `<>`

```typescript
// ✅ 正确
import React from 'react'
return (
  <React.Fragment key={i}>
    <div>Content</div>
  </React.Fragment>
)

// ❌ 错误 - Fragment 简写不支持 key
return (
  <>
    <div key={i}>Content</div>
  </>
)
```

## Switch 语句

case 内声明变量必须用 `{}` 包裹：

```typescript
switch (type) {
  case 'text': {
    const textContent = processText(data)
    return <div>{textContent}</div>
  }
  default:
    return null
}
```

## Hooks

- `useQuery` - API 数据获取
- `useState` - 本地状态
- `useEffect` - 副作用（注意清理）
- `useRef` - DOM 引用

## 错误处理

```typescript
// 未使用的错误变量
catch () { /* 或 catch (_err) */ }

// 组件中处理状态
if (isLoading) return <div>加载中...</div>
if (error) return <div>错误: {error.message}</div>
```

## 文件命名

- 组件：`PascalCase.tsx`
- Hooks：`useCamelCase.ts`
- 类型：`lowercase.ts`