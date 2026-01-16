import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'leaf-theme'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const isDark = theme === 'dark'
  const label = isDark
    ? lang === 'es'
      ? 'Modo claro'
      : 'Light mode'
    : lang === 'es'
      ? 'Modo oscuro'
      : 'Dark mode'
  const ariaLabel = isDark
    ? lang === 'es'
      ? 'Cambiar a modo claro'
      : 'Switch to light mode'
    : lang === 'es'
      ? 'Cambiar a modo oscuro'
      : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-background/80 px-1.5 sm:px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={ariaLabel}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
