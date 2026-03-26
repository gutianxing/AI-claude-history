import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
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
import ThemeToggle from './components/ThemeToggle'

function App() {
  const location = useLocation()
  const isFromActiveSessions = new URLSearchParams(location.search).get('from') === 'active-sessions'
  const isSessionDetail = location.pathname.startsWith('/sessions/') && location.pathname !== '/sessions'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                统计
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                仪表盘
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                项目
              </NavLink>
              <NavLink
                to="/sessions"
                className={() =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    (location.pathname === '/sessions' || (isSessionDetail && !isFromActiveSessions))
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                会话
              </NavLink>
              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                消息
              </NavLink>
              <NavLink
                to="/commands"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                命令
              </NavLink>
              <NavLink
                to="/active-sessions"
                className={() =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    (location.pathname === '/active-sessions' || (isSessionDetail && isFromActiveSessions))
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                运行中
              </NavLink>
              <NavLink
                to="/config"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`
                }
              >
                配置
              </NavLink>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
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
          <Route path="/config" element={<Config />} />
        </Routes>
      </main>
    </div>
  )
}

export default App