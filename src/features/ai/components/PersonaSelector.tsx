/**
 * Persona Selector Component
 *
 * Dropdown selector for choosing AI personas (built-in or custom).
 * Displays persona icon and name with grouped options.
 */

import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useAIStore } from '../stores/aiStore'
import { BUILT_IN_PERSONAS } from '../services/webllm/prompts'
import { cn } from '@/utils/cn'

interface PersonaSelectorProps {
  value: string  // Persona ID
  onChange: (personaId: string) => void
  className?: string
}

export function PersonaSelector({ value, onChange, className }: PersonaSelectorProps) {
  const { i18n } = useTranslation()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const customPersonas = useAIStore((s) => s.customPersonas)

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-border bg-background px-3 py-1.5 pr-8 text-xs sm:text-sm cursor-pointer hover:bg-muted transition-colors"
      >
        <optgroup label={lang === 'es' ? 'Preestablecidas' : 'Built-in'}>
          {Object.values(BUILT_IN_PERSONAS).map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.icon} {persona.name[lang]}
            </option>
          ))}
        </optgroup>

        {customPersonas.length > 0 && (
          <optgroup label={lang === 'es' ? 'Personalizadas' : 'Custom'}>
            {customPersonas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.icon || '🤖'} {persona.name[lang] || persona.name.en}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  )
}
