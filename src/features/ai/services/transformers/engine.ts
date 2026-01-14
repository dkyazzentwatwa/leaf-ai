/**
 * Transformers.js Engine
 *
 * Fallback AI engine using Transformers.js for devices without WebGPU
 * Works on iOS, older browsers, and uses WebGL/WASM for acceleration
 */

import { pipeline, env } from '@xenova/transformers'
import type { ChatMessage } from '../webllm/engine'

// Configure Transformers.js for iOS compatibility
env.allowLocalModels = false
env.allowRemoteModels = true
env.useBrowserCache = true

// Detect iOS
const isIOS = typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

if (isIOS) {
  console.log('[Transformers] Configuring for iOS compatibility - using single-threaded WASM')
  // Use single-threaded WASM on iOS (multi-threading can cause crashes)
  env.backends.onnx.wasm.numThreads = 1
}

export type TransformersModelId =
  | 'Xenova/Phi-1_5-quantized'
  | 'Xenova/TinyLlama-1.1B-Chat-v1.0'
  | 'Xenova/Qwen1.5-0.5B-Chat-quantized'

export interface TransformersModel {
  id: TransformersModelId
  name: string
  description: string
  size: string
  contextWindow: number
  recommended?: boolean
}

export const TRANSFORMERS_MODELS: Record<TransformersModelId, TransformersModel> = {
  'Xenova/TinyLlama-1.1B-Chat-v1.0': {
    id: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    name: 'TinyLlama 1.1B',
    description: 'Fast, lightweight model optimized for mobile',
    size: '~600MB',
    contextWindow: 2048,
    recommended: true,
  },
  'Xenova/Phi-1_5-quantized': {
    id: 'Xenova/Phi-1_5-quantized',
    name: 'Phi 1.5 (Quantized)',
    description: 'Microsoft Phi model, good quality',
    size: '~800MB',
    contextWindow: 2048,
  },
  'Xenova/Qwen1.5-0.5B-Chat-quantized': {
    id: 'Xenova/Qwen1.5-0.5B-Chat-quantized',
    name: 'Qwen 0.5B',
    description: 'Smallest model, fastest download',
    size: '~300MB',
    contextWindow: 2048,
  },
}

export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  onToken?: (token: string) => void
}

class TransformersEngine {
  private pipe: any = null
  private currentModel: TransformersModelId | null = null

  async loadModel(
    modelId: TransformersModelId,
    onProgress?: (progress: { loaded: number; total: number; status: string }) => void
  ): Promise<void> {
    if (this.currentModel === modelId && this.pipe) {
      console.log('[Transformers] Model already loaded:', modelId)
      return
    }

    console.log('[Transformers] Loading model:', modelId)

    try {
      // Notify start
      if (onProgress) {
        onProgress({ loaded: 0, total: 100, status: 'Initializing model...' })
      }

      // Create text generation pipeline with error handling
      this.pipe = await Promise.race([
        pipeline('text-generation', modelId, {
          progress_callback: (data: any) => {
            console.log('[Transformers] Progress:', data)
            if (onProgress && data.status) {
              const progress = {
                loaded: data.loaded || 0,
                total: data.total || 1,
                status: data.status,
              }
              onProgress(progress)
            }
          },
        }),
        // Timeout after 5 minutes
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Model loading timeout')), 300000)
        ),
      ])

      this.currentModel = modelId
      console.log('[Transformers] Model loaded successfully:', modelId)

      if (onProgress) {
        onProgress({ loaded: 100, total: 100, status: 'Model ready!' })
      }
    } catch (error) {
      console.error('[Transformers] Failed to load model:', error)
      this.pipe = null
      this.currentModel = null

      // Provide helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('timeout')) {
        throw new Error('Model loading timed out. Please check your internet connection.')
      } else if (errorMessage.includes('memory') || errorMessage.includes('SIMD')) {
        throw new Error('Not enough memory to load this model. Try a smaller model.')
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new Error('Network error while downloading model. Please check your connection.')
      } else {
        throw new Error(`Failed to load model: ${errorMessage}`)
      }
    }
  }

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    if (!this.pipe) {
      throw new Error('Model not loaded')
    }

    const { temperature = 0.7, maxTokens = 512, onToken } = options

    console.log('[Transformers] Generating response with', messages.length, 'messages')

    try {
      // Format messages for the model
      const prompt = this.formatMessages(messages)

      if (onToken) {
        // Streaming generation
        let fullText = ''
        const result = await this.pipe(prompt, {
          temperature,
          max_new_tokens: maxTokens,
          do_sample: true,
          top_k: 50,
          top_p: 0.95,
          callback_function: (output: any) => {
            try {
              const newText = output[0].generated_text.slice(fullText.length)
              if (newText) {
                fullText = output[0].generated_text
                onToken(newText)
              }
            } catch (error) {
              console.error('[Transformers] Streaming error:', error)
            }
          },
        })

        return result[0].generated_text
      } else {
        // Non-streaming generation
        const result = await this.pipe(prompt, {
          temperature,
          max_new_tokens: maxTokens,
          do_sample: true,
          top_k: 50,
          top_p: 0.95,
        })

        return result[0].generated_text
      }
    } catch (error) {
      console.error('[Transformers] Generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('memory')) {
        throw new Error('Out of memory during generation. Try reducing message length.')
      } else {
        throw new Error(`Generation failed: ${errorMessage}`)
      }
    }
  }

  private formatMessages(messages: ChatMessage[]): string {
    // Format messages for chat models
    let prompt = ''

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`
      }
    }

    prompt += 'Assistant: '
    return prompt
  }

  isModelLoaded(): boolean {
    return this.pipe !== null
  }

  getCurrentModel(): TransformersModelId | null {
    return this.currentModel
  }

  unload(): void {
    this.pipe = null
    this.currentModel = null
  }
}

export const transformersEngine = new TransformersEngine()
