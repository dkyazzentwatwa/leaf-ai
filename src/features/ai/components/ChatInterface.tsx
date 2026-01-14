/**
 * Chat Interface Component
 *
 * Main conversational UI for the AI assistants.
 * Supports streaming responses, conversation history, and suggested prompts.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  Bookmark,
  Copy,
  Download,
  FileText,
  Pencil,
  RefreshCw,
  Send,
  Shield,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Loader2,
  User,
  Leaf,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { useWebLLM } from '../hooks/useWebLLM'
import { useAIStore, selectActiveConversation } from '../stores/aiStore'
import { AVAILABLE_MODELS } from '../services/webllm/engine'
import { CONVERSATION_STARTERS, type AssistantType } from '../services/webllm/prompts'
import { ModelDownloader } from './ModelDownloader'
import { cn } from '@/utils/cn'
import { useToastStore } from '@/stores/toastStore'

interface ChatInterfaceProps {
  assistantType: AssistantType
  title?: string
  description?: string
  context?: string
}

export function ChatInterface({
  assistantType,
  title,
  description,
  context,
}: ChatInterfaceProps) {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const [input, setInput] = useState('')
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isModelReady,
    isGenerating,
    generationError,
    loadModel,
    sendMessage,
    generateReply,
    stopGeneration,
    resetChat,
  } = useWebLLM({ assistantType, context })

  const activeConversation = useAIStore(selectActiveConversation)
  const createConversation = useAIStore((s) => s.createConversation)
  const updateMessage = useAIStore((s) => s.updateMessage)
  const truncateConversation = useAIStore((s) => s.truncateConversation)
  const renameConversation = useAIStore((s) => s.renameConversation)
  const deleteMessage = useAIStore((s) => s.deleteMessage)
  const toggleBookmark = useAIStore((s) => s.toggleBookmark)
  const setReaction = useAIStore((s) => s.setReaction)
  const setConversationModel = useAIStore((s) => s.setConversationModel)
  const privacyMode = useAIStore((s) => s.privacyMode)
  const setPrivacyMode = useAIStore((s) => s.setPrivacyMode)
  const promptTemplates = useAIStore((s) => s.promptTemplates)
  const preferredModel = useAIStore((s) => s.preferredModel)
  const setPreferredModel = useAIStore((s) => s.setPreferredModel)
  const currentModel = useAIStore((s) => s.currentModel)
  const addToast = useToastStore((s) => s.addToast)

  const messages = activeConversation?.messages || []
  const starters = CONVERSATION_STARTERS[assistantType]?.[lang] || []
  const conversationTitle = activeConversation?.title || title || 'Leaf AI'
  const canExport = !!activeConversation && activeConversation.messages.length > 0
  const activeModelId = activeConversation?.modelId || preferredModel
  const lastUserMessageIndex = messages.reduce(
    (lastIndex, message, index) => (message.role === 'user' ? index : lastIndex),
    -1
  )
  const lastUserMessage = lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : null
  const isEditing = editingMessageIndex !== null

  const checkIsAtBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 40
  }

  const scrollToLatest = () => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    setShowScrollToLatest(false)
  }

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = event.target.value as keyof typeof AVAILABLE_MODELS
    const existingModel = activeConversation?.modelId || preferredModel
    if (modelId === existingModel) return

    const confirmMessage = lang === 'es'
      ? 'Cambiar el modelo cargará uno nuevo (~1-2GB). ¿Continuar?'
      : 'Switching models will load a new download (~1-2GB). Continue?'

    if (!window.confirm(confirmMessage)) return

    if (activeConversation) {
      setConversationModel(activeConversation.id, modelId)
    }
    setPreferredModel(modelId)

    if (currentModel === modelId) return

    try {
      await loadModel(modelId)
    } catch (error) {
      console.error('Failed to load model:', error)
    }
  }

  const handlePrivacyToggle = () => {
    setPrivacyMode(!privacyMode)
  }

  const handleTemplateSelect = (templateContent: string) => {
    setInput(templateContent)
    setEditingMessageIndex(null)
    inputRef.current?.focus()
  }

  const handleFileSelect = () => {
    if (!isModelReady || isGenerating) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const MAX_FILE_CHARS = 12000
    const text = await file.text()
    const truncated = text.length > MAX_FILE_CHARS
    const clippedText = truncated ? text.slice(0, MAX_FILE_CHARS) : text

    const prompt = lang === 'es'
      ? `Analiza el siguiente archivo (${file.name}). Resume puntos clave, riesgos y próximos pasos:\n\n${clippedText}${truncated ? '\n\n[Contenido truncado]' : ''}`
      : `Analyze the following file (${file.name}). Summarize key points, risks, and next steps:\n\n${clippedText}${truncated ? '\n\n[Content truncated]' : ''}`

    setEditingMessageIndex(null)
    setInput('')
    event.target.value = ''

    try {
      await sendMessage(prompt)
      addToast(
        truncated
          ? (lang === 'es' ? 'Archivo analizado (truncado)' : 'File analyzed (truncated)')
          : (lang === 'es' ? 'Archivo analizado' : 'File analyzed'),
        'success'
      )
    } catch (error) {
      console.error('Failed to analyze file:', error)
    }
  }

  // Focus input when model is ready
  useEffect(() => {
    if (isModelReady) {
      inputRef.current?.focus()
    }
  }, [isModelReady])

  useEffect(() => {
    const atBottom = checkIsAtBottom()
    setShowScrollToLatest(!atBottom)
  }, [messages, isGenerating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating || !isModelReady) return

    const message = input.trim()
    setInput('')

    if (isEditing && activeConversation && editingMessageIndex !== null) {
      const conversationId = activeConversation.id
      updateMessage(conversationId, editingMessageIndex, message)
      truncateConversation(conversationId, editingMessageIndex + 1)
      setEditingMessageIndex(null)

      try {
        await generateReply(conversationId)
      } catch (error) {
        console.error('Failed to regenerate response:', error)
      }
      return
    }

    if (isEditing) {
      setEditingMessageIndex(null)
    }

    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStarterClick = async (starter: string) => {
    if (isGenerating || !isModelReady) return
    setEditingMessageIndex(null)

    try {
      await sendMessage(starter)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleNewConversation = async () => {
    const hasMessages = messages.length > 0
    const confirmMessage = lang === 'es'
      ? '¿Iniciar una nueva conversación? Tu historial actual seguirá guardado.'
      : 'Start a new conversation? Your current history will stay saved.'

    if (hasMessages && !window.confirm(confirmMessage)) {
      return
    }

    if (isGenerating) {
      stopGeneration()
    }

    setEditingMessageIndex(null)
    setInput('')

    const conversationId = createConversation(assistantType)
    await resetChat()

    const promptText = lang === 'es'
      ? 'Nombre para esta conversación (opcional)'
      : 'Name this conversation (optional)'
    const nextTitle = window.prompt(promptText, '')
    if (nextTitle && nextTitle.trim()) {
      renameConversation(conversationId, nextTitle.trim())
    }
  }

  const handleRenameConversation = () => {
    if (!activeConversation) return
    const promptText = lang === 'es'
      ? 'Renombrar conversación'
      : 'Rename conversation'
    const nextTitle = window.prompt(promptText, activeConversation.title || '')
    if (nextTitle && nextTitle.trim()) {
      renameConversation(activeConversation.id, nextTitle.trim())
    }
  }

  const handleResendLast = async () => {
    if (!activeConversation || !lastUserMessage || isGenerating) return

    setEditingMessageIndex(null)
    truncateConversation(activeConversation.id, lastUserMessageIndex + 1)

    try {
      await generateReply(activeConversation.id)
    } catch (error) {
      console.error('Failed to resend message:', error)
    }
  }

  const handleEditLast = () => {
    if (!lastUserMessage || isGenerating) return
    setInput(lastUserMessage.content)
    setEditingMessageIndex(lastUserMessageIndex)
    inputRef.current?.focus()
  }

  const handleCancelEdit = () => {
    setEditingMessageIndex(null)
    setInput('')
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      addToast(lang === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard', 'success')
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleDeleteMessage = (messageIndex: number, role: 'user' | 'assistant') => {
    if (!activeConversation || isGenerating) return

    const confirmMessage = lang === 'es'
      ? '¿Eliminar este mensaje?'
      : 'Delete this message?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    setEditingMessageIndex(null)
    setInput('')
    deleteMessage(activeConversation.id, messageIndex, {
      deleteFollowingAssistant: role === 'user',
    })
  }

  const handleBookmark = (messageIndex: number) => {
    if (!activeConversation) return
    toggleBookmark(activeConversation.id, messageIndex)
  }

  const handleReaction = (messageIndex: number, reaction: 'up' | 'down') => {
    if (!activeConversation) return
    setReaction(activeConversation.id, messageIndex, reaction)
  }

  const handleExport = (format: 'markdown' | 'json') => {
    if (!activeConversation) return

    const baseName = activeConversation.title || `conversation-${activeConversation.id}`
    const safeName = baseName
      .trim()
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .replace(/ +/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      || 'conversation'

    const downloadFile = (filename: string, content: string, type: string) => {
      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    }

    if (format === 'json') {
      const payload = {
        id: activeConversation.id,
        title: activeConversation.title,
        createdAt: activeConversation.createdAt,
        updatedAt: activeConversation.updatedAt,
        messages: activeConversation.messages,
      }
      downloadFile(`${safeName}.json`, JSON.stringify(payload, null, 2), 'application/json')
      addToast(lang === 'es' ? 'Exportado a JSON' : 'Exported JSON', 'success')
      return
    }

    const header = `# ${activeConversation.title || (lang === 'es' ? 'Conversación' : 'Conversation')}`
    const body = activeConversation.messages
      .map((message) => {
        const roleLabel = message.role === 'user'
          ? (lang === 'es' ? 'Usuario' : 'User')
          : (lang === 'es' ? 'Asistente' : 'Assistant')
        return `**${roleLabel}**\n\n${message.content}`
      })
      .join('\n\n---\n\n')

    downloadFile(`${safeName}.md`, `${header}\n\n${body}\n`, 'text/markdown')
    addToast(lang === 'es' ? 'Exportado a Markdown' : 'Exported Markdown', 'success')
  }

  const parseDecorations = (text: string, keyPrefix: string): ReactNode[] => {
    const nodes: ReactNode[] = []
    let remaining = text
    let tokenIndex = 0

    const patterns: Array<{
      type: 'link' | 'bold' | 'italic'
      regex: RegExp
    }> = [
      { type: 'link', regex: /\[([^\]]+)\]\(([^)\s]+)\)/ },
      { type: 'bold', regex: /\*\*([^*]+)\*\*/ },
      { type: 'italic', regex: /(?<!\*)\*([^*]+)\*(?!\*)/ },
      { type: 'italic', regex: /(?<!_)_([^_]+)_(?!_)/ },
    ]

    while (remaining.length > 0) {
      let earliestMatch: {
        type: 'link' | 'bold' | 'italic'
        match: RegExpMatchArray
        index: number
      } | null = null

      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex)
        if (!match || match.index === undefined) continue
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = {
            type: pattern.type,
            match,
            index: match.index,
          }
        }
      }

      if (!earliestMatch) {
        nodes.push(remaining)
        break
      }

      if (earliestMatch.index > 0) {
        nodes.push(remaining.slice(0, earliestMatch.index))
      }

      const matchText = earliestMatch.match[0]
      const content = earliestMatch.match[1]

      if (earliestMatch.type === 'link') {
        const href = earliestMatch.match[2]
        const isExternal = /^https?:\/\//.test(href) || href.startsWith('mailto:')
        nodes.push(
          <a
            key={`${keyPrefix}-link-${tokenIndex}`}
            href={href}
            className="underline underline-offset-2 text-primary"
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noreferrer' : undefined}
          >
            {parseDecorations(content, `${keyPrefix}-linktext-${tokenIndex}`)}
          </a>
        )
      } else if (earliestMatch.type === 'bold') {
        nodes.push(
          <strong key={`${keyPrefix}-bold-${tokenIndex}`}>
            {parseDecorations(content, `${keyPrefix}-bold-${tokenIndex}`)}
          </strong>
        )
      } else if (earliestMatch.type === 'italic') {
        nodes.push(
          <em key={`${keyPrefix}-italic-${tokenIndex}`}>
            {parseDecorations(content, `${keyPrefix}-italic-${tokenIndex}`)}
          </em>
        )
      }

      remaining = remaining.slice(earliestMatch.index + matchText.length)
      tokenIndex += 1
    }

    return nodes
  }

  const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
    const nodes: ReactNode[] = []
    const codeChunks = text.split('`')

    codeChunks.forEach((chunk, chunkIndex) => {
      if (chunkIndex % 2 === 1) {
        nodes.push(
          <code
            key={`${keyPrefix}-code-${chunkIndex}`}
            className="rounded bg-muted px-1 py-0.5 text-xs"
          >
            {chunk}
          </code>
        )
        return
      }

      nodes.push(...parseDecorations(chunk, `${keyPrefix}-inline-${chunkIndex}`))
    })

    return nodes
  }

  const renderTextBlock = (content: string, keyPrefix: string): ReactNode[] => {
    const elements: ReactNode[] = []
    const lines = content.split('\n')
    let listType: 'ul' | 'ol' | null = null
    let listItems: ReactNode[][] = []
    let quoteLines: string[] = []

    const flushList = () => {
      if (!listType || listItems.length === 0) return
      const listKey = `${keyPrefix}-list-${elements.length}`
      const list = listType === 'ul' ? (
        <ul key={listKey} className="list-disc pl-5 space-y-1">
          {listItems.map((item, itemIndex) => (
            <li key={`${listKey}-item-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <ol key={listKey} className="list-decimal pl-5 space-y-1">
          {listItems.map((item, itemIndex) => (
            <li key={`${listKey}-item-${itemIndex}`}>{item}</li>
          ))}
        </ol>
      )
      elements.push(list)
      listType = null
      listItems = []
    }

    const flushQuote = () => {
      if (quoteLines.length === 0) return
      const quoteKey = `${keyPrefix}-quote-${elements.length}`
      const quoteContent = quoteLines.join('\n')
      elements.push(
        <blockquote
          key={quoteKey}
          className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground"
        >
          {renderTextBlock(quoteContent, `${quoteKey}-content`)}
        </blockquote>
      )
      quoteLines = []
    }

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim()

      if (!trimmed) {
        flushQuote()
        flushList()
        elements.push(<div key={`${keyPrefix}-spacer-${lineIndex}`} className="h-2" />)
        return
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushQuote()
        flushList()
        elements.push(<hr key={`${keyPrefix}-hr-${lineIndex}`} className="border-border/60" />)
        return
      }

      if (trimmed.startsWith('>')) {
        flushList()
        quoteLines.push(trimmed.replace(/^>\s?/, ''))
        return
      }

      flushQuote()

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
      if (headingMatch) {
        flushList()
        const level = headingMatch[1].length
        const headingLevel = Math.min(level + 1, 6) as 2 | 3 | 4 | 5 | 6
        const headingContent = renderInline(headingMatch[2], `${keyPrefix}-heading-${lineIndex}`)
        const headingKey = `${keyPrefix}-heading-${lineIndex}`
        const headingClass = "font-semibold mt-2"

        switch (headingLevel) {
          case 2:
            elements.push(<h2 key={headingKey} className={headingClass}>{headingContent}</h2>)
            break
          case 3:
            elements.push(<h3 key={headingKey} className={headingClass}>{headingContent}</h3>)
            break
          case 4:
            elements.push(<h4 key={headingKey} className={headingClass}>{headingContent}</h4>)
            break
          case 5:
            elements.push(<h5 key={headingKey} className={headingClass}>{headingContent}</h5>)
            break
          case 6:
            elements.push(<h6 key={headingKey} className={headingClass}>{headingContent}</h6>)
            break
        }
        return
      }

      const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/)
      if (unorderedMatch) {
        if (listType && listType !== 'ul') {
          flushList()
        }
        listType = 'ul'
        listItems.push(renderInline(unorderedMatch[1], `${keyPrefix}-ul-${lineIndex}`))
        return
      }

      const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
      if (orderedMatch) {
        if (listType && listType !== 'ol') {
          flushList()
        }
        listType = 'ol'
        listItems.push(renderInline(orderedMatch[1], `${keyPrefix}-ol-${lineIndex}`))
        return
      }

      flushList()
      elements.push(
        <p key={`${keyPrefix}-line-${lineIndex}`} className="mb-2 last:mb-0">
          {renderInline(line, `${keyPrefix}-line-${lineIndex}`)}
        </p>
      )
    })

    flushList()
    flushQuote()
    return elements
  }

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n')
    const blocks: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = []
    let buffer: string[] = []
    let inCode = false
    let codeLang = ''

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('```')) {
        if (!inCode) {
          if (buffer.length > 0) {
            blocks.push({ type: 'text', content: buffer.join('\n') })
            buffer = []
          }
          inCode = true
          codeLang = trimmed.slice(3).trim()
        } else {
          blocks.push({ type: 'code', content: buffer.join('\n'), lang: codeLang })
          buffer = []
          inCode = false
          codeLang = ''
        }
        return
      }

      buffer.push(line)
    })

    if (buffer.length > 0) {
      blocks.push({ type: inCode ? 'code' : 'text', content: buffer.join('\n'), lang: codeLang })
    }

    return blocks.map((block, index) => {
      if (block.type === 'code') {
        return (
          <div key={`${block.type}-${index}`} className="not-prose relative rounded-md border border-border bg-background/60 p-3">
            <button
              type="button"
              onClick={() => handleCopy(block.content)}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              {lang === 'es' ? 'Copiar código' : 'Copy code'}
            </button>
            <pre className="overflow-x-auto text-xs">
              <code>{block.content}</code>
            </pre>
          </div>
        )
      }

      return (
        <div key={`${block.type}-${index}`} className="space-y-2">
          {renderTextBlock(block.content, `${block.type}-${index}`)}
        </div>
      )
    })
  }

  const handleScroll = () => {
    const atBottom = checkIsAtBottom()
    setShowScrollToLatest(!atBottom)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Model not loaded
  if (!isModelReady) {
    return (
      <div className="space-y-6">
        {title && (
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}
        <ModelDownloader />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] sm:h-[600px] max-h-[85vh] sm:max-h-[80vh] border border-border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">{conversationTitle}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {isGenerating
                ? (lang === 'es' ? 'Pensando...' : 'Thinking...')
                : (lang === 'es' ? 'Listo para ayudar' : 'Ready to help')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <label className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{lang === 'es' ? 'Modelo' : 'Model'}</span>
            <select
              value={activeModelId}
              onChange={handleModelChange}
              className="rounded-md border border-border bg-background px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs"
            >
              {Object.entries(AVAILABLE_MODELS).map(([id, config]) => (
                <option key={id} value={id}>{config.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handlePrivacyToggle}
            className={cn(
              'flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors',
              privacyMode && 'text-primary border-primary/40 bg-primary/10'
            )}
            title={lang === 'es' ? 'Modo privacidad' : 'Privacy mode'}
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{lang === 'es' ? 'Privacidad' : 'Privacy'}</span>
          </button>
          {activeConversation && (
            <button
              type="button"
              onClick={handleRenameConversation}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
              title={lang === 'es' ? 'Renombrar' : 'Rename'}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{lang === 'es' ? 'Renombrar' : 'Rename'}</span>
            </button>
          )}
          {canExport && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => handleExport('markdown')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                title="Export Markdown"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">MD</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                title="Export JSON"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
            title={lang === 'es' ? 'Nueva conversación' : 'New conversation'}
          >
            <RotateCcw className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            <span className="hidden sm:inline">{lang === 'es' ? 'Nueva' : 'New'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 relative overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4',
          privacyMode && 'blur-sm pointer-events-none select-none'
        )}
      >
        {messages.length === 0 ? (
          // Empty state with starters
          <div className="h-full flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary/50 mb-3 sm:mb-4" />
            <h4 className="text-base sm:text-lg font-medium mb-2">
              {lang === 'es' ? '¿Cómo puedo ayudarte?' : 'How can I help you?'}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md px-4">
              {lang === 'es'
                ? 'Estoy aquí para ayudarte con preguntas, escritura, explicaciones y más.'
                : 'I\'m here to help with questions, writing, explanations, and more.'}
            </p>

            {/* Suggested prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {starters.slice(0, 4).map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleStarterClick(starter)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message list
          messages.filter(m => m.role !== 'system').map((message, index) => {
            const isUser = message.role === 'user'
            const isLastUser = isUser && index === lastUserMessageIndex
            const canCopy = message.content.trim().length > 0

            return (
              <div
                key={index}
                className={cn(
                  'flex gap-2 sm:gap-3',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                )}

                <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' && message.content === '' && isGenerating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {renderMessageContent(message.content)}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      'flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] text-muted-foreground flex-wrap',
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      disabled={!canCopy}
                      className="inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground disabled:opacity-50"
                      title={lang === 'es' ? 'Copiar' : 'Copy'}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="hidden sm:inline">{lang === 'es' ? 'Copiar' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookmark(index)}
                      className={cn(
                        'inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground',
                        message.bookmarked && 'text-primary'
                      )}
                      title={lang === 'es' ? 'Marcar' : 'Bookmark'}
                    >
                      <Bookmark className="h-3 w-3" />
                      <span className="hidden md:inline">{lang === 'es' ? 'Guardar' : 'Save'}</span>
                    </button>
                    {!isUser && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReaction(index, 'up')}
                          className={cn(
                            'inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground',
                            message.reaction === 'up' && 'text-primary'
                          )}
                          title={lang === 'es' ? 'Me gusta' : 'Like'}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="hidden md:inline">{lang === 'es' ? 'Útil' : 'Helpful'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReaction(index, 'down')}
                          className={cn(
                            'inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground',
                            message.reaction === 'down' && 'text-primary'
                          )}
                          title={lang === 'es' ? 'No útil' : 'Not helpful'}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span className="hidden md:inline">{lang === 'es' ? 'No útil' : 'Not helpful'}</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(index, message.role === 'user' ? 'user' : 'assistant')}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-0.5 sm:gap-1 hover:text-destructive disabled:opacity-50"
                      title={lang === 'es' ? 'Eliminar' : 'Delete'}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden md:inline">{lang === 'es' ? 'Eliminar' : 'Delete'}</span>
                    </button>
                    {isLastUser && (
                      <>
                        <button
                          type="button"
                          onClick={handleEditLast}
                          disabled={isGenerating}
                          className="inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground disabled:opacity-50"
                          title={lang === 'es' ? 'Editar' : 'Edit'}
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="hidden md:inline">{lang === 'es' ? 'Editar' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResendLast}
                          disabled={isGenerating}
                          className="inline-flex items-center gap-0.5 sm:gap-1 hover:text-foreground disabled:opacity-50"
                          title={lang === 'es' ? 'Reenviar' : 'Resend'}
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span className="hidden md:inline">{lang === 'es' ? 'Reenviar' : 'Resend'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Error message */}
        {generationError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{generationError}</span>
          </div>
        )}

        {showScrollToLatest && (
          <button
            type="button"
            onClick={scrollToLatest}
            className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-1 sm:gap-2 rounded-full border border-border bg-background/90 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-muted-foreground shadow-sm hover:text-foreground"
          >
            <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{lang === 'es' ? 'Ir al final' : 'Jump to latest'}</span>
          </button>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          'border-t border-border p-2 sm:p-4 bg-muted/30',
          privacyMode && 'blur-sm pointer-events-none select-none'
        )}
      >
        {isEditing && (
          <div className="mb-2 flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs">
            <span>
              {lang === 'es' ? 'Editando el último mensaje' : 'Editing the last message'}
            </span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-primary hover:text-primary/80"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        )}
        {promptTemplates.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
              {lang === 'es' ? 'Plantillas:' : 'Templates:'}
            </span>
            {promptTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.content)}
                className="rounded-full border border-border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground"
              >
                {template.title}
              </button>
            ))}
          </div>
        )}
        <div className="mb-2 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50"
          >
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{lang === 'es' ? 'Analizar archivo' : 'Analyze file'}</span>
          </button>
          <span className="text-[10px] sm:text-xs">{lang === 'es' ? 'Análisis local' : 'Local analysis'}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="text/*,.json,.md,.ts,.tsx,.js,.jsx,.py,.rs,.go,.java"
          onChange={handleFileChange}
        />
        <div className="flex gap-1.5 sm:gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'es' ? 'Escribe tu mensaje...' : 'Type your message...'}
            disabled={isGenerating}
            rows={1}
            className="flex-1 px-3 sm:px-4 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50 text-sm"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="px-3 sm:px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted/80 transition-colors flex-shrink-0"
            >
              <Square className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
          {lang === 'es'
            ? 'Toda la conversación se procesa localmente. Tus datos nunca salen de tu dispositivo.'
            : 'All conversation is processed locally. Your data never leaves your device.'}
        </p>
      </form>
    </div>
  )
}
