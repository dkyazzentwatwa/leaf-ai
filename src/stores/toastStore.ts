import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant?: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, variant?: Toast['variant']) => string
  removeToast: (id: string) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, variant = 'info') => {
    const id = generateId()
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }))
    return id
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
}))
