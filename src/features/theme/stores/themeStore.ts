/**
 * Theme State Store (Zustand)
 *
 * Manages theme selection and persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId } from '../types'
import { themes } from '../presets'

const THEME_STORAGE_KEY = 'leaf-theme-v2'
const OLD_THEME_KEY = 'leaf-theme'

interface ThemeState {
  activeThemeId: ThemeId
  setTheme: (themeId: ThemeId) => void
  isDarkTheme: () => boolean
}

// Detect system preference
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Migrate from old theme key if exists
function migrateOldTheme(): ThemeId | null {
  if (typeof window === 'undefined') return null
  const oldTheme = localStorage.getItem(OLD_THEME_KEY)
  if (oldTheme) {
    localStorage.removeItem(OLD_THEME_KEY)
    if (oldTheme === 'dark' || oldTheme === 'light') {
      return oldTheme
    }
  }
  return null
}

// Get initial theme
function getInitialTheme(): ThemeId {
  // Check for migrated old theme
  const migrated = migrateOldTheme()
  if (migrated) return migrated

  // Fall back to system preference
  return getSystemPreference()
}

// Apply theme to DOM
export function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return

  const theme = themes[themeId]
  if (!theme) return

  const root = document.documentElement

  // Set data-theme attribute
  root.setAttribute('data-theme', themeId)

  // Also handle .dark class for any components that still use it
  if (theme.meta.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Apply CSS variables directly for immediate effect
  const { colors } = theme
  root.style.setProperty('--background', colors.background)
  root.style.setProperty('--foreground', colors.foreground)
  root.style.setProperty('--card', colors.card)
  root.style.setProperty('--card-foreground', colors.cardForeground)
  root.style.setProperty('--popover', colors.popover)
  root.style.setProperty('--popover-foreground', colors.popoverForeground)
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--secondary', colors.secondary)
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground)
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--muted-foreground', colors.mutedForeground)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-foreground', colors.accentForeground)
  root.style.setProperty('--destructive', colors.destructive)
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground)
  root.style.setProperty('--border', colors.border)
  root.style.setProperty('--input', colors.input)
  root.style.setProperty('--ring', colors.ring)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: getInitialTheme(),

      setTheme: (themeId: ThemeId) => {
        applyTheme(themeId)
        set({ activeThemeId: themeId })
      },

      isDarkTheme: () => {
        const theme = themes[get().activeThemeId]
        return theme?.meta.isDark ?? false
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ activeThemeId: state.activeThemeId }),
    }
  )
)

// Subscribe to store changes to apply theme
useThemeStore.subscribe((state) => {
  applyTheme(state.activeThemeId)
})

// Initialize theme on load
if (typeof window !== 'undefined') {
  // Apply immediately to prevent flash
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.state?.activeThemeId) {
        applyTheme(parsed.state.activeThemeId)
      }
    } catch {
      applyTheme(getInitialTheme())
    }
  } else {
    applyTheme(getInitialTheme())
  }
}
