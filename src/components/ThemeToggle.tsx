import { useTheme } from '../hooks/useTheme'

const themeOptions = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'system', label: '跟随系统', icon: '💻' },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="relative">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600
                   rounded-md pl-8 pr-4 py-1.5 text-sm text-gray-700 dark:text-gray-200
                   hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
        {themeOptions.find((o) => o.value === theme)?.icon}
      </span>
    </div>
  )
}