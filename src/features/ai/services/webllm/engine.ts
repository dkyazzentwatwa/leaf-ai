/**
 * WebLLM Engine Service
 *
 * Manages local LLM inference using WebLLM.
 * All processing happens in the browser - no data sent to servers.
 */

import * as webllm from '@mlc-ai/web-llm'

// Model configurations - optimized for mobile/desktop balance
export const AVAILABLE_MODELS = {
  // Primary model - good balance of quality and size
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    name: 'Llama 3.2 3B',
    description: 'Best quality, ~2GB download',
    size: '~2GB',
    recommended: true,
    minRAM: 4,
  },
  // Smaller fallback
  'Phi-3.5-mini-instruct-q4f16_1-MLC': {
    name: 'Phi 3.5 Mini',
    description: 'Smaller model, ~1.5GB download',
    size: '~1.5GB',
    recommended: false,
    minRAM: 3,
  },
  // Tiny model for low-end devices
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': {
    name: 'Qwen 2.5 1.5B',
    description: 'Smallest model, ~1GB download',
    size: '~1GB',
    recommended: false,
    minRAM: 2,
  },
} as const

export type ModelId = keyof typeof AVAILABLE_MODELS

export const DEFAULT_MODEL: ModelId = 'Llama-3.2-3B-Instruct-q4f16_1-MLC'

export interface ModelLoadProgress {
  stage: 'downloading' | 'loading' | 'ready' | 'error'
  progress: number // 0-100
  text: string
  bytesLoaded?: number
  bytesTotal?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  stopSequences?: string[]
  onToken?: (token: string) => void
}

class WebLLMEngine {
  private engine: webllm.MLCEngineInterface | null = null
  private currentModel: ModelId | null = null
  private isLoading = false

  /**
   * Check if WebGPU is supported
   */
  async checkWebGPUSupport(): Promise<{ supported: boolean; error?: string }> {
    if (!navigator.gpu) {
      return {
        supported: false,
        error: 'WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.',
      }
    }

    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) {
        return {
          supported: false,
          error: 'No WebGPU adapter found. Your device may not support WebGPU.',
        }
      }
      return { supported: true }
    } catch (e) {
      return {
        supported: false,
        error: `WebGPU initialization failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Initialize the engine with a specific model
   */
  async loadModel(
    modelId: ModelId = DEFAULT_MODEL,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<void> {
    if (this.isLoading) {
      throw new Error('Model is already loading')
    }

    if (this.currentModel === modelId && this.engine) {
      onProgress?.({
        stage: 'ready',
        progress: 100,
        text: 'Model already loaded',
      })
      return
    }

    this.isLoading = true

    try {
      // Check WebGPU support first
      const gpuCheck = await this.checkWebGPUSupport()
      if (!gpuCheck.supported) {
        throw new Error(gpuCheck.error)
      }

      onProgress?.({
        stage: 'downloading',
        progress: 0,
        text: 'Initializing model download...',
      })

      // Create engine with progress callback
      this.engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          const progress = Math.round(report.progress * 100)

          let stage: ModelLoadProgress['stage'] = 'downloading'
          if (report.text.toLowerCase().includes('loading')) {
            stage = 'loading'
          }

          onProgress?.({
            stage,
            progress,
            text: report.text,
          })
        },
      })

      this.currentModel = modelId

      onProgress?.({
        stage: 'ready',
        progress: 100,
        text: 'Model ready!',
      })
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        text: error instanceof Error ? error.message : 'Failed to load model',
      })
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Generate a response from the model
   */
  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<string> {
    if (!this.engine) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    const {
      maxTokens = 1024,
      temperature = 0.7,
      topP = 0.95,
      stopSequences = [],
      onToken,
    } = options

    try {
      if (onToken) {
        // Streaming mode
        let fullResponse = ''
        const chunks = await this.engine.chat.completions.create({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop: stopSequences.length > 0 ? stopSequences : undefined,
          stream: true,
        })

        for await (const chunk of chunks) {
          const delta = chunk.choices[0]?.delta?.content || ''
          fullResponse += delta
          onToken(delta)
        }

        return fullResponse
      } else {
        // Non-streaming mode
        const response = await this.engine.chat.completions.create({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop: stopSequences.length > 0 ? stopSequences : undefined,
          stream: false,
        })

        return response.choices[0]?.message?.content || ''
      }
    } catch (error) {
      console.error('Generation error:', error)
      throw new Error(
        `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Reset the conversation context
   */
  async resetChat(): Promise<void> {
    if (this.engine) {
      await this.engine.resetChat()
    }
  }

  /**
   * Unload the current model to free memory
   */
  async unload(): Promise<void> {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
      this.currentModel = null
    }
  }

  /**
   * Check if a model is currently loaded
   */
  isModelLoaded(): boolean {
    return this.engine !== null && this.currentModel !== null
  }

  /**
   * Get the currently loaded model ID
   */
  getCurrentModel(): ModelId | null {
    return this.currentModel
  }

  /**
   * Get runtime stats (tokens/sec, etc.)
   */
  async getStats(): Promise<{ tokensPerSecond: number } | null> {
    if (!this.engine) return null

    try {
      const stats = await this.engine.runtimeStatsText()
      // Parse tokens/sec from stats text
      const match = stats.match(/(\d+\.?\d*)\s*tok\/s/)
      if (match) {
        return { tokensPerSecond: parseFloat(match[1]) }
      }
    } catch {
      // Stats not available
    }
    return null
  }
}

// Singleton instance
export const webLLMEngine = new WebLLMEngine()
