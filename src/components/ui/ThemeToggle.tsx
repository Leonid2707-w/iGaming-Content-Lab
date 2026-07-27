import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      <span className={`theme-toggle-thumb ${isDark ? 'translate-x-0' : 'translate-x-7'}`}>
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
      <Moon size={14} className="text-text-muted" aria-hidden="true" />
      <Sun size={14} className="text-text-muted" aria-hidden="true" />
    </button>
  )
}
