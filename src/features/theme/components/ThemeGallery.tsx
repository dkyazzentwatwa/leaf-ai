import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../stores/themeStore'
import { themes, themeOrder } from '../presets'
import { ThemePreviewCard } from './ThemePreviewCard'

export function ThemeGallery() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'
  const { activeThemeId, setTheme } = useThemeStore()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {themeOrder.map((themeId) => (
        <ThemePreviewCard
          key={themeId}
          theme={themes[themeId]}
          isActive={themeId === activeThemeId}
          onClick={() => setTheme(themeId)}
          lang={lang}
        />
      ))}
    </div>
  )
}
