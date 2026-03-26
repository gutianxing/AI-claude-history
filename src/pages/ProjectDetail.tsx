import { useParams, Link } from 'react-router-dom'
import { useProjectSessions } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface SessionItem {
  sessionId: string
  messageCount: number
  firstMessage?: string
  lastMessage?: string
  startedAt?: number
}

export default function ProjectDetail() {
  const { name } = useParams<{ name: string }>()
  const { data: sessions, isLoading, error } = useProjectSessions(name || '')

  const columns: ColumnsType<SessionItem> = [
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 200,
      render: (sessionId: string) => (
        <Link to={`/sessions/${sessionId}`} className="text-indigo-600 hover:text-indigo-800 font-mono">
          {sessionId}
        </Link>
      ),
    },
    {
      title: '首条消息',
      dataIndex: 'firstMessage',
      key: 'firstMessage',
      ellipsis: true,
      render: (firstMessage?: string) => firstMessage || '-',
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount',
      align: 'right',
      width: 100,
      sorter: (a: SessionItem, b: SessionItem) => (a.messageCount || 0) - (b.messageCount || 0),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      sorter: (a: SessionItem, b: SessionItem) => (a.startedAt || 0) - (b.startedAt || 0),
      render: (startedAt?: number) => startedAt ? format(new Date(startedAt), 'yyyy-MM-dd HH:mm') : '-',
    },
  ]

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
          ← 返回项目列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">项目: {name}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="sessionId"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个会话` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      </div>
    </div>
  )
}
