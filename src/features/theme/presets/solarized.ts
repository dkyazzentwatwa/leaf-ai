import type { ThemePreset } from '../types'

export const solarizedLightTheme: ThemePreset = {
  id: 'solarized-light',
  name: { en: 'Solarized Light', es: 'Solarized Claro' },
  description: { en: 'Warm and balanced', es: 'Cálido y equilibrado' },
  colors: {
    background: '44 87% 94%',          // #fdf6e3 base3
    foreground: '192 81% 14%',         // #073642 base02
    card: '44 87% 99%',                // slightly lighter
    cardForeground: '192 81% 14%',
    popover: '44 87% 99%',
    popoverForeground: '192 81% 14%',
    primary: '175 59% 40%',            // #2aa198 cyan
    primaryForeground: '44 87% 94%',
    secondary: '46 42% 88%',           // #eee8d5 base2
    secondaryForeground: '192 81% 14%',
    muted: '46 42% 88%',
    mutedForeground: '194 14% 40%',    // #657b83 base00
    accent: '18 89% 55%',              // #cb4b16 orange
    accentForeground: '44 87% 94%',
    destructive: '1 71% 52%',          // #dc322f red
    destructiveForeground: '44 87% 94%',
    border: '46 42% 82%',
    input: '46 42% 82%',
    ring: '175 59% 40%',
  },
  meta: {
    isDark: false,
    author: 'Ethan Schoonover',
  },
}

export const solarizedDarkTheme: ThemePreset = {
  id: 'solarized-dark',
  name: { en: 'Solarized Dark', es: 'Solarized Oscuro' },
  description: { en: 'Classic dark balance', es: 'Equilibrio oscuro clásico' },
  colors: {
    background: '192 81% 14%',         // #073642 base02
    foreground: '44 87% 94%',          // #fdf6e3 base3
    card: '192 100% 11%',              // #002b36 base03
    cardForeground: '44 87% 94%',
    popover: '192 100% 11%',
    popoverForeground: '44 87% 94%',
    primary: '175 59% 40%',            // #2aa198 cyan
    primaryForeground: '192 81% 14%',
    secondary: '192 81% 18%',
    secondaryForeground: '44 87% 94%',
    muted: '192 81% 18%',
    mutedForeground: '186 8% 55%',     // #839496 base0
    accent: '18 89% 55%',              // #cb4b16 orange
    accentForeground: '192 81% 14%',
    destructive: '1 71% 52%',          // #dc322f red
    destructiveForeground: '44 87% 94%',
    border: '192 81% 22%',
    input: '192 81% 22%',
    ring: '175 59% 40%',
  },
  meta: {
    isDark: true,
    author: 'Ethan Schoonover',
  },
}
