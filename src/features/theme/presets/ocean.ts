import type { ThemePreset } from '../types'

export const oceanTheme: ThemePreset = {
  id: 'ocean',
  name: { en: 'Ocean', es: 'Oceano' },
  description: { en: 'Deep sea blues', es: 'Azules del mar profundo' },
  colors: {
    background: '210 50% 10%',         // deep ocean
    foreground: '200 30% 92%',         // seafoam white
    card: '210 50% 13%',               // slightly lighter
    cardForeground: '200 30% 92%',
    popover: '210 50% 13%',
    popoverForeground: '200 30% 92%',
    primary: '190 70% 50%',            // tropical blue
    primaryForeground: '210 50% 10%',
    secondary: '210 40% 18%',          // mid ocean
    secondaryForeground: '200 30% 92%',
    muted: '210 40% 18%',
    mutedForeground: '200 20% 60%',
    accent: '170 65% 50%',             // teal wave
    accentForeground: '210 50% 10%',
    destructive: '15 75% 55%',         // coral warning
    destructiveForeground: '200 30% 92%',
    border: '210 40% 22%',
    input: '210 40% 22%',
    ring: '190 70% 50%',
  },
  meta: {
    isDark: true,
  },
}
