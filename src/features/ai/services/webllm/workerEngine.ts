/**
 * Worker-based WebLLM Engine
 *
 * Wraps the AI Web Worker to provide a clean API for the main thread.
 * All heavy AI processing runs in a separate thread.
 */

import type { WorkerRequest, WorkerResponse } from '../../workers/types'
import type { ModelId, ModelLoadProgress, ChatMessage, GenerateOptions } from './engine'

type MessageHandler = (response: WorkerResponse) => void

class WorkerEngine {
  private worker: Worker | null = null
  private isReady = false
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private currentModel: ModelId | null = null

  /**
   * Initialize the worker
   */
  async init(): Promise<void> {
    if (this.worker) return

    return new Promise((resolve, reject) => {
      try {
        // Create worker using Vite's worker import syntax
        this.worker = new Worker(
          new URL('../../workers/ai.worker.ts', import.meta.url),
          { type: 'module' }
        )

        // Set up message handler
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          this.handleMessage(event.data)
        }

        this.worker.onerror = (error) => {
          console.error('Worker error:', error)
          reject(error)
        }

        // Wait for ready signal
        const readyHandler = (response: WorkerResponse) => {
          if (response.type === 'ready') {
            this.isReady = true
            this.off('ready', readyHandler)
            resolve()
          }
        }
        this.on('ready', readyHandler)

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Worker initialization timeout'))
          }
        }, 10000)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Send message to worker
   */
  private send(message: WorkerRequest) {
    if (!this.worker) {
      throw new Error('Worker not initialized. Call init() first.')
    }
    this.worker.postMessage(message)
  }

  /**
   * Handle incoming messages from worker
   */
  private handleMessage(response: WorkerResponse) {
    const handlers = this.messageHandlers.get(response.type)
    if (handlers) {
      handlers.forEach((handler) => handler(response))
    }

    // Also notify 'all' handlers
    const allHandlers = this.messageHandlers.get('all')
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(response))
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Check WebGPU support
   */
  async checkWebGPUSupport(): Promise<{ supported: boolean; error?: string }> {
    await this.init()

    return new Promise((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === 'support-result') {
          this.off('support-result', handler)
          resolve({ supported: response.supported, error: response.error })
        }
      }
      this.on('support-result', handler)
      this.send({ type: 'check-support' })
    })
  }

  /**
   * Load model with progress callback
   */
  async loadModel(
    modelId: ModelId,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const progressHandler = (response: WorkerResponse) => {
        if (response.type === 'load-progress') {
          onProgress?.(response.progress)
        }
      }

      const completeHandler = (response: WorkerResponse) => {
        if (response.type === 'load-complete') {
          this.currentModel = response.modelId
          cleanup()
          resolve()
        }
      }

      const errorHandler = (response: WorkerResponse) => {
        if (response.type === 'load-error') {
          cleanup()
          reject(new Error(response.error))
        }
      }

      const cleanup = () => {
        this.off('load-progress', progressHandler)
        this.off('load-complete', completeHandler)
        this.off('load-error', errorHandler)
      }

      this.on('load-progress', progressHandler)
      this.on('load-complete', completeHandler)
      this.on('load-error', errorHandler)

      this.send({ type: 'load-model', modelId })
    })
  }

  /**
   * Generate response
   */
  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<string> {
    await this.init()

    const { onToken, ...restOptions } = options
    const useStreaming = !!onToken

    return new Promise((resolve, reject) => {
      const tokenHandler = (response: WorkerResponse) => {
        if (response.type === 'generate-token' && onToken) {
          onToken(response.token)
        }
      }

      const completeHandler = (response: WorkerResponse) => {
        if (response.type === 'generate-complete') {
          cleanup()
          resolve(response.response)
        }
      }

      const errorHandler = (response: WorkerResponse) => {
        if (response.type === 'generate-error') {
          cleanup()
          reject(new Error(response.error))
        }
      }

      const cleanup = () => {
        this.off('generate-token', tokenHandler)
        this.off('generate-complete', completeHandler)
        this.off('generate-error', errorHandler)
      }

      if (useStreaming) {
        this.on('generate-token', tokenHandler)
      }
      this.on('generate-complete', completeHandler)
      this.on('generate-error', errorHandler)

      this.send({
        type: useStreaming ? 'generate-stream' : 'generate',
        messages,
        options: restOptions,
      })
    })
  }

  /**
   * Stop streaming generation
   */
  stopGeneration() {
    if (!this.worker) return
    this.send({ type: 'stop-generation' })
  }

  /**
   * Reset chat context
   */
  async resetChat(): Promise<void> {
    await this.init()

    return new Promise((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === 'reset-complete') {
          this.off('reset-complete', handler)
          resolve()
        }
      }
      this.on('reset-complete', handler)
      this.send({ type: 'reset-chat' })
    })
  }

  /**
   * Unload model
   */
  async unload(): Promise<void> {
    if (!this.worker) return

    return new Promise((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === 'unload-complete') {
          this.off('unload-complete', handler)
          this.currentModel = null
          resolve()
        }
      }
      this.on('unload-complete', handler)
      this.send({ type: 'unload' })
    })
  }

  /**
   * Get runtime stats
   */
  async getStats(): Promise<{ tokensPerSecond: number } | null> {
    if (!this.worker) return null

    return new Promise((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === 'stats-result') {
          this.off('stats-result', handler)
          resolve(response.stats)
        }
      }
      this.on('stats-result', handler)
      this.send({ type: 'get-stats' })
    })
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.currentModel !== null
  }

  /**
   * Get current model
   */
  getCurrentModel(): ModelId | null {
    return this.currentModel
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isReady = false
      this.currentModel = null
      this.messageHandlers.clear()
    }
  }
}

// Singleton instance
export const workerEngine = new WorkerEngine()
