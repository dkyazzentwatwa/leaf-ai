/**
 * Password Setup Dialog Component
 *
 * First-time encryption setup modal. Allows users to enable AES-256-GCM encryption
 * with a password. Shows password strength validation and warnings.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Eye, EyeOff, AlertTriangle, X } from 'lucide-react'
import { validatePasswordStrength } from '@/utils/encryption'
import { cn } from '@/utils/cn'

interface PasswordSetupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSetup: (password: string) => void
  onSkip: () => void
}

export function PasswordSetupDialog({ isOpen, onClose, onSetup, onSkip }: PasswordSetupDialogProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'es' ? 'es' : 'en'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const passwordValidation = password ? validatePasswordStrength(password) : null
  const passwordsMatch = password === confirmPassword
  const canSubmit = password && confirmPassword && passwordsMatch && (passwordValidation?.score ?? 0) >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      onSetup(password)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {lang === 'es' ? 'Configurar Encriptación' : 'Setup Encryption'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lang === 'es'
                ? 'Protege tus conversaciones con encriptación AES-256-GCM. Tu contraseña nunca sale de tu dispositivo.'
                : 'Protect your conversations with AES-256-GCM encryption. Your password never leaves your device.'}
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {lang === 'es' ? 'Contraseña' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={lang === 'es' ? 'Ingresa una contraseña fuerte' : 'Enter a strong password'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && passwordValidation && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        passwordValidation.score > level
                          ? passwordValidation.score <= 1
                            ? 'bg-red-500'
                            : passwordValidation.score === 2
                            ? 'bg-yellow-500'
                            : passwordValidation.score === 3
                            ? 'bg-green-500'
                            : 'bg-green-600'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  'text-xs',
                  passwordValidation.score <= 1 ? 'text-red-500' :
                  passwordValidation.score === 2 ? 'text-yellow-500' :
                  'text-green-500'
                )}>
                  {passwordValidation.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {lang === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary',
                  confirmPassword && !passwordsMatch
                    ? 'border-red-500'
                    : 'border-border'
                )}
                placeholder={lang === 'es' ? 'Confirma tu contraseña' : 'Confirm your password'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500">
                {lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {lang === 'es'
                ? '⚠️ IMPORTANTE: Si olvidas tu contraseña, no podrás recuperar tus datos. No hay forma de resetear la contraseña.'
                : '⚠️ IMPORTANT: If you forget your password, you cannot recover your data. There is no way to reset the password.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {lang === 'es' ? 'Omitir' : 'Skip'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex-1 px-4 py-2 rounded-md text-sm font-medium',
                canSubmit
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {lang === 'es' ? 'Habilitar Encriptación' : 'Enable Encryption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
