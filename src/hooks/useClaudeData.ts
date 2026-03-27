import { useQuery } from '@tanstack/react-query'
import type { MessagesResponse, MessagesParams, SessionItem, ProjectItem, HistoryEntry } from '../types'

const API_BASE = '/api'

// Fetch history
export function useHistory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/history`)
      if (!res.ok) throw new Error('Failed to fetch history')
      return res.json() as Promise<HistoryEntry[]>
    },
    enabled: options?.enabled ?? true,
  })
}

// Fetch projects
export function useProjects(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/projects`)
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json() as Promise<ProjectItem[]>
    },
    enabled: options?.enabled ?? true,
  })
}

// Fetch project sessions
export function useProjectSessions(projectName: string) {
  return useQuery({
    queryKey: ['projects', projectName, 'sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/sessions`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      return res.json()
    },
    enabled: !!projectName,
  })
}

// Fetch session detail
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Failed to fetch session')
      return res.json()
    },
    enabled: !!sessionId,
  })
}

// Fetch config
export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/config`)
      if (!res.ok) throw new Error('Failed to fetch config')
      return res.json()
    },
  })
}

// Fetch MCP servers
export function useMcpServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/mcp-servers`)
      if (!res.ok) throw new Error('Failed to fetch MCP servers')
      return res.json()
    },
  })
}

// Fetch agents
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    },
  })
}

// Fetch skills
export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/skills`)
      if (!res.ok) throw new Error('Failed to fetch skills')
      return res.json()
    },
  })
}

// Fetch stats
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })
}

// Fetch all messages with pagination
export function useAllMessages(params: MessagesParams = {}) {
  const { page = 1, pageSize = 20, search = '', role = 'all' } = params

  return useQuery({
    queryKey: ['all-messages', page, pageSize, search, role],
    queryFn: async (): Promise<MessagesResponse> => {
      const queryParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        role
      })
      const res = await fetch(`${API_BASE}/all-messages?${queryParams}`)
      if (!res.ok) throw new Error('Failed to fetch all messages')
      return res.json()
    },
    placeholderData: (previousData) => previousData,
  })
}

// Fetch all sessions
export function useAllSessions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/all-sessions`)
      if (!res.ok) throw new Error('Failed to fetch all sessions')
      return res.json() as Promise<SessionItem[]>
    },
    enabled: options?.enabled ?? true,
    staleTime: 0, // Always refetch when requested
  })
}

// Fetch active sessions (running Claude Code windows)
export function useActiveSessions() {
  return useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/active-sessions`)
      if (!res.ok) throw new Error('Failed to fetch active sessions')
      return res.json()
    },
  })
}