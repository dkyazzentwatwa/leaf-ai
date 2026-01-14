/**
 * AI State Store (Zustand)
 *
 * Manages global AI state including model status, conversations, and settings.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelId, ModelLoadProgress, ChatMessage } from '../services/webllm/engine'
import type { TransformersModelId } from '../services/transformers/engine'
import type { AssistantType } from '../services/webllm/prompts'

// Support both WebLLM and Transformers models
export type AnyModelId = ModelId | TransformersModelId | string

export interface StoredMessage extends ChatMessage {
  id: string
  bookmarked?: boolean
  reaction?: 'up' | 'down'
}

export interface Conversation {
  id: string
  type: AssistantType
  messages: StoredMessage[]
  createdAt: number
  updatedAt: number
  title?: string
  folder?: string
  tags?: string[]
  modelId?: AnyModelId
}

export interface PromptTemplate {
  id: string
  title: string
  content: string
}

interface AIState {
  // Model state
  modelStatus: 'idle' | 'downloading' | 'loading' | 'ready' | 'error'
  modelProgress: ModelLoadProgress | null
  currentModel: AnyModelId | null
  modelError: string | null

  // Conversation state
  conversations: Conversation[]
  activeConversationId: string | null

  // Settings
  preferredModel: AnyModelId
  autoLoadModel: boolean
  privacyMode: boolean
  promptTemplates: PromptTemplate[]
  lastModelLoadMs: number | null

  // Actions
  setModelStatus: (status: AIState['modelStatus']) => void
  setModelProgress: (progress: ModelLoadProgress | null) => void
  setCurrentModel: (model: AnyModelId | null) => void
  setModelError: (error: string | null) => void

  createConversation: (type: AssistantType) => string
  addMessage: (conversationId: string, message: ChatMessage) => void
  updateLastAssistantMessage: (conversationId: string, content: string) => void
  updateMessage: (conversationId: string, messageIndex: number, content: string) => void
  truncateConversation: (conversationId: string, messageCount: number) => void
  renameConversation: (conversationId: string, title: string) => void
  setConversationFolder: (conversationId: string, folder: string | null) => void
  setConversationTags: (conversationId: string, tags: string[]) => void
  setConversationModel: (conversationId: string, modelId: AnyModelId) => void
  deleteMessage: (
    conversationId: string,
    messageIndex: number,
    options?: { deleteFollowingAssistant?: boolean }
  ) => void
  toggleBookmark: (conversationId: string, messageIndex: number) => void
  setReaction: (
    conversationId: string,
    messageIndex: number,
    reaction: 'up' | 'down' | null
  ) => void
  setActiveConversation: (id: string | null) => void
  deleteConversation: (id: string) => void
  clearAllConversations: () => void

  setPreferredModel: (model: AnyModelId) => void
  setAutoLoadModel: (autoLoad: boolean) => void
  setPrivacyMode: (privacyMode: boolean) => void
  addPromptTemplate: (template: PromptTemplate) => void
  updatePromptTemplate: (templateId: string, updates: Partial<PromptTemplate>) => void
  deletePromptTemplate: (templateId: string) => void
  setLastModelLoadMs: (duration: number | null) => void

  reset: () => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const initialState = {
  modelStatus: 'idle' as const,
  modelProgress: null,
  currentModel: null,
  modelError: null,
  conversations: [],
  activeConversationId: null,
  preferredModel: 'Llama-3.2-3B-Instruct-q4f16_1-MLC' as ModelId,
  autoLoadModel: false,
  privacyMode: false,
  promptTemplates: [],
  lastModelLoadMs: null,
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Model actions
      setModelStatus: (status) => set({ modelStatus: status }),
      setModelProgress: (progress) => set({ modelProgress: progress }),
      setCurrentModel: (model) => set({ currentModel: model }),
      setModelError: (error) => set({ modelError: error }),

      // Conversation actions
      createConversation: (type) => {
        const id = generateId()
        const conversation: Conversation = {
          id,
          type,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modelId: undefined,
          tags: [],
        }

        set((state) => ({
          conversations: [
            {
              ...conversation,
              modelId: state.preferredModel,
            },
            ...state.conversations,
          ],
          activeConversationId: id,
        }))

        return id
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    {
                      ...message,
                      id: generateId(),
                    },
                  ],
                  updatedAt: Date.now(),
                  // Auto-generate title from first user message
                  title: conv.title || (message.role === 'user'
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title),
                }
              : conv
          ),
        }))
      },

      updateLastAssistantMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = [...conv.messages]
            const lastIndex = messages.length - 1

            if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
              messages[lastIndex] = { ...messages[lastIndex], content }
            }

            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      updateMessage: (conversationId, messageIndex, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = [...conv.messages]
            if (!messages[messageIndex]) return conv

            messages[messageIndex] = { ...messages[messageIndex], content }

            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      truncateConversation: (conversationId, messageCount) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = conv.messages.slice(0, Math.max(messageCount, 0))
            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      renameConversation: (conversationId, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title, updatedAt: Date.now() }
              : conv
          ),
        }))
      },

      setConversationFolder: (conversationId, folder) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, folder: folder || undefined, updatedAt: Date.now() }
              : conv
          ),
        }))
      },

      setConversationTags: (conversationId, tags) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, tags, updatedAt: Date.now() }
              : conv
          ),
        }))
      },

      setConversationModel: (conversationId, modelId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, modelId, updatedAt: Date.now() }
              : conv
          ),
        }))
      },

      deleteMessage: (conversationId, messageIndex, options) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = [...conv.messages]
            if (!messages[messageIndex]) return conv

            const shouldDeleteFollowing = options?.deleteFollowingAssistant
              && messages[messageIndex].role === 'user'
              && messages[messageIndex + 1]?.role === 'assistant'

            messages.splice(messageIndex, shouldDeleteFollowing ? 2 : 1)

            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      toggleBookmark: (conversationId, messageIndex) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = [...conv.messages]
            const target = messages[messageIndex]
            if (!target) return conv

            messages[messageIndex] = {
              ...target,
              bookmarked: !target.bookmarked,
            }

            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      setReaction: (conversationId, messageIndex, reaction) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv

            const messages = [...conv.messages]
            const target = messages[messageIndex]
            if (!target) return conv

            messages[messageIndex] = {
              ...target,
              reaction: target.reaction === reaction ? undefined : reaction || undefined,
            }

            return { ...conv, messages, updatedAt: Date.now() }
          }),
        }))
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id)
          const nextActive = state.activeConversationId === id
            ? remaining[0]?.id ?? null
            : state.activeConversationId

          return {
            conversations: remaining,
            activeConversationId: nextActive,
          }
        })
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null })
      },

      // Settings actions
      setPreferredModel: (model) => set({ preferredModel: model }),
      setAutoLoadModel: (autoLoad) => set({ autoLoadModel: autoLoad }),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
      addPromptTemplate: (template) => set((state) => ({
        promptTemplates: [template, ...state.promptTemplates],
      })),
      updatePromptTemplate: (templateId, updates) => set((state) => ({
        promptTemplates: state.promptTemplates.map((template) =>
          template.id === templateId ? { ...template, ...updates } : template
        ),
      })),
      deletePromptTemplate: (templateId) => set((state) => ({
        promptTemplates: state.promptTemplates.filter((template) => template.id !== templateId),
      })),
      setLastModelLoadMs: (duration) => set({ lastModelLoadMs: duration }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'leaf-ai-store',
      // Only persist settings and conversations, not runtime state
      partialize: (state) => ({
        conversations: state.conversations,
        preferredModel: state.preferredModel,
        autoLoadModel: state.autoLoadModel,
        privacyMode: state.privacyMode,
        promptTemplates: state.promptTemplates,
      }),
    }
  )
)

// Selectors
export const selectIsModelReady = (state: AIState) => state.modelStatus === 'ready'
export const selectIsModelLoading = (state: AIState) =>
  state.modelStatus === 'downloading' || state.modelStatus === 'loading'
export const selectModelStatus = (state: AIState) => state.modelStatus
export const selectActiveConversation = (state: AIState) =>
  state.conversations.find((c) => c.id === state.activeConversationId)
