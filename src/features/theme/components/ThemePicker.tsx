import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { useThemeStore } from '../stores/themeStore'
import { themes, themeOrder } from '../presets'
import type { ThemeId } from '../types'
import { cn } from '@/utils/cn'

function ColorSwatch({ colors, size = 'md' }: { colors: { primary: string; accent: string; background: string }; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className={cn('rounded-full overflow-hidden flex', sizeClasses)}>
      <div
        className="w-1/3 h-full"
        style={{ backgroundColor: `hsl(${colors.background})` }}
      />
      <div
        className="w-1/3 h-full"
        style={{ backgroundColor: `hsl(${colors.primary})` }}
      />
      <div
        className="w-1/3 h-full"
        style={{ backgroundColor: `hsl(${colors.accent})` }}
      />
    </div>
  )
}

export function ThemePicker() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'
  const { activeThemeId, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeTheme = themes[activeThemeId]

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelectTheme = (themeId: ThemeId) => {
    setTheme(themeId)
    setIsOpen(false)
  }

  const ariaLabel = lang === 'es' ? 'Seleccionar tema' : 'Select theme'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
          isOpen && 'bg-muted text-foreground ring-2 ring-ring ring-offset-1 ring-offset-background'
        )}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ColorSwatch
          colors={{
            primary: activeTheme.colors.primary,
            accent: activeTheme.colors.accent,
            background: activeTheme.colors.background
          }}
          size="sm"
        />
        <span className="hidden sm:inline max-w-[80px] truncate">{activeTheme.name[lang]}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          role="listbox"
          aria-label={ariaLabel}
        >
          <div className="p-1.5 max-h-80 overflow-y-auto">
            {themeOrder.map((themeId) => {
              const theme = themes[themeId]
              const isActive = themeId === activeThemeId

              return (
                <button
                  key={themeId}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelectTheme(themeId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ColorSwatch
                    colors={{
                      primary: theme.colors.primary,
                      accent: theme.colors.accent,
                      background: theme.colors.background
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {theme.name[lang]}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {theme.description[lang]}
                    </div>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
