/**
 * Persona Manager Component
 *
 * UI for creating and managing custom AI personas in Settings.
 * Allows users to define custom system prompts with bilingual support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { useAIStore } from '../stores/aiStore'
import { BUILT_IN_PERSONAS } from '../services/webllm/prompts'
import type { Persona } from '../services/webllm/prompts'
import { useToastStore } from '@/stores/toastStore'

export function PersonaManager() {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const customPersonas = useAIStore((s) => s.customPersonas)
  const addCustomPersona = useAIStore((s) => s.addCustomPersona)
  const updateCustomPersona = useAIStore((s) => s.updateCustomPersona)
  const deleteCustomPersona = useAIStore((s) => s.deleteCustomPersona)
  const addToast = useToastStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    nameEn: string
    nameEs: string
    descriptionEn: string
    descriptionEs: string
    promptEn: string
    promptEs: string
    icon: string
  }>({
    nameEn: '',
    nameEs: '',
    descriptionEn: '',
    descriptionEs: '',
    promptEn: '',
    promptEs: '',
    icon: '🤖',
  })

  const handleCreate = () => {
    setEditingId('new')
    setFormData({
      nameEn: '',
      nameEs: '',
      descriptionEn: '',
      descriptionEs: '',
      promptEn: '',
      promptEs: '',
      icon: '🤖',
    })
  }

  const handleEdit = (persona: Persona) => {
    setEditingId(persona.id)
    setFormData({
      nameEn: persona.name.en,
      nameEs: persona.name.es,
      descriptionEn: persona.description.en,
      descriptionEs: persona.description.es,
      promptEn: persona.systemPrompt.en,
      promptEs: persona.systemPrompt.es,
      icon: persona.icon || '🤖',
    })
  }

  const handleSave = () => {
    // Validation
    if (!formData.nameEn.trim() || !formData.promptEn.trim()) {
      addToast(
        lang === 'es'
          ? 'Nombre y prompt en inglés son requeridos'
          : 'English name and prompt are required',
        'error'
      )
      return
    }

    const personaData = {
      name: {
        en: formData.nameEn.trim(),
        es: formData.nameEs.trim() || formData.nameEn.trim(),
      },
      description: {
        en: formData.descriptionEn.trim(),
        es: formData.descriptionEs.trim() || formData.descriptionEn.trim(),
      },
      systemPrompt: {
        en: formData.promptEn.trim(),
        es: formData.promptEs.trim() || formData.promptEn.trim(),
      },
      icon: formData.icon,
    }

    if (editingId === 'new') {
      addCustomPersona(personaData)
      addToast(
        lang === 'es' ? 'Persona creada' : 'Persona created',
        'success'
      )
    } else if (editingId) {
      updateCustomPersona(editingId, personaData)
      addToast(
        lang === 'es' ? 'Persona actualizada' : 'Persona updated',
        'success'
      )
    }

    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    const confirmMessage = lang === 'es'
      ? '¿Eliminar esta persona personalizada?'
      : 'Delete this custom persona?'

    if (!window.confirm(confirmMessage)) return

    deleteCustomPersona(id)
    addToast(
      lang === 'es' ? 'Persona eliminada' : 'Persona deleted',
      'success'
    )
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  if (editingId) {
    return (
      <div className="space-y-4 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">
            {editingId === 'new'
              ? (lang === 'es' ? 'Nueva Persona' : 'New Persona')
              : (lang === 'es' ? 'Editar Persona' : 'Edit Persona')}
          </h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Save className="h-3 w-3" />
              {lang === 'es' ? 'Guardar' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted"
            >
              <X className="h-3 w-3" />
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Icon */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Icono (emoji)' : 'Icon (emoji)'}
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value.slice(0, 2) })}
              className="w-20 px-2 py-1 text-sm border border-border rounded-md bg-background"
              maxLength={2}
            />
          </div>

          {/* Name (English) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Nombre (Inglés) *' : 'Name (English) *'}
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              placeholder="e.g., Marketing Expert"
              maxLength={50}
            />
          </div>

          {/* Name (Spanish) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Nombre (Español)' : 'Name (Spanish)'}
            </label>
            <input
              type="text"
              value={formData.nameEs}
              onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              placeholder="ej., Experto en Marketing"
              maxLength={50}
            />
          </div>

          {/* Description (English) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Descripción (Inglés)' : 'Description (English)'}
            </label>
            <input
              type="text"
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              placeholder="Brief description of this persona"
              maxLength={100}
            />
          </div>

          {/* Description (Spanish) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Descripción (Español)' : 'Description (Spanish)'}
            </label>
            <input
              type="text"
              value={formData.descriptionEs}
              onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              placeholder="Breve descripción de esta persona"
              maxLength={100}
            />
          </div>

          {/* System Prompt (English) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Prompt del Sistema (Inglés) *' : 'System Prompt (English) *'}
            </label>
            <textarea
              value={formData.promptEn}
              onChange={(e) => setFormData({ ...formData, promptEn: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background font-mono"
              rows={10}
              placeholder="You are a marketing expert who specializes in..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'es'
                ? 'Define el comportamiento y personalidad de la IA'
                : 'Define the AI\'s behavior and personality'}
            </p>
          </div>

          {/* System Prompt (Spanish) */}
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'es' ? 'Prompt del Sistema (Español)' : 'System Prompt (Spanish)'}
            </label>
            <textarea
              value={formData.promptEs}
              onChange={(e) => setFormData({ ...formData, promptEs: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background font-mono"
              rows={10}
              placeholder="Eres un experto en marketing que se especializa en..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'es'
                ? 'Si no se proporciona, se usará la versión en inglés'
                : 'If not provided, English version will be used'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {lang === 'es' ? 'Personas de IA' : 'AI Personas'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'es'
              ? 'Crea personas personalizadas con prompts únicos'
              : 'Create custom personas with unique system prompts'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" />
          {lang === 'es' ? 'Nueva Persona' : 'New Persona'}
        </button>
      </div>

      {/* Built-in Personas (read-only preview) */}
      <div>
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">
          {lang === 'es' ? 'Preestablecidas' : 'Built-in Personas'}
        </h4>
        <div className="space-y-2">
          {Object.values(BUILT_IN_PERSONAS).map((persona) => (
            <div
              key={persona.id}
              className="flex items-center justify-between px-3 py-2 border border-border rounded-md bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{persona.icon}</span>
                <div>
                  <p className="text-sm font-medium">{persona.name[lang]}</p>
                  <p className="text-xs text-muted-foreground">{persona.description[lang]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Personas */}
      {customPersonas.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">
            {lang === 'es' ? 'Personalizadas' : 'Custom Personas'}
          </h4>
          <div className="space-y-2">
            {customPersonas.map((persona) => (
              <div
                key={persona.id}
                className="flex items-center justify-between px-3 py-2 border border-border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{persona.icon || '🤖'}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {persona.name[lang] || persona.name.en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {persona.description[lang] || persona.description.en}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(persona)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(persona.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {customPersonas.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          {lang === 'es'
            ? 'No hay personas personalizadas. ¡Crea una para empezar!'
            : 'No custom personas yet. Create one to get started!'}
        </p>
      )}
    </div>
  )
}
