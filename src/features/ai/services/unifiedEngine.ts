/**
 * Unified AI Engine
 *
 * Automatically selects the best available AI engine:
 * - WebGPU available → WebLLM (faster, bigger models)
 * - No WebGPU (iOS, old browsers) → Transformers.js (WebGL/WASM, smaller models)
 */

import { workerEngine } from './webllm/workerEngine'
import { transformersEngine, TRANSFORMERS_MODELS, type TransformersModelId } from './transformers/engine'
import type { ModelId, ChatMessage, GenerateOptions as WebLLMOptions } from './webllm/engine'
import type { GenerateOptions as TransformersOptions } from './transformers/engine'

export type EngineType = 'webllm' | 'transformers'
export type UnifiedModelId = ModelId | TransformersModelId

interface EngineInfo {
  type: EngineType
  supported: boolean
  name: string
  description: string
}

class UnifiedEngine {
  private detectedEngine: EngineType | null = null
  private webGPUChecked = false

  /**
   * Detect if running on iOS/iPad
   */
  private isIOS(): boolean {
    if (typeof navigator === 'undefined') return false

    const ua = navigator.userAgent
    const isIOSUA = /iPad|iPhone|iPod/.test(ua)
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

    return isIOSUA || isIPadOS
  }

  /**
   * Detect the best available engine
   */
  async detectEngine(): Promise<EngineInfo> {
    if (this.webGPUChecked && this.detectedEngine) {
      return this.getEngineInfo(this.detectedEngine)
    }

    console.log('[UnifiedEngine] Starting engine detection...')

    // CRITICAL: Skip WebGPU check on iOS to prevent crashes
    if (this.isIOS()) {
      console.log('[UnifiedEngine] iOS detected - using Transformers.js')
      this.detectedEngine = 'transformers'
      this.webGPUChecked = true
      return {
        type: 'transformers',
        supported: true,
        name: 'Transformers.js (WebGL/WASM)',
        description: 'Local AI optimized for iOS using WebGL/WebAssembly.',
      }
    }

    // For non-iOS, check WebGPU support safely
    try {
      console.log('[UnifiedEngine] Checking WebGPU support...')
      const webGPUResult = await workerEngine.checkWebGPUSupport()

      if (webGPUResult.supported) {
        console.log('[UnifiedEngine] WebGPU supported - using WebLLM')
        this.detectedEngine = 'webllm'
        this.webGPUChecked = true
        return {
          type: 'webllm',
          supported: true,
          name: 'WebLLM (WebGPU)',
          description: 'Hardware-accelerated local AI using WebGPU. Fastest performance.',
        }
      }
    } catch (error) {
      console.warn('[UnifiedEngine] WebGPU check failed:', error)
      // Fall through to Transformers.js
    }

    // Fallback to Transformers.js
    console.log('[UnifiedEngine] Using Transformers.js fallback')
    this.detectedEngine = 'transformers'
    this.webGPUChecked = true
    return {
      type: 'transformers',
      supported: true,
      name: 'Transformers.js (WebGL/WASM)',
      description: 'Local AI using WebGL or WebAssembly. Works on all devices.',
    }
  }

  /**
   * Get current engine info
   */
  getEngineInfo(type: EngineType): EngineInfo {
    if (type === 'webllm') {
      return {
        type: 'webllm',
        supported: true,
        name: 'WebLLM (WebGPU)',
        description: 'Hardware-accelerated local AI using WebGPU',
      }
    }
    return {
      type: 'transformers',
      supported: true,
      name: 'Transformers.js (WebGL/WASM)',
      description: 'Local AI using WebGL or WebAssembly',
    }
  }

  /**
   * Load model using the appropriate engine
   */
  async loadModel(
    modelId: UnifiedModelId,
    onProgress?: (progress: any) => void
  ): Promise<void> {
    console.log('[UnifiedEngine] Loading model:', modelId)

    try {
      const engineInfo = await this.detectEngine()

      if (engineInfo.type === 'webllm') {
        // Use WebLLM
        console.log('[UnifiedEngine] Using WebLLM engine')
        await workerEngine.loadModel(modelId as ModelId, onProgress)
      } else {
        // Use Transformers.js
        console.log('[UnifiedEngine] Using Transformers.js engine')
        await transformersEngine.loadModel(modelId as TransformersModelId, (progress) => {
          if (onProgress) {
            // Convert to WebLLM-style progress
            const percent = progress.total > 0
              ? Math.round((progress.loaded / progress.total) * 100)
              : 0

            onProgress({
              stage: progress.status.includes('download') ? 'downloading' : 'loading',
              progress: percent,
              text: progress.status,
            })
          }
        })
      }

      console.log('[UnifiedEngine] Model loaded successfully')
    } catch (error) {
      console.error('[UnifiedEngine] Failed to load model:', error)
      throw error
    }
  }

  /**
   * Generate response using the appropriate engine
   */
  async generate(
    messages: ChatMessage[],
    options: WebLLMOptions | TransformersOptions = {}
  ): Promise<string> {
    const engineInfo = await this.detectEngine()

    if (engineInfo.type === 'webllm') {
      return workerEngine.generate(messages, options as WebLLMOptions)
    } else {
      return transformersEngine.generate(messages, options as TransformersOptions)
    }
  }

  /**
   * Stop generation
   */
  stopGeneration(): void {
    if (this.detectedEngine === 'webllm') {
      workerEngine.stopGeneration()
    }
    // Transformers.js doesn't support stopping mid-generation
  }

  /**
   * Reset chat context
   */
  async resetChat(): Promise<void> {
    if (this.detectedEngine === 'webllm') {
      await workerEngine.resetChat()
    }
    // Transformers.js is stateless
  }

  /**
   * Unload model
   */
  async unload(): Promise<void> {
    if (this.detectedEngine === 'webllm') {
      await workerEngine.unload()
    } else if (this.detectedEngine === 'transformers') {
      transformersEngine.unload()
    }
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    if (this.detectedEngine === 'webllm') {
      return workerEngine.isModelLoaded()
    } else if (this.detectedEngine === 'transformers') {
      return transformersEngine.isModelLoaded()
    }
    return false
  }

  /**
   * Get current model
   */
  getCurrentModel(): UnifiedModelId | null {
    if (this.detectedEngine === 'webllm') {
      return workerEngine.getCurrentModel()
    } else if (this.detectedEngine === 'transformers') {
      return transformersEngine.getCurrentModel()
    }
    return null
  }

  /**
   * Get detected engine type
   */
  getEngineType(): EngineType | null {
    return this.detectedEngine
  }

  /**
   * Get available models for current engine
   */
  async getAvailableModels(): Promise<Record<string, any>> {
    const engineInfo = await this.detectEngine()

    if (engineInfo.type === 'webllm') {
      const { AVAILABLE_MODELS } = await import('./webllm/engine')
      return AVAILABLE_MODELS
    } else {
      return TRANSFORMERS_MODELS
    }
  }
}

export const unifiedEngine = new UnifiedEngine()
