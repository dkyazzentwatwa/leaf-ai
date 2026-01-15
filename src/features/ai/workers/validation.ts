/**
 * Worker Message Validation
 *
 * Runtime type checking for Web Worker communication between main thread and AI worker.
 * Prevents silent failures and improves debugging by validating message structure.
 *
 * @module validation
 */

import type { WorkerRequest, WorkerResponse } from './types'
import type { ModelId, ChatMessage } from '../services/webllm/engine'

/**
 * Type guard to check if a value is a valid WorkerRequest
 *
 * @param message - Unknown value to validate
 * @returns true if message is a valid WorkerRequest
 *
 * @example
 * ```typescript
 * if (validateWorkerRequest(event.data)) {
 *   // Safe to use as WorkerRequest
 *   handleRequest(event.data)
 * }
 * ```
 */
export function validateWorkerRequest(message: unknown): message is WorkerRequest {
  if (!message || typeof message !== 'object') {
    console.error('[Worker Validation] Invalid message: not an object', message)
    return false
  }

  const msg = message as Record<string, unknown>

  if (typeof msg.type !== 'string') {
    console.error('[Worker Validation] Invalid message: missing or invalid type', message)
    return false
  }

  // Validate each message type
  switch (msg.type) {
    case 'check-support':
      return true

    case 'load-model':
      if (typeof msg.modelId !== 'string') {
        console.error('[Worker Validation] load-model: invalid modelId', message)
        return false
      }
      return true

    case 'generate':
    case 'generate-stream':
      if (!Array.isArray(msg.messages)) {
        console.error(`[Worker Validation] ${msg.type}: messages must be an array`, message)
        return false
      }

      // Validate messages array
      for (const chatMsg of msg.messages) {
        if (!isValidChatMessage(chatMsg)) {
          console.error(`[Worker Validation] ${msg.type}: invalid chat message`, chatMsg)
          return false
        }
      }

      // options is optional, but if present must be an object
      if (msg.options !== undefined && (typeof msg.options !== 'object' || msg.options === null)) {
        console.error(`[Worker Validation] ${msg.type}: invalid options`, message)
        return false
      }

      return true

    case 'stop-generation':
    case 'reset-chat':
    case 'unload':
    case 'get-stats':
      return true

    default:
      console.error('[Worker Validation] Unknown request type:', msg.type)
      return false
  }
}

/**
 * Type guard to check if a value is a valid WorkerResponse
 *
 * @param message - Unknown value to validate
 * @returns true if message is a valid WorkerResponse
 *
 * @example
 * ```typescript
 * this.worker.onmessage = (event) => {
 *   if (validateWorkerResponse(event.data)) {
 *     handleResponse(event.data)
 *   }
 * }
 * ```
 */
export function validateWorkerResponse(message: unknown): message is WorkerResponse {
  if (!message || typeof message !== 'object') {
    console.error('[Worker Validation] Invalid response: not an object', message)
    return false
  }

  const msg = message as Record<string, unknown>

  if (typeof msg.type !== 'string') {
    console.error('[Worker Validation] Invalid response: missing or invalid type', message)
    return false
  }

  // Validate each response type
  switch (msg.type) {
    case 'support-result':
      if (typeof msg.supported !== 'boolean') {
        console.error('[Worker Validation] support-result: invalid supported flag', message)
        return false
      }
      // error is optional
      if (msg.error !== undefined && typeof msg.error !== 'string') {
        console.error('[Worker Validation] support-result: invalid error', message)
        return false
      }
      return true

    case 'load-progress':
      if (!msg.progress || typeof msg.progress !== 'object') {
        console.error('[Worker Validation] load-progress: invalid progress', message)
        return false
      }
      return true

    case 'load-complete':
      if (typeof msg.modelId !== 'string') {
        console.error('[Worker Validation] load-complete: invalid modelId', message)
        return false
      }
      return true

    case 'load-error':
    case 'generate-error':
      if (typeof msg.error !== 'string') {
        console.error(`[Worker Validation] ${msg.type}: invalid error`, message)
        return false
      }
      return true

    case 'generate-token':
      if (typeof msg.token !== 'string') {
        console.error('[Worker Validation] generate-token: invalid token', message)
        return false
      }
      return true

    case 'generate-complete':
      if (typeof msg.response !== 'string') {
        console.error('[Worker Validation] generate-complete: invalid response', message)
        return false
      }
      return true

    case 'reset-complete':
    case 'unload-complete':
    case 'ready':
      return true

    case 'stats-result':
      // stats can be null or an object with tokensPerSecond
      if (msg.stats !== null && typeof msg.stats !== 'object') {
        console.error('[Worker Validation] stats-result: invalid stats', message)
        return false
      }
      return true

    default:
      console.error('[Worker Validation] Unknown response type:', msg.type)
      return false
  }
}

