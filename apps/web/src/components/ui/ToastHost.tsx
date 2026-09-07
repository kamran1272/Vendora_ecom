import { useToastStore } from '@/store/toast'

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[min(calc(100vw-1.5rem),24rem)] flex-col gap-3 sm:right-4 sm:top-4" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={`toast-enter pointer-events-auto rounded-2xl border bg-white p-4 shadow-xl ${toast.tone === 'success' ? 'border-emerald-200' : toast.tone === 'error' ? 'border-rose-200' : 'border-sky-200'}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${toast.tone === 'success' ? 'bg-emerald-100 text-emerald-700' : toast.tone === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`} aria-hidden="true">{toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{toast.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p></div>
            <button type="button" onClick={() => dismiss(toast.id)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Dismiss notification">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
