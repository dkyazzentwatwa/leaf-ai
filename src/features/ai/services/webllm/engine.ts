/**
 * WebLLM Engine Service
 *
 * Manages local LLM inference using WebLLM.
 * All processing happens in the browser - no data sent to servers.
 */

import * as webllm from '@mlc-ai/web-llm'

// Model configurations - iOS-first with mandatory 4-bit quantization
export const AVAILABLE_MODELS = {
  // ===== iOS-ONLY MODELS (<1GB, 4-BIT QUANTIZED) =====
  // These models are designed for iOS 26+ Safari with strict memory limits
  'SmolLM2-135M-Instruct-q0f16-MLC': {
    name: 'SmolLM2 135M (q0)',
    description: 'Ultra-tiny 2-bit model for iOS',
    size: '~360MB',
    recommended: true, // Recommended for iOS
    minRAM: 1,
    iosOnly: true,
    maxBufferSizeMB: 400,
    performance: '2-3 tok/sec on iPhone 17 Pro',
    quantization: 'q0f16', // 2-bit weights, f16 activations
  },
  'SmolLM2-360M-Instruct-q4f16_1-MLC': {
    name: 'SmolLM2 360M (q4)',
    description: 'Small 4-bit model for iOS',
    size: '~376MB',
    recommended: false,
    minRAM: 1,
    iosOnly: true,
    maxBufferSizeMB: 400,
    performance: '2-3 tok/sec on iPhone 17 Pro',
    quantization: 'q4f16_1',
  },
  'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC': {
    name: 'TinyLlama 1.1B (q4)',
    description: 'Small 4-bit model for newer iPhones',
    size: '~697MB',
    recommended: false,
    minRAM: 2,
    iosOnly: true,
    maxBufferSizeMB: 700,
    performance: '1-2 tok/sec on iPhone 17 Pro',
    quantization: 'q4f16_1',
  },
  'Qwen2.5-0.5B-Instruct-q4f16_1-MLC': {
    name: 'Qwen 2.5 0.5B (q4)',
    description: 'Best quality iOS model (advanced)',
    size: '~945MB',
    recommended: false,
    minRAM: 2,
    iosOnly: true,
    maxBufferSizeMB: 950,
    performance: '1-2 tok/sec on iPhone 17 Pro',
    quantization: 'q4f16_1',
  },

  // ===== DESKTOP/ANDROID MODELS (1-3GB, 4-BIT QUANTIZED) =====
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    name: 'Llama 3.2 3B (q4)',
    description: 'Best quality 4-bit model (Desktop/Android)',
    size: '~2.3GB',
    recommended: true,
    minRAM: 4,
    iosOnly: false,
    maxBufferSizeMB: 2300,
    performance: '3-7 tok/sec',
    quantization: 'q4f16_1',
  },
  'gemma-2-2b-it-q4f16_1-MLC': {
    name: 'Gemma 2 2B (q4)',
    description: 'Google\'s efficient 4-bit model (Desktop/Android)',
    size: '~1.9GB',
    recommended: false,
    minRAM: 3,
    iosOnly: false,
    maxBufferSizeMB: 1900,
    performance: '3-6 tok/sec',
    quantization: 'q4f16_1',
  },
  'Llama-3.2-1B-Instruct-q4f32_1-MLC': {
    name: 'Llama 3.2 1B (q4)',
    description: 'Compact Llama model (Desktop/Android)',
    size: '~1.1GB',
    recommended: false,
    minRAM: 2,
    iosOnly: false,
    maxBufferSizeMB: 1100,
    performance: '5-8 tok/sec',
    quantization: 'q4f32_1',
  },
  'Phi-3.5-mini-instruct-q4f16_1-MLC': {
    name: 'Phi 3.5 Mini (q4)',
    description: 'Good 4-bit balance (Desktop/Android)',
    size: '~1.5GB',
    recommended: false,
    minRAM: 3,
    iosOnly: false,
    maxBufferSizeMB: 1500,
    performance: '4-6 tok/sec',
    quantization: 'q4f16_1',
  },
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': {
    name: 'Qwen 2.5 1.5B (q4)',
    description: 'Smallest 4-bit full model (Desktop/Android)',
    size: '~1GB',
    recommended: false,
    minRAM: 2,
    iosOnly: false,
    maxBufferSizeMB: 1000,
    performance: '5-7 tok/sec',
    quantization: 'q4f16_1',
  },
} as const

export interface ModelInfo {
  name: string
  description: string
  size: string
  recommended: boolean
  minRAM: number
  iosOnly: boolean
  maxBufferSizeMB: number
  performance: string
  quantization: string
}

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
