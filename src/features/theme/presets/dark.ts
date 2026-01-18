import type { ThemePreset } from '../types'

export const darkTheme: ThemePreset = {
  id: 'dark',
  name: { en: 'Dark', es: 'Oscuro' },
  description: { en: 'Easy on the eyes', es: 'Suave para la vista' },
  colors: {
    background: '220 26% 8%',
    foreground: '43 36% 95%',
    card: '220 26% 10%',
    cardForeground: '43 36% 95%',
    popover: '220 26% 10%',
    popoverForeground: '43 36% 95%',
    primary: '142 69% 58%',
    primaryForeground: '220 26% 8%',
    secondary: '220 20% 16%',
    secondaryForeground: '43 36% 95%',
    muted: '220 20% 16%',
    mutedForeground: '220 15% 60%',
    accent: '218 94% 76%',
    accentForeground: '220 26% 8%',
    destructive: '0 63% 50%',
    destructiveForeground: '0 0% 100%',
    border: '220 20% 18%',
    input: '220 20% 18%',
    ring: '142 69% 58%',
  },
  meta: {
    isDark: true,
  },
}
