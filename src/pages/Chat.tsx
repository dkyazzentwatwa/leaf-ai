import { useTranslation } from 'react-i18next'
import { Leaf, Lock, Cpu, Zap, Globe } from 'lucide-react'
import { ChatInterface } from '@/features/ai/components/ChatInterface'
import { ModelDownloader } from '@/features/ai/components/ModelDownloader'
import { ConversationHistory } from '@/features/ai/components/ConversationHistory'
import { useAIStore, selectIsModelReady } from '@/features/ai/stores/aiStore'

export function Chat() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const isModelReady = useAIStore(selectIsModelReady)

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="mb-4 sm:mb-8 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <Leaf className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Leaf AI
          </h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
          {lang === 'es'
            ? 'Tu asistente de IA privado, ejecutándose completamente en tu navegador'
            : 'Your private AI assistant, running entirely in your browser'}
        </p>
      </div>

      {/* Privacy notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 mb-4 sm:mb-6 bg-primary/10 border border-primary/30 rounded-lg">
        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
            {lang === 'es' ? 'Privacidad Completa' : 'Complete Privacy'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'es'
              ? 'Todo el procesamiento de IA ocurre en tu dispositivo. Sin servidores, sin seguimiento.'
              : 'All AI processing happens on your device. No servers, no tracking.'}
          </p>
        </div>
        {isModelReady && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">{lang === 'es' ? 'IA Local' : 'Local AI'}</span>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-10 grid gap-4 sm:gap-6 lg:grid-cols-[280px,1fr]">
        <ConversationHistory />
        <div className="space-y-4 sm:space-y-8">
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

          {/* How it works section (only show when model not ready) */}
          {!isModelReady && (
            <div className="border border-border rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">
                {lang === 'es' ? '¿Por qué Leaf AI?' : 'Why Leaf AI?'}
              </h2>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="inline-flex p-2 sm:p-3 bg-primary/10 rounded-full mb-2 sm:mb-3">
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                    {lang === 'es' ? 'Privado' : 'Private'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'es'
                      ? 'Tus conversaciones nunca salen de tu dispositivo'
                      : 'Your conversations never leave your device'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex p-2 sm:p-3 bg-primary/10 rounded-full mb-2 sm:mb-3">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                    {lang === 'es' ? 'Rápido' : 'Fast'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'es'
                      ? 'Funciona sin conexión después de la descarga inicial'
                      : 'Works offline after initial download'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex p-2 sm:p-3 bg-primary/10 rounded-full mb-2 sm:mb-3">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                    {lang === 'es' ? 'Accesible' : 'Accessible'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lang === 'es'
                      ? 'Gratis y de código abierto para todos'
                      : 'Free and open source for everyone'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
