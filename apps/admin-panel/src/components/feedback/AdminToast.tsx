import { useEffect, useState } from 'react'

export type AdminToastTone = 'success' | 'error' | 'warning' | 'info'

export type AdminToastMessage = {
  id: number
  tone: AdminToastTone
  title: string
  message: string
}

const TOAST_EVENT = 'vendora:admin-toast'
let nextToastId = 1

export function showAdminToast(toast: Omit<AdminToastMessage, 'id'>) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...toast, id: nextToastId++ } }))
}

export function AdminToastHost() {
  const [toasts, setToasts] = useState<AdminToastMessage[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const message = (event as CustomEvent<AdminToastMessage>).detail
      setToasts((current) => [...current, message])
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== message.id)), 5000)
    }
    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min( calc(100vw-2rem),_24rem)] flex-col gap-3" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto rounded-2xl border bg-white p-4 shadow-xl ${toast.tone === 'success' ? 'border-emerald-200' : toast.tone === 'error' ? 'border-rose-200' : toast.tone === 'warning' ? 'border-amber-200' : 'border-sky-200'}`} role="status">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 text-sm font-bold ${toast.tone === 'success' ? 'text-emerald-600' : toast.tone === 'error' ? 'text-rose-600' : toast.tone === 'warning' ? 'text-amber-600' : 'text-sky-600'}`} aria-hidden="true">{toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}