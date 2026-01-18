import type { ThemePreset } from '../types'

export const draculaTheme: ThemePreset = {
  id: 'dracula',
  name: { en: 'Dracula', es: 'Dracula' },
  description: { en: 'Dark purple aesthetic', es: 'Estilo morado oscuro' },
  colors: {
    background: '231 15% 18%',        // #282a36
    foreground: '60 30% 96%',          // #f8f8f2
    card: '232 14% 21%',               // #2d303d
    cardForeground: '60 30% 96%',
    popover: '232 14% 21%',
    popoverForeground: '60 30% 96%',
    primary: '265 89% 78%',            // #bd93f9 purple
    primaryForeground: '231 15% 18%',
    secondary: '231 15% 25%',          // slightly lighter bg
    secondaryForeground: '60 30% 96%',
    muted: '231 15% 25%',
    mutedForeground: '60 10% 70%',
    accent: '326 100% 74%',            // #ff79c6 pink
    accentForeground: '231 15% 18%',
    destructive: '0 100% 67%',         // #ff5555 red
    destructiveForeground: '60 30% 96%',
    border: '232 14% 28%',
    input: '232 14% 28%',
    ring: '265 89% 78%',
  },
  meta: {
    isDark: true,
    author: 'Zeno Rocha',
  },
}
