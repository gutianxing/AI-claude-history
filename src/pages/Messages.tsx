import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAllMessages, useAllSessions, useHistory, useProjects } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { DataTable } from '../components/DataTable'
import { Input, Tag, Tabs, Button, Drawer } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

interface ContentBlock {
  type: string
  text?: string
  thinking?: string
  name?: string
  input?: Record<string, unknown>
  content?: string | Record<string, unknown>
}

interface MessageItem {
  uuid: string
  role: string
  content: string
  contentBlocks?: ContentBlock[]
  sessionId: string
  project: string
  timestamp?: string
  model?: string
}

interface SessionItem {
  sessionId: string
  project: string
  messageCount: number
  firstMessage?: string
  startedAt?: number
}

interface HistoryItem {
  display: string
  timestamp: number
  project: string
  sessionId: string
}

interface ProjectItem {
  name: string
  path: string
  sessionCount: number
  lastActivity?: string
}

export default function Messages() {
  const [activeTab, setActiveTab] = useState('messages')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)

  // Pagination state for messages
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })

  const { data: messagesData, isLoading: loadingMessages, isFetching: fetchingMessages, refetch: refetchMessages } = useAllMessages({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: searchTerm,
    role: roleFilter
  })
  const { data: sessions, isLoading: loadingSessions, error: errorSessions, refetch: refetchSessions } = useAllSessions()
  const { data: history, isLoading: loadingHistory, error: errorHistory, refetch: refetchHistory } = useHistory()
  const { data: projects, isLoading: loadingProjects, error: errorProjects, refetch: refetchProjects } = useProjects()

  const handleRefresh = () => {
    refetchMessages()
    refetchSessions()
    refetchHistory()
    refetchProjects()
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
        <div className="truncate text-gray-700 dark:text-gray-300" title={content}>
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
              <span key={index} className="text-gray-700 dark:text-gray-300 truncate" title={block.text}>
                {text}
              </span>
            )
          }
          if (block.type === 'thinking') {
            return (
              <Tag
                key={index}
                color="orange"
                className="cursor-pointer hover:opacity-80 flex-shrink-0"
                onClick={() => handleBlockClick(block)}
              >
                💭 思考过程
              </Tag>
            )
          }
          if (block.type === 'tool_use') {
            return (
              <Tag
                key={index}
                color="blue"
                className="cursor-pointer hover:opacity-80 flex-shrink-0"
                onClick={() => handleBlockClick(block)}
              >
                🔧 {block.name || '工具调用'}
              </Tag>
            )
          }
          if (block.type === 'tool_result') {
            return (
              <Tag
                key={index}
                color="green"
                className="cursor-pointer hover:opacity-80 flex-shrink-0"
                onClick={() => handleBlockClick(block)}
              >
                📋 工具结果
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
        <Tag color={role === 'user' ? 'blue' : 'green'}>
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
        <Link to={`/sessions/${sessionId}`} className="text-indigo-600 hover:text-indigo-800 font-mono text-xs">
          {sessionId.slice(0, 8)}...
        </Link>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 120,
      render: (project: string) => <span className="text-xs text-gray-500 dark:text-gray-400">{project.split(/[\\/]/).pop()}</span>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model?: string) => model ? <span className="text-xs text-indigo-600">{model}</span> : '-',
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp?: string) => timestamp ? format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss') : '-',
    },
  ]

  // Sessions Tab
  const filteredSessions = sessions?.filter((s: SessionItem) =>
    !searchTerm ||
    s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.firstMessage && s.firstMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

  const sessionColumns: ColumnsType<SessionItem> = [
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 150,
      render: (sessionId: string) => (
        <Link to={`/sessions/${sessionId}`} className="text-indigo-600 hover:text-indigo-800 font-mono">
          {sessionId.slice(0, 8)}...
        </Link>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 150,
      render: (project: string) => project.split(/[\\/]/).pop(),
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
  const filteredHistory = history?.filter((entry: HistoryItem) =>
    !searchTerm ||
    entry.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.project.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
      render: (project: string) => <span className="text-xs text-gray-500 dark:text-gray-400">{project.split(/[\\/]/).pop()}</span>,
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
      render: (sessionId: string) => <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{sessionId.slice(0, 8)}...</span>,
    },
  ]

  // Projects Tab
  const filteredProjects = projects?.filter((p: ProjectItem) =>
    !searchTerm ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.path.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'sessions',
      label: `会话 (${sessions?.length || 0})`,
      children: (
        <DataTable
          columns={sessionColumns}
          dataSource={filteredSessions}
          rowKey="sessionId"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个会话` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'commands',
      label: `命令 (${history?.length || 0})`,
      children: (
        <DataTable
          columns={commandColumns}
          dataSource={filteredHistory}
          rowKey={(_, index) => `cmd-${index}`}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条命令` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'projects',
      label: `项目 (${projects?.length || 0})`,
      children: (
        <DataTable
          columns={projectColumns}
          dataSource={filteredProjects}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个项目` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
  ]

  const isLoading = loadingSessions || loadingHistory || loadingProjects
  const error = errorSessions || errorHistory || errorProjects

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error?.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据浏览</h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
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
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => handleRoleFilterChange('user')}
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              用户
            </button>
            <button
              onClick={() => handleRoleFilterChange('assistant')}
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === 'assistant'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              助手
            </button>
          </div>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Drawer
        title={
          selectedBlock?.type === 'thinking' ? '💭 思考过程' :
          selectedBlock?.type === 'tool_use' ? `🔧 工具调用: ${selectedBlock.name}` :
          '📋 工具结果'
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
                  <code className="text-sm">{selectedBlock.name || 'unknown'}</code>
                </div>
                {selectedBlock.input && (
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">输入参数</div>
                    <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-auto max-h-96">
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
                    <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                      {selectedBlock.content}
                    </pre>
                  ) : (
                    <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-auto max-h-96">
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