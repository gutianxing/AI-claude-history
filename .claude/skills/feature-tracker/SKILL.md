---
name: feature-tracker
description: |
  Track and update FEATURES.md after completing development tasks. Use this skill whenever you implement a new feature, fix a bug, refactor code, or make any changes that affect the project's feature set. Automatically determines whether FEATURES.md needs updating and maintains the checkbox format with proper categorization.
---

# Feature Tracker

Automatically update FEATURES.md to reflect completed development work.

## When to Update FEATURES.md

Update FEATURES.md when the completed task:

1. **Adds new functionality** - New pages, components, API endpoints, user interactions
2. **Modifies existing features** - UI changes, behavior changes, configuration options
3. **Removes features** - Deprecated functionality, cleanup
4. **Fixes significant bugs** - Bug fixes that affect user-visible behavior

**Do NOT update FEATURES.md for:**
- Code refactoring without behavior changes
- Dependency updates
- Internal tooling changes
- Documentation-only updates
- Minor styling tweaks

## How to Update FEATURES.md

### Step 1: Read current FEATURES.md

Read the file to understand existing structure and categories.

### Step 2: Determine the action

- **New feature**: Add to appropriate category under "已完成功能"
- **Modified feature**: Update the existing entry description if significantly changed
- **Removed feature**: Move from "已完成功能" to a "已移除功能" section (create if needed), or simply remove if it was never released
- **Bug fix**: Add note to existing feature entry, or create new entry if it's a significant fix

### Step 3: Choose or create category

Existing categories in this project:
- 仪表盘 (Dashboard)
- 项目管理 (Projects)
- 会话管理 (Sessions)
- 消息管理 (Messages)
- 命令历史 (Commands)
- 会话详情 (Session Detail)
- 统计图表 (Stats)
- 配置信息 (Config)
- 导出功能 (Export)

If no category fits, create a new one following the naming convention.

### Step 4: Write the entry

Format:
```markdown
#### Category Name
- [x] Feature description - optional additional details
```

Guidelines:
- Use concise, user-facing language
- Start with a verb when appropriate (显示, 支持, 添加, etc.)
- Include relevant details like limits, options, or related features
- Keep entries atomic - one feature per checkbox

### Step 5: Update "待开发功能" if applicable

If the completed feature was listed in "待开发功能":
- Remove it from that section
- Or mark it as `[x]` if keeping it there for reference

## Example Updates

### Adding a new feature

Before:
```markdown
#### 消息管理 (Messages)
- [x] 显示所有消息列表
- [x] 按关键词搜索消息内容
```

After (added filtering feature):
```markdown
#### 消息管理 (Messages)
- [x] 显示所有消息列表
- [x] 按关键词搜索消息内容
- [x] 按角色过滤 (user/assistant)
```

### Adding a new category

```markdown
#### 数据导出 (Data Export)
- [x] 导出会话为 JSON 格式
- [x] 导出会话为 Markdown 格式
```

## Workflow

1. Complete the user's development request
2. Ask yourself: "Does this change what users can do or how they interact with the app?"
3. If yes, read FEATURES.md
4. Determine the appropriate update action
5. Make the update, preserving existing formatting and categories
6. Inform the user of the FEATURES.md update

## Important Notes

- Always preserve the checkbox format (`- [x]` for completed, `- [ ]` for pending)
- Maintain the existing section structure
- Use Chinese to match the existing document language
- Group related features under the same category
- Don't duplicate existing entries - update them instead