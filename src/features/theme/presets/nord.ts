import type { ThemePreset } from '../types'

export const nordTheme: ThemePreset = {
  id: 'nord',
  name: { en: 'Nord', es: 'Nord' },
  description: { en: 'Arctic blue frost', es: 'Azul glacial del norte' },
  colors: {
    background: '220 16% 22%',         // #2e3440 polar night
    foreground: '218 27% 92%',         // #eceff4 snow storm
    card: '220 17% 26%',               // #3b4252
    cardForeground: '218 27% 92%',
    popover: '220 17% 26%',
    popoverForeground: '218 27% 92%',
    primary: '193 43% 67%',            // #88c0d0 frost
    primaryForeground: '220 16% 22%',
    secondary: '220 16% 28%',          // #434c5e
    secondaryForeground: '218 27% 92%',
    muted: '220 16% 28%',
    mutedForeground: '219 28% 72%',    // #d8dee9
    accent: '179 25% 65%',             // #8fbcbb frost teal
    accentForeground: '220 16% 22%',
    destructive: '354 42% 56%',        // #bf616a aurora red
    destructiveForeground: '218 27% 92%',
    border: '220 17% 32%',
    input: '220 17% 32%',
    ring: '193 43% 67%',
  },
  meta: {
    isDark: true,
    author: 'Arctic Ice Studio',
  },
}
