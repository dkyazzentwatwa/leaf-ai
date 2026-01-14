/**
 * Model Manager Component
 *
 * Allows users to view downloaded AI models, see storage usage,
 * and delete models to free up space.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  AlertTriangle,
} from 'lucide-react'
import { AVAILABLE_MODELS, type ModelId } from '../services/webllm/engine'
import { workerEngine } from '../services/webllm/workerEngine'
import { useAIStore } from '../stores/aiStore'
import { cn } from '@/utils/cn'

interface CachedModel {
  id: string
  name: string
  size: number
  cacheKeys: string[]
}

interface StorageInfo {
  used: number
  quota: number
  models: CachedModel[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

async function getStorageInfo(): Promise<StorageInfo> {
  const models: CachedModel[] = []
  let totalUsed = 0

  try {
    // Get storage estimate
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      totalUsed = estimate.usage || 0
    }

    // Get all cache names
    const cacheNames = await caches.keys()

    // Find WebLLM caches
    for (const cacheName of cacheNames) {
      if (cacheName.includes('webllm') || cacheName.includes('mlc') || cacheName.includes('tvmjs')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()

        let cacheSize = 0
        for (const request of keys) {
          try {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.clone().blob()
              cacheSize += blob.size
            }
          } catch {
            // Skip if can't read size
          }
        }

        if (keys.length > 0) {
          // Try to identify which model this cache belongs to
          const modelId = identifyModel(cacheName, keys.map(k => k.url))

          models.push({
            id: cacheName,
            name: modelId ? AVAILABLE_MODELS[modelId as ModelId]?.name || modelId : cacheName,
            size: cacheSize,
            cacheKeys: keys.map(k => k.url),
          })
        }
      }
    }

    const quota = (await navigator.storage?.estimate())?.quota || 0

    return {
      used: totalUsed,
      quota,
      models,
    }
  } catch (error) {
    console.error('Failed to get storage info:', error)
    return { used: 0, quota: 0, models: [] }
  }
}

function identifyModel(cacheName: string, urls: string[]): string | null {
  const modelPatterns = Object.keys(AVAILABLE_MODELS)

  for (const pattern of modelPatterns) {
    const shortName = pattern.replace('-MLC', '').toLowerCase()
    if (cacheName.toLowerCase().includes(shortName)) {
      return pattern
    }
    for (const url of urls) {
      if (url.toLowerCase().includes(shortName)) {
        return pattern
      }
    }
  }

  return null
}

async function deleteModelCache(cacheId: string): Promise<boolean> {
  try {
    const deleted = await caches.delete(cacheId)
    return deleted
  } catch (error) {
    console.error('Failed to delete cache:', error)
    return false
  }
}

async function clearAllModelCaches(): Promise<number> {
  let deletedCount = 0
  try {
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      if (cacheName.includes('webllm') || cacheName.includes('mlc') || cacheName.includes('tvmjs')) {
        const deleted = await caches.delete(cacheName)
        if (deleted) deletedCount++
      }
    }
  } catch (error) {
    console.error('Failed to clear caches:', error)
  }
  return deletedCount
}

async function clearIndexedDBs(): Promise<void> {
  try {
    // Get all IndexedDB databases
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name && (
          db.name.includes('webllm') ||
          db.name.includes('mlc') ||
          db.name.includes('tvmjs') ||
          db.name.includes('cache')
        )) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error)
  }
}

async function clearAllAppData(): Promise<void> {
  try {
    // Clear all caches
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))

    // Clear all IndexedDB
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    }

    // Clear localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()
  } catch (error) {
    console.error('Failed to clear all app data:', error)
    throw error
  }
}

export function ModelManager() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const setModelStatus = useAIStore((s) => s.setModelStatus)

  const loadStorageInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await getStorageInfo()
      setStorageInfo(info)
    } catch (err) {
      setError(lang === 'es' ? 'Error al cargar información de almacenamiento' : 'Failed to load storage information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStorageInfo()
  }, [])

  const handleDeleteModel = async (cacheId: string, modelName: string) => {
    setDeleting(cacheId)
    setError(null)
    setSuccess(null)

    try {
      // Unload the model from memory first
      await workerEngine.unload()

      // Delete the cache
      const deleted = await deleteModelCache(cacheId)

      // Also clear related IndexedDB entries
      await clearIndexedDBs()

      // Reset model status in store
      setModelStatus('idle')

      if (deleted) {
        setSuccess(lang === 'es' ? `${modelName} eliminado` : `Deleted ${modelName}`)
        await loadStorageInfo()
      } else {
        setError(lang === 'es' ? `Error al eliminar ${modelName}` : `Failed to delete ${modelName}`)
      }
    } catch {
      setError(lang === 'es' ? `Error al eliminar ${modelName}` : `Failed to delete ${modelName}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAllModels = async () => {
    const confirmMessage = lang === 'es'
      ? '¿Eliminar todos los modelos de IA descargados? Necesitarás volver a descargarlos para usar las funciones de IA.'
      : 'Delete all downloaded AI models? You will need to re-download them to use AI features.'

    if (!confirm(confirmMessage)) {
      return
    }

    setDeleting('all')
    setError(null)
    setSuccess(null)

    try {
      // Unload current model
      await workerEngine.unload()

      // Clear all model caches
      const count = await clearAllModelCaches()

      // Clear IndexedDB entries
      await clearIndexedDBs()

      // Reset model status
      setModelStatus('idle')

      setSuccess(lang === 'es'
        ? `${count} caché(s) de modelo eliminado(s)`
        : `Cleared ${count} model cache(s)`)
      await loadStorageInfo()
    } catch {
      setError(lang === 'es' ? 'Error al limpiar cachés de modelos' : 'Failed to clear model caches')
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAllData = async () => {
    const confirmMessage = lang === 'es'
      ? '¿Eliminar TODOS los datos de la aplicación? Esto incluye modelos, conversaciones y configuraciones. La página se recargará.'
      : 'Delete ALL app data? This includes models, conversations, and settings. The page will reload.'

    if (!confirm(confirmMessage)) {
      return
    }

    setDeleting('all-data')
    setError(null)
    setSuccess(null)

    try {
      // Terminate the worker
      workerEngine.terminate()

      // Clear everything
      await clearAllAppData()

      // Reload the page to reset state
      window.location.reload()
    } catch {
      setError(lang === 'es' ? 'Error al limpiar datos de la aplicación' : 'Failed to clear app data')
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">
            {lang === 'es' ? 'Cargando información de almacenamiento...' : 'Loading storage info...'}
          </span>
        </div>
      </div>
    )
  }

  const usedPercent = storageInfo?.quota
    ? Math.round((storageInfo.used / storageInfo.quota) * 100)
    : 0

  return (
    <div className="border border-border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">
              {lang === 'es' ? 'Modelos de IA Descargados' : 'Downloaded AI Models'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === 'es'
                ? 'Administra modelos en caché para liberar espacio'
                : 'Manage cached models to free up storage'}
            </p>
          </div>
        </div>
        <button
          onClick={loadStorageInfo}
          disabled={loading}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={lang === 'es' ? 'Actualizar' : 'Refresh'}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Storage Usage */}
      {storageInfo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span>{lang === 'es' ? 'Almacenamiento Usado' : 'Storage Used'}</span>
            </span>
            <span className="font-medium">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-yellow-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Offline Cache Summary */}
      {storageInfo && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            {lang === 'es' ? 'Caché offline' : 'Offline cache'}
          </span>
          <span className="font-medium">
            {storageInfo.models.length > 0
              ? `${storageInfo.models.length} ${lang === 'es' ? 'modelo(s)' : 'model(s)'} · ${formatBytes(storageInfo.used)}`
              : (lang === 'es' ? 'Sin modelos descargados' : 'No cached models')}
          </span>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model List */}
      {storageInfo && storageInfo.models.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {lang === 'es' ? 'Modelos en Caché' : 'Cached Models'}
          </h4>
          <div className="space-y-2">
            {storageInfo.models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">{model.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(model.size)} • {model.cacheKeys.length} {lang === 'es' ? 'archivos' : 'files'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteModel(model.id, model.name)}
                  disabled={deleting !== null}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive border border-border rounded-md hover:border-destructive/50 transition-colors disabled:opacity-50"
                >
                  {deleting === model.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{lang === 'es' ? 'Eliminar' : 'Delete'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Clear All Models Button */}
          <button
            onClick={handleClearAllModels}
            disabled={deleting !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {deleting === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>{lang === 'es' ? 'Eliminar Todos los Modelos' : 'Clear All Models'}</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{lang === 'es' ? 'No hay modelos de IA descargados' : 'No AI models downloaded yet'}</p>
          <p className="text-sm mt-1">
            {lang === 'es'
              ? 'Descarga un modelo desde la página principal para usar las funciones de IA'
              : 'Download a model from the main page to use AI features'}
          </p>
        </div>
      )}

      {/* Clear All App Data */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={handleClearAllData}
          disabled={deleting !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-destructive/80 hover:text-destructive border border-border rounded-lg hover:border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {deleting === 'all-data' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{lang === 'es' ? 'Borrar Todos los Datos de la App' : 'Clear All App Data'}</span>
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {lang === 'es'
            ? 'Elimina modelos, conversaciones y configuraciones'
            : 'Removes models, conversations, and settings'}
        </p>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        <p>
          {lang === 'es'
            ? 'Los modelos se almacenan en la caché de tu navegador. Eliminarlos requerirá volver a descargar (~2GB) para usar las funciones de IA nuevamente.'
            : 'Models are stored in your browser\'s cache. Deleting them will require re-downloading (~2GB) to use AI features again.'}
        </p>
      </div>
    </div>
  )
}
