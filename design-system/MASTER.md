# Claude Code Chat Log Viewer - 设计系统

## 设计原则

- **开发者友好**: 使用等宽字体、代码风格元素
- **深色模式优先**: 深色主题为主，浅色主题辅助
- **信息密度高**: 仪表盘类型应用，需要高效展示数据
- **一致性**: 统一的组件样式、间距、圆角

---

## 颜色系统

### 主色调（深色模式）

```css
--color-primary: #22C55E;      /* 强调色 - 绿色 */
--color-primary-hover: #16A34A;
--color-secondary: #334155;    /* 次要色 */
--color-background: #0F172A;   /* 背景色 */
--color-surface: #1E293B;      /* 卡片/表面色 */
--color-surface-hover: #334155;
--color-text: #F8FAFC;         /* 主文字 */
--color-text-secondary: #94A3B8; /* 次要文字 */
--color-border: #334155;       /* 边框色 */
```

### 语义颜色

```css
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;

/* Token 颜色 */
--color-token-input: #F97316;   /* 橙色 */
--color-token-output: #14B8A6;  /* 青色 */
--color-token-total: #EC4899;   /* 粉色 */

/* 角色颜色 */
--color-user: #3B82F6;          /* 蓝色 */
--color-assistant: #22C55E;     /* 绿色 */
```

### 浅色模式覆盖

```css
--color-background-light: #F8FAFC;
--color-surface-light: #FFFFFF;
--color-text-light: #0F172A;
--color-text-secondary-light: #64748B;
--color-border-light: #E2E8F0;
```

---

## 字体系统

### 字体族

```css
/* 代码字体 - 用于 ID、命令、代码 */
--font-mono: 'Fira Code', 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;

/* 正文字体 */
--font-sans: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 字体大小

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

---

## 间距系统

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
```

---

## 圆角系统

```css
--radius-sm: 0.25rem;  /* 4px - 小元素 */
--radius-md: 0.5rem;   /* 8px - 按钮、输入框 */
--radius-lg: 0.75rem;  /* 12px - 卡片 */
--radius-xl: 1rem;     /* 16px - 大卡片 */
--radius-full: 9999px; /* 圆形 */
```

---

## 阴影系统

```css
/* 深色模式 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(34, 197, 94, 0.15); /* 强调色光晕 */

/* 浅色模式 */
--shadow-sm-light: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md-light: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg-light: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

## 过渡动画

```css
/* 默认过渡 */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* 常用过渡类 */
.transition-colors {
  transition: color, background-color, border-color var(--transition-normal);
}

.transition-shadow {
  transition: box-shadow var(--transition-normal);
}

.transition-transform {
  transition: transform var(--transition-fast);
}
```

---

## 组件规范

### 卡片 (Card)

```tsx
// 标准卡片
<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6
  hover:shadow-lg transition-shadow duration-200 cursor-pointer">
  ...
</div>

// 可点击卡片
<Link className="block bg-white dark:bg-slate-800 rounded-lg shadow-md p-6
  hover:shadow-lg hover:border-green-500 border-2 border-transparent
  transition-all duration-200 cursor-pointer">
  ...
</Link>
```

### 按钮 (Button)

```tsx
// 主要按钮
<button className="px-4 py-2 bg-green-600 text-white rounded-lg
  hover:bg-green-700 active:bg-green-800 transition-colors duration-200
  font-medium flex items-center gap-2">
  <Icon /> 文本
</button>

// 次要按钮
<button className="px-4 py-2 bg-slate-100 dark:bg-slate-700
  text-slate-700 dark:text-slate-200 rounded-lg
  hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200">
  文本
</button>

// 图标按钮
<button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700
  transition-colors duration-200" title="提示文字">
  <Icon className="w-5 h-5" />
</button>
```

### 标签 (Tag)

```tsx
// 标准标签 - 不使用 emoji
<Tag color="blue">命令名称</Tag>

// 自定义颜色标签
<span className="px-2 py-1 text-xs font-medium rounded-full
  bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
  标签
</span>
```

### 统计卡片 (Stat Card)

```tsx
<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6
  border-l-4 border-green-500">
  <div className="flex items-center gap-3">
    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
      <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
    </div>
    <div>
      <div className="text-sm text-slate-500 dark:text-slate-400">标题</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">123</div>
    </div>
  </div>
</div>
```

### 表格容器 (Table Container)

```tsx
<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
  <DataTable ... />
</div>
```

### 折叠区块 (Collapsible)

```tsx
<details className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200
  dark:border-slate-700 rounded-lg">
  <summary className="px-4 py-3 cursor-pointer font-medium
    text-slate-700 dark:text-slate-300 hover:bg-slate-100
    dark:hover:bg-slate-700/50 transition-colors duration-200">
    标题
  </summary>
  <div className="px-4 pb-4">
    内容
  </div>
</details>
```

---

## 图标规范

### 重要规则

- **禁止使用 emoji 作为 UI 图标**
- 使用 Lucide React 或 Heroicons
- 统一尺寸：`w-5 h-5` (20px) 用于按钮，`w-6 h-6` (24px) 用于标题

### 推荐图标映射

| 功能 | Lucide 图标 | Heroicon |
|------|-------------|----------|
| 项目 | Folder | FolderIcon |
| 会话 | MessageSquare | ChatBubbleLeftRightIcon |
| 消息 | MessagesSquare | ChatBubbleBottomCenterTextIcon |
| 命令 | Terminal | CommandLineIcon |
| 统计 | BarChart3 | ChartBarIcon |
| 配置 | Settings | Cog6ToothIcon |
| 刷新 | RefreshCw | ArrowPathIcon |
| 导出 | Download | ArrowDownTrayIcon |
| 导入 | Upload | ArrowUpTrayIcon |
| 删除 | Trash2 | TrashIcon |
| 编辑 | Pencil | PencilIcon |
| 收藏 | Star | StarIcon |
| 标签 | Tag | TagIcon |
| 过滤 | Filter | FunnelIcon |
| 搜索 | Search | MagnifyingGlassIcon |
| 关闭 | X | XMarkIcon |
| 代码 | CodeBracket | CodeBracketIcon |
| 运行中 | Activity | SignalIcon |
| 用户 | User | UserIcon |
| 助手 | Bot | SparklesIcon |
| 思考 | Brain | LightBulbIcon |
| 工具 | Wrench | WrenchScrewdriverIcon |
| Token | Coins | CurrencyDollarIcon |

---

## 响应式断点

```css
/* Mobile First */
sm: 640px   /* 小屏幕 */
md: 768px   /* 平板 */
lg: 1024px  /* 小桌面 */
xl: 1280px  /* 大桌面 */
2xl: 1536px /* 超大桌面 */
```

---

## 无障碍规范

1. **对比度**: 文字对比度至少 4.5:1
2. **焦点状态**: 所有交互元素需要可见的焦点环
3. **触摸目标**: 最小 44x44px
4. **alt 文本**: 所有图片需要有 alt 描述
5. **aria 标签**: 图标按钮需要 aria-label

```tsx
// 焦点样式示例
<button className="focus:outline-none focus:ring-2 focus:ring-green-500
  focus:ring-offset-2 dark:focus:ring-offset-slate-800">
```

---

## 性能规范

1. **动画**: 优先使用 `transform` 和 `opacity`
2. **懒加载**: 图片和大型列表使用懒加载
3. **骨架屏**: 加载状态使用骨架屏而非 spin
4. **prefers-reduced-motion**: 尊重用户动画偏好

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```