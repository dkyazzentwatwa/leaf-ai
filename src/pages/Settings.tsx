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
  Palette,
  Users,
  Info,
} from 'lucide-react'
import { ModelManager } from '@/features/ai/components/ModelManager'
import { ModelDownloader } from '@/features/ai/components/ModelDownloader'
import { PersonaManager } from '@/features/ai/components/PersonaManager'
import { ThemeGallery } from '@/features/theme'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">
            {lang === 'es' ? 'Configuración' : 'Settings'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'es'
            ? 'Gestiona modelos de IA y preferencias de la aplicación'
            : 'Manage AI models and app preferences'}
        </p>
      </div>

      {/* Appearance / Theme Selection */}
      <CollapsibleSection
        title={lang === 'es' ? 'Apariencia' : 'Appearance'}
        icon={<Palette className="h-5 w-5" />}
        defaultOpen
      >
        <ThemeGallery />
      </CollapsibleSection>

      {/* Model Status - Always visible inline */}
      <div className="mb-4 p-4 border border-border rounded-xl bg-card">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">
            {lang === 'es' ? 'Estado del Modelo' : 'Model Status'}
          </span>
          <span className="ml-auto">
            {isModelReady ? (
              <span className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {lang === 'es' ? 'Listo' : 'Ready'}
              </span>
            ) : modelStatus === 'loading' || modelStatus === 'downloading' ? (
              <span className="inline-flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                {lang === 'es' ? 'Cargando...' : 'Loading...'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                {lang === 'es' ? 'Sin modelo' : 'No model'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Download Model */}
      {!isModelReady && (
        <CollapsibleSection
          title={lang === 'es' ? 'Descargar Modelo' : 'Download Model'}
          icon={<Download className="h-5 w-5" />}
          defaultOpen
        >
          <ModelDownloader />
        </CollapsibleSection>
      )}

      {/* Model Management */}
      <CollapsibleSection
        title={lang === 'es' ? 'Gestión de Almacenamiento' : 'Storage Management'}
        icon={<Trash2 className="h-5 w-5" />}
      >
        <ModelManager />
      </CollapsibleSection>

      {/* Prompt Templates */}
      <CollapsibleSection
        title={lang === 'es' ? 'Plantillas de Prompt' : 'Prompt Templates'}
        icon={<FileText className="h-5 w-5" />}
      >
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
      </CollapsibleSection>

      {/* AI Personas */}
      <CollapsibleSection
        title={lang === 'es' ? 'Personas de IA' : 'AI Personas'}
        icon={<Users className="h-5 w-5" />}
      >
        <div className="border border-border rounded-lg p-4 bg-card">
          <PersonaManager />
        </div>
      </CollapsibleSection>

      {/* Privacy & Backup */}
      <CollapsibleSection
        title={lang === 'es' ? 'Privacidad y Respaldo' : 'Privacy & Backup'}
        icon={<Shield className="h-5 w-5" />}
      >
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
      </CollapsibleSection>

      {/* Performance */}
      <CollapsibleSection
        title={lang === 'es' ? 'Rendimiento' : 'Performance'}
        icon={<Gauge className="h-5 w-5" />}
      >
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
      </CollapsibleSection>

      {/* About the Models */}
      <CollapsibleSection
        title={lang === 'es' ? 'Acerca de los Modelos' : 'About the Models'}
        icon={<Info className="h-5 w-5" />}
      >
        <div className="p-4 bg-muted/50 border border-border rounded-lg">
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
        </div>
      </CollapsibleSection>
    </div>
  )
}
