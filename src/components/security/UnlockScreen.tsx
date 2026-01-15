/**
 * Unlock Screen Component
 *
 * Full-screen password entry when app is locked with encryption enabled.
 * Displays after app mount if encryption is enabled and user is not unlocked.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Eye, EyeOff, AlertCircle, Leaf } from 'lucide-react'
import { cn } from '@/utils/cn'

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<boolean>
  onForgotPassword: () => void
}

export function UnlockScreen({ onUnlock, onForgotPassword }: UnlockScreenProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const MAX_ATTEMPTS = 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      setError(lang === 'es' ? 'Ingresa tu contraseña' : 'Enter your password')
      return
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError(lang === 'es' ? 'Demasiados intentos. Recarga la página.' : 'Too many attempts. Reload the page.')
      return
    }

    setIsUnlocking(true)
    setError(null)

    try {
      const success = await onUnlock(password)
      if (!success) {
        setAttempts(prev => prev + 1)
        setError(
          lang === 'es'
            ? `Contraseña incorrecta. ${MAX_ATTEMPTS - attempts - 1} intentos restantes.`
            : `Incorrect password. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`
        )
        setPassword('')
      }
    } catch (error) {
      console.error('Unlock error:', error)
      setAttempts(prev => prev + 1)
      setError(
        lang === 'es'
          ? 'Error al desbloquear. Intenta de nuevo.'
          : 'Failed to unlock. Try again.'
      )
    } finally {
      setIsUnlocking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Leaf AI</h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'es' ? 'Datos Encriptados' : 'Encrypted Data'}
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {lang === 'es' ? 'Ingresa tu contraseña para desbloquear' : 'Enter your password to unlock'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                disabled={isUnlocking || attempts >= MAX_ATTEMPTS}
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors',
                  error ? 'border-red-500' : 'border-border'
                )}
                placeholder={lang === 'es' ? 'Contraseña' : 'Password'}
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isUnlocking}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Unlock Button */}
          <button
            type="submit"
            disabled={isUnlocking || !password || attempts >= MAX_ATTEMPTS}
            className={cn(
              'w-full px-4 py-3 rounded-lg font-medium transition-colors',
              isUnlocking || !password || attempts >= MAX_ATTEMPTS
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isUnlocking
              ? (lang === 'es' ? 'Desbloqueando...' : 'Unlocking...')
              : (lang === 'es' ? 'Desbloquear' : 'Unlock')}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isUnlocking}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
            >
              {lang === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {lang === 'es'
              ? 'Tus conversaciones están protegidas con encriptación AES-256-GCM'
              : 'Your conversations are protected with AES-256-GCM encryption'}
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>
              {lang === 'es' ? '100% Local - Sin Servidores' : '100% Local - No Servers'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
