import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAllMessages, useAllSessions, useHistory, useProjects, useStats } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { DataTable } from '../components/DataTable'
import { Input, Tag, Tabs, Button, Drawer, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { MessagesSquare, User, Bot, Wrench, FileText, Brain, Clock, FolderOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { ContentBlock, MessageItem, SessionItem, ProjectItem, HistoryEntry } from '../types'
import { getProjectName, truncateSessionId } from '../utils'

type HistoryItem = HistoryEntry

export default function Messages() {
  const [activeTab, setActiveTab] = useState('messages')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)

  // Track which tabs have been visited (for lazy loading)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['messages']))

  // Pagination state for messages
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })

  // Fetch stats for count display (lightweight)
  const { data: stats } = useStats()

  // Only fetch messages on initial load (it's paginated)
  const { data: messagesData, isLoading: loadingMessages, isFetching: fetchingMessages, refetch: refetchMessages } = useAllMessages({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: searchTerm,
    role: roleFilter
  })

  // Lazy load other data - only fetch when tab is visited
  const { data: sessions, isLoading: loadingSessions, refetch: refetchSessions } = useAllSessions({
    enabled: visitedTabs.has('sessions')
  })
  const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useHistory({
    enabled: visitedTabs.has('commands')
  })
  const { data: projects, isLoading: loadingProjects, refetch: refetchProjects } = useProjects({
    enabled: visitedTabs.has('projects')
  })

  // Get counts from stats or loaded data
  const sessionCount = sessions?.length ?? stats?.totalSessions ?? 0
  const historyCount = history?.length ?? stats?.totalCommands ?? 0
  const projectCount = projects?.length ?? stats?.totalProjects ?? 0

  // Mark tab as visited when switched
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setVisitedTabs(prev => new Set(prev).add(key))
  }

  const handleRefresh = () => {
    refetchMessages()
    if (visitedTabs.has('sessions')) refetchSessions()
    if (visitedTabs.has('commands')) refetchHistory()
    if (visitedTabs.has('projects')) refetchProjects()
  }

  // Handle table pagination change
  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20
    })
  }

  // Reset pagination when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRoleFilterChange = (role: 'all' | 'user' | 'assistant') => {
    setRoleFilter(role)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleBlockClick = (block: ContentBlock) => {
    setSelectedBlock(block)
    setDrawerOpen(true)
  }

  // Render content with clickable blocks
  const renderContent = (content: string, contentBlocks?: ContentBlock[]) => {
    if (!contentBlocks || contentBlocks.length === 0) {
      return (
        <div className="truncate text-slate-700 dark:text-slate-300" title={content}>
          {content}
        </div>
      )
    }

    return (
      <div className="flex flex-wrap gap-1 items-center overflow-hidden">
        {contentBlocks.map((block, index) => {
          if (block.type === 'text' && block.text) {
            const text = block.text.length > 80 ? block.text.slice(0, 80) + '...' : block.text
            return (
              <span key={index} className="text-slate-700 dark:text-slate-300 truncate" title={block.text}>
                {text}
              </span>
            )
          }
          if (block.type === 'thinking') {
            return (
              <Tag
                key={index}
                color="orange"
                className="cursor-pointer hover:opacity-80 flex-shrink-0 flex items-center gap-1"
                onClick={() => handleBlockClick(block)}
              >
                <Brain className="w-3 h-3" />
                思考过程
              </Tag>
            )
          }
          if (block.type === 'tool_use') {
            return (
              <Tag
                key={index}
                color="blue"
                className="cursor-pointer hover:opacity-80 flex-shrink-0 flex items-center gap-1"
                onClick={() => handleBlockClick(block)}
              >
                <Wrench className="w-3 h-3" />
                {block.name || '工具调用'}
              </Tag>
            )
          }
          if (block.type === 'tool_result') {
            return (
              <Tag
                key={index}
                color="green"
                className="cursor-pointer hover:opacity-80 flex-shrink-0 flex items-center gap-1"
                onClick={() => handleBlockClick(block)}
              >
                <FileText className="w-3 h-3" />
                工具结果
              </Tag>
            )
          }
          return null
        })}
      </div>
    )
  }

  // Messages Tab
  const messageColumns: ColumnsType<MessageItem> = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role: string) => (
        <Tag color={role === 'user' ? 'blue' : 'green'} className="flex items-center gap-1">
          {role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
          {role === 'user' ? '用户' : '助手'}
        </Tag>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 400,
      render: (content: string, record: MessageItem) => renderContent(content, record.contentBlocks),
    },
    {
      title: '会话',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 120,
      render: (sessionId: string) => (
        <Link
          to={`/sessions/${sessionId}`}
          className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 font-mono text-xs transition-colors"
        >
          {truncateSessionId(sessionId)}
        </Link>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 120,
      render: (project: string) => (
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <FolderOpen className="w-3 h-3" />
          {getProjectName(project)}
        </span>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model?: string) => model ? (
        <span className="text-xs text-green-600 dark:text-green-400 font-mono">{model}</span>
      ) : '-',
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp?: string) => timestamp ? (
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3 h-3" />
          {format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')}
        </span>
      ) : '-',
    },
  ]

  // Sessions Tab
  const filteredSessions = useMemo(() => {
    if (!sessions) return []
    return sessions.filter((s: SessionItem) =>
      !searchTerm ||
      s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.firstMessage && s.firstMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [sessions, searchTerm])

  const sessionColumns: ColumnsType<SessionItem> = [
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 150,
      render: (sessionId: string) => (
        <Link to={`/sessions/${sessionId}`} className="text-indigo-600 hover:text-indigo-800 font-mono">
          {truncateSessionId(sessionId)}
        </Link>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 150,
      render: (project: string) => getProjectName(project),
    },
    {
      title: '首条消息',
      dataIndex: 'firstMessage',
      key: 'firstMessage',
      ellipsis: true,
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount',
      align: 'right',
      width: 100,
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 150,
      render: (startedAt?: number) => startedAt ? format(new Date(startedAt), 'yyyy-MM-dd HH:mm') : '-',
    },
  ]

  // Commands Tab
  const filteredHistory = useMemo(() => {
    if (!history) return []
    return history.filter((entry: HistoryItem) =>
      !searchTerm ||
      entry.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.project.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [history, searchTerm])

  const commandColumns: ColumnsType<HistoryItem> = [
    {
      title: '命令',
      dataIndex: 'display',
      key: 'display',
      render: (display: string) => {
        const cmd = display.split(' ')[0]
        return (
          <div>
            <Tag color="blue">{cmd}</Tag>
            <span className="text-sm text-gray-600 ml-2">{display}</span>
          </div>
        )
      },
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 150,
      render: (project: string) => <span className="text-xs text-gray-500 dark:text-gray-400">{getProjectName(project)}</span>,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: number) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      title: '会话',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 120,
      render: (sessionId: string) => <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{truncateSessionId(sessionId)}</span>,
    },
  ]

  // Projects Tab
  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter((p: ProjectItem) =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.path.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  const projectColumns: ColumnsType<ProjectItem> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Link to={`/projects/${encodeURIComponent(name)}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
          {name}
        </Link>
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: '会话数',
      dataIndex: 'sessionCount',
      key: 'sessionCount',
      align: 'right',
      width: 100,
    },
    {
      title: '最后活动',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 180,
      render: (lastActivity?: string) => lastActivity ? new Date(lastActivity).toLocaleString('zh-CN') : '-',
    },
  ]

  // Loading spinner for lazy-loaded tabs
  const renderTabContent = (content: React.ReactNode, isLoading: boolean, hasData: boolean) => {
    if (isLoading && !hasData) {
      return (
        <div className="text-center py-10">
          <Spin size="large" />
          <div className="mt-2 text-gray-500">加载中...</div>
        </div>
      )
    }
    return content
  }

  const tabItems = [
    {
      key: 'messages',
      label: `消息 (${messagesData?.total || 0})`,
      children: (
        <DataTable
          columns={messageColumns}
          dataSource={messagesData?.data || []}
          rowKey="uuid"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: messagesData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条消息`,
          }}
          onChange={handleTableChange}
          loading={loadingMessages || fetchingMessages}
          size="middle"
          bordered
          scroll={{ x: 1000, y: 'calc(100vh - 400px)' }}
        />
      ),
    },
    {
      key: 'sessions',
      label: `会话 (${sessionCount})`,
      children: renderTabContent(
        <DataTable
          columns={sessionColumns}
          dataSource={filteredSessions}
          rowKey="sessionId"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个会话` }}
          size="middle"
          bordered
          scroll={{ x: 800, y: 'calc(100vh - 400px)' }}
        />,
        loadingSessions,
        !!sessions
      ),
    },
    {
      key: 'commands',
      label: `命令 (${historyCount})`,
      children: renderTabContent(
        <DataTable
          columns={commandColumns}
          dataSource={filteredHistory}
          rowKey={(_, index) => `cmd-${index}`}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条命令` }}
          size="middle"
          bordered
          scroll={{ x: 800, y: 'calc(100vh - 400px)' }}
        />,
        loadingHistory,
        !!history
      ),
    },
    {
      key: 'projects',
      label: `项目 (${projectCount})`,
      children: renderTabContent(
        <DataTable
          columns={projectColumns}
          dataSource={filteredProjects}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个项目` }}
          size="middle"
          bordered
          scroll={{ x: 800, y: 'calc(100vh - 400px)' }}
        />,
        loadingProjects,
        !!projects
      ),
    },
  ]

  if (loadingMessages) return <div className="text-center py-10">加载中...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <MessagesSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">数据浏览</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">浏览消息、会话、命令和项目</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loadingMessages || fetchingMessages}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          刷新
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <Input
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
          />
        </div>
        {activeTab === 'messages' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRoleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                roleFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => handleRoleFilterChange('user')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                roleFilter === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              用户
            </button>
            <button
              onClick={() => handleRoleFilterChange('assistant')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                roleFilter === 'assistant'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              助手
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="px-4 pt-2"
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            {selectedBlock?.type === 'thinking' ? (
              <>
                <Brain className="w-5 h-5 text-orange-500" />
                思考过程
              </>
            ) : selectedBlock?.type === 'tool_use' ? (
              <>
                <Wrench className="w-5 h-5 text-blue-500" />
                工具调用: {selectedBlock.name}
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 text-green-500" />
                工具结果
              </>
            )}
          </div>
        }
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedBlock && (
          <div className="space-y-4">
            {selectedBlock.type === 'thinking' && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-2">思考内容</div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedBlock.thinking || '无内容'}</ReactMarkdown>
                </div>
              </div>
            )}

            {selectedBlock.type === 'tool_use' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">工具名称</div>
                  <code className="text-sm text-slate-700 dark:text-slate-300">{selectedBlock.name || 'unknown'}</code>
                </div>
                {selectedBlock.input && (
                  <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-2">输入参数</div>
                    <pre className="text-xs bg-slate-800 text-slate-100 p-3 rounded overflow-auto max-h-96">
                      {JSON.stringify(selectedBlock.input, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {selectedBlock.type === 'tool_result' && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">结果内容</div>
                <div className="prose prose-sm max-w-none">
                  {typeof selectedBlock.content === 'string' ? (
                    <pre className="text-xs bg-slate-800 text-slate-100 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                      {selectedBlock.content}
                    </pre>
                  ) : (
                    <pre className="text-xs bg-slate-800 text-slate-100 p-3 rounded overflow-auto max-h-96">
                      {JSON.stringify(selectedBlock.content, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}