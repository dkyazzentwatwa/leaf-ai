/**
 * AI Web Worker
 *
 * Runs WebLLM inference in a separate thread to keep the UI responsive.
 * All AI processing happens here, isolated from the main thread.
 */

import * as webllm from '@mlc-ai/web-llm'
import type { WorkerRequest, WorkerResponse } from './types'
import type { ModelId, ChatMessage } from '../services/webllm/engine'
import { validateWorkerRequest } from './validation'

// Worker state
let engine: webllm.MLCEngineInterface | null = null
let currentModel: ModelId | null = null
let isLoading = false
let stopRequested = false

// Post message helper with type safety
function post(message: WorkerResponse) {
  self.postMessage(message)
}

// Check WebGPU support
async function checkSupport(): Promise<{ supported: boolean; error?: string }> {
  // In worker context, we need to check navigator.gpu
  const nav = self.navigator as Navigator & { gpu?: GPU }

  if (!nav.gpu) {
    return {
      supported: false,
      error: 'WebGPU is not supported in this browser.',
    }
  }

  try {
    const adapter = await nav.gpu.requestAdapter()
    if (!adapter) {
      return {
        supported: false,
        error: 'No WebGPU adapter found.',
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

// Load model
async function loadModel(modelId: ModelId) {
  if (isLoading) {
    post({ type: 'load-error', error: 'Model is already loading' })
    return
  }

  if (currentModel === modelId && engine) {
    post({
      type: 'load-progress',
      progress: { stage: 'ready', progress: 100, text: 'Model already loaded' },
    })
    post({ type: 'load-complete', modelId })
    return
  }

  isLoading = true

  try {
    post({
      type: 'load-progress',
      progress: { stage: 'downloading', progress: 0, text: 'Initializing...' },
    })

    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        const progress = Math.round(report.progress * 100)
        const stage = report.text.toLowerCase().includes('loading') ? 'loading' : 'downloading'

        post({
          type: 'load-progress',
          progress: {
            stage: stage as 'downloading' | 'loading',
            progress,
            text: report.text,
          },
        })
      },
    })

    currentModel = modelId

    post({
      type: 'load-progress',
      progress: { stage: 'ready', progress: 100, text: 'Model ready!' },
    })
    post({ type: 'load-complete', modelId })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load model'
    post({
      type: 'load-progress',
      progress: { stage: 'error', progress: 0, text: errorMessage },
    })
    post({ type: 'load-error', error: errorMessage })
  } finally {
    isLoading = false
  }
}

// Generate response (non-streaming)
async function generate(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; topP?: number } = {}
) {
  if (!engine) {
    post({ type: 'generate-error', error: 'Model not loaded' })
    return
  }

  const { maxTokens = 1024, temperature = 0.7, topP = 0.95 } = options

  try {
    const response = await engine.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stream: false,
    })

    const content = response.choices[0]?.message?.content || ''
    post({ type: 'generate-complete', response: content })
  } catch (error) {
    post({
      type: 'generate-error',
      error: error instanceof Error ? error.message : 'Generation failed',
    })
  }
}

// Generate response (streaming)
async function generateStream(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; topP?: number } = {}
) {
  if (!engine) {
    post({ type: 'generate-error', error: 'Model not loaded' })
    return
  }

  const { maxTokens = 1024, temperature = 0.7, topP = 0.95 } = options

  try {
    let fullResponse = ''
    stopRequested = false

    const chunks = await engine.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stream: true,
    })

    for await (const chunk of chunks) {
      if (stopRequested) {
        stopRequested = false
        break
      }
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) {
        fullResponse += delta
        post({ type: 'generate-token', token: delta })
      }
    }

    post({ type: 'generate-complete', response: fullResponse })
  } catch (error) {
    post({
      type: 'generate-error',
      error: error instanceof Error ? error.message : 'Generation failed',
    })
  }
}

// Reset chat context
async function resetChat() {
  if (engine) {
    await engine.resetChat()
  }
  post({ type: 'reset-complete' })
}

// Unload model
async function unload() {
  if (engine) {
    await engine.unload()
    engine = null
    currentModel = null
  }
  post({ type: 'unload-complete' })
}

// Get stats
async function getStats() {
  if (!engine) {
    post({ type: 'stats-result', stats: null })
    return
  }

  try {
    const statsText = await engine.runtimeStatsText()
    const match = statsText.match(/(\d+\.?\d*)\s*tok\/s/)
    if (match) {
      post({ type: 'stats-result', stats: { tokensPerSecond: parseFloat(match[1]) } })
    } else {
      post({ type: 'stats-result', stats: null })
    }
  } catch {
    post({ type: 'stats-result', stats: null })
  }
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { data } = event

  // Validate incoming request
  if (!validateWorkerRequest(data)) {
    console.error('Invalid worker request:', data)
    return
  }

  switch (data.type) {
    case 'check-support': {
      const result = await checkSupport()
      post({ type: 'support-result', ...result })
      break
    }

    case 'load-model':
      await loadModel(data.modelId)
      break

    case 'generate':
      await generate(data.messages, data.options)
      break

    case 'generate-stream':
      await generateStream(data.messages, data.options)
      break

    case 'stop-generation':
      stopRequested = true
      break

    case 'reset-chat':
      await resetChat()
      break

    case 'unload':
      await unload()
      break

    case 'get-stats':
      await getStats()
      break
  }
}

// Signal that worker is ready
post({ type: 'ready' })
