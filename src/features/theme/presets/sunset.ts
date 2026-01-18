import type { ThemePreset } from '../types'

export const sunsetTheme: ThemePreset = {
  id: 'sunset',
  name: { en: 'Sunset', es: 'Atardecer' },
  description: { en: 'Warm evening glow', es: 'Cálido resplandor vespertino' },
  colors: {
    background: '15 30% 12%',          // dusky warm dark
    foreground: '35 60% 92%',          // warm white
    card: '15 30% 15%',                // slightly lighter
    cardForeground: '35 60% 92%',
    popover: '15 30% 15%',
    popoverForeground: '35 60% 92%',
    primary: '25 90% 55%',             // orange sun
    primaryForeground: '15 30% 12%',
    secondary: '15 25% 20%',           // twilight
    secondaryForeground: '35 60% 92%',
    muted: '15 25% 20%',
    mutedForeground: '25 30% 60%',
    accent: '340 70% 60%',             // pink clouds
    accentForeground: '15 30% 12%',
    destructive: '0 70% 55%',          // deep red
    destructiveForeground: '35 60% 92%',
    border: '15 25% 24%',
    input: '15 25% 24%',
    ring: '25 90% 55%',
  },
  meta: {
    isDark: true,
  },
}
