import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

export type SellerToastTone = 'success' | 'error' | 'warning' | 'info'

type SellerToast = {
  id: number
  tone: SellerToastTone
  title: string
  message: string
}

const TOAST_EVENT = 'vendora:seller-toast'
let nextToastId = 1

export function showSellerToast(toast: Omit<SellerToast, 'id'>) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...toast, id: nextToastId++ } }))
}

export function SellerToastHost() {
  const [toasts, setToasts] = useState<SellerToast[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const toast = (event as CustomEvent<SellerToast>).detail
      setToasts((current) => [...current.filter((item) => item.message !== toast.message), toast])
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 5000)
    }
    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [])

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[min(calc(100vw-1.5rem),24rem)] flex-col gap-3 sm:right-4 sm:top-4" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto rounded-xl border bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${toast.tone === 'success' ? 'border-emerald-200' : toast.tone === 'error' ? 'border-rose-200' : toast.tone === 'warning' ? 'border-amber-200' : 'border-sky-200'}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 ${toast.tone === 'success' ? 'text-emerald-600' : toast.tone === 'error' ? 'text-rose-600' : toast.tone === 'warning' ? 'text-amber-600' : 'text-sky-600'}`} aria-hidden="true">{toast.tone === 'success' ? <CheckCircle2 size={19} /> : toast.tone === 'error' ? <AlertCircle size={19} /> : toast.tone === 'warning' ? <TriangleAlert size={19} /> : <Info size={19} />}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{toast.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p></div>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
