import { Link } from 'react-router-dom'
import { Tag, Button, Upload, message, Modal } from 'antd'
import { ReloadOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import {
  FolderOpen,
  MessageSquare,
  MessagesSquare,
  Terminal,
  ArrowDownToLine,
  ArrowUpFromLine,
  Hash,
} from 'lucide-react'
import { useStats } from '../hooks/useClaudeData'
import { DataTable } from '../components/DataTable'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload'
import { useState } from 'react'

interface CommandItem {
  command: string
  count: number
}

interface ModelItem {
  model: string
  count: number
}

interface TokenStats {
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  tokenByModel: Array<{ model: string; input: number; output: number; total: number }>
  tokenTrend: Array<{ date: string; input: number; output: number; total: number }>
}

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function Stats() {
  const { data: stats, isLoading, error, refetch } = useStats()
  const [restoring, setRestoring] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Handle backup
  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('备份失败')

      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claude-chat-log-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('备份成功')
    } catch {
      message.error('备份失败')
    }
  }

  // Handle file change for restore
  const handleFileChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList.slice(-1))
  }

  // Handle restore
  const handleRestore = async () => {
    if (fileList.length === 0) {
      message.error('请选择备份文件')
      return
    }

    const file = fileList[0].originFileObj
    if (!file) {
      message.error('文件读取失败')
      return
    }

    setRestoring(true)
    try {
      const content = await file.text()
      const backupData = JSON.parse(content)

      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '恢复失败')
      }

      const data = await res.json()
      message.success(`恢复成功：${data.stats.descriptions} 个描述, ${data.stats.favorites} 个收藏, ${data.stats.analyses} 个分析报告`)
      setRestoreModalOpen(false)
      setFileList([])
      refetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '恢复失败')
    } finally {
      setRestoring(false)
    }
  }

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

  const tokenByModelColumns: ColumnsType<{ model: string; input: number; output: number; total: number }> = [
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '输入 Token',
      dataIndex: 'input',
      key: 'input',
      align: 'right',
      render: (input: number) => formatNumber(input),
    },
    {
      title: '输出 Token',
      dataIndex: 'output',
      key: 'output',
      align: 'right',
      render: (output: number) => formatNumber(output),
    },
    {
      title: '总计',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total: number) => <span className="font-semibold">{formatNumber(total)}</span>,
    },
  ]

  const modelData: ModelItem[] = Object.entries(stats?.modelUsage || {}).map(([model, count]) => ({
    model,
    count: count as number,
  }))

  const tokenStats: TokenStats = (stats as { tokenStats?: TokenStats })?.tokenStats || {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    tokenByModel: [],
    tokenTrend: []
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claude Code 对话历史查看器</h1>
        <div className="flex gap-2">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleBackup}
          >
            备份数据
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setRestoreModalOpen(true)}
          >
            恢复数据
          </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/projects"
          className="stat-card group border-l-4 border-indigo-500 hover:border-indigo-600 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 group-hover:scale-110 transition-transform duration-200">
              <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">项目总数</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalProjects || 0}</div>
            </div>
          </div>
        </Link>
        <Link
          to="/sessions"
          className="stat-card group border-l-4 border-green-500 hover:border-green-600 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-200">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">会话总数</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalSessions || 0}</div>
            </div>
          </div>
        </Link>
        <Link
          to="/messages"
          className="stat-card group border-l-4 border-blue-500 hover:border-blue-600 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-200">
              <MessagesSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">消息总数</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalMessages || 0}</div>
            </div>
          </div>
        </Link>
        <Link
          to="/commands"
          className="stat-card group border-l-4 border-purple-500 hover:border-purple-600 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform duration-200">
              <Terminal className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">命令总数</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalCommands || 0}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Token Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <ArrowDownToLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">总输入 Token</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatNumber(tokenStats.totalInputTokens)}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-teal-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <ArrowUpFromLine className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">总输出 Token</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatNumber(tokenStats.totalOutputTokens)}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-pink-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
              <Hash className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">总 Token 消耗</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatNumber(tokenStats.totalTokens)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Usage by Model */}
      <DataTable
        title="各模型 Token 消耗"
        columns={tokenByModelColumns}
        dataSource={tokenStats.tokenByModel}
        rowKey="model"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        size="middle"
        bordered
        scroll={{ y: 300 }}
      />

      {/* Top Commands */}
      <DataTable
        title="常用命令"
        columns={commandColumns}
        dataSource={stats?.topCommands || []}
        rowKey="command"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        size="middle"
        bordered
        scroll={{ y: 300 }}
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
        scroll={{ y: 300 }}
      />

      {/* Restore Modal */}
      <Modal
        title="恢复数据"
        open={restoreModalOpen}
        onCancel={() => {
          setRestoreModalOpen(false)
          setFileList([])
        }}
        onOk={handleRestore}
        confirmLoading={restoring}
        okText="恢复"
        cancelText="取消"
      >
        <div className="space-y-4 py-4">
          <div className="text-red-500 text-sm">
            ⚠️ 警告：恢复操作将覆盖当前的所有数据（描述、命名、收藏、标签、分析报告等）。
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择备份文件</label>
            <Upload
              accept=".json"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">请选择之前导出的备份文件</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}