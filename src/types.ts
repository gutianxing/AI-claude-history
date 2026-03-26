// History entry from history.jsonl
export interface HistoryEntry {
  display: string
  timestamp: number
  project: string
  sessionId: string
}

// Message in a conversation
export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
  model?: string
  usage?: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number
    cache_read_input_tokens?: number
  }
  id?: string
  type?: string
}

export interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result'
  text?: string
  thinking?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
  is_error?: boolean
}

// Conversation entry from projects/*.jsonl
export interface ConversationEntry {
  type: 'user' | 'assistant' | 'file-history-snapshot'
  message?: Message
  timestamp: string
  sessionId: string
  cwd?: string
  uuid: string
  parentUuid?: string
  permissionMode?: string
  entrypoint?: string
  version?: string
  gitBranch?: string
  slug?: string
  userType?: string
  isSidechain?: boolean
  promptId?: string
}

// Session metadata
export interface Session {
  sessionId: string
  project: string
  startedAt?: number
  messageCount: number
  firstMessage?: string
  lastMessage?: string
}

// Project info
export interface Project {
  name: string
  path: string
  sessionCount: number
  lastActivity?: string
}

// Settings/Config
export interface Settings {
  model: string
  enabledPlugins: Record<string, boolean>
  extraKnownMarketplaces: Record<string, { source: { source: string; path: string } }>
  teammateMode?: string
  permissions?: {
    allow: string[]
    defaultMode: string
  }
  env?: Record<string, string>
}

// MCP Server
export interface McpServer {
  name: string
  command?: string
  args?: string[]
  type?: string
  url?: string
  description?: string
  env?: Record<string, string>
}

// Agent
export interface Agent {
  name: string
  path: string
  description?: string
}

// Skill
export interface Skill {
  name: string
  path: string
  description?: string
}

// Stats
export interface Stats {
  totalProjects: number
  totalSessions: number
  totalMessages: number
  totalCommands: number
  modelUsage: Record<string, number>
  projectUsage: Record<string, number>
  dailyActivity: { date: string; count: number }[]
  topCommands: { command: string; count: number }[]
}

// Messages list item (for messages tab)
export interface MessageItem {
  uuid: string
  role: string
  content: string
  contentBlocks?: ContentBlock[]
  sessionId: string
  project: string
  timestamp?: string
  model?: string
}

// Messages API response
export interface MessagesResponse {
  data: MessageItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Messages API params
export interface MessagesParams {
  page?: number
  pageSize?: number
  search?: string
  role?: string
}

// Session list item
export interface SessionItem {
  sessionId: string
  sessionName?: string
  project: string
  messageCount: number
  firstMessage?: string
  startedAt?: number
  description?: string
  hasAnalysis?: boolean
  isImported?: boolean
  isFavorite?: boolean
  tags?: string[]
}

// Project list item
export interface ProjectItem {
  name: string
  path: string
  sessionCount: number
  lastActivity?: string
}