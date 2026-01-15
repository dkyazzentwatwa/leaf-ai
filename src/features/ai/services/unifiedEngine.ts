/**
 * Unified AI Engine
 *
 * Wrapper around WebLLM with proper error handling
 */

import { workerEngine } from './webllm/workerEngine'
import type { ModelId, ChatMessage, GenerateOptions } from './webllm/engine'

export type EngineType = 'webllm'
export type UnifiedModelId = ModelId

interface EngineInfo {
  type: EngineType
  supported: boolean
  name: string
  description: string
}

class UnifiedEngine {
  private webGPUChecked = false

  /**
   * Detect WebGPU support
   */
  async detectEngine(): Promise<EngineInfo> {
    if (this.webGPUChecked) {
      return {
        type: 'webllm',
        supported: true,
        name: 'WebLLM (WebGPU)',
        description: 'Hardware-accelerated local AI using WebGPU.',
      }
    }

    console.log('[UnifiedEngine] Checking WebGPU support...')

    try {
      const webGPUResult = await workerEngine.checkWebGPUSupport()

      this.webGPUChecked = true

      if (webGPUResult.supported) {
        console.log('[UnifiedEngine] WebGPU supported')
        return {
          type: 'webllm',
          supported: true,
          name: 'WebLLM (WebGPU)',
          description: 'Hardware-accelerated local AI using WebGPU.',
        }
      } else {
        console.log('[UnifiedEngine] WebGPU not supported:', webGPUResult.error)
        return {
          type: 'webllm',
          supported: false,
          name: 'WebLLM (WebGPU)',
          description: webGPUResult.error || 'WebGPU is not supported on this device.',
        }
      }
    } catch (error) {
      console.error('[UnifiedEngine] WebGPU check failed:', error)
      this.webGPUChecked = true
      return {
        type: 'webllm',
        supported: false,
        name: 'WebLLM (WebGPU)',
        description: 'Failed to check WebGPU support. Please refresh the page.',
      }
    }
  }

  /**
   * Load model using WebLLM
   */
  async loadModel(
    modelId: UnifiedModelId,
    onProgress?: (progress: any) => void
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
  async getAvailableModels(): Promise<Record<string, any>> {
    const { AVAILABLE_MODELS } = await import('./webllm/engine')
    return AVAILABLE_MODELS
  }

  /**
   * Get runtime stats (tokens/sec, etc.)
   */
  async getStats(): Promise<{ tokensPerSecond: number } | null> {
    return workerEngine.getStats()
  }
}

export const unifiedEngine = new UnifiedEngine()
