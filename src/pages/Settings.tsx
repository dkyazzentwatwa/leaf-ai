import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings as SettingsIcon,
  HardDrive,
  Trash2,
  Download,
  Upload,
  FileText,
  Shield,
  Gauge,
  Plus,
  Pencil,
  X,
  AlertTriangle,
} from 'lucide-react'
import { ModelManager } from '@/features/ai/components/ModelManager'
import { ModelDownloader } from '@/features/ai/components/ModelDownloader'
import { PersonaManager } from '@/features/ai/components/PersonaManager'
import { useWebLLM } from '@/features/ai/hooks/useWebLLM'
import { useAIStore, selectIsModelReady, selectModelStatus } from '@/features/ai/stores/aiStore'
import { useToastStore } from '@/stores/toastStore'
import { safePrompt, safeConfirm } from '@/utils/userInput'
import { secureWipeAllData } from '@/utils/secureDelete'

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function Settings() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const isModelReady = useAIStore(selectIsModelReady)
  const modelStatus = useAIStore(selectModelStatus)
  const lastModelLoadMs = useAIStore((s) => s.lastModelLoadMs)
  const privacyMode = useAIStore((s) => s.privacyMode)
  const setPrivacyMode = useAIStore((s) => s.setPrivacyMode)
  const promptTemplates = useAIStore((s) => s.promptTemplates)
  const addPromptTemplate = useAIStore((s) => s.addPromptTemplate)
  const updatePromptTemplate = useAIStore((s) => s.updatePromptTemplate)
  const deletePromptTemplate = useAIStore((s) => s.deletePromptTemplate)
  const conversations = useAIStore((s) => s.conversations)
  const preferredModel = useAIStore((s) => s.preferredModel)
  const autoLoadModel = useAIStore((s) => s.autoLoadModel)
  const { getStats } = useWebLLM()
  const addToast = useToastStore((s) => s.addToast)

  const [tokensPerSecond, setTokensPerSecond] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportData = () => {
    const payload = {
      conversations,
      preferredModel,
      autoLoadModel,
      privacyMode,
      promptTemplates,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leaf-ai-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    addToast(lang === 'es' ? 'Respaldo descargado' : 'Backup downloaded', 'success')
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text) as {
        conversations?: typeof conversations
        preferredModel?: typeof preferredModel
        autoLoadModel?: boolean
        privacyMode?: boolean
        promptTemplates?: typeof promptTemplates
      }

      useAIStore.setState({
        conversations: payload.conversations || [],
        preferredModel: payload.preferredModel || preferredModel,
        autoLoadModel: payload.autoLoadModel ?? autoLoadModel,
        privacyMode: payload.privacyMode ?? privacyMode,
        promptTemplates: payload.promptTemplates || [],
      })

      addToast(lang === 'es' ? 'Respaldo restaurado' : 'Backup restored', 'success')
    } catch (error) {
      console.error('Failed to import backup:', error)
      addToast(lang === 'es' ? 'Error al importar respaldo' : 'Failed to import backup', 'error')
    } finally {
      if (event.target) event.target.value = ''
    }
  }

  const handleAddTemplate = () => {
    const title = safePrompt(lang === 'es' ? 'Título de la plantilla' : 'Template title', '', { maxLength: 100 })
    if (!title || !title.trim()) return
    const content = safePrompt(
      lang === 'es' ? 'Contenido de la plantilla' : 'Template content',
      '',
      { maxLength: 1000 }
    )
    if (!content || !content.trim()) return

    addPromptTemplate({
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
    })
    addToast(lang === 'es' ? 'Plantilla añadida' : 'Template added', 'success')
  }

  const handleEditTemplate = (templateId: string, currentTitle: string, currentContent: string) => {
    const title = safePrompt(lang === 'es' ? 'Editar título' : 'Edit title', currentTitle, { maxLength: 100 })
    if (title === null) return
    const content = safePrompt(lang === 'es' ? 'Editar contenido' : 'Edit content', currentContent, { maxLength: 1000 })
    if (content === null) return

    updatePromptTemplate(templateId, {
      title: title.trim() || currentTitle,
      content: content.trim() || currentContent,
    })
    addToast(lang === 'es' ? 'Plantilla actualizada' : 'Template updated', 'success')
  }

  const handleDeleteTemplate = (templateId: string) => {
    const confirmMessage = lang === 'es'
      ? '¿Eliminar esta plantilla?'
      : 'Delete this template?'

    if (!safeConfirm(confirmMessage)) return
    deletePromptTemplate(templateId)
    addToast(lang === 'es' ? 'Plantilla eliminada' : 'Template deleted', 'success')
  }

  const handleSecureWipe = async () => {
    const confirmMessage = lang === 'es'
      ? '⚠️ ADVERTENCIA: Esto borrará TODOS los datos de la aplicación de forma permanente (conversaciones, ajustes, modelos descargados). Esta acción no se puede deshacer.\n\n¿Estás seguro?'
      : '⚠️ WARNING: This will permanently erase ALL application data (conversations, settings, downloaded models). This action cannot be undone.\n\nAre you sure?'

    if (!safeConfirm(confirmMessage)) return

    try {
      await secureWipeAllData()
      addToast(
        lang === 'es' ? 'Datos borrados de forma segura' : 'Data securely wiped',
        'success'
      )
      // Reload page to reset application state
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Failed to wipe data:', error)
      addToast(
        lang === 'es' ? 'Error al borrar datos' : 'Failed to wipe data',
        'error'
      )
    }
  }

  const handleRefreshStats = async () => {
    setStatsLoading(true)
    try {
      const stats = await getStats()
      setTokensPerSecond(stats?.tokensPerSecond ?? null)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">
            {lang === 'es' ? 'Configuración' : 'Settings'}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {lang === 'es'
            ? 'Gestiona modelos de IA y preferencias de la aplicación'
            : 'Manage AI models and app preferences'}
        </p>
      </div>

      {/* Model Status */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          {lang === 'es' ? 'Estado del Modelo' : 'Model Status'}
        </h2>

        <div className="p-4 border border-border rounded-lg bg-card">
          {isModelReady ? (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-600 dark:text-green-400">
                {lang === 'es' ? 'Modelo listo' : 'Model ready'}
              </span>
            </div>
          ) : modelStatus === 'loading' || modelStatus === 'downloading' ? (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {lang === 'es' ? 'Cargando modelo...' : 'Loading model...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">
                {lang === 'es' ? 'Ningún modelo cargado' : 'No model loaded'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Download Model */}
      {!isModelReady && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            {lang === 'es' ? 'Descargar Modelo' : 'Download Model'}
          </h2>
          <ModelDownloader />
        </section>
      )}

      {/* Model Management */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          {lang === 'es' ? 'Gestión de Almacenamiento' : 'Storage Management'}
        </h2>
        <ModelManager />
      </section>

      {/* Prompt Templates */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {lang === 'es' ? 'Plantillas de Prompt' : 'Prompt Templates'}
        </h2>
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {lang === 'es'
                ? 'Guarda prompts frecuentes para reutilizarlos en el chat'
                : 'Save common prompts to reuse in chat'}
            </p>
            <button
              type="button"
              onClick={handleAddTemplate}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              {lang === 'es' ? 'Añadir' : 'Add'}
            </button>
          </div>
          {promptTemplates.length > 0 ? (
            <div className="space-y-2">
              {promptTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{template.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(template.id, template.title, template.content)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.content.length > 160
                      ? `${template.content.slice(0, 160)}...`
                      : template.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {lang === 'es' ? 'Sin plantillas guardadas.' : 'No templates saved yet.'}
            </p>
          )}
        </div>
      </section>

      {/* AI Personas */}
      <section className="mb-8">
        <div className="border border-border rounded-lg p-4 bg-card">
          <PersonaManager />
        </div>
      </section>

      {/* Privacy & Backup */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {lang === 'es' ? 'Privacidad y Respaldo' : 'Privacy & Backup'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-border rounded-lg p-4 bg-card space-y-2">
            <h3 className="font-medium text-sm">
              {lang === 'es' ? 'Modo Privacidad' : 'Privacy Mode'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'es'
                ? 'Aplica un desenfoque al chat para ocultar contenido en pantalla.'
                : 'Blur the chat to hide content on screen.'}
            </p>
            <button
              type="button"
              onClick={() => setPrivacyMode(!privacyMode)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              {privacyMode
                ? (lang === 'es' ? 'Desactivar' : 'Disable')
                : (lang === 'es' ? 'Activar' : 'Enable')}
            </button>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card space-y-2">
            <h3 className="font-medium text-sm">
              {lang === 'es' ? 'Respaldo Local' : 'Local Backup'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'es'
                ? 'Guarda o restaura conversaciones y ajustes.'
                : 'Export or restore conversations and settings.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                {lang === 'es' ? 'Exportar' : 'Export'}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                {lang === 'es' ? 'Importar' : 'Import'}
              </button>
              <button
                type="button"
                onClick={handleSecureWipe}
                className="inline-flex items-center gap-2 rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <AlertTriangle className="h-4 w-4" />
                {lang === 'es' ? 'Borrado Seguro' : 'Secure Wipe'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportData}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {lang === 'es'
                ? '⚠️ El borrado seguro elimina TODOS los datos de forma permanente, incluyendo modelos descargados.'
                : '⚠️ Secure wipe permanently erases ALL data including downloaded models.'}
            </p>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          {lang === 'es' ? 'Rendimiento' : 'Performance'}
        </h2>
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {lang === 'es' ? 'Velocidad de tokens' : 'Tokens per second'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tokensPerSecond ? `${tokensPerSecond.toFixed(2)} tok/s` : (lang === 'es' ? 'Sin datos' : 'No data')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshStats}
              disabled={statsLoading}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Gauge className="h-4 w-4" />
              {lang === 'es' ? 'Actualizar' : 'Refresh'}
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {lang === 'es' ? 'Último tiempo de carga' : 'Last model load time'}: {lastModelLoadMs ? `${lastModelLoadMs} ms` : (lang === 'es' ? 'Sin datos' : 'No data')}
          </div>
        </div>
      </section>

      {/* About the Models */}
      <section className="p-4 bg-muted/50 border border-border rounded-lg">
        <h3 className="font-medium mb-2">
          {lang === 'es' ? 'Acerca de los Modelos' : 'About the Models'}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {lang === 'es'
            ? 'Leaf AI utiliza modelos de lenguaje que se ejecutan completamente en tu navegador usando WebGPU. Los modelos se descargan una vez y se almacenan localmente.'
            : 'Leaf AI uses language models that run entirely in your browser using WebGPU. Models are downloaded once and stored locally.'}
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            <strong>Llama 3.2 3B</strong> - {lang === 'es' ? '~2GB, mejor calidad' : '~2GB, best quality'}
          </li>
          <li>
            <strong>Phi 3.5 Mini</strong> - {lang === 'es' ? '~1.5GB, buen balance' : '~1.5GB, good balance'}
          </li>
          <li>
            <strong>Qwen 2.5 1.5B</strong> - {lang === 'es' ? '~1GB, para dispositivos con menos recursos' : '~1GB, for lower-end devices'}
          </li>
        </ul>
      </section>
    </div>
  )
}
