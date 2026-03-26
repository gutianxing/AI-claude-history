import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server directory
config({ path: join(__dirname, '.env') })

import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = 3001

// Claude config directory
const CLAUDE_DIR = process.env.CLAUDE_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude')

// Session descriptions file path
const DESCRIPTIONS_FILE = path.join(__dirname, 'data', 'session-descriptions.json')
const ANALYSIS_DIR = path.join(__dirname, 'data', 'session-analysis')
const IMPORTED_SESSIONS_FILE = path.join(__dirname, 'data', 'imported-sessions.json')
const SESSION_NAMES_FILE = path.join(__dirname, 'data', 'session-names.json')
const FAVORITES_FILE = path.join(__dirname, 'data', 'session-favorites.json')
const TAGS_FILE = path.join(__dirname, 'data', 'session-tags.json')

// Helper to ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
  }
}

// Helper to read session descriptions
function readDescriptions(): Record<string, string> {
  ensureDataDir()
  try {
    if (fs.existsSync(DESCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(DESCRIPTIONS_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return {}
}

// Helper to save session description
function saveDescription(sessionId: string, description: string) {
  ensureDataDir()
  const descriptions = readDescriptions()
  descriptions[sessionId] = description
  fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2))
}

// Helper to read session names
function readSessionNames(): Record<string, string> {
  ensureDataDir()
  try {
    if (fs.existsSync(SESSION_NAMES_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_NAMES_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return {}
}

// Helper to save session name
function saveSessionName(sessionId: string, name: string) {
  ensureDataDir()
  const names = readSessionNames()
  names[sessionId] = name
  fs.writeFileSync(SESSION_NAMES_FILE, JSON.stringify(names, null, 2))
}

// Helper to delete session name
function deleteSessionName(sessionId: string) {
  ensureDataDir()
  const names = readSessionNames()
  if (names[sessionId]) {
    delete names[sessionId]
    fs.writeFileSync(SESSION_NAMES_FILE, JSON.stringify(names, null, 2))
  }
}

// Helper to read favorites
function readFavorites(): string[] {
  ensureDataDir()
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      return JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return []
}

// Helper to toggle favorite
function toggleFavorite(sessionId: string): boolean {
  ensureDataDir()
  const favorites = readFavorites()
  const index = favorites.indexOf(sessionId)
  if (index > -1) {
    favorites.splice(index, 1)
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
    return false
  } else {
    favorites.push(sessionId)
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
    return true
  }
}

// Helper to read tags
function readSessionTags(): Record<string, string[]> {
  ensureDataDir()
  try {
    if (fs.existsSync(TAGS_FILE)) {
      return JSON.parse(fs.readFileSync(TAGS_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return {}
}

// Helper to get all unique tags
function getAllTags(): string[] {
  const sessionTags = readSessionTags()
  const tagSet = new Set<string>()
  Object.values(sessionTags).forEach(tags => {
    tags.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

// Helper to update session tags
function updateSessionTags(sessionId: string, tags: string[]): void {
  ensureDataDir()
  const sessionTags = readSessionTags()
  if (tags.length > 0) {
    sessionTags[sessionId] = tags
  } else {
    delete sessionTags[sessionId]
  }
  fs.writeFileSync(TAGS_FILE, JSON.stringify(sessionTags, null, 2))
}

// Helper to delete session tags
function deleteSessionTags(sessionId: string): void {
  ensureDataDir()
  const sessionTags = readSessionTags()
  if (sessionTags[sessionId]) {
    delete sessionTags[sessionId]
    fs.writeFileSync(TAGS_FILE, JSON.stringify(sessionTags, null, 2))
  }
}

// Helper to save session analysis
function saveAnalysis(sessionId: string, analysis: {
  purpose: string
  improvements: string
  summary: string
}) {
  ensureDataDir()
  const analysisFile = path.join(ANALYSIS_DIR, `${sessionId}.md`)
  const content = `# 会话分析报告

## 会话 ID
${sessionId}

## 主要目的
${analysis.purpose}

## 需要改进的地方
${analysis.improvements}

## 详细总结
${analysis.summary}

---
*生成时间: ${new Date().toLocaleString('zh-CN')}*
`
  fs.writeFileSync(analysisFile, content)
}

// Helper to read imported sessions
function readImportedSessions(): Record<string, { originalSessionId: string; importedAt: string }> {
  ensureDataDir()
  try {
    if (fs.existsSync(IMPORTED_SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(IMPORTED_SESSIONS_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return {}
}

// Helper to save imported session
function saveImportedSession(sessionId: string, originalSessionId: string) {
  ensureDataDir()
  const imported = readImportedSessions()
  imported[sessionId] = {
    originalSessionId,
    importedAt: new Date().toISOString()
  }
  fs.writeFileSync(IMPORTED_SESSIONS_FILE, JSON.stringify(imported, null, 2))
}

// Helper to check if analysis exists
function hasAnalysis(sessionId: string): boolean {
  ensureDataDir()
  const analysisFile = path.join(ANALYSIS_DIR, `${sessionId}.md`)
  return fs.existsSync(analysisFile)
}

app.use(express.json({ limit: '50mb' }))

// Helper to read JSONL files
function readJsonl(filePath: string): Record<string, unknown>[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.trim().split('\n').map(line => JSON.parse(line))
  } catch {
    return []
  }
}

// Helper to get project name from path
function getProjectName(projectPath: string): string {
  return path.basename(projectPath)
}

// API: Get history
app.get('/api/history', (req, res) => {
  try {
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl')
    const history = readJsonl(historyPath)
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read history' })
  }
})

// API: Get projects
app.get('/api/projects', (req, res) => {
  try {
    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true })
    const projects = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const projectPath = path.join(projectsDir, entry.name)
        const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'))
        let lastActivity = ''
        let sessionCount = files.length

        // Get last activity
        files.forEach(file => {
          const stat = fs.statSync(path.join(projectPath, file))
          if (!lastActivity || stat.mtime > new Date(lastActivity)) {
            lastActivity = stat.mtime.toISOString()
          }
        })

        return {
          name: entry.name.replace(/-/g, '/').replace(/^C--/, 'C:/'),
          path: entry.name,
          sessionCount,
          lastActivity
        }
      })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read projects' })
  }
})

// API: Get project sessions
app.get('/api/projects/:name/sessions', (req, res) => {
  try {
    // Decode the project name and convert to directory format
    let projectName = decodeURIComponent(req.params.name)
    // Convert Windows path to directory name format
    // Handles both forward slashes (from projects list) and backslashes (from history)
    // e.g., "D:\workspace\project\DSGP\dsgp-node20" -> "d--workspace-project-DSGP-dsgp-node20"
    // e.g., "D:/workspace/project/DSGP/dsgp-node20" -> "d--workspace-project-DSGP-dsgp-node20"
    projectName = projectName
      .replace(/:\\/g, '--')         // Replace "D:\" with "D--" (drive letter + colon + backslash)
      .replace(/:\//g, '--')         // Replace "D:/" with "D--" (drive letter + colon + forward slash)
      .replace(/\\/g, '-')           // Replace remaining backslashes with dashes
      .replace(/\//g, '-')           // Replace remaining forward slashes with dashes
      .toLowerCase()                 // Convert to lowercase for directory matching

    const projectDir = path.join(CLAUDE_DIR, 'projects', projectName)

    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found', path: projectDir })
    }

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'))

    const sessions = files.map(file => {
      const sessionId = file.replace('.jsonl', '')
      const filePath = path.join(projectDir, file)
      const entries = readJsonl(filePath)

      // Find first user message
      const firstUserMsg = entries.find((e: Record<string, unknown>) => e.type === 'user')
      const firstMessage = firstUserMsg?.message?.content
        ? typeof firstUserMsg.message.content === 'string'
          ? firstUserMsg.message.content.slice(0, 100)
          : '[复杂消息]'
        : ''

      // Get timestamp - try first entry, then first message with timestamp
      let startedAt: number | undefined
      if (entries.length > 0) {
        // Try first entry's timestamp
        const firstEntry = entries[0] as { timestamp?: string | number }
        if (firstEntry?.timestamp) {
          startedAt = new Date(firstEntry.timestamp).getTime()
        } else {
          // Fallback: find first entry with timestamp
          const entryWithTimestamp = entries.find((e: Record<string, unknown>) => e.timestamp) as { timestamp?: string | number } | undefined
          if (entryWithTimestamp?.timestamp) {
            startedAt = new Date(entryWithTimestamp.timestamp).getTime()
          }
        }
      }

      return {
        sessionId,
        messageCount: entries.filter((e: Record<string, unknown>) => e.type === 'user' || e.type === 'assistant').length,
        firstMessage,
        startedAt
      }
    })

    res.json(sessions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read sessions' })
  }
})

// API: Get session detail
app.get('/api/sessions/:id', (req, res) => {
  try {
    const sessionId = req.params.id
    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    let sessionData: Record<string, unknown>[] = []
    let foundProject = ''

    // Find the session file
    for (const projectDir of projectDirs) {
      const sessionFile = path.join(projectsDir, projectDir, `${sessionId}.jsonl`)
      if (fs.existsSync(sessionFile)) {
        sessionData = readJsonl(sessionFile)
        foundProject = projectDir.replace(/-/g, '/').replace(/^C--/, 'C:/')
        break
      }
    }

    if (sessionData.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Transform messages to expected format
    const messages = sessionData
      .filter((e: Record<string, unknown>) => e.type === 'user' || e.type === 'assistant')
      .map((e: Record<string, unknown>) => {
        const entry = e as {
          type: string
          uuid?: string
          timestamp?: string
          message?: {
            role?: string
            content?: string | Array<{ type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string }>
            model?: string
            usage?: { input_tokens?: number; output_tokens?: number }
          }
        }
        return {
          uuid: entry.uuid || '',
          role: entry.message?.role || entry.type,
          content: entry.message?.content || '',
          timestamp: entry.timestamp,
          model: entry.message?.model,
          usage: entry.message?.usage
        }
      })

    res.json({
      sessionId,
      sessionName: readSessionNames()[sessionId] || '',
      project: foundProject,
      messages
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read session' })
  }
})

// API: Get config
app.get('/api/config', (req, res) => {
  try {
    const settingsPath = path.join(CLAUDE_DIR, 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read config' })
  }
})

// API: Get active sessions (running Claude Code windows)
app.get('/api/active-sessions', (req, res) => {
  try {
    const sessionsDir = path.join(CLAUDE_DIR, 'sessions')
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'))

    const activeSessions = files.map(file => {
      const sessionPath = path.join(sessionsDir, file)
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'))
      return {
        pid: sessionData.pid,
        sessionId: sessionData.sessionId,
        cwd: sessionData.cwd,
        startedAt: sessionData.startedAt,
        kind: sessionData.kind
      }
    })

    // Sort by startedAt descending
    activeSessions.sort((a, b) => b.startedAt - a.startedAt)

    res.json(activeSessions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read active sessions' })
  }
})

// API: Get MCP servers (from ~/.claude.json mcpServers field)
app.get('/api/mcp-servers', (req, res) => {
  try {
    const claudeJsonPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude.json')
    const claudeJson = JSON.parse(fs.readFileSync(claudeJsonPath, 'utf-8'))

    // Get MCP servers from ~/.claude.json mcpServers field
    const mcpServers = claudeJson.mcpServers || {}

    const servers = Object.entries(mcpServers).map(([name, config]) => ({
      name,
      ...(config as Record<string, unknown>)
    }))

    res.json(servers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read MCP servers' })
  }
})

// API: Get agents
app.get('/api/agents', (req, res) => {
  try {
    const agentsDir = path.join(CLAUDE_DIR, 'agents')
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    const agents = files.map(file => ({
      name: file.replace('.md', ''),
      path: path.join(agentsDir, file)
    }))
    res.json(agents)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read agents' })
  }
})

// API: Get skills
app.get('/api/skills', (req, res) => {
  try {
    const skillsDir = path.join(CLAUDE_DIR, 'skills')
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    const skills = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: path.join(skillsDir, entry.name)
      }))
    res.json(skills)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read skills' })
  }
})

// API: Get stats
app.get('/api/stats', (req, res) => {
  try {
    // Read history
    const historyPath = path.join(CLAUDE_DIR, 'history.jsonl')
    const history = readJsonl(historyPath)

    // Read projects
    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    let totalSessions = 0
    let totalMessages = 0
    const modelUsage: Record<string, number> = {}
    const projectUsage: Record<string, number> = {}
    const dailyActivity: Record<string, number> = {}
    const commandCounts: Record<string, number> = {}

    // Process history
    history.forEach((entry: Record<string, unknown>) => {
      const e = entry as { timestamp?: number; project?: string; display?: string }
      // Daily activity
      if (e.timestamp) {
        const date = new Date(e.timestamp).toISOString().slice(0, 10)
        dailyActivity[date] = (dailyActivity[date] || 0) + 1
      }

      // Project usage
      if (e.project) {
        projectUsage[e.project] = (projectUsage[e.project] || 0) + 1
      }

      // Command counts
      if (e.display) {
        const cmd = e.display.split(' ')[0]
        commandCounts[cmd] = (commandCounts[cmd] || 0) + 1
      }
    })

    // Process each project
    projectDirs.forEach(projectDir => {
      const projectPath = path.join(projectsDir, projectDir)
      const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'))
      totalSessions += files.length

      files.forEach(file => {
        const entries = readJsonl(path.join(projectPath, file))
        entries.forEach((entry: Record<string, unknown>) => {
          const e = entry as { type?: string; message?: { model?: string } }
          if (e.type === 'user' || e.type === 'assistant') {
            totalMessages++
          }
          if (e.message?.model) {
            modelUsage[e.message.model] = (modelUsage[e.message.model] || 0) + 1
          }
        })
      })
    })

    // Format daily activity
    const dailyActivityArray = Object.entries(dailyActivity)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    // Format top commands
    const topCommands = Object.entries(commandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([command, count]) => ({ command, count }))

    res.json({
      totalProjects: projectDirs.length,
      totalSessions,
      totalMessages,
      totalCommands: history.length,
      modelUsage,
      projectUsage,
      dailyActivity: dailyActivityArray,
      topCommands
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute stats' })
  }
})

// API: Get all sessions
app.get('/api/all-sessions', (req, res) => {
  try {
    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    // Read saved descriptions, imported sessions, session names, favorites and tags
    const descriptions = readDescriptions()
    const importedSessions = readImportedSessions()
    const sessionNames = readSessionNames()
    const favorites = readFavorites()
    const sessionTags = readSessionTags()

    const allSessions: Array<{
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
    }> = []

    projectDirs.forEach(projectDir => {
      const projectPath = path.join(projectsDir, projectDir)
      const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'))

      files.forEach(file => {
        const sessionId = file.replace('.jsonl', '')
        const filePath = path.join(projectPath, file)
        const entries = readJsonl(filePath)

        const firstUserMsg = entries.find((e: Record<string, unknown>) => e.type === 'user')
        const firstMessage = firstUserMsg?.message?.content
          ? typeof firstUserMsg.message.content === 'string'
            ? firstUserMsg.message.content.slice(0, 100)
            : '[复杂消息]'
          : ''

        // Get timestamp - try first entry, then first message with timestamp
        let startedAt: number | undefined
        if (entries.length > 0) {
          // Try first entry's timestamp
          const firstEntry = entries[0] as { timestamp?: string | number }
          if (firstEntry?.timestamp) {
            startedAt = new Date(firstEntry.timestamp).getTime()
          } else {
            // Fallback: find first entry with timestamp
            const entryWithTimestamp = entries.find((e: Record<string, unknown>) => e.timestamp) as { timestamp?: string | number } | undefined
            if (entryWithTimestamp?.timestamp) {
              startedAt = new Date(entryWithTimestamp.timestamp).getTime()
            }
          }
        }

        allSessions.push({
          sessionId,
          sessionName: sessionNames[sessionId] || '',
          project: projectDir.replace(/-/g, '/').replace(/^C--/, 'C:/'),
          messageCount: entries.filter((e: Record<string, unknown>) => e.type === 'user' || e.type === 'assistant').length,
          firstMessage,
          startedAt,
          description: descriptions[sessionId] || '',
          hasAnalysis: hasAnalysis(sessionId),
          isImported: !!importedSessions[sessionId],
          isFavorite: favorites.includes(sessionId),
          tags: sessionTags[sessionId] || []
        })
      })
    })

    // Sort by startedAt descending
    allSessions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))

    res.json(allSessions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all sessions' })
  }
})

// API: Get all messages (with pagination support)
app.get('/api/all-messages', (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const searchTerm = (req.query.search as string) || ''
    const roleFilter = (req.query.role as string) || 'all'

    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    const allMessages: Array<{
      uuid: string
      role: string
      content: string
      contentBlocks?: Array<{ type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string | Record<string, unknown> }>
      sessionId: string
      project: string
      timestamp?: string
      model?: string
    }> = []

    projectDirs.forEach(projectDir => {
      const projectPath = path.join(projectsDir, projectDir)
      const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'))

      files.forEach(file => {
        const sessionId = file.replace('.jsonl', '')
        const filePath = path.join(projectPath, file)
        const entries = readJsonl(filePath)

        entries.forEach((entry: Record<string, unknown>) => {
          const e = entry as {
            type?: string
            uuid?: string
            message?: {
              role?: string
              content?: string | Array<{ type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string | Record<string, unknown> }>
              timestamp?: string
              model?: string
            }
            timestamp?: string
          }

          if (e.type === 'user' || e.type === 'assistant') {
            let content = ''
            let contentBlocks: Array<{ type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string | Record<string, unknown> }> = []

            if (e.message?.content) {
              if (typeof e.message.content === 'string') {
                content = e.message.content
              } else if (Array.isArray(e.message.content)) {
                contentBlocks = e.message.content
                content = e.message.content
                  .map((block: { type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string | Record<string, unknown> }) => {
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
            }

            allMessages.push({
              uuid: e.uuid || '',
              role: e.message?.role || e.type,
              content: content.slice(0, 500),
              contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
              sessionId,
              project: projectDir.replace(/-/g, '/').replace(/^C--/, 'C:/'),
              timestamp: e.timestamp || e.message?.timestamp,
              model: e.message?.model
            })
          }
        })
      })
    })

    // Sort by timestamp descending
    allMessages.sort((a, b) => {
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Filter by search term and role
    const filteredMessages = allMessages.filter((m) => {
      const matchesSearch = !searchTerm ||
        m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.project.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || m.role === roleFilter
      return matchesSearch && matchesRole
    })

    // Calculate pagination
    const total = filteredMessages.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedMessages = filteredMessages.slice(startIndex, startIndex + pageSize)

    res.json({
      data: paginatedMessages,
      total,
      page,
      pageSize,
      totalPages
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all messages' })
  }
})

// API: Summarize session using AI
app.post('/api/summarize-session', async (req, res) => {
  try {
    const { sessionId, messages } = req.body

    let sessionMessages = messages

    // If only sessionId provided, fetch the session data
    if (!messages && sessionId) {
      const projectsDir = path.join(CLAUDE_DIR, 'projects')
      const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)

      let sessionData: Record<string, unknown>[] = []

      for (const projectDir of projectDirs) {
        const sessionFile = path.join(projectsDir, projectDir, `${sessionId}.jsonl`)
        if (fs.existsSync(sessionFile)) {
          sessionData = readJsonl(sessionFile)
          break
        }
      }

      if (sessionData.length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      sessionMessages = sessionData
        .filter((e: Record<string, unknown>) => e.type === 'user' || e.type === 'assistant')
        .map((e: Record<string, unknown>) => {
          const entry = e as {
            type: string
            message?: {
              role?: string
              content?: string | Array<{ type: string; text?: string; thinking?: string }>
            }
          }
          return {
            role: entry.message?.role || entry.type,
            content: entry.message?.content || ''
          }
        })
    }

    if (!sessionMessages || !Array.isArray(sessionMessages)) {
      return res.status(400).json({ error: 'Messages are required' })
    }

    // Build conversation text for summarization
    let conversationText = ''
    sessionMessages.forEach((msg: { role: string; content: string | Record<string, unknown>[] }) => {
      const role = msg.role === 'user' ? '用户' : '助手'
      let content = ''
      if (typeof msg.content === 'string') {
        content = msg.content
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .map((block: { type: string; text?: string; thinking?: string }) => {
            if (block.type === 'text') return block.text || ''
            if (block.type === 'thinking') return `[思考: ${block.thinking?.slice(0, 200)}...]`
            return ''
          })
          .join('\n')
      }
      conversationText += `${role}: ${content}\n\n`
    })

    // Truncate if too long
    if (conversationText.length > 50000) {
      conversationText = conversationText.slice(0, 50000) + '\n\n[...内容过长已截断...]'
    }

    // Call AI API for summarization
    const apiKey = process.env.ANTHROPIC_API_KEY
    const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'

    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
    }

    console.log(`Calling AI API: ${baseUrl}/v1/messages with model: ${model}`)

    // Build request body - support both Anthropic and OpenAI-compatible formats
    const isAnthropicApi = baseUrl.includes('anthropic.com')

    // Normalize base URL - remove trailing slash
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')

    // Determine endpoint based on API type
    const endpoint = isAnthropicApi ? '/v1/messages' : '/v1/chat/completions'

    const requestBody = isAnthropicApi ? {
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `请完成以下三个任务：

## 任务1：生成会话描述（100-200字）
用简洁的语言描述这个会话的主要内容，包括：
- 会话目的/主题
- 完成的关键任务
- 使用的主要技术/工具

## 任务2：分析会话目的
请总结这次会话的主要目的是什么？用户想要达成什么目标？

## 任务3：分析需要改进的地方
请分析这次会话中有哪些可以改进的地方？包括：
- 沟通效率方面
- 任务执行方面
- 技术实现方面
- 其他建议

## 任务4：生成详细总结
包括：
1. 主要讨论的话题
2. 完成的主要任务
3. 关键决策或结论
4. 使用的主要工具/技术

请按以下格式回复：
【描述】
（100-200字的简短描述）

【目的】
（会话的主要目的）

【改进】
（需要改进的地方）

【总结】
（详细总结内容）

对话内容：
${conversationText}`
        }
      ]
    } : {
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `请完成以下三个任务：

## 任务1：生成会话描述（100-200字）
用简洁的语言描述这个会话的主要内容，包括：
- 会话目的/主题
- 完成的关键任务
- 使用的主要技术/工具

## 任务2：分析会话目的
请总结这次会话的主要目的是什么？用户想要达成什么目标？

## 任务3：分析需要改进的地方
请分析这次会话中有哪些可以改进的地方？包括：
- 沟通效率方面
- 任务执行方面
- 技术实现方面
- 其他建议

## 任务4：生成详细总结
包括：
1. 主要讨论的话题
2. 完成的主要任务
3. 关键决策或结论
4. 使用的主要工具/技术

请按以下格式回复：
【描述】
（100-200字的简短描述）

【目的】
（会话的主要目的）

【改进】
（需要改进的地方）

【总结】
（详细总结内容）

对话内容：
${conversationText}`
        }
      ]
    }

    // Build headers - OpenAI-compatible APIs use Authorization: Bearer
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (isAnthropicApi) {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    console.log(`Full API URL: ${normalizedBaseUrl}${endpoint}`)

    const response = await fetch(`${normalizedBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('AI API error response:', errorData.slice(0, 500))
      return res.status(500).json({ error: `AI API error: ${errorData.slice(0, 200)}` })
    }

    const responseText = await response.text()
    console.log('AI API response:', responseText.slice(0, 200))

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText.slice(0, 500))
      return res.status(500).json({ error: 'AI API returned non-JSON response' })
    }

    const fullText = data.content?.[0]?.text || data.choices?.[0]?.message?.content || ''

    console.log('Full AI response text:', fullText.slice(0, 500))

    // Parse description, purpose, improvements and summary
    let description = ''
    let purpose = ''
    let improvements = ''
    let summary = fullText

    const descMatch = fullText.match(/【描述】\s*([\s\S]*?)(?=【目的】|【改进】|【总结】|$)/)
    const purposeMatch = fullText.match(/【目的】\s*([\s\S]*?)(?=【描述】|【改进】|【总结】|$)/)
    const improveMatch = fullText.match(/【改进】\s*([\s\S]*?)(?=【描述】|【目的】|【总结】|$)/)
    const summaryMatch = fullText.match(/【总结】\s*([\s\S]*?)$/)

    console.log('Regex matches:', {
      descMatch: descMatch ? descMatch[1].slice(0, 50) : null,
      purposeMatch: purposeMatch ? purposeMatch[1].slice(0, 50) : null,
      improveMatch: improveMatch ? improveMatch[1].slice(0, 50) : null,
      summaryMatch: summaryMatch ? summaryMatch[1].slice(0, 50) : null
    })

    if (descMatch) {
      description = descMatch[1].trim()
    }
    if (purposeMatch) {
      purpose = purposeMatch[1].trim()
    }
    if (improveMatch) {
      improvements = improveMatch[1].trim()
    }
    if (summaryMatch) {
      summary = summaryMatch[1].trim()
    }

    console.log('Parsed values:', {
      description: description.slice(0, 50),
      purpose: purpose.slice(0, 50),
      improvements: improvements.slice(0, 50),
      summary: summary.slice(0, 50)
    })

    // Save description and analysis if sessionId is provided
    if (sessionId && description) {
      console.log('Saving description for session:', sessionId)
      saveDescription(sessionId, description)
    }
    if (sessionId && purpose && improvements && summary) {
      console.log('Saving analysis for session:', sessionId)
      saveAnalysis(sessionId, { purpose, improvements, summary })
    }

    res.json({ summary, description, purpose, improvements })
  } catch (error) {
    console.error('Summarization error:', error)
    res.status(500).json({ error: 'Failed to summarize session' })
  }
})

// API: Download session analysis
app.get('/api/session-analysis/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params
    const analysisFile = path.join(ANALYSIS_DIR, `${sessionId}.md`)

    if (!fs.existsSync(analysisFile)) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    res.download(analysisFile, `session-analysis-${sessionId}.md`)
  } catch (error) {
    res.status(500).json({ error: 'Failed to download analysis' })
  }
})

// API: Get session analysis content
app.get('/api/session-analysis-content/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params
    const analysisFile = path.join(ANALYSIS_DIR, `${sessionId}.md`)

    if (!fs.existsSync(analysisFile)) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    const content = fs.readFileSync(analysisFile, 'utf-8')
    res.json({ content })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read analysis' })
  }
})

// API: Import session from JSON
app.post('/api/import-session', (req, res) => {
  try {
    const { projectName, sessionData } = req.body

    if (!projectName || !sessionData) {
      return res.status(400).json({ error: 'Missing project name or session data' })
    }

    // Validate session data structure
    if (!sessionData.sessionId || !Array.isArray(sessionData.messages)) {
      return res.status(400).json({ error: 'Invalid session data format' })
    }

    // Convert project name to directory format (same logic as project sessions API)
    const projectDirName = projectName
      .replace(/:\//g, '--')
      .replace(/:\//g, '--')
      .replace(/\\/g, '-')
      .replace(/\//g, '-')
      .toLowerCase()

    const projectDir = path.join(CLAUDE_DIR, 'projects', projectDirName)

    // Create project directory if not exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true })
    }

    // Always generate new sessionId to avoid conflicts
    const newSessionId = crypto.randomUUID()
    const originalSessionId = sessionData.sessionId
    const filePath = path.join(projectDir, `${newSessionId}.jsonl`)

    // Convert messages to JSONL entries (always generate new uuids)
    const entries = sessionData.messages.map((msg: {
      uuid?: string
      role: string
      content: string | Record<string, unknown>[]
      timestamp?: string
      model?: string
      usage?: { input_tokens?: number; output_tokens?: number }
    }) => {
      const entry: Record<string, unknown> = {
        type: msg.role === 'user' ? 'user' : 'assistant',
        uuid: crypto.randomUUID(), // Always generate new uuid
        timestamp: msg.timestamp || new Date().toISOString(),
      }

      if (msg.role === 'user') {
        entry.message = {
          role: 'user',
          content: msg.content
        }
      } else {
        entry.message = {
          role: 'assistant',
          content: msg.content,
          model: msg.model || 'unknown'
        }
        if (msg.usage) {
          (entry.message as Record<string, unknown>).usage = msg.usage
        }
      }

      return JSON.stringify(entry)
    })

    // Write JSONL file
    fs.writeFileSync(filePath, entries.join('\n') + '\n', 'utf-8')

    // Save to imported sessions registry
    saveImportedSession(newSessionId, originalSessionId)

    res.json({
      success: true,
      sessionId: newSessionId,
      originalSessionId,
      project: projectName
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: 'Failed to import session' })
  }
})

// API: Delete imported session
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params

    // Check if this is an imported session
    const importedSessions = readImportedSessions()
    if (!importedSessions[id]) {
      return res.status(400).json({ error: '只能删除导入的会话' })
    }

    // Find and delete the session file
    const projectsDir = path.join(CLAUDE_DIR, 'projects')
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    let deleted = false
    for (const projectDir of projectDirs) {
      const sessionFile = path.join(projectsDir, projectDir, `${id}.jsonl`)
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile)
        deleted = true
        break
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: '会话文件不存在' })
    }

    // Remove from imported sessions registry
    delete importedSessions[id]
    fs.writeFileSync(IMPORTED_SESSIONS_FILE, JSON.stringify(importedSessions, null, 2))

    // Delete associated analysis if exists
    const analysisFile = path.join(ANALYSIS_DIR, `${id}.md`)
    if (fs.existsSync(analysisFile)) {
      fs.unlinkSync(analysisFile)
    }

    // Delete description if exists
    const descriptions = readDescriptions()
    if (descriptions[id]) {
      delete descriptions[id]
      fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2))
    }

    // Delete session name if exists
    deleteSessionName(id)

    // Delete from favorites if exists
    const favorites = readFavorites()
    const favIndex = favorites.indexOf(id)
    if (favIndex > -1) {
      favorites.splice(favIndex, 1)
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
    }

    // Delete session tags if exists
    deleteSessionTags(id)

    res.json({ success: true, message: '会话已删除' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: '删除会话失败' })
  }
})

// API: Rename session
app.put('/api/sessions/:id/name', (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: '名称不能为空' })
    }

    if (name.length > 100) {
      return res.status(400).json({ error: '名称长度不能超过100个字符' })
    }

    saveSessionName(id, name.trim())
    res.json({ success: true, sessionId: id, name: name.trim() })
  } catch (error) {
    console.error('Rename error:', error)
    res.status(500).json({ error: '重命名会话失败' })
  }
})

// API: Toggle favorite session
app.post('/api/sessions/:id/favorite', (req, res) => {
  try {
    const { id } = req.params
    const isFavorite = toggleFavorite(id)
    res.json({ success: true, sessionId: id, isFavorite })
  } catch (error) {
    console.error('Favorite error:', error)
    res.status(500).json({ error: '收藏操作失败' })
  }
})

// API: Get all favorites
app.get('/api/favorites', (req, res) => {
  try {
    const favorites = readFavorites()
    res.json(favorites)
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({ error: '获取收藏列表失败' })
  }
})

// API: Get all tags (including standalone tags)
app.get('/api/tags', (req, res) => {
  try {
    const tags = getAllTagsWithStandalone()
    res.json(tags)
  } catch (error) {
    console.error('Get tags error:', error)
    res.status(500).json({ error: '获取标签列表失败' })
  }
})

// Standalone tags file for tags not yet assigned to sessions
const STANDALONE_TAGS_FILE = path.join(__dirname, 'data', 'standalone-tags.json')

function readStandaloneTags(): string[] {
  ensureDataDir()
  try {
    if (fs.existsSync(STANDALONE_TAGS_FILE)) {
      return JSON.parse(fs.readFileSync(STANDALONE_TAGS_FILE, 'utf-8'))
    }
  } catch {
    // ignore errors
  }
  return []
}

function saveStandaloneTags(tags: string[]): void {
  ensureDataDir()
  fs.writeFileSync(STANDALONE_TAGS_FILE, JSON.stringify(tags, null, 2))
}

// Override getAllTags to include standalone tags
function getAllTagsWithStandalone(): string[] {
  const sessionTags = readSessionTags()
  const standaloneTags = readStandaloneTags()
  const tagSet = new Set<string>()

  Object.values(sessionTags).forEach(tags => {
    tags.forEach(tag => tagSet.add(tag))
  })
  standaloneTags.forEach(tag => tagSet.add(tag))

  return Array.from(tagSet).sort()
}

// API: Create a new standalone tag
app.post('/api/tags', (req, res) => {
  try {
    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '标签名不能为空' })
    }

    if (name.length > 20) {
      return res.status(400).json({ error: '标签名不能超过20个字符' })
    }

    const tagName = name.trim()
    const allTags = getAllTagsWithStandalone()

    if (allTags.includes(tagName)) {
      return res.status(400).json({ error: '标签已存在' })
    }

    // Add to standalone tags
    const standaloneTags = readStandaloneTags()
    standaloneTags.push(tagName)
    saveStandaloneTags(standaloneTags)

    res.json({ success: true, name: tagName })
  } catch (error) {
    console.error('Create tag error:', error)
    res.status(500).json({ error: '创建标签失败' })
  }
})

// API: Rename a tag
app.put('/api/tags/:tagName', (req, res) => {
  try {
    const { tagName } = req.params
    const { newName } = req.body

    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return res.status(400).json({ error: '新标签名不能为空' })
    }

    if (newName.length > 20) {
      return res.status(400).json({ error: '标签名不能超过20个字符' })
    }

    const decodedTagName = decodeURIComponent(tagName)
    const trimmedNewName = newName.trim()

    // Check if new name already exists
    const allTags = getAllTagsWithStandalone()
    if (allTags.includes(trimmedNewName) && trimmedNewName !== decodedTagName) {
      return res.status(400).json({ error: '标签名已存在' })
    }

    const sessionTags = readSessionTags()
    let updatedCount = 0

    Object.keys(sessionTags).forEach(sessionId => {
      const index = sessionTags[sessionId].indexOf(decodedTagName)
      if (index > -1) {
        // Remove old tag and add new one (avoid duplicates)
        sessionTags[sessionId].splice(index, 1)
        if (!sessionTags[sessionId].includes(trimmedNewName)) {
          sessionTags[sessionId].push(trimmedNewName)
        }
        updatedCount++
      }
    })

    fs.writeFileSync(TAGS_FILE, JSON.stringify(sessionTags, null, 2))

    // Also update standalone tags
    const standaloneTags = readStandaloneTags()
    const standaloneIndex = standaloneTags.indexOf(decodedTagName)
    if (standaloneIndex > -1) {
      standaloneTags.splice(standaloneIndex, 1)
      if (!standaloneTags.includes(trimmedNewName)) {
        standaloneTags.push(trimmedNewName)
      }
      saveStandaloneTags(standaloneTags)
    }

    res.json({ success: true, oldName: decodedTagName, newName: trimmedNewName, updatedCount })
  } catch (error) {
    console.error('Rename tag error:', error)
    res.status(500).json({ error: '重命名标签失败' })
  }
})

// API: Delete a tag from all sessions
app.delete('/api/tags/:tagName', (req, res) => {
  try {
    const { tagName } = req.params
    const decodedTagName = decodeURIComponent(tagName)

    const sessionTags = readSessionTags()
    let removedCount = 0

    Object.keys(sessionTags).forEach(sessionId => {
      const index = sessionTags[sessionId].indexOf(decodedTagName)
      if (index > -1) {
        sessionTags[sessionId].splice(index, 1)
        removedCount++
        // Remove empty tag arrays
        if (sessionTags[sessionId].length === 0) {
          delete sessionTags[sessionId]
        }
      }
    })

    fs.writeFileSync(TAGS_FILE, JSON.stringify(sessionTags, null, 2))

    // Also remove from standalone tags
    const standaloneTags = readStandaloneTags()
    const standaloneIndex = standaloneTags.indexOf(decodedTagName)
    if (standaloneIndex > -1) {
      standaloneTags.splice(standaloneIndex, 1)
      saveStandaloneTags(standaloneTags)
    }

    res.json({ success: true, tagName: decodedTagName, removedCount })
  } catch (error) {
    console.error('Delete tag error:', error)
    res.status(500).json({ error: '删除标签失败' })
  }
})

// API: Update session tags (supports both PUT and POST)
const handleUpdateTags = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { tags } = req.body

    console.log('Update tags request:', { id, tags, method: req.method })

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: '标签格式错误' })
    }

    // Validate tags
    const validTags = tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.length <= 20)
      .map(tag => tag.trim())

    updateSessionTags(id, validTags)
    res.json({ success: true, sessionId: id, tags: validTags })
  } catch (error) {
    console.error('Update tags error:', error)
    res.status(500).json({ error: '更新标签失败' })
  }
}

app.put('/api/sessions/:id/tags', handleUpdateTags)
app.post('/api/sessions/:id/tags', handleUpdateTags)

// Start server - must be after all route definitions
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Claude directory: ${CLAUDE_DIR}`)
})