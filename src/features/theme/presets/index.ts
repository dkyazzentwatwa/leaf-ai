import type { ThemePreset, ThemeId } from '../types'
import { lightTheme } from './light'
import { darkTheme } from './dark'
import { draculaTheme } from './dracula'
import { nordTheme } from './nord'
import { monokaiTheme } from './monokai'
import { solarizedLightTheme, solarizedDarkTheme } from './solarized'
import { forestTheme } from './forest'
import { oceanTheme } from './ocean'
import { sunsetTheme } from './sunset'
import { lavenderTheme } from './lavender'

export const themes: Record<ThemeId, ThemePreset> = {
  light: lightTheme,
  dark: darkTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  monokai: monokaiTheme,
  'solarized-light': solarizedLightTheme,
  'solarized-dark': solarizedDarkTheme,
  forest: forestTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  lavender: lavenderTheme,
}

export const themeOrder: ThemeId[] = [
  'light',
  'dark',
  'dracula',
  'nord',
  'monokai',
  'solarized-light',
  'solarized-dark',
  'forest',
  'ocean',
  'sunset',
  'lavender',
]

export {
  lightTheme,
  darkTheme,
  draculaTheme,
  nordTheme,
  monokaiTheme,
  solarizedLightTheme,
  solarizedDarkTheme,
  forestTheme,
  oceanTheme,
  sunsetTheme,
  lavenderTheme,
}
