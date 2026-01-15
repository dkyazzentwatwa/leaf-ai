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
  const [availableModels, setAvailableModels] = useState<Record<string, any>>({})
  const [isIOS, setIsIOS] = useState(false)
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

  // Detect WebGPU support and filter models by platform
  useEffect(() => {
    unifiedEngine.detectEngine().then((info) => {
      setEngineInfo(info)

      // Detect platform (iOS/Android/Desktop)
      const ua = navigator.userAgent
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

      setIsIOS(isIOSDevice)

      // Filter models based on platform
      const filtered = Object.fromEntries(
        Object.entries(AVAILABLE_MODELS).filter(([_, modelInfo]) => {
          if (isIOSDevice) {
            // iOS: Only show iOS-compatible models (< 400MB)
            return modelInfo.iosOnly === true
          } else {
            // Desktop/Android: Only show non-iOS models (1-3GB)
            return modelInfo.iosOnly === false
          }
        })
      )

      setAvailableModels(filtered)

      // Set default model based on platform
      if (isIOSDevice && Object.keys(filtered).length > 0) {
        const firstIOSModel = Object.keys(filtered)[0] as ModelId
        // Only update if current preferred model is not iOS-compatible
        const currentModelInfo = AVAILABLE_MODELS[preferredModel as ModelId]
        if (!currentModelInfo || !currentModelInfo.iosOnly) {
          setPreferredModel(firstIOSModel)
          setSelectedModel(firstIOSModel)
        }
      }
    })
  }, [preferredModel, setPreferredModel])

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
      <div className={cn('border border-border rounded-lg p-3 sm:p-4 w-full', compact && 'p-2 sm:p-3')}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground flex-shrink-0" />
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
      <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4 w-full">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-green-700 dark:text-green-400">AI Model Ready</h3>
              <p className="text-sm text-muted-foreground truncate">
                {modelInfo?.name} loaded and ready to use
              </p>
            </div>
          </div>
          <button
            onClick={handleUnload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive border border-border rounded-md hover:border-destructive/50 transition-colors flex-shrink-0"
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
      <div className={cn('border border-border rounded-lg p-4 w-full', compact && 'p-3')}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">
                {modelProgress.stage === 'downloading' ? 'Downloading AI Model...' : 'Loading AI Model...'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {modelProgress.text}
              </p>
            </div>
            <span className="text-sm font-medium flex-shrink-0">{modelProgress.progress}%</span>
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
      <div className={cn('border border-destructive/50 bg-destructive/10 rounded-lg p-4 w-full', compact && 'p-3')}>
        <div className="flex items-start gap-3 min-w-0">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-destructive">Failed to Load AI</h3>
            <p className="text-sm text-muted-foreground mt-1 break-words">{modelError}</p>
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
    <div className="border border-border rounded-2xl p-6 sm:p-8 space-y-6 w-full bg-card shadow-sm">
      <div className="flex items-start gap-4 sm:gap-5 min-w-0">
        <div className="p-4 bg-primary/10 rounded-2xl flex-shrink-0">
          <Cpu className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-xl sm:text-2xl tracking-tight mb-2">Get Started with Local AI</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
            Download an AI model to start chatting. All processing happens on your device—your conversations never leave your browser.
          </p>
        </div>
      </div>

      {/* iOS WebGPU Support Banner */}
      {isIOS && engineInfo?.supported && (
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl min-w-0">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">
              iPhone/iPad Detected - WebGPU Active!
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
              Your device supports hardware-accelerated AI. Using optimized iOS models (&lt; 1GB) for best performance.
            </p>
          </div>
        </div>
      )}

      {/* Model selection */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Select AI Model</h3>
        <div className="space-y-3">
          {(Object.entries(availableModels) as [ModelId, any][]).map(
            ([id, info]) => (
              <label
                key={id}
                className={cn(
                  'flex items-center gap-3 sm:gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 min-w-0',
                  selectedModel === id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
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
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedModel === id ? 'border-primary' : 'border-muted-foreground'
                  )}
                >
                  {selectedModel === id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-medium text-sm sm:text-base">{info.name}</span>
                  {info.recommended && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                  {cachedModels.has(id) && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">
                      Cached
                    </span>
                  )}
                </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {info.description}
                  </p>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">{info.size}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-base shadow-sm hover:shadow-md"
      >
        <Download className="h-5 w-5" />
        {actionLabel} {availableModels[selectedModel]?.name || 'Model'}
      </button>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 text-sm text-muted-foreground min-w-0 border border-border/40">
        <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-accent" />
        <p className="flex-1 min-w-0 break-words leading-relaxed">
          {isSelectedCached
            ? 'This model is already cached—loading will be instant. '
            : 'The AI model downloads once and caches in your browser. '}
          All conversations are processed locally. No data ever leaves your device.
        </p>
      </div>
    </div>
  )
}
