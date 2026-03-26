import { Link } from 'react-router-dom'
import { Tag, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useStats } from '../hooks/useClaudeData'
import { DataTable } from '../components/DataTable'
import type { ColumnsType } from 'antd/es/table'

interface CommandItem {
  command: string
  count: number
}

interface ModelItem {
  model: string
  count: number
}

export default function Stats() {
  const { data: stats, isLoading, error, refetch } = useStats()

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  const commandColumns: ColumnsType<CommandItem> = [
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
      render: (command: string) => <Tag color="blue">{command}</Tag>,
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (count: number) => `${count} 次`,
    },
  ]

  const modelColumns: ColumnsType<ModelItem> = [
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (count: number) => `${count} 次`,
    },
  ]

  const modelData: ModelItem[] = Object.entries(stats?.modelUsage || {}).map(([model, count]) => ({
    model,
    count: count as number,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claude Code 对话历史查看器</h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/projects" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">项目总数</div>
          <div className="text-3xl font-bold text-indigo-600">{stats?.totalProjects || 0}</div>
        </Link>
        <Link to="/sessions" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">会话总数</div>
          <div className="text-3xl font-bold text-green-600">{stats?.totalSessions || 0}</div>
        </Link>
        <Link to="/messages" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">消息总数</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.totalMessages || 0}</div>
        </Link>
        <Link to="/commands" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">命令总数</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.totalCommands || 0}</div>
        </Link>
      </div>

      {/* Top Commands */}
      <DataTable
        title="常用命令"
        columns={commandColumns}
        dataSource={stats?.topCommands || []}
        rowKey="command"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        size="middle"
        bordered
        scroll={{ y: 500 }}
      />

      {/* Model Usage */}
      <DataTable
        title="模型使用分布"
        columns={modelColumns}
        dataSource={modelData}
        rowKey="model"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        size="middle"
        bordered
        scroll={{ y: 500 }}
      />
    </div>
  )
}