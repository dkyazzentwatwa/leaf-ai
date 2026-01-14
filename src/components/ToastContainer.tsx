import { useEffect, useRef } from 'react'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/utils/cn'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  const activeTimers = useRef(new Set<string>())

  useEffect(() => {
    toasts.forEach((toast) => {
      if (activeTimers.current.has(toast.id)) return
      activeTimers.current.add(toast.id)
      window.setTimeout(() => {
        removeToast(toast.id)
        activeTimers.current.delete(toast.id)
      }, 3200)
    })
  }, [toasts, removeToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm shadow-lg backdrop-blur',
            toast.variant === 'success' && 'border-green-500/40 bg-green-500/10 text-green-700',
            toast.variant === 'error' && 'border-red-500/40 bg-red-500/10 text-red-700',
            toast.variant === 'info' && 'border-border bg-background/90 text-foreground'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
