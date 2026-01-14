/**
 * Transformers.js Engine
 *
 * Fallback AI engine using Transformers.js for devices without WebGPU
 * Works on iOS, older browsers, and uses WebGL/WASM for acceleration
 */

import { pipeline, env } from '@xenova/transformers'
import type { ChatMessage } from '../webllm/engine'

// Configure Transformers.js
env.allowLocalModels = false
env.allowRemoteModels = true

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
      return
    }

    try {
      // Create text generation pipeline
      this.pipe = await pipeline('text-generation', modelId, {
        progress_callback: (data: any) => {
          if (onProgress && data.status) {
            const progress = {
              loaded: data.loaded || 0,
              total: data.total || 1,
              status: data.status,
            }
            onProgress(progress)
          }
        },
      })

      this.currentModel = modelId
    } catch (error) {
      this.pipe = null
      this.currentModel = null
      throw error
    }
  }

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    if (!this.pipe) {
      throw new Error('Model not loaded')
    }

    const { temperature = 0.7, maxTokens = 512, onToken } = options

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
          const newText = output[0].generated_text.slice(fullText.length)
          if (newText) {
            fullText = output[0].generated_text
            onToken(newText)
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
