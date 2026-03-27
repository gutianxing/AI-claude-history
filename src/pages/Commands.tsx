import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHistory } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { DataTable } from '../components/DataTable'
import { Input, Tag, Button, Collapse } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { Terminal, Clock, FolderOpen, Hash } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { HistoryEntry } from '../types'
import { getProjectName, truncateSessionId } from '../utils'

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
    return history.filter((entry) => {
      const cmd = extractCommand(entry.display)
      return cmd !== null
    })
  }, [history])

  const filteredHistory = commandHistory?.filter((entry) =>
    entry.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.project.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Group by command
  const commandGroups: Record<string, number> = {}
  filteredHistory.forEach((entry) => {
    const cmd = extractCommand(entry.display)
    if (cmd) {
      commandGroups[cmd] = (commandGroups[cmd] || 0) + 1
    }
  })

  const topCommands = Object.entries(commandGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const columns: ColumnsType<HistoryEntry> = [
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
          <div className="flex items-center gap-2">
            <Tag color={isSlashCommand ? 'blue' : isMention ? 'purple' : 'default'}>
              {cmd}
            </Tag>
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{display}</span>
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
        <Link
          to={`/projects/${encodeURIComponent(project)}`}
          className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors"
        >
          <FolderOpen className="w-3 h-3" />
          {getProjectName(project)}
        </Link>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: number) => (
        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
          <Clock className="w-3 h-3" />
          {format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')}
        </span>
      ),
    },
    {
      title: '会话',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 120,
      render: (sessionId: string) => (
        <Link
          to={`/sessions/${sessionId}`}
          className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs font-mono transition-colors"
        >
          {truncateSessionId(sessionId)}
        </Link>
      ),
    },
  ]

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Terminal className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">命令历史</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              共 {commandHistory.length} 条命令 (从 {history?.length || 0} 条记录中筛选)
            </p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          刷新
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
        <Input
          placeholder="搜索命令..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      {/* Top Commands */}
      <Collapse
        className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden"
        items={[
          {
            key: '1',
            label: (
              <span className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-green-500" />
                命令统计 (Top 12)
              </span>
            ),
            children: (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {topCommands.map(([cmd, count]) => {
                  const isSlashCommand = cmd.startsWith('/')
                  const isMention = cmd.startsWith('@')
                  return (
                    <div
                      key={cmd}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600"
                    >
                      <div className={`font-mono text-sm truncate ${
                        isSlashCommand ? 'text-blue-600 dark:text-blue-400' :
                        isMention ? 'text-purple-600 dark:text-purple-400' :
                        'text-slate-600 dark:text-slate-300'
                      }`}>
                        {cmd}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{count}</div>
                    </div>
                  )
                })}
              </div>
            ),
          },
        ]}
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          columns={columns}
          dataSource={filteredHistory}
          rowKey={(_, index) => `cmd-${index}`}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条命令` }}
          size="middle"
          bordered={false}
          scroll={{ x: 800, y: 'calc(100vh - 450px)' }}
        />
      </div>
    </div>
  )
}