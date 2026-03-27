import { useConfig, useMcpServers, useAgents, useSkills } from '../hooks/useClaudeData'
import { DataTable } from '../components/DataTable'
import { Tabs, Tag, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { Settings, Server, Users, Zap, Puzzle, Variable, Cpu } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'

interface McpServer {
  name: string
  description?: string
  command?: string
  type?: string
  url?: string
}

interface AgentItem {
  name: string
  path: string
}

interface SkillItem {
  name: string
  path: string
}

interface EnvItem {
  key: string
  value: string
}

export default function Config() {
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useConfig()
  const { data: mcpServers, isLoading: mcpLoading, refetch: refetchMcp } = useMcpServers()
  const { data: agents, isLoading: agentsLoading, refetch: refetchAgents } = useAgents()
  const { data: skills, isLoading: skillsLoading, refetch: refetchSkills } = useSkills()

  const isLoading = configLoading || mcpLoading || agentsLoading || skillsLoading

  const handleRefresh = () => {
    refetchConfig()
    refetchMcp()
    refetchAgents()
    refetchSkills()
  }

  if (isLoading) return <div className="text-center py-10">加载中...</div>

  // MCP Servers Table Columns
  const mcpColumns: ColumnsType<McpServer> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => <span className="font-medium text-indigo-600">{name}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc?: string) => desc || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type?: string) => (
        <Tag color={type === 'http' ? 'blue' : 'green'}>{type || 'stdio'}</Tag>
      ),
    },
    {
      title: '命令/URL',
      key: 'connection',
      width: 300,
      ellipsis: true,
      render: (_: unknown, record: McpServer) => (
        <code className="text-xs text-gray-500 dark:text-gray-400">
          {record.type === 'http' ? record.url : record.command}
        </code>
      ),
    },
  ]

  // Agents Table Columns
  const agentColumns: ColumnsType<AgentItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => <code className="text-xs text-gray-500 dark:text-gray-400">{path}</code>,
    },
  ]

  // Skills Table Columns
  const skillColumns: ColumnsType<SkillItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => <Tag color="cyan">{name}</Tag>,
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => <code className="text-xs text-gray-500 dark:text-gray-400">{path}</code>,
    },
  ]

  // Environment Variables Table Columns
  const envData: EnvItem[] = Object.entries(config?.env || {}).map(([key, value]) => ({
    key,
    value: typeof value === 'string' && value.length > 100 ? value.slice(0, 100) + '...' : String(value),
  }))

  const envColumns: ColumnsType<EnvItem> = [
    {
      title: '变量名',
      dataIndex: 'key',
      key: 'key',
      width: 250,
      render: (key: string) => <code className="text-indigo-600 font-medium">{key}</code>,
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (value: string) => <code className="text-gray-600 dark:text-gray-300">{value}</code>,
    },
  ]

  // Plugins data
  const pluginsData = Object.entries(config?.enabledPlugins || {}).map(([name, enabled]) => ({
    name,
    enabled: Boolean(enabled),
  }))

  const pluginColumns: ColumnsType<{ name: string; enabled: boolean }> = [
    {
      title: '插件名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      align: 'center',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? '已启用' : '已禁用'}</Tag>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'mcp',
      label: `MCP 服务器 (${mcpServers?.length || 0})`,
      children: (
        <DataTable
          columns={mcpColumns}
          dataSource={mcpServers || []}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个服务器` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'agents',
      label: `Agents (${agents?.length || 0})`,
      children: (
        <DataTable
          columns={agentColumns}
          dataSource={agents || []}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个 Agent` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'skills',
      label: `Skills (${skills?.length || 0})`,
      children: (
        <DataTable
          columns={skillColumns}
          dataSource={skills || []}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个 Skill` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'plugins',
      label: `插件 (${pluginsData.length})`,
      children: (
        <DataTable
          columns={pluginColumns}
          dataSource={pluginsData}
          rowKey="name"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个插件` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
    {
      key: 'env',
      label: `环境变量 (${envData.length})`,
      children: (
        <DataTable
          columns={envColumns}
          dataSource={envData}
          rowKey="key"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个变量` }}
          size="middle"
          bordered
          scroll={{ y: 500 }}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">配置信息</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">MCP 服务器、Agents、Skills 和环境变量</p>
          </div>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card border-l-4 border-indigo-500">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">当前模型</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">{config?.model || 'unknown'}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">MCP 服务器</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mcpServers?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Agents</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{agents?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-cyan-500">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-cyan-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Skills</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{skills?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Puzzle className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">已启用插件</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {Object.values(config?.enabledPlugins || {}).filter(Boolean).length}
              </div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <Variable className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">环境变量</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{envData.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <Tabs items={tabItems} />
      </div>
    </div>
  )
}