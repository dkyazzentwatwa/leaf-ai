import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { APP_CONFIG } from '@/core/config/app.config'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent border border-border rounded px-2 py-1 text-sm cursor-pointer"
      >
        {Object.entries(APP_CONFIG.languages).map(([code, lang]) => (
          <option key={code} value={code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  )
}
