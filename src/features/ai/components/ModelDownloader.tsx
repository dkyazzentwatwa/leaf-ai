/**
 * Model Downloader Component
 *
 * Shows model download progress and allows users to select/download AI models.
 * Includes WebGPU compatibility check and clear progress indicators.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Download,
  Cpu,
  CheckCircle2,
  Loader2,
  Info,
  Trash2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { useWebLLM } from '../hooks/useWebLLM'
import { AVAILABLE_MODELS, type ModelId } from '../services/webllm/engine'
import { unifiedEngine } from '../services/unifiedEngine'
import { useAIStore } from '../stores/aiStore'
import { cn } from '@/utils/cn'

interface ModelDownloaderProps {
  onModelReady?: () => void
  compact?: boolean
}

const identifyModel = (cacheName: string, urls: string[]): ModelId | null => {
  const modelPatterns = Object.keys(AVAILABLE_MODELS) as ModelId[]

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

export function ModelDownloader({ onModelReady, compact = false }: ModelDownloaderProps) {
  const [engineInfo, setEngineInfo] = useState<{
    supported: boolean
    name: string
    description: string
  } | null>(null)
  const availableModels = AVAILABLE_MODELS
  const preferredModel = useAIStore((s) => s.preferredModel)
  const setPreferredModel = useAIStore((s) => s.setPreferredModel)
  const [selectedModel, setSelectedModel] = useState<ModelId>(preferredModel as ModelId)
  const [cachedModels, setCachedModels] = useState<Set<ModelId>>(new Set())

  const {
    isModelReady,
    isModelLoading,
    modelProgress,
    modelError,
    loadModel,
    unloadModel,
  } = useWebLLM()

  const currentModel = useAIStore((s) => s.currentModel)

  const loadCachedModels = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !('caches' in window)) {
        setCachedModels(new Set())
        return
      }

      const cacheNames = await caches.keys()
      const found = new Set<ModelId>()

      for (const cacheName of cacheNames) {
        if (!cacheName.includes('webllm') && !cacheName.includes('mlc') && !cacheName.includes('tvmjs')) {
          continue
        }

        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        if (keys.length === 0) continue

        const modelId = identifyModel(cacheName, keys.map((key) => key.url))
        if (modelId) {
          found.add(modelId)
        }
      }

      setCachedModels(found)
    } catch (error) {
      console.error('Failed to check model cache:', error)
    }
  }, [])

  // Detect WebGPU support on mount
  useEffect(() => {
    unifiedEngine.detectEngine().then((info) => {
      setEngineInfo(info)
    })
  }, [])

  useEffect(() => {
    loadCachedModels()
  }, [loadCachedModels])

  useEffect(() => {
    setSelectedModel(preferredModel as ModelId)
  }, [preferredModel])

  // Notify when model is ready
  useEffect(() => {
    if (isModelReady && onModelReady) {
      onModelReady()
    }
  }, [isModelReady, onModelReady])

  const handleDownload = async () => {
    setPreferredModel(selectedModel)
    try {
      await loadModel(selectedModel)
      await loadCachedModels()
    } catch (error) {
      console.error('Failed to load model:', error)
    }
  }

  const handleSelectModel = (modelId: ModelId) => {
    setSelectedModel(modelId)
    setPreferredModel(modelId)
  }

  const handleUnload = async () => {
    await unloadModel()
  }

  // Loading state for engine detection
  if (!engineInfo) {
    return (
      <div className={cn('border border-border rounded-lg p-3 sm:p-4', compact && 'p-2 sm:p-3')}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
          <span className="text-sm sm:text-base text-muted-foreground">Checking AI compatibility...</span>
        </div>
      </div>
    )
  }

  // Model is ready
  if (isModelReady && currentModel) {
    const modelInfo = availableModels[currentModel]

    if (compact) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">AI Ready</span>
          <span className="text-xs text-muted-foreground">({modelInfo?.name})</span>
        </div>
      )
    }

    return (
      <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">AI Model Ready</h3>
              <p className="text-sm text-muted-foreground">
                {modelInfo?.name} loaded and ready to use
              </p>
            </div>
          </div>
          <button
            onClick={handleUnload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive border border-border rounded-md hover:border-destructive/50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Unload
          </button>
        </div>
      </div>
    )
  }

  // Model is loading
  if (isModelLoading && modelProgress) {
    return (
      <div className={cn('border border-border rounded-lg p-4', compact && 'p-3')}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">
                {modelProgress.stage === 'downloading' ? 'Downloading AI Model...' : 'Loading AI Model...'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {modelProgress.text}
              </p>
            </div>
            <span className="text-sm font-medium">{modelProgress.progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${modelProgress.progress}%` }}
            />
          </div>

          {!compact && (
            <p className="text-xs text-muted-foreground">
              <Info className="h-3 w-3 inline mr-1" />
              The model is cached after first download. Future loads will be instant.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (modelError) {
    return (
      <div className={cn('border border-destructive/50 bg-destructive/10 rounded-lg p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Failed to Load AI</h3>
            <p className="text-sm text-muted-foreground mt-1">{modelError}</p>
            <button
              onClick={handleDownload}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isSelectedCached = cachedModels.has(selectedModel)
  const actionLabel = isSelectedCached ? 'Load' : 'Download'

  // Default: Model selection & download UI
  if (compact) {
    return (
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
      >
        <Download className="h-4 w-4" />
        {actionLabel} AI Model
      </button>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Cpu className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Local AI Assistant</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Download an AI model to enable the rights assistant, document generator, and smart
            features. All processing happens locally on your device - your data never leaves
            your phone.
          </p>
        </div>
      </div>

      {/* iOS WebGPU Support Banner */}
      {engineInfo && engineInfo.supported &&
       (navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad')) && (
        <div className="flex items-start gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-md">
          <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
              WebGPU Active on iOS!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your device supports hardware-accelerated AI. Enjoy fast, local AI processing!
            </p>
          </div>
        </div>
      )}

      {/* Model selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Model</label>
        <div className="space-y-2">
          {(Object.entries(availableModels) as [ModelId, any][]).map(
            ([id, info]) => (
              <label
                key={id}
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedModel === id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="radio"
                  name="model"
                  value={id}
                  checked={selectedModel === id}
                  onChange={() => handleSelectModel(id)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    selectedModel === id ? 'border-primary' : 'border-muted-foreground'
                  )}
                >
                  {selectedModel === id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{info.name}</span>
                  {info.recommended && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  {cachedModels.has(id) && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Cached
                    </span>
                  )}
                </div>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{info.size}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <Download className="h-5 w-5" />
        {actionLabel} {availableModels[selectedModel]?.name || 'Model'}
      </button>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          {isSelectedCached
            ? 'This model is already cached, so loading will be fast.'
            : 'The AI model is downloaded once and cached in your browser.'} All conversations are
          processed locally - no data is ever sent to external servers. This protects your
          privacy completely.
        </p>
      </div>
    </div>
  )
}
