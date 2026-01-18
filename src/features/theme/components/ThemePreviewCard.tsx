import { Check } from 'lucide-react'
import type { ThemePreset } from '../types'
import { cn } from '@/utils/cn'

interface ThemePreviewCardProps {
  theme: ThemePreset
  isActive: boolean
  onClick: () => void
  lang: 'en' | 'es'
}

export function ThemePreviewCard({ theme, isActive, onClick, lang }: ThemePreviewCardProps) {
  const { colors } = theme

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-xl border-2 p-3 text-left transition-all duration-200',
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Preview Area */}
      <div
        className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3"
        style={{ backgroundColor: `hsl(${colors.background})` }}
      >
        {/* Simulated UI Elements */}
        <div className="absolute inset-2 flex flex-col gap-1.5">
          {/* Header bar */}
          <div
            className="h-2 w-full rounded-sm"
            style={{ backgroundColor: `hsl(${colors.card})` }}
          />

          {/* Content area */}
          <div className="flex-1 flex gap-1.5">
            {/* Sidebar */}
            <div
              className="w-1/4 rounded-sm"
              style={{ backgroundColor: `hsl(${colors.secondary})` }}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col gap-1">
              <div
                className="h-2 w-3/4 rounded-sm"
                style={{ backgroundColor: `hsl(${colors.muted})` }}
              />
              <div
                className="h-2 w-1/2 rounded-sm"
                style={{ backgroundColor: `hsl(${colors.muted})` }}
              />
              <div className="flex-1" />
              {/* Primary button */}
              <div
                className="h-2.5 w-1/3 rounded-sm self-end"
                style={{ backgroundColor: `hsl(${colors.primary})` }}
              />
            </div>
          </div>
        </div>

        {/* Color dots */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${colors.primary})` }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${colors.accent})` }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${colors.destructive})` }}
          />
        </div>

        {/* Active checkmark */}
        {isActive && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="space-y-0.5">
        <div className="font-medium text-sm flex items-center gap-2">
          {theme.name[lang]}
          {theme.meta.isDark && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {lang === 'es' ? 'Oscuro' : 'Dark'}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {theme.description[lang]}
        </div>
      </div>
    </button>
  )
}
