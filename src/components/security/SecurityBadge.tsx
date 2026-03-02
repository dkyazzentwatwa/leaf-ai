/**
 * Security Badge Component
 *
 * Visual security status indicator showing privacy mode, encryption, and local-only status.
 * Displays in the header to provide constant visibility of security features.
 */

import { useTranslation } from 'react-i18next'
import { Shield, EyeOff } from 'lucide-react'
import { useAIStore } from '@/features/ai/stores/aiStore'

export function SecurityBadge() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const privacyMode = useAIStore((s) => s.privacyMode)

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Privacy Mode Indicator */}
      {privacyMode && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
          title={lang === 'es' ? 'Modo Privacidad Activo' : 'Privacy Mode Active'}
        >
          <EyeOff className="h-3 w-3" />
          <span className="hidden sm:inline">
            {lang === 'es' ? 'Privado' : 'Private'}
          </span>
        </div>
      )}

      {/* Local-Only Badge */}
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs"
        title={lang === 'es' ? '100% Local - Sin Servidores' : '100% Local - No Servers'}
      >
        <Shield className="h-3 w-3" />
        <span className="hidden sm:inline">
          {lang === 'es' ? 'Local' : 'Local'}
        </span>
      </div>
    </div>
  )
}
