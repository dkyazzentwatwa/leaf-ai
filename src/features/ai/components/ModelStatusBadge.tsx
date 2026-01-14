import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { useWebLLM } from '../hooks/useWebLLM'
import { useAIStore, selectModelStatus } from '../stores/aiStore'
import { cn } from '@/utils/cn'

export function ModelStatusBadge() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const modelStatus = useAIStore(selectModelStatus)
  const modelError = useAIStore((s) => s.modelError)
  const currentModel = useAIStore((s) => s.currentModel)
  const preferredModel = useAIStore((s) => s.preferredModel)
  const { loadModel } = useWebLLM()

  const statusConfig: Record<typeof modelStatus, { label: string; dot: string }> = {
    idle: {
      label: lang === 'es' ? 'Modelo sin cargar' : 'Model idle',
      dot: 'bg-gray-400',
    },
    downloading: {
      label: lang === 'es' ? 'Descargando modelo' : 'Downloading model',
      dot: 'bg-yellow-500 animate-pulse',
    },
    loading: {
      label: lang === 'es' ? 'Cargando modelo' : 'Loading model',
      dot: 'bg-yellow-500 animate-pulse',
    },
    ready: {
      label: lang === 'es' ? 'Modelo listo' : 'Model ready',
      dot: 'bg-green-500',
    },
    error: {
      label: lang === 'es' ? 'Error del modelo' : 'Model error',
      dot: 'bg-red-500',
    },
  }

  const isBusy = modelStatus === 'loading' || modelStatus === 'downloading'
  const currentName = currentModel || preferredModel
  const reloadLabel = lang === 'es' ? 'Recargar modelo' : 'Reload model'

  const handleReload = async () => {
    if (isBusy) return
    try {
      await loadModel()
    } catch (error) {
      console.error('Failed to reload model:', error)
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground"
      title={modelError || currentName || undefined}
    >
      <span className={cn('h-2 w-2 rounded-full', statusConfig[modelStatus].dot)} />
      <span className="hidden md:inline">{statusConfig[modelStatus].label}</span>
      <button
        type="button"
        onClick={handleReload}
        disabled={isBusy}
        className="rounded-full p-1 hover:text-foreground disabled:opacity-40"
        aria-label={reloadLabel}
        title={reloadLabel}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isBusy && 'animate-spin')} />
      </button>
    </div>
  )
}
