import type { ThemePreset } from '../types'

export const lightTheme: ThemePreset = {
  id: 'light',
  name: { en: 'Light', es: 'Claro' },
  description: { en: 'Clean and bright', es: 'Limpio y brillante' },
  colors: {
    background: '30 100% 98%',
    foreground: '220 26% 8%',
    card: '0 0% 100%',
    cardForeground: '220 26% 8%',
    popover: '0 0% 100%',
    popoverForeground: '220 26% 8%',
    primary: '142 71% 45%',
    primaryForeground: '0 0% 100%',
    secondary: '43 36% 87%',
    secondaryForeground: '220 26% 8%',
    muted: '43 20% 92%',
    mutedForeground: '220 15% 45%',
    accent: '191 62% 66%',
    accentForeground: '220 26% 8%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '43 20% 88%',
    input: '43 20% 88%',
    ring: '142 71% 45%',
  },
  meta: {
    isDark: false,
  },
}
