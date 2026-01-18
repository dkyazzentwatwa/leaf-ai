import type { ThemePreset } from '../types'

export const forestTheme: ThemePreset = {
  id: 'forest',
  name: { en: 'Forest', es: 'Bosque' },
  description: { en: 'Deep greens and earth', es: 'Verdes profundos y tierra' },
  colors: {
    background: '150 20% 10%',         // deep forest floor
    foreground: '80 25% 90%',          // soft leaf light
    card: '150 20% 13%',               // slightly lighter
    cardForeground: '80 25% 90%',
    popover: '150 20% 13%',
    popoverForeground: '80 25% 90%',
    primary: '142 50% 45%',            // forest green
    primaryForeground: '150 20% 10%',
    secondary: '150 15% 18%',          // moss
    secondaryForeground: '80 25% 90%',
    muted: '150 15% 18%',
    mutedForeground: '80 15% 60%',
    accent: '35 70% 55%',              // autumn gold
    accentForeground: '150 20% 10%',
    destructive: '0 55% 50%',          // berry red
    destructiveForeground: '80 25% 90%',
    border: '150 15% 22%',
    input: '150 15% 22%',
    ring: '142 50% 45%',
  },
  meta: {
    isDark: true,
  },
}
