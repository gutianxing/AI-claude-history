import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Tag, Drawer, message, Spin } from 'antd'
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import { Code2, Clock, FolderOpen, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import type { ColumnsType } from 'antd/es/table'
import { DataTable } from '../components/DataTable'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface CodeSnippet {
  id: string
  sessionId: string
  project: string
  language: string
  code: string
  timestamp?: string
  messageId?: string
}

export default function CodeSnippets() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const codeRef = useRef<HTMLPreElement>(null)

  // Fetch code snippets
  const fetchSnippets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/code-snippets')
      if (!res.ok) throw new Error('获取失败')
      const data = await res.json()
      setSnippets(data)
    } catch {
      message.error('获取代码片段失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSnippets()
  }, [])

  // Apply syntax highlighting when drawer opens
  useEffect(() => {
    if (drawerOpen && codeRef.current && selectedSnippet) {
      const codeEl = codeRef.current.querySelector('code')
      if (codeEl) {
        hljs.highlightElement(codeEl)
      }
    }
  }, [drawerOpen, selectedSnippet])

  // Get unique languages
  const languages = Array.from(new Set(snippets.map(s => s.language))).sort()

  // Filter snippets
  const filteredSnippets = snippets.filter(s => {
    return !searchTerm ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Copy code to clipboard
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      message.success('已复制到剪贴板')
    } catch {
      message.error('复制失败')
    }
  }

  // Open snippet detail
  const handleOpenDetail = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet)
    setDrawerOpen(true)
  }

  // Table columns
  const columns: ColumnsType<CodeSnippet> = [
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string) => <Tag color="blue">{language}</Tag>,
      filters: languages.map(lang => ({ text: lang, value: lang })),
      onFilter: (value, record) => record.language === value,
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 180,
      ellipsis: true,
      render: (project: string) => (
        <Link
          to={`/projects/${encodeURIComponent(project)}`}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          title={project}
        >
          {project.split(/[\\/]/).pop()}
        </Link>
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
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-mono"
          title={sessionId}
        >
          {sessionId.slice(0, 8)}...
        </Link>
      ),
    },
    {
      title: '代码预览',
      dataIndex: 'code',
      key: 'code',
      ellipsis: true,
      render: (code: string) => (
        <code className="text-xs text-gray-600 dark:text-gray-300">
          {code.split('\n')[0].slice(0, 80)}
          {(code.split('\n')[0].length > 80 || code.split('\n').length > 1) && '...'}
        </code>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 130,
      render: (timestamp: string) => timestamp ? format(new Date(timestamp), 'MM-dd HH:mm') : '-',
      sorter: (a, b) => (a.timestamp ? new Date(a.timestamp).getTime() : 0) - (b.timestamp ? new Date(b.timestamp).getTime() : 0),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CodeSnippet) => (
        <Button size="small" onClick={() => handleOpenDetail(record)}>
          查看
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Code2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">代码片段</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">共 {snippets.length} 个片段</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchSnippets}
          loading={loading}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          刷新
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-slate-200 dark:border-slate-700">
        <Input
          placeholder="搜索代码内容、会话或项目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      {/* Snippets Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          columns={columns}
          dataSource={filteredSnippets}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            defaultPageSize: 20,
          }}
          size="middle"
          bordered={false}
          scroll={{ x: 800, y: 'calc(100vh - 350px)' }}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Tag color="blue">{selectedSnippet?.language}</Tag>
            <span className="text-slate-800 dark:text-white">代码片段</span>
          </div>
        }
        placement="right"
        width={700}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          selectedSnippet && (
            <div className="flex gap-2">
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(selectedSnippet.code)}
              >
                复制
              </Button>
              <Link to={`/sessions/${selectedSnippet.sessionId}`}>
                <Button type="primary" className="bg-green-600 hover:bg-green-700 border-green-600">
                  查看会话
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selectedSnippet && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">项目：</span>
                <span className="dark:text-slate-300">{selectedSnippet.project.split(/[\\/]/).pop()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">语言：</span>
                <Tag color="blue">{selectedSnippet.language}</Tag>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">行数：</span>
                <span className="dark:text-slate-300">{selectedSnippet.code.split('\n').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">时间：</span>
                <span className="dark:text-slate-300">
                  {selectedSnippet.timestamp ? format(new Date(selectedSnippet.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
                </span>
              </div>
            </div>

            <pre
              ref={codeRef}
              className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto"
            >
              <code className={`language-${selectedSnippet.language}`}>
                {selectedSnippet.code}
              </code>
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}