import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { FolderOpen, Clock, MessageSquare } from 'lucide-react'
import { useProjects } from '../hooks/useClaudeData'
import { DataTable } from '../components/DataTable'
import type { ColumnsType } from 'antd/es/table'

interface ProjectItem {
  name: string
  path: string
  sessionCount: number
  lastActivity?: string
}

export default function Projects() {
  const { data: projects, isLoading, error, refetch } = useProjects()

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  const columns: ColumnsType<ProjectItem> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Link
          to={`/projects/${encodeURIComponent(name)}`}
          className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          {name}
        </Link>
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => (
        <code className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
          {path}
        </code>
      ),
    },
    {
      title: '会话数',
      dataIndex: 'sessionCount',
      key: 'sessionCount',
      align: 'right',
      width: 120,
      render: (count: number) => (
        <span className="flex items-center justify-end gap-1 text-slate-700 dark:text-slate-300">
          <MessageSquare className="w-4 h-4 text-green-500" />
          <span className="font-semibold">{count}</span>
        </span>
      ),
    },
    {
      title: '最后活动',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 200,
      render: (lastActivity?: string) => (
        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          {lastActivity ? new Date(lastActivity).toLocaleString('zh-CN') : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">项目列表</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">共 {projects?.length || 0} 个项目</p>
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

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          columns={columns}
          dataSource={projects || []}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个项目` }}
          size="middle"
          bordered={false}
          scroll={{ y: 500 }}
        />
      </div>
    </div>
  )
}