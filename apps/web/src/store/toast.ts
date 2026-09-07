import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastMessage = {
  id: number
  tone: ToastTone
  title: string
  message: string
}

interface ToastState {
  toasts: ToastMessage[]
  show: (toast: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: number) => void
}

let nextToastId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const existing = get().toasts.find((item) => item.message === toast.message)
    if (existing) return
    const id = nextToastId++
    set((state) => ({ toasts: [...state.toasts.slice(-3), { ...toast, id }] }))
    window.setTimeout(() => get().dismiss(id), 4200)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
