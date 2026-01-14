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
    <div className="border border-border rounded-lg bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full lg:cursor-default"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold">
            {lang === 'es' ? 'Historial de Conversaciones' : 'Conversation History'}
          </h3>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {lang === 'es'
              ? 'Busca o cambia entre sesiones guardadas'
              : 'Search or switch between saved chats'}
          </p>
        </div>
        <div className="lg:hidden">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      <div className={cn("space-y-2", !isExpanded && "hidden lg:block")}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={lang === 'es' ? 'Buscar conversaciones...' : 'Search conversations...'}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">
              {lang === 'es' ? 'Carpeta' : 'Folder'}
            </span>
            <select
              value={folderFilter}
              onChange={(event) => setFolderFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1"
            >
              <option value="all">{lang === 'es' ? 'Todas' : 'All'}</option>
              {availableFolders.map((folder) => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">
              {lang === 'es' ? 'Etiqueta' : 'Tag'}
            </span>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1"
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
        <div className={cn("space-y-2 max-h-[420px] overflow-y-auto pr-1", !isExpanded && "hidden lg:block")}>
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
                'w-full rounded-lg border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
                conversation.id === activeConversationId
                  ? 'border-primary bg-primary/10'
                  : 'border-border/60 hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRename(conversation.id, conversation.title)
                    }}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Renombrar' : 'Rename'}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleFolder(conversation.id, conversation.folder)
                    }}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Carpeta' : 'Folder'}
                  >
                    <Folder className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleTags(conversation.id, conversation.tags)
                    }}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                    title={lang === 'es' ? 'Etiquetas' : 'Tags'}
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      event.preventDefault()
                      handleDeleteConversation(conversation.id, conversation.title)
                    }}
                    className="shrink-0 p-1 text-muted-foreground hover:text-destructive"
                    title={lang === 'es' ? 'Eliminar' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
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
