/**
 * Unified AI Engine
 *
 * Wrapper around WebLLM with proper error handling
 */

import { workerEngine } from './webllm/workerEngine'
import type { ModelId, ChatMessage, GenerateOptions, ModelLoadProgress, ModelInfo } from './webllm/engine'

export type EngineType = 'webllm'
export type UnifiedModelId = ModelId

interface EngineInfo {
  type: EngineType
  supported: boolean
  name: string
  description: string
}

class UnifiedEngine {
  private cachedEngineInfo: EngineInfo | null = null

  /**
   * Detect WebGPU support
   */
  async detectEngine(): Promise<EngineInfo> {
    if (this.cachedEngineInfo) {
      return this.cachedEngineInfo
    }

    console.log('[UnifiedEngine] Checking WebGPU support...')

    try {
      const webGPUResult = await workerEngine.checkWebGPUSupport()

      if (webGPUResult.supported) {
        console.log('[UnifiedEngine] WebGPU supported')
        this.cachedEngineInfo = {
          type: 'webllm',
          supported: true,
          name: 'WebLLM (WebGPU)',
          description: 'Hardware-accelerated local AI using WebGPU.',
        }
        return this.cachedEngineInfo
      }

      console.log('[UnifiedEngine] WebGPU not supported:', webGPUResult.error)
      this.cachedEngineInfo = {
        type: 'webllm',
        supported: false,
        name: 'WebLLM (WebGPU)',
        description: webGPUResult.error || 'WebGPU is not supported on this device.',
      }
      return this.cachedEngineInfo
    } catch (error) {
      console.error('[UnifiedEngine] WebGPU check failed:', error)
      this.cachedEngineInfo = {
        type: 'webllm',
        supported: false,
        name: 'WebLLM (WebGPU)',
        description: 'Failed to check WebGPU support. Please refresh the page.',
      }
      return this.cachedEngineInfo
    }
  }

  /**
   * Load model using WebLLM
   */
  async loadModel(
    modelId: UnifiedModelId,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<void> {
    console.log('[UnifiedEngine] Loading model:', modelId)
    await workerEngine.loadModel(modelId, onProgress)
  }

  /**
   * Generate response using WebLLM
   */
  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<string> {
    return workerEngine.generate(messages, options)
  }

  /**
   * Stop generation
   */
  stopGeneration(): void {
    workerEngine.stopGeneration()
  }

  /**
   * Reset chat context
   */
  async resetChat(): Promise<void> {
    await workerEngine.resetChat()
  }

  /**
   * Unload model
   */
  async unload(): Promise<void> {
    await workerEngine.unload()
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return workerEngine.isModelLoaded()
  }

  /**
   * Get current model
   */
  getCurrentModel(): UnifiedModelId | null {
    return workerEngine.getCurrentModel()
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<Record<string, ModelInfo>> {
    const { AVAILABLE_MODELS } = await import('./webllm/engine')
    return AVAILABLE_MODELS as Record<string, ModelInfo>
  }

  /**
   * Get runtime stats (tokens/sec, etc.)
   */
  async getStats(): Promise<{ tokensPerSecond: number } | null> {
    return workerEngine.getStats()
  }
}

export const unifiedEngine = new UnifiedEngine()
