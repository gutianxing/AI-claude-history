import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">项目列表</h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>
      <DataTable
        columns={columns}
        dataSource={projects || []}
        rowKey="name"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个项目` }}
        size="middle"
        bordered
        scroll={{ y: 500 }}
      />
    </div>
  )
}