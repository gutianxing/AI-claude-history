import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAllSessions, useSession } from '../hooks/useClaudeData'
import { format } from 'date-fns'
import { DataTable } from '../components/DataTable'
import { Input, Button, Modal, Spin, message, Drawer, Upload, Popconfirm, Tag, Select, InputRef } from 'antd'
import { DownloadOutlined, RobotOutlined, FileTextOutlined, ReloadOutlined, FileMarkdownOutlined, UploadOutlined, DeleteOutlined, EditOutlined, StarOutlined, StarFilled, TagOutlined, TagsOutlined, FilterOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload'
import React from 'react'

interface SessionItem {
  sessionId: string
  sessionName?: string
  project: string
  messageCount: number
  firstMessage?: string
  startedAt?: number
  lastActivity?: string
  description?: string
  hasAnalysis?: boolean
  isImported?: boolean
  isFavorite?: boolean
  tags?: string[]
}

// Session Action Buttons Component
function SessionActions({
  sessionId,
  isImported,
  isFavorite,
  tags = [],
  onSummarizeComplete,
  onDelete,
  onRefresh
}: {
  sessionId: string
  isImported?: boolean
  isFavorite?: boolean
  tags?: string[]
  onSummarizeComplete?: () => void
  onDelete?: () => void
  onRefresh?: () => void
}) {
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favorite, setFavorite] = useState(isFavorite || false)
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [currentTags, setCurrentTags] = useState<string[]>(tags || [])
  const [allTags, setAllTags] = useState<string[]>([])
  const { refetch } = useSession(sessionId)

  // Sync props with state when they change
  useEffect(() => {
    setFavorite(isFavorite || false)
  }, [isFavorite])

  useEffect(() => {
    setCurrentTags(tags || [])
  }, [tags])

  const handleExportJSON = async () => {
    try {
      const { data } = await refetch()
      const dataStr = JSON.stringify(data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${sessionId}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const handleExportMarkdown = async () => {
    try {
      const { data } = await refetch()
      const messages = data?.messages || []
      let md = `# 会话 ${sessionId}\n\n`
      messages.forEach((msg: { role: string; content: string | Record<string, unknown>[]; timestamp?: string; model?: string }) => {
        const role = msg.role === 'user' ? '👤 用户' : '🤖 助手'
        md += `## ${role}\n`
        if (msg.timestamp) {
          md += `_${format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss')}_\n\n`
        }
        if (msg.model) {
          md += `**Model:** ${msg.model}\n\n`
        }
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)
        md += `${content}\n\n---\n\n`
      })
      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${sessionId}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const handleSummarize = async () => {
    setSummaryModalOpen(true)
    setSummarizing(true)
    setSummary('')

    try {
      const res = await fetch('/api/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!res.ok) throw new Error('Failed to summarize')

      const data = await res.json()
      setSummary(data.summary)

      if (onSummarizeComplete) {
        onSummarizeComplete()
      }
    } catch {
      setSummary('总结失败，请稍后重试')
    } finally {
      setSummarizing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器返回非 JSON 响应')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '删除失败')
      }

      message.success('会话已删除')
      if (onDelete) {
        onDelete()
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/favorite`, {
        method: 'POST',
      })
      const data = await res.json()
      setFavorite(data.isFavorite)
      message.success(data.isFavorite ? '已收藏' : '已取消收藏')
      if (onRefresh) onRefresh()
    } catch {
      message.error('操作失败')
    }
  }

  const handleOpenTagsModal = async () => {
    try {
      const res = await fetch('/api/tags')
      const tags = await res.json()
      setAllTags(tags)
    } catch {
      setAllTags([])
    }
    setCurrentTags(tags)
    setTagsModalOpen(true)
  }

  const handleSaveTags = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: currentTags }),
      })
      if (!res.ok) throw new Error('保存失败')
      message.success('标签已保存')
      setTagsModalOpen(false)
      if (onRefresh) onRefresh()
    } catch {
      message.error('保存标签失败')
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        size="small"
        type={favorite ? 'primary' : 'default'}
        icon={favorite ? <StarFilled /> : <StarOutlined />}
        onClick={handleToggleFavorite}
        title={favorite ? '取消收藏' : '收藏'}
        style={favorite ? { backgroundColor: '#faad14', borderColor: '#faad14' } : {}}
      />
      <Button
        size="small"
        icon={<TagOutlined />}
        onClick={handleOpenTagsModal}
        title="标签"
      />
      <Button
        size="small"
        icon={<FileTextOutlined />}
        onClick={handleExportMarkdown}
        title="导出 Markdown"
      />
      <Button
        size="small"
        icon={<DownloadOutlined />}
        onClick={handleExportJSON}
        title="导出 JSON"
      />
      <Button
        size="small"
        type="primary"
        icon={<RobotOutlined />}
        onClick={handleSummarize}
        title="AI 总结"
      />
      {isImported && (
        <Popconfirm
          title="确认删除"
          description="确定要删除这个导入的会话吗？此操作不可恢复。"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true, loading: deleting }}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除会话"
            loading={deleting}
          />
        </Popconfirm>
      )}

      <Modal
        title="会话总结"
        open={summaryModalOpen}
        onCancel={() => setSummaryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSummaryModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {summarizing ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4 text-gray-500 dark:text-gray-400">正在生成总结...</div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </Modal>

      <Modal
        title="管理标签"
        open={tagsModalOpen}
        onCancel={() => setTagsModalOpen(false)}
        onOk={handleSaveTags}
        okText="保存"
        cancelText="取消"
      >
        <div className="py-4">
          <div className="mb-2 text-sm text-gray-500">选择或输入标签（最多10个）：</div>
          <Select
            mode="tags"
            value={currentTags}
            onChange={(values) => setCurrentTags(values.slice(0, 10))}
            options={allTags.map(tag => ({ label: tag, value: tag }))}
            className="w-full"
            placeholder="输入标签后按回车添加"
            maxCount={10}
          />
          <div className="mt-2 text-xs text-gray-400">
            提示：可直接输入新标签，每个标签最多20个字符
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function Sessions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [analysisData, setAnalysisData] = useState<{
    purpose?: string
    improvements?: string
    summary?: string
  } | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const { data: sessions, isLoading, error, refetch } = useAllSessions()

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingSessionId, setRenamingSessionId] = useState('')
  const [renamingSessionName, setRenamingSessionName] = useState('')
  const [renaming, setRenaming] = useState(false)

  // Tag management state
  const [tagManageDrawerOpen, setTagManageDrawerOpen] = useState(false)
  const [allTagsList, setAllTagsList] = useState<string[]>([])
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const editInputRef = React.useRef<InputRef>(null)
  const newInputRef = React.useRef<InputRef>(null)

  // Favorite sessions drawer state
  const [favoritesDrawerOpen, setFavoritesDrawerOpen] = useState(false)

  // Tag filter state
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Fetch all tags for filter dropdown
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    if (sessions) {
      const tags = new Set<string>()
      sessions.forEach((s: SessionItem) => {
        s.tags?.forEach(tag => tags.add(tag))
      })
      setAvailableTags(Array.from(tags).sort())
    }
  }, [sessions])

  const fetchAllTags = async () => {
    try {
      const res = await fetch('/api/tags')
      const tags = await res.json()
      setAllTagsList(tags)
    } catch {
      setAllTagsList([])
    }
  }

  const handleOpenTagManage = () => {
    fetchAllTags()
    setNewTagName('')
    setTagManageDrawerOpen(true)
  }

  const handleAddTag = async () => {
    const tagName = newTagName.trim()
    if (!tagName) {
      message.error('标签名不能为空')
      return
    }
    if (tagName.length > 20) {
      message.error('标签名不能超过20个字符')
      return
    }
    if (allTagsList.includes(tagName)) {
      message.error('标签已存在')
      return
    }
    // Add tag to a special "standalone" storage for tags not yet assigned to sessions
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      })
      if (!res.ok) throw new Error('添加失败')
      message.success('标签已添加')
      setNewTagName('')
      fetchAllTags()
      newInputRef.current?.focus()
    } catch {
      message.error('添加标签失败')
    }
  }

  const handleRenameTag = async (oldName: string, newName: string) => {
    const trimmedName = newName.trim()
    if (!trimmedName) {
      message.error('标签名不能为空')
      return
    }
    if (trimmedName === oldName) {
      setEditingTag(null)
      return
    }
    if (trimmedName.length > 20) {
      message.error('标签名不能超过20个字符')
      return
    }
    if (allTagsList.includes(trimmedName) && trimmedName !== oldName) {
      message.error('标签名已存在')
      return
    }
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: trimmedName }),
      })
      if (!res.ok) throw new Error('重命名失败')
      message.success('标签已重命名')
      fetchAllTags()
      refetch()
    } catch {
      message.error('重命名标签失败')
    } finally {
      setEditingTag(null)
    }
  }

  const handleDeleteTag = async (tagName: string) => {
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('删除失败')
      message.success('标签已删除')
      fetchAllTags()
      refetch()
    } catch {
      message.error('删除标签失败')
    }
  }

  const handleOpenRename = (sessionId: string, currentName?: string) => {
    setRenamingSessionId(sessionId)
    setRenamingSessionName(currentName || '')
    setRenameModalOpen(true)
  }

  const handleRename = async () => {
    if (!renamingSessionName.trim()) {
      message.error('名称不能为空')
      return
    }

    setRenaming(true)
    try {
      const res = await fetch(`/api/sessions/${renamingSessionId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renamingSessionName.trim() }),
      })

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器返回非 JSON 响应')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '重命名失败')
      }

      message.success('重命名成功')
      setRenameModalOpen(false)
      refetch()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '重命名失败')
    } finally {
      setRenaming(false)
    }
  }

  const handleDescriptionClick = async (description: string, sessionId: string) => {
    setSelectedDescription(description)
    setSelectedSessionId(sessionId)
    setDrawerOpen(true)
    setAnalysisData(null)

    // Fetch analysis data
    setLoadingAnalysis(true)
    try {
      const res = await fetch(`/api/session-analysis-content/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.content) {
          const purposeMatch = data.content.match(/## 主要目的\s*([\s\S]*?)(?=##|$)/)
          const improvementsMatch = data.content.match(/## 需要改进的地方\s*([\s\S]*?)(?=##|$)/)
          const summaryMatch = data.content.match(/## 详细总结\s*([\s\S]*?)(?=##|$)/)

          setAnalysisData({
            purpose: purposeMatch?.[1]?.trim(),
            improvements: improvementsMatch?.[1]?.trim(),
            summary: summaryMatch?.[1]?.trim(),
          })
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setLoadingAnalysis(false)
    }
  }

  // Handle file import
  const handleFileChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList.slice(-1)) // Keep only last file
  }

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error('请选择要导入的 JSON 文件')
      return
    }

    const file = fileList[0].originFileObj
    if (!file) {
      message.error('文件读取失败')
      return
    }

    setImporting(true)
    try {
      const content = await file.text()
      const sessionData = JSON.parse(content)

      // Validate session data structure
      if (!sessionData.sessionId || !Array.isArray(sessionData.messages)) {
        message.error('无效的会话文件格式')
        setImporting(false)
        return
      }

      const res = await fetch('/api/import-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: '导入会话',
          sessionData
        })
      })

      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text.slice(0, 200))
        throw new Error('服务器返回非 JSON 响应，请确保后端服务器正在运行 (npm run server)')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '导入失败')
      }

      message.success('会话导入成功')
      setImportModalOpen(false)
      setFileList([])
      refetch()
    } catch (err) {
      console.error('Import error:', err)
      message.error(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  if (isLoading) return <div className="text-center py-10">加载中...</div>
  if (error) return <div className="text-red-500">加载失败: {error.message}</div>

  const filteredSessions = (sessions?.filter((s: SessionItem) => {
    const matchesSearch = s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTag = !filterTag || (s.tags && s.tags.includes(filterTag))
    return matchesSearch && matchesTag
  }) || [])

  const columns: ColumnsType<SessionItem> = [
    {
      title: '会话',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 280,
      render: (sessionId: string, record: SessionItem) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            {record.isFavorite && (
              <StarFilled className="text-yellow-500 text-sm" />
            )}
            <Link
              to={`/sessions/${sessionId}`}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-mono flex-1 truncate"
              title={sessionId}
            >
              {record.sessionName || `${sessionId.slice(0, 8)}...`}
            </Link>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleOpenRename(sessionId, record.sessionName)
              }}
              title="重命名"
              className="text-gray-400 hover:text-indigo-600"
            />
          </div>
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.tags.slice(0, 3).map(tag => (
                <Tag key={tag} color="blue" className="text-xs m-0">{tag}</Tag>
              ))}
              {record.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{record.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'isImported',
      key: 'isImported',
      width: 100,
      render: (isImported?: boolean) => (
        <span className={`text-xs px-2 py-1 rounded ${isImported ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
          {isImported ? '📥 导入' : '原生'}
        </span>
      ),
      filters: [
        { text: '原生会话', value: false },
        { text: '导入会话', value: true },
      ],
      onFilter: (value, record) => record.isImported === value,
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 200,
      render: (project: string) => project.split(/[\\/]/).pop(),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description?: string, record?: SessionItem) => (
        <div className="flex items-center gap-2">
          {description ? (
            <span
              className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer flex-1 truncate"
              onClick={() => handleDescriptionClick(description, record?.sessionId || '')}
              title="点击查看详情"
            >
              {description}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
          )}
          {record?.hasAnalysis && (
            <Button
              size="small"
              icon={<FileMarkdownOutlined />}
              onClick={() => {
                window.open(`/api/session-analysis/${record.sessionId}`, '_blank')
              }}
              title="下载分析报告"
            />
          )}
        </div>
      ),
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
      width: 160,
      sorter: (a: SessionItem, b: SessionItem) => (a.startedAt || 0) - (b.startedAt || 0),
      render: (startedAt?: number) => startedAt ? format(new Date(startedAt), 'yyyy-MM-dd HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: SessionItem) => (
        <SessionActions
          sessionId={record.sessionId}
          isImported={record.isImported}
          isFavorite={record.isFavorite}
          tags={record.tags}
          onSummarizeComplete={refetch}
          onDelete={refetch}
          onRefresh={refetch}
        />
      ),
    },
  ]

  // Favorite sessions
  const favoriteSessions = sessions?.filter((s: SessionItem) => s.isFavorite) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">会话列表</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">共 {sessions?.length || 0} 个会话</div>
          <Button
            icon={<StarFilled className="text-yellow-500" />}
            onClick={() => setFavoritesDrawerOpen(true)}
          >
            收藏会话 {favoriteSessions.length > 0 && `(${favoriteSessions.length})`}
          </Button>
          <Button
            icon={<TagsOutlined />}
            onClick={handleOpenTagManage}
          >
            管理标签
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
          >
            导入会话
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="搜索会话 ID、项目或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </div>
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2">
            <FilterOutlined className="text-gray-400" />
            <Select
              allowClear
              placeholder="按标签筛选"
              value={filterTag}
              onChange={setFilterTag}
              style={{ minWidth: 150 }}
              options={availableTags.map(tag => ({ label: tag, value: tag }))}
            />
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        dataSource={filteredSessions}
        rowKey="sessionId"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个会话` }}
        size="middle"
        bordered
        scroll={{ y: 500 }}
      />

      <Drawer
        title="会话详情"
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          selectedSessionId && (
            <Button
              type="link"
              icon={<FileMarkdownOutlined />}
              onClick={() => window.open(`/api/session-analysis/${selectedSessionId}`, '_blank')}
            >
              下载报告
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {/* Description */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">📝 会话描述</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{selectedDescription}</ReactMarkdown>
            </div>
          </div>

          {/* Analysis Data */}
          {loadingAnalysis && (
            <div className="text-center py-4">
              <Spin size="small" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">加载分析数据...</span>
            </div>
          )}

          {analysisData && (
            <>
              {analysisData.purpose && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">🎯 主要目的</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysisData.purpose}</ReactMarkdown>
                  </div>
                </div>
              )}

              {analysisData.improvements && (
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">💡 改进建议</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysisData.improvements}</ReactMarkdown>
                  </div>
                </div>
              )}

              {analysisData.summary && (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">📋 详细总结</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysisData.summary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Drawer>

      {/* Import Modal */}
      <Modal
        title="导入会话"
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false)
          setFileList([])
        }}
        onOk={handleImport}
        confirmLoading={importing}
        okText="导入"
        cancelText="取消"
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择 JSON 文件</label>
            <Upload
              accept=".json"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">支持导入之前导出的 JSON 格式会话文件，将导入到"导入会话"项目</p>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        title="重命名会话"
        open={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        onOk={handleRename}
        confirmLoading={renaming}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <Input
            placeholder="输入会话名称"
            value={renamingSessionName}
            onChange={(e) => setRenamingSessionName(e.target.value)}
            maxLength={100}
            showCount
            autoFocus
          />
        </div>
      </Modal>

      {/* Favorite Sessions Drawer */}
      <Drawer
        title={
          <span className="flex items-center gap-2">
            <StarFilled className="text-yellow-500" />
            收藏的会话 ({favoriteSessions.length})
          </span>
        }
        placement="right"
        width={450}
        open={favoritesDrawerOpen}
        onClose={() => setFavoritesDrawerOpen(false)}
      >
        {favoriteSessions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <StarOutlined className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
            <div>暂无收藏的会话</div>
            <div className="text-sm mt-2">点击会话操作中的星标按钮添加收藏</div>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteSessions.map((session: SessionItem) => (
              <div
                key={session.sessionId}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-2">
                  <StarFilled className="text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/sessions/${session.sessionId}`}
                      className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline block truncate"
                      title={session.sessionId}
                      onClick={() => setFavoritesDrawerOpen(false)}
                    >
                      {session.sessionName || `${session.sessionId.slice(0, 12)}...`}
                    </Link>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {session.messageCount} 条消息 · {session.project.split(/[\\/]/).pop()}
                    </div>
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.tags.map(tag => (
                          <Tag key={tag} color="blue" className="text-xs m-0">{tag}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* Tag Management Drawer */}
      <Drawer
        title="标签管理"
        placement="right"
        width={400}
        open={tagManageDrawerOpen}
        onClose={() => {
          setTagManageDrawerOpen(false)
          setEditingTag(null)
        }}
      >
        <div className="space-y-4">
          {/* Add new tag */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">添加新标签</div>
            <div className="flex gap-2">
              <Input
                ref={newInputRef}
                placeholder="输入标签名"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onPressEnter={handleAddTag}
                maxLength={20}
                showCount
              />
              <Button type="primary" onClick={handleAddTag}>添加</Button>
            </div>
          </div>

          {/* Tag list */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">所有标签 ({allTagsList.length})</div>
            {allTagsList.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无标签
              </div>
            ) : (
              <div className="space-y-2">
                {allTagsList.map(tag => (
                  <div key={tag} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    {editingTag === tag ? (
                      <>
                        <Input
                          ref={editInputRef}
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onPressEnter={() => handleRenameTag(tag, editingTagName)}
                          maxLength={20}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleRenameTag(tag, editingTagName)}
                        >
                          保存
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setEditingTag(null)}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tag color="blue" className="text-sm m-0">{tag}</Tag>
                        <div className="flex-1" />
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingTag(tag)
                            setEditingTagName(tag)
                            setTimeout(() => editInputRef.current?.focus(), 0)
                          }}
                          title="重命名"
                        />
                        <Popconfirm
                          title="删除标签"
                          description="确定要删除此标签吗？该标签将从所有会话中移除。"
                          onConfirm={() => handleDeleteTag(tag)}
                          okText="删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title="删除"
                          />
                        </Popconfirm>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  )
}