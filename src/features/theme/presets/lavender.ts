import type { ThemePreset } from '../types'

export const lavenderTheme: ThemePreset = {
  id: 'lavender',
  name: { en: 'Lavender', es: 'Lavanda' },
  description: { en: 'Soft purple serenity', es: 'Serenidad morada suave' },
  colors: {
    background: '270 30% 96%',         // soft lavender white
    foreground: '270 25% 20%',         // deep purple-gray
    card: '270 30% 99%',               // pure white tint
    cardForeground: '270 25% 20%',
    popover: '270 30% 99%',
    popoverForeground: '270 25% 20%',
    primary: '270 60% 60%',            // lavender purple
    primaryForeground: '0 0% 100%',
    secondary: '270 20% 90%',          // light lavender
    secondaryForeground: '270 25% 20%',
    muted: '270 20% 90%',
    mutedForeground: '270 15% 50%',
    accent: '320 50% 65%',             // soft pink
    accentForeground: '270 25% 20%',
    destructive: '0 65% 55%',          // muted red
    destructiveForeground: '0 0% 100%',
    border: '270 20% 85%',
    input: '270 20% 85%',
    ring: '270 60% 60%',
  },
  meta: {
    isDark: false,
  },
}