/**
 * Validate a ChatMessage object
 *
 * @param message - Object to validate as ChatMessage
 * @returns true if valid ChatMessage
 */
function isValidChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') {
    return false
  }

  const msg = message as Record<string, unknown>

  // role must be 'system', 'user', or 'assistant'
  if (typeof msg.role !== 'string' || !['system', 'user', 'assistant'].includes(msg.role)) {
    return false
  }

  // content must be a string
  if (typeof msg.content !== 'string') {
    return false
  }

  return true
}

/**
 * Validate and sanitize a WorkerRequest before sending
 * Returns a sanitized copy of the request if valid, null if invalid
 *
 * @param message - Request to validate and sanitize
 * @returns Sanitized request or null if invalid
 *
 * @example
 * ```typescript
 * const sanitized = sanitizeWorkerRequest(request)
 * if (sanitized) {
 *   worker.postMessage(sanitized)
 * }
 * ```
 */
export function sanitizeWorkerRequest(message: unknown): WorkerRequest | null {
  if (!validateWorkerRequest(message)) {
    return null
  }

  // Create a clean copy to avoid passing through any extra properties
  const msg = message as WorkerRequest

  switch (msg.type) {
    case 'check-support':
      return { type: 'check-support' }

    case 'load-model':
      return {
        type: 'load-model',
        modelId: msg.modelId,
      }

    case 'generate':
    case 'generate-stream':
      return {
        type: msg.type,
        messages: msg.messages.map(sanitizeChatMessage),
        options: msg.options,
      }

    case 'stop-generation':
      return { type: 'stop-generation' }

    case 'reset-chat':
      return { type: 'reset-chat' }

    case 'unload':
      return { type: 'unload' }

    case 'get-stats':
      return { type: 'get-stats' }

    default:
      return null
  }
}

/**
 * Sanitize a ChatMessage by removing extra properties
 *
 * @param message - ChatMessage to sanitize
 * @returns Sanitized ChatMessage
 */
function sanitizeChatMessage(message: ChatMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content,
  }
}

/**
 * Check if a model ID is valid
 * Performs basic format validation
 *
 * @param modelId - Model ID to validate
 * @returns true if valid format
 */
export function isValidModelId(modelId: unknown): modelId is ModelId {
  if (typeof modelId !== 'string' || modelId.length === 0) {
    return false
  }

  // Basic format check: should end with -MLC or contain valid separators
  if (!modelId.includes('-') && !modelId.includes('_')) {
    return false
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /\.\.\//,
  ]

  return !suspiciousPatterns.some(pattern => pattern.test(modelId))
}

/**
 * Validate generate options object
 *
 * @param options - Options to validate
 * @returns true if valid
 */
export function isValidGenerateOptions(options: unknown): boolean {
  if (options === undefined || options === null) {
    return true // Options are optional
  }

  if (typeof options !== 'object') {
    return false
  }

  const opts = options as Record<string, unknown>

  // Validate known option fields if present
  if (opts.temperature !== undefined && typeof opts.temperature !== 'number') {
    return false
  }

  if (opts.top_p !== undefined && typeof opts.top_p !== 'number') {
    return false
  }

  if (opts.max_tokens !== undefined && typeof opts.max_tokens !== 'number') {
    return false
  }

  if (opts.presence_penalty !== undefined && typeof opts.presence_penalty !== 'number') {
    return false
  }

  if (opts.frequency_penalty !== undefined && typeof opts.frequency_penalty !== 'number') {
    return false
  }

  return true
}

/**
 * Create a validation error response
 * Helper for worker to send back validation errors
 *
 * @param errorMessage - Error message
 * @returns Error response object
 */
export function createValidationErrorResponse(errorMessage: string): WorkerResponse {
  return {
    type: 'generate-error',
    error: `Validation Error: ${errorMessage}`,
  }
}

/**
 * Check if worker communication is healthy
 * Can be called periodically to verify worker is responding
 *
 * @param worker - Worker instance to check
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves if worker is healthy
 */
export async function checkWorkerHealth(worker: Worker, timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      cleanup()
      resolve(false)
    }, timeout)

    const messageHandler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.type === 'ready') {
        cleanup()
        resolve(true)
      }
    }

    const cleanup = () => {
      clearTimeout(timeoutId)
      worker.removeEventListener('message', messageHandler)
    }

    worker.addEventListener('message', messageHandler)

    // Send check-support as a ping
    try {
      worker.postMessage({ type: 'check-support' })
    } catch (error) {
      cleanup()
      resolve(false)
    }
  })
}
