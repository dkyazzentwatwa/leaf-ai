import Dexie, { type EntityTable } from 'dexie'

/**
 * Leaf AI Database Schema
 *
 * Simple schema for storing AI conversations locally.
 * All data stays on the device - privacy first.
 */

// AI Conversation types
export interface AIConversation {
  id: string
  messages: Message[]
  assistantType: 'general'
  createdAt: number
  updatedAt: number
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// Model cache for tracking downloaded models
export interface ModelCache {
  modelId: string
  version: string
  downloadedAt: number
}

// Database class
export class LeafAIDB extends Dexie {
  // AI tables
  aiConversations!: EntityTable<AIConversation, 'id'>
  modelCache!: EntityTable<ModelCache, 'modelId'>

  constructor() {
    super('LeafAIDB')

    this.version(1).stores({
      aiConversations: 'id, assistantType, updatedAt',
      modelCache: 'modelId, downloadedAt'
    })
  }
}

// Export singleton instance
export const db = new LeafAIDB()
