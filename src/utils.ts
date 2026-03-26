import type { ContentBlock } from './types'

/**
 * Get project name from full path
 * e.g., "D:\workspace\project" -> "project"
 */
export function getProjectName(project: string): string {
  return project.split(/[\\/]/).pop() || project
}

/**
 * Truncate session ID for display
 * e.g., "abc123def456" -> "abc123de..."
 */
export function truncateSessionId(sessionId: string, length = 8): string {
  return sessionId.length > length ? `${sessionId.slice(0, length)}...` : sessionId
}

/**
 * Format content for display in messages table
 */
export function formatContent(content: string, maxLength = 500): string {
  return content.length > maxLength ? content.slice(0, maxLength) : content
}

/**
 * Render content block type label
 */
export function getBlockTypeLabel(type: string): string {
  switch (type) {
    case 'text': return '文本'
    case 'thinking': return '思考过程'
    case 'tool_use': return '工具调用'
    case 'tool_result': return '工具结果'
    default: return type
  }
}

/**
 * Extract text from content blocks
 */
export function extractTextFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map(block => {
      if (block.type === 'text') return block.text || ''
      if (block.type === 'thinking') return '[思考过程]'
      if (block.type === 'tool_use') return `[工具调用: ${block.name || 'unknown'}]`
      if (block.type === 'tool_result') {
        const resultContent = typeof block.content === 'string' ? block.content.slice(0, 100) : '[复杂结果]'
        return `[工具结果: ${resultContent}]`
      }
      return ''
    })
    .join(' ')
}