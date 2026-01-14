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
   * Detect the best available engine
   */
  async detectEngine(): Promise<EngineInfo> {
    if (this.webGPUChecked && this.detectedEngine) {
      return this.getEngineInfo(this.detectedEngine)
    }

    // Check WebGPU support
    const webGPUResult = await workerEngine.checkWebGPUSupport()

    if (webGPUResult.supported) {
      this.detectedEngine = 'webllm'
      this.webGPUChecked = true
      return {
        type: 'webllm',
        supported: true,
        name: 'WebLLM (WebGPU)',
        description: 'Hardware-accelerated local AI using WebGPU. Fastest performance.',
      }
    }

    // Fallback to Transformers.js
    this.detectedEngine = 'transformers'
    this.webGPUChecked = true
    return {
      type: 'transformers',
      supported: true,
      name: 'Transformers.js (WebGL/WASM)',
      description: 'Local AI using WebGL or WebAssembly. Works on iOS and all devices.',
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
    const engineInfo = await this.detectEngine()

    if (engineInfo.type === 'webllm') {
      // Use WebLLM
      await workerEngine.loadModel(modelId as ModelId, onProgress)
    } else {
      // Use Transformers.js
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
