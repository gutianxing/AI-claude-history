import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveSessions } from '../hooks/useClaudeData'
import { DataTable } from '../components/DataTable'
import { Tag, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { Activity, Cpu, Terminal, Monitor, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { ColumnsType } from 'antd/es/table'

interface ActiveSession {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind: string
}

export default function ActiveSessions() {
  const { data: activeSessions, isLoading, error, refetch } = useActiveSessions()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
      setLastRefresh(new Date())
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [refetch])

  // Manual refresh handler
  const handleRefresh = () => {
    refetch()
    setLastRefresh(new Date())
  }

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  const columns: ColumnsType<ActiveSession> = [
    {
      title: 'PID',
      dataIndex: 'pid',
      key: 'pid',
      width: 80,
      render: (pid: number) => <Tag color="blue">{pid}</Tag>,
    },
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 280,
      render: (sessionId: string) => (
        <Link
          to={`/sessions/${sessionId}?from=active-sessions`}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-xs"
        >
          {sessionId}
        </Link>
      ),
    },
    {
      title: '工作目录',
      dataIndex: 'cwd',
      key: 'cwd',
      ellipsis: true,
      render: (cwd: string) => <code className="text-xs text-gray-600">{cwd}</code>,
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      width: 100,
      render: (kind: string) => (
        <Tag color={kind === 'interactive' ? 'green' : 'orange'}>{kind}</Tag>
      ),
    },
    {
      title: '启动时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (startedAt: number) => format(new Date(startedAt), 'yyyy-MM-dd HH:mm:ss'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">运行中窗口</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              每 5 分钟自动刷新，共 {activeSessions?.length || 0} 个窗口正在运行
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            上次刷新: {format(lastRefresh, 'HH:mm:ss')}
          </span>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
            className="bg-green-600 hover:bg-green-700 border-green-600"
          >
            刷新
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Monitor className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">运行中窗口</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{activeSessions?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <Terminal className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">交互式会话</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {activeSessions?.filter((s: ActiveSession) => s.kind === 'interactive').length || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">其他类型</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {activeSessions?.filter((s: ActiveSession) => s.kind !== 'interactive').length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          title="窗口列表"
          columns={columns}
          dataSource={activeSessions || []}
          rowKey="pid"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个窗口` }}
          size="middle"
          bordered={false}
          scroll={{ y: 500 }}
        />
      </div>
    </div>
  )
}