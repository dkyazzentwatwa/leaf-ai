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
  private initializationAttempts = 0
  private readonly MAX_INIT_ATTEMPTS = 3

  /**
   * Check if browser/platform is supported
   */
  private checkBrowserSupport(): { supported: boolean; reason?: string } {
    // Check for Web Workers support
    if (typeof Worker === 'undefined') {
      return {
        supported: false,
        reason: 'Web Workers are not supported in this browser.'
      }
    }

    return { supported: true }
  }

  /**
   * Initialize the worker
   */
  async init(): Promise<void> {
    if (this.worker) return

    // Check browser support first
    const browserCheck = this.checkBrowserSupport()
    if (!browserCheck.supported) {
      throw new Error(browserCheck.reason || 'Browser not supported')
    }

    if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
      throw new Error('Worker initialization failed after multiple attempts. Please refresh the page.')
    }

    this.initializationAttempts++

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
          this.handleWorkerCrash(error)
          reject(new Error('Worker crashed. This may be due to browser limitations. Try using Chrome or a desktop browser.'))
        }

        this.worker.onmessageerror = (error) => {
          console.error('Worker message error:', error)
          reject(new Error('Worker communication error'))
        }

        // Wait for ready signal with timeout
        const readyHandler = (response: WorkerResponse) => {
          if (response.type === 'ready') {
            this.isReady = true
            this.off('ready', readyHandler)
            resolve()
          }
        }
        this.on('ready', readyHandler)

        // Timeout after 5 seconds (reduced from 10)
        setTimeout(() => {
          if (!this.isReady) {
            this.off('ready', readyHandler)
            reject(new Error('Worker initialization timeout. Your browser may not support WebGPU or Web Workers properly.'))
          }
        }, 5000)
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
   * Detect if running on iOS/iPad (including iPadOS pretending to be Mac)
   */
  private isIOS(): boolean {
    if (typeof navigator === 'undefined') return false

    const ua = navigator.userAgent
    const isIOSUA = /iPad|iPhone|iPod/.test(ua)
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

    return isIOSUA || isIPadOS
  }

  /**
   * Extract iOS or Safari version
   * Returns null if version cannot be determined or not iOS/Safari
   */
  private getIOSSafariVersion(): number | null {
    if (typeof navigator === 'undefined') return null

    const ua = navigator.userAgent

    // Check for Safari version (e.g., "Version/18.0" in Safari on iOS/macOS)
    const safariMatch = ua.match(/Version\/(\d+)/)
    if (safariMatch) {
      return parseInt(safariMatch[1], 10)
    }

    // Check for iOS version in OS string (e.g., "iPhone OS 18_0")
    const iosMatch = ua.match(/OS (\d+)[_\d]*/)
    if (iosMatch) {
      return parseInt(iosMatch[1], 10)
    }

    return null
  }

  /**
   * Check if device supports WebGPU based on iOS/Safari version
   * iOS 18+ / Safari 18+ supports WebGPU
   */
  private supportsWebGPUVersion(): boolean {
    const version = this.getIOSSafariVersion()

    // If we can't determine version but WebGPU API exists, assume it's supported
    const nav = navigator as Navigator & { gpu?: GPU }
    if (version === null && nav.gpu) {
      return true
    }

    // iOS/Safari 18+ supports WebGPU
    return version !== null && version >= 18
  }

  /**
   * Check WebGPU support directly (without worker)
   */
  private async checkWebGPUDirectly(): Promise<{ supported: boolean; error?: string }> {
    const isIOS = this.isIOS()
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    // Check for WebGPU API
    const nav = navigator as Navigator & { gpu?: GPU }
    if (!nav.gpu) {
      // Provide helpful error messages based on platform
      if (isIOS && !this.supportsWebGPUVersion()) {
        const version = this.getIOSSafariVersion()
        return {
          supported: false,
          error: `WebGPU requires iOS 18+ or Safari 18+. You have version ${version || 'unknown'}. Please update your device to use local AI.`
        }
      }

      if (isSafari && !this.supportsWebGPUVersion()) {
        const safariVersion = this.getIOSSafariVersion()
        return {
          supported: false,
          error: `WebGPU requires Safari 18+. You have Safari ${safariVersion || 'unknown'}. Please update your browser.`
        }
      }

      return {
        supported: false,
        error: 'WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or update to Safari 18+.'
      }
    }

    try {
      // Try to request adapter with timeout
      const adapter = await Promise.race([
        nav.gpu.requestAdapter(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ])

      if (!adapter) {
        return {
          supported: false,
          error: 'No WebGPU adapter found. Your device GPU may not be supported. Try cloud AI mode instead.'
        }
      }

      return { supported: true }
    } catch (e) {
      return {
        supported: false,
        error: `WebGPU initialization failed: ${e instanceof Error ? e.message : 'Unknown error'}. Try cloud AI mode instead.`
      }
    }
  }

  /**
   * Check WebGPU support (tries direct check first, falls back to worker)
   */
  async checkWebGPUSupport(): Promise<{ supported: boolean; error?: string }> {
    console.log('[WorkerEngine] Checking WebGPU support...')

    // Do a quick direct check first
    const directCheck = await this.checkWebGPUDirectly()
    if (!directCheck.supported) {
      console.log('[WorkerEngine] Direct WebGPU check failed:', directCheck.error)
      return directCheck
    }

    console.log('[WorkerEngine] Direct WebGPU check passed, verifying with worker...')

    // If direct check passes, verify with worker (with timeout)
    try {
      const workerCheckPromise = (async () => {
        await this.init()

        return new Promise<{ supported: boolean; error?: string }>((resolve) => {
          const handler = (response: WorkerResponse) => {
            if (response.type === 'support-result') {
              this.off('support-result', handler)
              resolve({ supported: response.supported, error: response.error })
            }
          }
          this.on('support-result', handler)
          this.send({ type: 'check-support' })
        })
      })()

      // Add 5 second timeout for worker check
      const timeoutPromise = new Promise<{ supported: boolean; error: string }>((resolve) => {
        setTimeout(() => {
          resolve({
            supported: false,
            error: 'Worker initialization timed out. Your browser may not fully support WebGPU.'
          })
        }, 5000)
      })

      const result = await Promise.race([workerCheckPromise, timeoutPromise])
      console.log('[WorkerEngine] Worker WebGPU check result:', result)
      return result
    } catch (error) {
      return {
        supported: false,
        error: error instanceof Error ? error.message : 'Failed to verify WebGPU support'
      }
    }
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
   * Handle worker crash
   */
  private handleWorkerCrash(error: ErrorEvent) {
    console.error('Worker crashed:', error)

    // Clean up the crashed worker
    if (this.worker) {
      try {
        this.worker.terminate()
      } catch (e) {
        console.error('Error terminating crashed worker:', e)
      }
      this.worker = null
      this.isReady = false
      this.messageHandlers.clear()
    }

    // Notify all handlers of the crash
    const allHandlers = this.messageHandlers.get('all')
    if (allHandlers) {
      allHandlers.forEach((handler) => handler({
        type: 'load-error' as any,
        error: 'Worker crashed. Please try using Chrome or a desktop browser.'
      }))
    }
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
      this.initializationAttempts = 0
    }
  }

  /**
   * Reset initialization attempts
   */
  resetInitAttempts() {
    this.initializationAttempts = 0
  }
}

// Singleton instance
export const workerEngine = new WorkerEngine()
