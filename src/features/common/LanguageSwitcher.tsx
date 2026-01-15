import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { APP_CONFIG } from '@/core/config/app.config'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const languages = Object.keys(APP_CONFIG.languages)
  const currentIndex = languages.indexOf(i18n.language)
  const nextIndex = (currentIndex + 1) % languages.length
  const nextLanguage = languages[nextIndex]
  const currentLang = APP_CONFIG.languages[i18n.language as keyof typeof APP_CONFIG.languages]

  const handleLanguageToggle = () => {
    i18n.changeLanguage(nextLanguage)
  }

  return (
    <button
      onClick={handleLanguageToggle}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted/50 transition-all duration-200"
      title={`${currentLang?.nativeName || i18n.language.toUpperCase()}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{i18n.language.toUpperCase()}</span>
    </button>
  )
}
