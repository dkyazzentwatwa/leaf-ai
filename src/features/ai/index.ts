// AI Feature - Public API
// All AI processing is local via Web Worker - no data sent to servers

// Components
export { ModelDownloader } from './components/ModelDownloader'
export { ModelManager } from './components/ModelManager'
export { ChatInterface } from './components/ChatInterface'

// Hooks
export { useWebLLM } from './hooks/useWebLLM'

// Store
export { useAIStore } from './stores/aiStore'
export type { Conversation } from './stores/aiStore'

// Services - Worker-based engine (recommended)
export { workerEngine } from './services/webllm/workerEngine'

// Services - Direct engine (fallback)
export {
  webLLMEngine,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  type ModelId,
  type ModelLoadProgress,
  type ChatMessage,
} from './services/webllm/engine'

export {
  getSystemPrompt,
  CONVERSATION_STARTERS,
  type AssistantType,
} from './services/webllm/prompts'

// Worker types
export type { WorkerRequest, WorkerResponse } from './workers/types'
