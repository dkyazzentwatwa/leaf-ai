/**
 * useWebLLM Hook
 *
 * React hook for interacting with the local WebLLM engine via Web Worker.
 * Handles model loading, chat generation, and state management.
 * All AI processing runs in a separate thread for better UI responsiveness.
 */

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { unifiedEngine } from '../services/unifiedEngine'
import type { ModelId, ChatMessage, GenerateOptions } from '../services/webllm/engine'
import { getSystemPrompt, type AssistantType, type Persona } from '../services/webllm/prompts'
import {
  useAIStore,
  selectIsModelReady,
  selectIsModelLoading,
  selectActiveConversation,
} from '../stores/aiStore'

interface UseWebLLMOptions {
  assistantType?: AssistantType
  context?: string
  customPersona?: Persona  // NEW: Support custom personas
}

export function useWebLLM(options: UseWebLLMOptions = {}) {
  const { assistantType = 'general', context, customPersona } = options
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Store state
  const isModelReady = useAIStore(selectIsModelReady)
  const isModelLoading = useAIStore(selectIsModelLoading)
  const activeConversation = useAIStore(selectActiveConversation)
  const modelProgress = useAIStore((s) => s.modelProgress)
  const modelError = useAIStore((s) => s.modelError)
  const preferredModel = useAIStore((s) => s.preferredModel)
  const setLastModelLoadMs = useAIStore((s) => s.setLastModelLoadMs)

  // Store actions
  const setModelStatus = useAIStore((s) => s.setModelStatus)
  const setModelProgress = useAIStore((s) => s.setModelProgress)
  const setCurrentModel = useAIStore((s) => s.setCurrentModel)
  const setModelError = useAIStore((s) => s.setModelError)
  const createConversation = useAIStore((s) => s.createConversation)
  const addMessage = useAIStore((s) => s.addMessage)
  const updateLastAssistantMessage = useAIStore((s) => s.updateLastAssistantMessage)

  /**
   * Check if AI is supported (WebGPU or WebGL/WASM fallback)
   */
  const checkSupport = useCallback(async () => {
    const engineInfo = await unifiedEngine.detectEngine()
    return { supported: true, engine: engineInfo.type }
  }, [])

  /**
   * Load the AI model (runs in Web Worker)
   */
  const loadModel = useCallback(
    async (modelId?: ModelId) => {
      const model = (modelId || preferredModel) as ModelId

      const start = typeof performance !== 'undefined' ? performance.now() : Date.now()

      setModelError(null)
      setModelStatus('downloading')

      try {
        await unifiedEngine.loadModel(model, (progress) => {
          setModelProgress(progress)

          if (progress.stage === 'downloading') {
            setModelStatus('downloading')
          } else if (progress.stage === 'loading') {
            setModelStatus('loading')
          } else if (progress.stage === 'ready') {
            setModelStatus('ready')
            setCurrentModel(model)
          } else if (progress.stage === 'error') {
            setModelStatus('error')
            setModelError(progress.text)
          }
        })
      } catch (error) {
        setModelStatus('error')

        // Parse error and provide helpful message
        let errorMessage = 'Failed to load AI model'
        if (error instanceof Error) {
          if (error.message.includes('too large for iOS')) {
            errorMessage = error.message + ' iOS devices have strict memory limits (1.5GB WebContent limit).'
          } else if (error.message.includes('Device was lost') || error.message.includes('device lost')) {
            errorMessage = 'GPU ran out of memory. The model exceeded your device limits. Please try a smaller model or restart the app.'
          } else if (error.message.includes('buffer') || error.message.includes('Buffer')) {
            errorMessage = 'Model size exceeds device GPU buffer limits. Try a smaller model (SmolLM2 135M for iOS).'
          } else if (error.message.includes('WebGPU') || error.message.includes('GPU')) {
            errorMessage = error.message
          } else if (error.message.includes('Worker')) {
            errorMessage = 'Web Worker initialization failed. Your browser may have limited support. Try desktop Chrome or Edge.'
          } else {
            errorMessage = error.message
          }
        }

        setModelError(errorMessage)
        throw error
      } finally {
        const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const duration = Math.round(end - start)
        setLastModelLoadMs(Number.isFinite(duration) ? duration : null)
      }
    },
    [
      preferredModel,
      setModelError,
      setModelStatus,
      setModelProgress,
      setCurrentModel,
      setLastModelLoadMs,
    ]
  )

  /**
   * Send a message and get a response (runs in Web Worker)
   */
  const sendMessage = useCallback(
    async (
      content: string,
      options: { stream?: boolean; conversationId?: string } = {}
    ) => {
      const { stream = true, conversationId } = options

      if (!isModelReady) {
        throw new Error('Model not loaded')
      }

      setIsGenerating(true)
      setGenerationError(null)

      // Get or create conversation
      let convId = conversationId || activeConversation?.id
      if (!convId) {
        convId = createConversation(assistantType)
      }

      // Get conversation messages
      const conversation = useAIStore.getState().conversations.find((c) => c.id === convId)
      const existingMessages = (conversation?.messages || []).map((message) => ({
        role: message.role,
        content: message.content,
      }))

      // Build messages array with system prompt
      const systemPrompt = getSystemPrompt({
        type: assistantType,
        language: lang,
        context,
        customPersona,  // NEW: Pass custom persona
      })
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...existingMessages,
        { role: 'user', content },
      ]

      // Add user message to store
      addMessage(convId, { role: 'user', content })

      // Add placeholder for assistant response
      addMessage(convId, { role: 'assistant', content: '' })

      try {
        const generateOptions: GenerateOptions = {
          maxTokens: 1024,
          temperature: 0.7,
        }

        if (stream) {
          generateOptions.onToken = (token) => {
            // Update the assistant message as tokens arrive
            const conv = useAIStore.getState().conversations.find((c) => c.id === convId)
            const lastMsg = conv?.messages[conv.messages.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              updateLastAssistantMessage(convId!, lastMsg.content + token)
            }
          }
        }

        const response = await unifiedEngine.generate(messages, generateOptions)

        // If not streaming, update with full response
        if (!stream) {
          updateLastAssistantMessage(convId!, response)
        }

        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed'
        setGenerationError(errorMessage)

        // Update assistant message with error
        updateLastAssistantMessage(convId!, `Error: ${errorMessage}`)

        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [
      isModelReady,
      activeConversation,
      assistantType,
      lang,
      context,
      createConversation,
      addMessage,
      updateLastAssistantMessage,
    ]
  )

  /**
   * Generate a response using the existing conversation messages
   */
  const generateReply = useCallback(
    async (
      conversationId: string,
      options: { stream?: boolean } = {}
    ) => {
      const { stream = true } = options

      if (!isModelReady) {
        throw new Error('Model not loaded')
      }

      const conversation = useAIStore.getState().conversations.find((c) => c.id === conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      setIsGenerating(true)
      setGenerationError(null)

      const systemPrompt = getSystemPrompt({
        type: assistantType,
        language: lang,
        context,
        customPersona,  // NEW: Pass custom persona
      })
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ]

      addMessage(conversationId, { role: 'assistant', content: '' })

      try {
        const generateOptions: GenerateOptions = {
          maxTokens: 1024,
          temperature: 0.7,
        }

        if (stream) {
          generateOptions.onToken = (token) => {
            const conv = useAIStore.getState().conversations.find((c) => c.id === conversationId)
            const lastMsg = conv?.messages[conv.messages.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              updateLastAssistantMessage(conversationId, lastMsg.content + token)
            }
          }
        }

        const response = await unifiedEngine.generate(messages, generateOptions)

        if (!stream) {
          updateLastAssistantMessage(conversationId, response)
        }

        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed'
        setGenerationError(errorMessage)
        updateLastAssistantMessage(conversationId, `Error: ${errorMessage}`)
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [isModelReady, assistantType, lang, context, addMessage, updateLastAssistantMessage]
  )

  /**
   * Stop streaming generation
   */
  const stopGeneration = useCallback(() => {
    unifiedEngine.stopGeneration()
  }, [])

  /**
   * Reset the chat context
   */
  const resetChat = useCallback(async () => {
    await unifiedEngine.resetChat()
  }, [])

  /**
   * Unload the model to free memory
   */
  const unloadModel = useCallback(async () => {
    await unifiedEngine.unload()
    setModelStatus('idle')
    setCurrentModel(null)
    setModelProgress(null)
  }, [setModelStatus, setCurrentModel, setModelProgress])

  /**
   * Get performance stats
   */
  const getStats = useCallback(async (): Promise<{ tokensPerSecond: number } | null> => {
    try {
      return await unifiedEngine.getStats()
    } catch (error) {
      console.warn('Failed to get stats:', error)
      return null
    }
  }, [])

  return {
    // State
    isModelReady,
    isModelLoading,
    isGenerating,
    modelProgress,
    modelError,
    generationError,
    activeConversation,

    // Actions
    checkSupport,
    loadModel,
    sendMessage,
    generateReply,
    stopGeneration,
    resetChat,
    unloadModel,
    getStats,
  }
}
