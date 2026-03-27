import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  MessagesSquare,
  Terminal,
  Activity,
  Code2,
  Settings,
} from 'lucide-react'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import SessionDetail from './pages/SessionDetail'
import Config from './pages/Config'
import Stats from './pages/Stats'
import Sessions from './pages/Sessions'
import Messages from './pages/Messages'
import Commands from './pages/Commands'
import ActiveSessions from './pages/ActiveSessions'
import CodeSnippets from './pages/CodeSnippets'
import ThemeToggle from './components/ThemeToggle'
import NotificationToast from './components/NotificationToast'

// Navigation item type
interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  isActive?: (pathname: string, search: string) => boolean
}

export default function App() {
  const location = useLocation()
  const isFromActiveSessions = new URLSearchParams(location.search).get('from') === 'active-sessions'
  const isSessionDetail = location.pathname.startsWith('/sessions/') && location.pathname !== '/sessions'

  // Navigation items
  const navItems: NavItem[] = [
    { to: '/', icon: <BarChart3 className="w-4 h-4" />, label: '统计' },
    { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: '仪表盘' },
    { to: '/projects', icon: <FolderOpen className="w-4 h-4" />, label: '项目' },
    {
      to: '/sessions',
      icon: <MessageSquare className="w-4 h-4" />,
      label: '会话',
      isActive: (pathname) => pathname === '/sessions' || (isSessionDetail && !isFromActiveSessions)
    },
    { to: '/messages', icon: <MessagesSquare className="w-4 h-4" />, label: '消息' },
    { to: '/commands', icon: <Terminal className="w-4 h-4" />, label: '命令' },
    {
      to: '/active-sessions',
      icon: <Activity className="w-4 h-4" />,
      label: '运行中',
      isActive: (pathname) => pathname === '/active-sessions' || (isSessionDetail && isFromActiveSessions)
    },
    { to: '/code-snippets', icon: <Code2 className="w-4 h-4" />, label: '代码' },
    { to: '/config', icon: <Settings className="w-4 h-4" />, label: '配置' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-white hidden sm:inline">Claude Code</span>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const isActive = item.isActive
                  ? item.isActive(location.pathname, location.search)
                  : location.pathname === item.to

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={() =>
                      `nav-link flex-shrink-0 ${isActive ? 'active' : ''}`
                    }
                  >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Routes>
          <Route path="/" element={<Stats />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:name" element={<ProjectDetail />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/active-sessions" element={<ActiveSessions />} />
          <Route path="/code-snippets" element={<CodeSnippets />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </main>
      <NotificationToast />
    </div>
  )
}