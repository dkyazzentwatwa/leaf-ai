import { useTranslation } from 'react-i18next'
import { Lock, Zap, Globe } from 'lucide-react'
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

        {/* Key Features */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="p-3 rounded-xl bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === 'es' ? 'Completamente Privado' : 'Completely Private'}</h3>
              <p className="text-sm text-muted-foreground">
                {lang === 'es' ? 'Toda la IA se ejecuta en tu dispositivo' : 'All AI runs on your device'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg">
            <div className="p-3 rounded-xl bg-accent/10">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === 'es' ? 'Rápido y Offline' : 'Fast & Offline'}</h3>
              <p className="text-sm text-muted-foreground">
                {lang === 'es' ? 'Funciona sin conexión después de la descarga' : 'Works offline after download'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="p-3 rounded-xl bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === 'es' ? 'Gratis y Abierto' : 'Free & Open'}</h3>
              <p className="text-sm text-muted-foreground">
                {lang === 'es' ? 'Código abierto para todos' : 'Open source for everyone'}
              </p>
            </div>
          </div>
        </div>
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
