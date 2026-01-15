import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, MessageCircle, Pencil, Tag, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAIStore } from '../stores/aiStore'
import { cn } from '@/utils/cn'

export function ConversationHistory() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const conversations = useAIStore((s) => s.conversations)
  const activeConversationId = useAIStore((s) => s.activeConversationId)
  const setActiveConversation = useAIStore((s) => s.setActiveConversation)
  const renameConversation = useAIStore((s) => s.renameConversation)
  const setConversationFolder = useAIStore((s) => s.setConversationFolder)
  const setConversationTags = useAIStore((s) => s.setConversationTags)
  const deleteConversation = useAIStore((s) => s.deleteConversation)

  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const availableFolders = useMemo(() => {
    const folders = new Set<string>()
    conversations.forEach((conversation) => {
      if (conversation.folder) folders.add(conversation.folder)
    })
    return Array.from(folders).sort()
  }, [conversations])

  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    conversations.forEach((conversation) => {
      conversation.tags?.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [conversations])

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

    if (!normalizedQuery) {
      return sorted
    }

    return sorted.filter((conversation) => {
      if (folderFilter !== 'all' && conversation.folder !== folderFilter) return false
      if (tagFilter !== 'all' && !(conversation.tags || []).includes(tagFilter)) return false
      const titleMatch = conversation.title?.toLowerCase().includes(normalizedQuery)
      const folderMatch = conversation.folder?.toLowerCase().includes(normalizedQuery)
      const tagMatch = (conversation.tags || []).some((tag) => tag.toLowerCase().includes(normalizedQuery))
      const messageMatch = conversation.messages.some((message) =>
        message.content.toLowerCase().includes(normalizedQuery)
      )
      return titleMatch || folderMatch || tagMatch || messageMatch
    })
  }, [conversations, folderFilter, query, tagFilter])

  const handleRename = (conversationId: string, currentTitle?: string) => {
    const promptText = lang === 'es'
      ? 'Nombre de la conversación'
      : 'Conversation name'
    const placeholder = currentTitle || ''
    const nextTitle = window.prompt(promptText, placeholder)

    if (nextTitle && nextTitle.trim()) {
      renameConversation(conversationId, nextTitle.trim())
    }
  }

  const handleFolder = (conversationId: string, currentFolder?: string) => {
    const promptText = lang === 'es'
      ? 'Carpeta (vacío para quitar)'
      : 'Folder (leave blank to clear)'
    const nextFolder = window.prompt(promptText, currentFolder || '')

    if (nextFolder === null) return
    setConversationFolder(conversationId, nextFolder.trim() || null)
  }

  const handleTags = (conversationId: string, currentTags?: string[]) => {
    const promptText = lang === 'es'
      ? 'Etiquetas separadas por comas'
      : 'Comma-separated tags'
    const nextTags = window.prompt(promptText, (currentTags || []).join(', '))

    if (nextTags === null) return

    const tags = nextTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setConversationTags(conversationId, Array.from(new Set(tags)))
  }

  const handleDeleteConversation = (conversationId: string, title?: string) => {
    const confirmMessage = lang === 'es'
      ? `¿Eliminar la conversación "${title || 'sin título'}"?`
      : `Delete conversation "${title || 'untitled'}"?`

    if (!window.confirm(confirmMessage)) return

    deleteConversation(conversationId)
  }

  const formatUpdatedAt = (timestamp: number) => {
    const formatter = new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    })
    return formatter.format(new Date(timestamp))
  }

  return (
    <div className="border border-border rounded-2xl bg-card p-4 sm:p-5 space-y-4 sm:space-y-5 w-full shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full lg:cursor-default group"
      >
        <div className="text-left">
          <h3 className="text-base font-bold tracking-tight">
            {lang === 'es' ? 'Conversaciones' : 'Conversations'}
          </h3>
          <p className="text-sm text-muted-foreground hidden sm:block mt-0.5">
            {lang === 'es'
              ? 'Gestiona tus chats'
              : 'Manage your chats'}
          </p>
        </div>
        <div className="lg:hidden">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
          )}
        </div>
      </button>

      <div className={cn("space-y-3 sm:space-y-4", !isExpanded && "hidden lg:block")}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={lang === 'es' ? 'Buscar...' : 'Search...'}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <div className="grid gap-2 sm:gap-3 text-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:gap-1.5">
            <span className="text-muted-foreground">
              {lang === 'es' ? 'Carpeta' : 'Folder'}
            </span>
            <select
              value={folderFilter}
              onChange={(event) => setFolderFilter(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="all">{lang === 'es' ? 'Todas' : 'All'}</option>
              {availableFolders.map((folder) => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:gap-1.5">
            <span className="text-muted-foreground">
              {lang === 'es' ? 'Etiqueta' : 'Tag'}
            </span>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="all">{lang === 'es' ? 'Todas' : 'All'}</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredConversations.length > 0 ? (
        <div className={cn("space-y-2.5 max-h-[50vh] sm:max-h-[420px] overflow-y-auto overflow-x-hidden pr-1.5", !isExpanded && "hidden lg:block")}>
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveConversation(conversation.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveConversation(conversation.id)
                }
              }}
              className={cn(
                'w-full rounded-xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40',
                conversation.id === activeConversationId
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
              )}
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                      {conversation.title
                        || (lang === 'es' ? 'Conversación sin título' : 'Untitled conversation')}
                    </span>
                  </div>
                  {(conversation.folder || (conversation.tags && conversation.tags.length > 0)) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {conversation.folder && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                          <Folder className="h-3 w-3" />
                          {conversation.folder}
                        </span>
                      )}
                      {(conversation.tags || []).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.messages.length} {lang === 'es' ? 'mensajes' : 'messages'} ·
                    {` ${formatUpdatedAt(conversation.updatedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRename(conversation.id, conversation.title)
                    }}
                    className="shrink-0 p-0.5 sm:p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Renombrar' : 'Rename'}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleFolder(conversation.id, conversation.folder)
                    }}
                    className="shrink-0 p-0.5 sm:p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Carpeta' : 'Folder'}
                  >
                    <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleTags(conversation.id, conversation.tags)
                    }}
                    className="shrink-0 p-0.5 sm:p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Etiquetas' : 'Tags'}
                  >
                    <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      event.preventDefault()
                      handleDeleteConversation(conversation.id, conversation.title)
                    }}
                    className="shrink-0 p-0.5 sm:p-1 text-muted-foreground hover:text-destructive"
                    title={lang === 'es' ? 'Eliminar' : 'Delete'}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("text-xs text-muted-foreground text-center py-6", !isExpanded && "hidden lg:block")}>
          {lang === 'es'
            ? 'No hay conversaciones guardadas todavía'
            : 'No saved conversations yet'}
        </div>
      )}
    </div>
  )
}
