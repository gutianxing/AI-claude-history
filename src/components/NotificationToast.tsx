import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning' | 'connected'
  timestamp: string
  projectPath?: string
  projectName?: string
}

interface ActiveSession {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind: string
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const navigate = useNavigate()

  // Fetch active sessions periodically
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/active-sessions')
        const data = await res.json()
        setActiveSessions(data)
      } catch (err) {
        console.error('Failed to fetch active sessions:', err)
      }
    }

    fetchActiveSessions()
    const interval = setInterval(fetchActiveSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  // SSE connection for notifications
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/notifications')

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data)

        // Skip connection messages
        if (notification.type === 'connected') {
          console.log('Notification service:', notification.message)
          return
        }

        // Add notification
        setNotifications(prev => [...prev, notification])

        // Auto remove after 15 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }, 15000)
      } catch (err) {
        console.error('Failed to parse notification:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Check if project has active session
  const findActiveSession = (projectPath: string): ActiveSession | null => {
    if (!projectPath) return null

    // Normalize paths for comparison
    const normalizePath = (p: string) => p.replace(/\\/g, '/').toLowerCase()

    return activeSessions.find(session =>
      normalizePath(session.cwd) === normalizePath(projectPath)
    ) || null
  }

  // Handle click on project name
  const handleProjectClick = (notification: Notification) => {
    if (!notification.projectPath) return

    const activeSession = findActiveSession(notification.projectPath)

    if (activeSession) {
      // Navigate to session detail
      navigate(`/sessions/${activeSession.sessionId}?from=active-sessions`)
    } else {
      // Show tooltip that session is no longer active
      alert('该会话已结束，无法查看详情')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => {
        const isActive = notification.projectPath && findActiveSession(notification.projectPath)

        return (
          <div
            key={notification.id}
            className={`${getBgColor(notification.type)} border rounded-lg shadow-lg p-4 animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{getIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {notification.message}
                </div>
                {notification.projectName && (
                  <button
                    onClick={() => handleProjectClick(notification)}
                    className={`text-xs mt-2 flex items-center gap-1 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    title={isActive ? '点击查看运行中的会话' : '会话已结束'}
                  >
                    <span>📁</span>
                    <span className="font-medium underline decoration-dotted underline-offset-2">
                      {notification.projectName}
                    </span>
                    {isActive && <span className="text-green-500">●</span>}
                  </button>
                )}
                {notification.projectPath && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate" title={notification.projectPath}>
                    {notification.projectPath}
                  </div>
                )}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(notification.timestamp).toLocaleTimeString('zh-CN')}
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}