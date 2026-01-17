import { useTranslation } from 'react-i18next'
import { ChatInterface } from '@/features/ai/components/ChatInterface'
import { ModelDownloader } from '@/features/ai/components/ModelDownloader'
import { ConversationHistory } from '@/features/ai/components/ConversationHistory'
import { useAIStore, selectIsModelReady } from '@/features/ai/stores/aiStore'

export function Chat() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const isModelReady = useAIStore(selectIsModelReady)

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12 sm:mb-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
          {lang === 'es'
            ? 'Tu asistente de IA privado'
            : 'Your private AI assistant'}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
          {lang === 'es'
            ? 'Ejecutándose completamente en tu navegador. Sin servidores, sin seguimiento, sin compromisos.'
            : 'Running entirely in your browser. No servers, no tracking, no compromises.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <ConversationHistory />
        <div className="space-y-6 min-w-0">
          {/* Model downloader (if not ready) */}
          {!isModelReady && (
            <div>
              <ModelDownloader />
            </div>
          )}

          {/* Chat interface */}
          {isModelReady && (
            <ChatInterface
              assistantType="general"
              title={lang === 'es' ? 'Leaf AI' : 'Leaf AI'}
            />
          )}
        </div>
      </div>
    </div>
  )
}
