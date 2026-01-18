export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemePreset {
  id: string
  name: { en: string; es: string }
  description: { en: string; es: string }
  colors: ThemeColors
  meta: {
    isDark: boolean
    author?: string
  }
}

export type ThemeId =
  | 'light'
  | 'dark'
  | 'dracula'
  | 'nord'
  | 'monokai'
  | 'solarized-light'
  | 'solarized-dark'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'lavender'
