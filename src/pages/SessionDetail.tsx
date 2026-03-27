import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useSession, useActiveSessions } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Button, Modal, Spin, Card, Descriptions, Tag, Input, Tooltip } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import {
  User,
  Bot,
  Brain,
  Wrench,
  FileText,
  Target,
  Lightbulb,
  ClipboardList,
  ArrowLeft,
  Download,
  FileCode,
  Clock,
  Zap,
  FolderOpen,
  X,
} from 'lucide-react'

const MESSAGES_PER_PAGE = 10
const RECENT_MESSAGES_COUNT = 30 // For active sessions

function MessageContent({ content }: { content: string | Record<string, unknown>[] }) {
  const codeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })
    }
  }, [content])

  if (typeof content === 'string') {
    // Fold long text content
    if (content.length > 500) {
      return (
        <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
          <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            内容 ({content.length} 字符)
          </summary>
          <div ref={codeRef} className="mt-2 markdown-body prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </details>
      )
    }
    return (
      <div ref={codeRef} className="markdown-body prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  // Handle array content (tool_use, thinking, etc.)
  return (
    <div ref={codeRef} className="space-y-3">
      {content.map((block, i) => {
        const b = block as { type: string; text?: string | Record<string, unknown>; thinking?: string; name?: string; input?: Record<string, unknown>; content?: string | Record<string, unknown> }

        switch (b.type) {
          case 'text': {
            // Handle text - ensure it's a string
            const textContent = typeof b.text === 'string' ? b.text :
              (b.text && typeof b.text === 'object' ? JSON.stringify(b.text, null, 2) : '')

            if (textContent && textContent.length > 500) {
              return (
                <details key={i} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                  <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    文本内容 ({textContent.length} 字符)
                  </summary>
                  <div className="mt-2 markdown-body prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                  </div>
                </details>
              )
            }
            return (
              <div key={i} className="markdown-body prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent || ''}</ReactMarkdown>
              </div>
            )
          }
          case 'thinking':
            return (
              <details key={i} className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <summary className="cursor-pointer text-yellow-800 dark:text-yellow-300 font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  思考过程
                </summary>
                <div className="mt-2 text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">{b.thinking}</div>
              </details>
            )
          case 'tool_use':
            return (
              <details key={i} className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <summary className="cursor-pointer text-blue-800 dark:text-blue-300 font-medium flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Tool: {b.name}
                </summary>
                {b.input && (
                  <pre className="mt-2 text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(b.input, null, 2)}
                  </pre>
                )}
              </details>
            )
          case 'tool_result': {
            // Handle tool_result content - ensure it's a string
            const resultContent = typeof b.content === 'string' ? b.content :
              (b.content && typeof b.content === 'object' ? JSON.stringify(b.content, null, 2) : '')
            return (
              <details key={i} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tool Result
                </summary>
                <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-600 p-2 rounded overflow-x-auto max-h-60">
                  {resultContent}
                </pre>
              </details>
            )
          }
          default:
            // For unknown types, show as collapsible JSON
            return (
              <details key={i} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3">
                <summary className="cursor-pointer text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {b.type || '未知类型'}
                </summary>
                <pre className="mt-2 text-xs bg-gray-200 dark:bg-gray-600 p-2 rounded overflow-x-auto">
                  {JSON.stringify(block, null, 2)}
                </pre>
              </details>
            )
        }
      })}
    </div>
  )
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const fromActiveSessions = searchParams.get('from') === 'active-sessions'
  const { data: session, isLoading, error, refetch } = useSession(id || '')
  const { data: activeSessions } = useActiveSessions()
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [analysisData, setAnalysisData] = useState<{
    purpose?: string
    improvements?: string
    summary?: string
    hasAnalysis: boolean
  }>({ hasAnalysis: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null)
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Check if this session is currently active (running) or came from active-sessions page
  const isActiveSession = activeSessions?.some((s: { sessionId: string }) => s.sessionId === id) || fromActiveSessions

  // Auto refresh every 30 seconds for active sessions
  useEffect(() => {
    if (!isActiveSession) return

    const interval = setInterval(() => {
      refetch()
    }, 30 * 1000) // 30 seconds

    return () => clearInterval(interval)
  }, [isActiveSession, refetch])

  const messages = session?.messages || []

  // Helper function to extract searchable text from message content
  const extractSearchableText = (content: string | Record<string, unknown>[]): string => {
    if (typeof content === 'string') return content.toLowerCase()

    return content.map((block) => {
      const b = block as {
        type: string
        text?: string | Record<string, unknown>
        thinking?: string
        name?: string
        input?: Record<string, unknown>
        content?: string | Record<string, unknown>
      }
      switch (b.type) {
        case 'text': {
          // Handle text - could be string or object
          if (typeof b.text === 'string') return b.text
          if (b.text && typeof b.text === 'object') return JSON.stringify(b.text)
          return ''
        }
        case 'thinking':
          return b.thinking || ''
        case 'tool_use':
          return `${b.name || ''} ${b.input ? JSON.stringify(b.input) : ''}`
        case 'tool_result': {
          // Handle tool_result content - could be string or object
          if (typeof b.content === 'string') return b.content
          if (b.content && typeof b.content === 'object') return JSON.stringify(b.content)
          return ''
        }
        default:
          // For unknown types, stringify the whole block
          return JSON.stringify(block)
      }
    }).join(' ').toLowerCase()
  }

  // Find matching message indices for highlighting and navigation
  const matchingIndices = useMemo(() => {
    if (!searchTerm.trim()) return []

    const term = searchTerm.toLowerCase()
    const indices: number[] = []

    messages.forEach((msg: { content: string | Record<string, unknown>[] }, index: number) => {
      if (extractSearchableText(msg.content).includes(term)) {
        indices.push(index)
      }
    })

    return indices
  }, [messages, searchTerm])

  // Count of actual matches
  const matchCount = matchingIndices.length

  // For active sessions: show only recent messages, normal sessions: paginate from start
  const visibleMessages = isActiveSession
    ? messages.slice(-RECENT_MESSAGES_COUNT)
    : messages.slice(0, visibleCount)
  const hasMore = !isActiveSession && visibleCount < messages.length

  // Ensure target message is visible when navigating
  useEffect(() => {
    if (pendingScrollIndex !== null && !isActiveSession && pendingScrollIndex >= visibleCount) {
      setVisibleCount(pendingScrollIndex + MESSAGES_PER_PAGE)
    }
  }, [pendingScrollIndex, isActiveSession, visibleCount])

  // Fetch analysis data
  useEffect(() => {
    if (id) {
      fetch(`/api/session-analysis-content/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.content) {
            // Parse the markdown content
            const purposeMatch = data.content.match(/## 主要目的\s*([\s\S]*?)(?=##|$)/)
            const improvementsMatch = data.content.match(/## 需要改进的地方\s*([\s\S]*?)(?=##|$)/)
            const summaryMatch = data.content.match(/## 详细总结\s*([\s\S]*?)(?=##|$)/)

            setAnalysisData({
              purpose: purposeMatch?.[1]?.trim(),
              improvements: improvementsMatch?.[1]?.trim(),
              summary: summaryMatch?.[1]?.trim(),
              hasAnalysis: true
            })
          }
        })
        .catch(() => {
          setAnalysisData({ hasAnalysis: false })
        })
    }
  }, [id])

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => Math.min(prev + MESSAGES_PER_PAGE, messages.length))
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, messages.length])

  // Reset visible count when session changes
  useEffect(() => {
    setVisibleCount(MESSAGES_PER_PAGE)
  }, [id])

  // Scroll to bottom for active sessions
  useEffect(() => {
    if (isActiveSession && scrollContainerRef.current && visibleMessages.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [isActiveSession, visibleMessages.length])

  // Scroll to pending message after it's loaded
  useEffect(() => {
    if (pendingScrollIndex !== null && messageRefs.current.has(pendingScrollIndex)) {
      scrollToMessage(pendingScrollIndex)
      setPendingScrollIndex(null)
    }
  }, [pendingScrollIndex, visibleCount])

  // Scroll to first match when search term changes
  useEffect(() => {
    if (matchingIndices.length > 0) {
      setCurrentMatchIndex(0)
      const targetIndex = matchingIndices[0]
      // Check if message is already rendered
      if (messageRefs.current.has(targetIndex)) {
        scrollToMessage(targetIndex)
      } else {
        // Will scroll after it's loaded
        setPendingScrollIndex(targetIndex)
      }
    }
  }, [searchTerm])

  // Scroll to a specific message by index
  const scrollToMessage = (messageIndex: number) => {
    const messageElement = messageRefs.current.get(messageIndex)
    if (messageElement && scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect()
      const messageRect = messageElement.getBoundingClientRect()
      const scrollTop = scrollContainerRef.current.scrollTop + messageRect.top - containerRect.top - 20

      scrollContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  // Navigate to next match
  const goToNextMatch = () => {
    if (matchingIndices.length === 0) return
    const nextIndex = (currentMatchIndex + 1) % matchingIndices.length
    setCurrentMatchIndex(nextIndex)
    const targetIndex = matchingIndices[nextIndex]
    if (messageRefs.current.has(targetIndex)) {
      scrollToMessage(targetIndex)
    } else {
      setPendingScrollIndex(targetIndex)
    }
  }

  // Navigate to previous match
  const goToPrevMatch = () => {
    if (matchingIndices.length === 0) return
    const prevIndex = currentMatchIndex === 0 ? matchingIndices.length - 1 : currentMatchIndex - 1
    setCurrentMatchIndex(prevIndex)
    const targetIndex = matchingIndices[prevIndex]
    if (messageRefs.current.has(targetIndex)) {
      scrollToMessage(targetIndex)
    } else {
      setPendingScrollIndex(targetIndex)
    }
  }

  const handleSummarize = async () => {
    if (!session?.messages) return

    setSummaryModalOpen(true)
    setSummarizing(true)
    setSummary('')

    try {
      const res = await fetch('/api/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          messages: session.messages
        })
      })

      if (!res.ok) throw new Error('Failed to summarize')

      const data = await res.json()
      setSummary(data.summary)

      // Refresh analysis data
      if (data.purpose || data.improvements) {
        setAnalysisData({
          purpose: data.purpose,
          improvements: data.improvements,
          summary: data.summary,
          hasAnalysis: true
        })
      }
    } catch {
      setSummary('总结失败，请稍后重试')
    } finally {
      setSummarizing(false)
    }
  }

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px - 48px)' }}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to={isActiveSession ? "/active-sessions" : "/sessions"}
            className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isActiveSession ? '返回运行中窗口' : '返回会话列表'}
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {session?.sessionName || '会话详情'}
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Session ID: <code className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{id}</code>
          </div>
          {session?.project && (
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <FolderOpen className="w-4 h-4" />
              项目: {session.project}
            </div>
          )}
        </div>

        {/* Export Buttons - only for completed sessions */}
        {!isActiveSession && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => {
                const data = JSON.stringify(session, null, 2)
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `session-${id}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出 JSON
            </button>
            <button
              onClick={() => {
                let md = `# 会话 ${id}\n\n`
                messages.forEach((msg: { role: string; content: string | Record<string, unknown>[]; timestamp?: string; model?: string }) => {
                  const role = msg.role === 'user' ? '用户' : '助手'
                  md += `## ${role}\n`
                  if (msg.timestamp) {
                    md += `_${format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss')}_\n\n`
                  }
                  if (msg.model) {
                    md += `**Model:** ${msg.model}\n\n`
                  }
                  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)
                  md += `${content}\n\n---\n\n`
                })
                const blob = new Blob([md], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `session-${id}.md`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              导出 Markdown
            </button>
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <Bot className="w-4 h-4" />
              {summarizing ? '总结中...' : 'AI 总结'}
            </button>
            {analysisData.hasAnalysis && (
              <button
                onClick={() => window.open(`/api/session-analysis/${id}`, '_blank')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                下载分析报告
              </button>
            )}
          </div>
        )}

        {/* Active session indicator */}
        {isActiveSession && (
          <div className="mt-4">
            <Tag color="green">运行中会话</Tag>
          </div>
        )}

        {/* Search Box */}
        <div className="mt-4">
          <div className="relative">
            <Input
              placeholder="搜索消息内容..."
              prefix={<SearchOutlined className="text-gray-400" />}
              suffix={
                searchTerm ? (
                  <div className="flex items-center gap-2">
                    {matchCount > 0 && (
                      <span className="text-sm text-gray-500">
                        {currentMatchIndex + 1}/{matchCount}
                      </span>
                    )}
                    <button
                      onClick={goToPrevMatch}
                      disabled={matchCount === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={goToNextMatch}
                      disabled={matchCount === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setVisibleCount(MESSAGES_PER_PAGE) // Reset pagination when searching
              }}
              allowClear
              className="w-full"
            />
            {searchTerm && matchCount === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                未找到匹配 "{searchTerm}" 的消息
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto mt-4">
        {/* AI Analysis Card */}
        {analysisData.hasAnalysis && !isActiveSession && (
          <div className="mb-4">
            <Card
              title={
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-500" />
                  AI 会话分析
                </span>
              }
              className="shadow-md"
              extra={
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(`/api/session-analysis/${id}`, '_blank')}
                >
                  下载完整报告
                </Button>
              }
            >
              <Descriptions column={1} bordered size="small">
                {analysisData.purpose && (
                  <Descriptions.Item label={<span className="flex items-center gap-1"><Target className="w-4 h-4 text-blue-500" /> 主要目的</span>}>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.purpose}</ReactMarkdown>
                    </div>
                  </Descriptions.Item>
                )}
                {analysisData.improvements && (
                  <Descriptions.Item label={<span className="flex items-center gap-1"><Lightbulb className="w-4 h-4 text-orange-500" /> 改进建议</span>}>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.improvements}</ReactMarkdown>
                    </div>
                  </Descriptions.Item>
                )}
                {analysisData.summary && (
                  <Descriptions.Item label={<span className="flex items-center gap-1"><ClipboardList className="w-4 h-4 text-green-500" /> 详细总结</span>}>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.summary}</ReactMarkdown>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {visibleMessages.map((msg: {
            uuid: string
            role: string
            content: string | Record<string, unknown>[]
            timestamp?: string
            model?: string
            usage?: { input_tokens?: number; output_tokens?: number }
          }, index: number) => {
            const actualIndex = isActiveSession
              ? messages.length - visibleMessages.length + index
              : index
            const isMatch = matchingIndices.includes(actualIndex)
            const isCurrentMatch = matchingIndices[currentMatchIndex] === actualIndex

            return (
              <div
                key={msg.uuid || index}
                ref={(el) => {
                  if (el) messageRefs.current.set(actualIndex, el)
                }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${
                  isCurrentMatch ? 'ring-2 ring-yellow-400 rounded-lg' : ''
                } ${isMatch ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
              >
              {msg.role !== 'user' && (
                <div className="message-avatar bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'message-user' : 'message-assistant'} p-4`}>
                <div className="flex justify-between items-center gap-4 mb-2">
                  <div className="font-semibold flex items-center gap-2">
                    {msg.role === 'user' ? (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        用户
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Bot className="w-4 h-4" />
                        助手
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs opacity-70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp && format(new Date(msg.timestamp), 'HH:mm:ss')}
                  </div>
                </div>
                {msg.model && (
                  <div className="text-xs mb-2 px-2 py-1 rounded inline-block bg-black/10">
                    {msg.model}
                  </div>
                )}
                <MessageContent content={msg.content} />
                {msg.usage && ((msg.usage.input_tokens || 0) > 0 || (msg.usage.output_tokens || 0) > 0) && (
                  <div className="mt-3 pt-2 border-t border-black/10 text-xs opacity-70 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Tokens: {msg.usage.input_tokens || 0} in
                    {(msg.usage.output_tokens || 0) > 0 && ` / ${msg.usage.output_tokens || 0} out`}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="message-avatar bg-white/20 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
            )
          })}

          {/* Load more trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Spin size="small" />
                <span>加载更多... ({visibleCount}/{messages.length})</span>
              </div>
            </div>
          )}

          {/* All loaded indicator */}
          {!hasMore && messages.length > MESSAGES_PER_PAGE && !isActiveSession && (
            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">
              已加载全部 {messages.length} 条消息
            </div>
          )}

          {/* Active session message count indicator */}
          {isActiveSession && messages.length > RECENT_MESSAGES_COUNT && (
            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">
              显示最近 {RECENT_MESSAGES_COUNT} 条消息 (共 {messages.length} 条)
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      <Modal
        title="会话总结"
        open={summaryModalOpen}
        onCancel={() => setSummaryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSummaryModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {summarizing ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4 text-gray-500 dark:text-gray-400">正在生成总结...</div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        )}
      </Modal>
    </div>
  )
}