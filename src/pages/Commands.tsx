import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHistory } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { DataTable } from '../components/DataTable'
import { Input, Tag, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface HistoryItem {
  display: string
  timestamp: number
  project: string
  sessionId: string
}

// Extract commands from display text (only /xx and @xx patterns)
function extractCommand(display: string): string | null {
  // Match patterns like /command or @mention at the start of words
  const match = display.match(/(^|\s)(\/[\w-]+|@[\w-]+)/)
  return match ? match[2] : null
}

export default function Commands() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: history, isLoading, error, refetch } = useHistory()

  // Filter only command entries (those with / or @)
  const commandHistory = useMemo(() => {
    if (!history) return []
    return history.filter((entry: HistoryItem) => {
      const cmd = extractCommand(entry.display)
      return cmd !== null
    })
  }, [history])

  const filteredHistory = commandHistory?.filter((entry: HistoryItem) =>
    entry.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.project.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Group by command
  const commandGroups: Record<string, number> = {}
  filteredHistory.forEach((entry: HistoryItem) => {
    const cmd = extractCommand(entry.display)
    if (cmd) {
      commandGroups[cmd] = (commandGroups[cmd] || 0) + 1
    }
  })

  const topCommands = Object.entries(commandGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const columns: ColumnsType<HistoryItem> = [
    {
      title: '命令',
      dataIndex: 'display',
      key: 'display',
      width: 200,
      render: (display: string) => {
        const cmd = extractCommand(display)
        const isSlashCommand = cmd?.startsWith('/')
        const isMention = cmd?.startsWith('@')
        return (
          <div>
            <Tag color={isSlashCommand ? 'blue' : isMention ? 'purple' : 'default'}>
              {cmd}
            </Tag>
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
      render: (project: string) => (
        <Link to={`/projects/${encodeURIComponent(project)}`} className="text-indigo-600 hover:text-indigo-800 text-xs">
          {project.split(/[\\/]/).pop()}
        </Link>
      ),
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
      render: (sessionId: string) => (
        <Link to={`/sessions/${sessionId}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-mono">
          {sessionId.slice(0, 8)}...
        </Link>
      ),
    },
  ]

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">命令历史</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            共 {commandHistory.length} 条命令 (从 {history?.length || 0} 条记录中筛选)
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <Input
          placeholder="搜索命令..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      {/* Top Commands */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">命令统计 (Top 12)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {topCommands.map(([cmd, count]) => {
            const isSlashCommand = cmd.startsWith('/')
            const isMention = cmd.startsWith('@')
            return (
              <div key={cmd} className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
                <div className={`font-mono text-sm truncate ${
                  isSlashCommand ? 'text-blue-600' : isMention ? 'text-purple-600' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {cmd}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={filteredHistory}
        rowKey={(_, index) => `cmd-${index}`}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条命令` }}
        size="middle"
        bordered
        scroll={{ y: 500 }}
      />
    </div>
  )
}