import type { ThemePreset } from '../types'

export const monokaiTheme: ThemePreset = {
  id: 'monokai',
  name: { en: 'Monokai', es: 'Monokai' },
  description: { en: 'Vibrant classic', es: 'Vibrante clásico' },
  colors: {
    background: '70 8% 15%',           // #272822
    foreground: '60 36% 96%',          // #f8f8f2
    card: '70 8% 18%',                 // slightly lighter
    cardForeground: '60 36% 96%',
    popover: '70 8% 18%',
    popoverForeground: '60 36% 96%',
    primary: '80 76% 53%',             // #a6e22e green
    primaryForeground: '70 8% 15%',
    secondary: '70 8% 22%',
    secondaryForeground: '60 36% 96%',
    muted: '70 8% 22%',
    mutedForeground: '60 17% 73%',
    accent: '190 81% 67%',             // #66d9ef cyan
    accentForeground: '70 8% 15%',
    destructive: '6 75% 59%',          // #f92672 magenta/red
    destructiveForeground: '60 36% 96%',
    border: '70 8% 26%',
    input: '70 8% 26%',
    ring: '80 76% 53%',
  },
  meta: {
    isDark: true,
    author: 'Wimer Hazenberg',
  },
}
