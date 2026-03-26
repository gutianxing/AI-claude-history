---
name: feature-implementer
description: |
  Implement features based on user requirements and update FEATURES.md documentation. Use this skill when the user requests to implement a feature, add functionality, or complete a task that should be tracked. The skill analyzes requirements, implements the feature following existing code patterns, and documents the completed work in FEATURES.md. Trigger phrases: "实现", "添加", "完成", "开发", "做一个功能", "implement", "add feature".
---

# Feature Implementer

A skill for implementing features based on user requirements and documenting them in FEATURES.md.

## Workflow

### Step 1: Understand the Requirement

Listen to the user's request and clarify:
1. What exactly needs to be implemented?
2. What is the expected behavior/output?
3. Are there any constraints or preferences?

If the requirement is vague, ask clarifying questions before proceeding.

### Step 2: Analyze the Codebase

Before implementing, understand the existing patterns:

1. **Read FEATURES.md** - Check what features already exist
2. **Read ARCHITECTURE.md** - Understand project structure and tech stack
3. **Explore relevant files** - Look at similar existing implementations

Key files to check:
- `src/pages/` - Page components
- `src/hooks/` - Data fetching hooks
- `server/index.ts` - Backend API
- `src/types.ts` - TypeScript types

### Step 3: Plan the Implementation

Break down the feature into:
- Frontend changes (components, pages, hooks)
- Backend changes (API endpoints, data processing)
- Type definitions if needed

Follow existing code patterns and conventions.

### Step 4: Implement the Feature

**Coding guidelines:**
- Match existing code style and patterns
- Keep components focused and small
- Use TypeScript types properly
- Follow the project's tech stack (React, Tailwind, Express, etc.)

**Implementation order:**
1. Backend API changes (if needed)
2. Frontend hooks (if needed)
3. UI components
4. Integration and wiring

### Step 5: Test the Feature

Verify the implementation works:
- Restart server if backend changed: `npm run server`
- Check frontend hot-reload
- Test the feature in browser
- Handle edge cases

### Step 6: Update FEATURES.md

After successful implementation, update FEATURES.md:

1. **If new feature category**: Add a new section under "已完成功能"
2. **If enhancement to existing feature**: Add sub-items to the relevant section
3. **Mark items as [x] completed**

**Format example:**
```markdown
#### N. 功能名称
- [x] 具体实现项1
- [x] 具体实现项2
- [x] 具体实现项3
```

Place new features in the appropriate location, maintaining the numbered order.

### Step 7: Update ARCHITECTURE.md (if needed)

If the implementation adds:
- New API endpoints → Update API 端点 section
- New files/directories → Update 项目结构 section
- New dependencies → Update 技术栈 section

### Step 8: Context Management

After completing all tasks, manage context window usage:

1. **Check context usage**: Run `/context` to see current context consumption
2. **Evaluate threshold**: If context usage exceeds 60%, run `/compact` to compress conversation history
3. **Why this matters**: Keeping context under control ensures better performance and prevents hitting context limits during long sessions

**Example flow:**
```
> /context
Context: 85% used (127500/150000 tokens)
> /compact  # Since 85% > 60%, compact is needed
```

This step helps maintain session efficiency and prevents unexpected context overflow errors.

## Documentation Update Rules

### FEATURES.md Structure

```markdown
# 项目名称

项目简介

## 功能列表

### ✅ 已完成功能

#### 1. 功能分类
- [x] 具体功能点

---

## 待开发功能

- [ ] 未来计划
```

### When to Update

| Change Type | Update Action |
|-------------|---------------|
| New page/component | Add to FEATURES.md |
| New API endpoint | Add to FEATURES.md + ARCHITECTURE.md |
| New hook | Add to FEATURES.md |
| Bug fix | No doc update needed |
| Refactor | No doc update needed |
| New dependency | Update ARCHITECTURE.md |

### Writing Style

- Use imperative form: "显示..." "支持..." "添加..."
- Be specific: "按日期范围过滤" not "过滤功能"
- Keep items atomic: one feature per checkbox
- Group related items under a numbered category

## Example Workflow

**User request:** "我想添加一个按日期过滤会话的功能"

**Implementation steps:**
1. Read existing Sessions.tsx to understand current structure
2. Read server/index.ts to check API patterns
3. Add date picker UI to Sessions.tsx
4. Add date query params to API endpoint
5. Update useAllSessions hook to accept date params
6. Test the filtering works
7. Update FEATURES.md:
   ```markdown
   #### 4. 会话管理 (Sessions)
   - [x] 显示所有会话列表
   - [x] 按关键词搜索会话
   - [x] 按日期范围过滤会话  // 新增
   ```

## Notes

- Always read existing code before implementing
- Maintain consistency with project patterns
- Update documentation immediately after implementation
- Keep FEATURES.md as a user-facing feature list
- Keep ARCHITECTURE.md as a technical reference
- Always check context usage after completing tasks and compact if over 60%