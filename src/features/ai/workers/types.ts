/**
 * Web Worker Message Types
 *
 * Defines the communication protocol between main thread and AI worker.
 */

import type { ModelId, ModelLoadProgress, ChatMessage, GenerateOptions } from '../services/webllm/engine'

// Messages from main thread to worker
export type WorkerRequest =
  | { type: 'check-support' }
  | { type: 'load-model'; modelId: ModelId }
  | { type: 'generate'; messages: ChatMessage[]; options?: Omit<GenerateOptions, 'onToken'> }
  | { type: 'generate-stream'; messages: ChatMessage[]; options?: Omit<GenerateOptions, 'onToken'> }
  | { type: 'stop-generation' }
  | { type: 'reset-chat' }
  | { type: 'unload' }
  | { type: 'get-stats' }

// Messages from worker to main thread
export type WorkerResponse =
  | { type: 'support-result'; supported: boolean; error?: string }
  | { type: 'load-progress'; progress: ModelLoadProgress }
  | { type: 'load-complete'; modelId: ModelId }
  | { type: 'load-error'; error: string }
  | { type: 'generate-token'; token: string }
  | { type: 'generate-complete'; response: string }
  | { type: 'generate-error'; error: string }
  | { type: 'reset-complete' }
  | { type: 'unload-complete' }
  | { type: 'stats-result'; stats: { tokensPerSecond: number } | null }
  | { type: 'ready' }
