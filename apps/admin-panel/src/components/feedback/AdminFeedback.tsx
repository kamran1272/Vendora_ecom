import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'

export function AdminTableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return <div className="space-y-3 p-6" aria-label="Loading content">{Array.from({ length: rows }).map((_, row) => <div key={row} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }).map((__, column) => <div key={column} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>)}</div>
}

export function AdminContentSkeleton({ lines = 4 }: { lines?: number }) {
  return <div className="space-y-4 rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-sm" aria-label="Loading content"><div className="h-6 w-1/3 animate-pulse rounded-lg bg-slate-100" />{Array.from({ length: lines }).map((_, index) => <div key={index} className={`h-12 animate-pulse rounded-xl bg-slate-100 ${index % 2 ? 'w-4/5' : 'w-full'}`} />)}</div>
}

export function AdminEmptyState({ title, message, action }: { title: string; message: string; action?: { label: string; onClick: () => void } }) {
  return <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-6 w-6" /></span><h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>{action ? <button type="button" onClick={action.onClick} className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">{action.label}</button> : null}</div>
}

export function AdminErrorState({ onRetry, message = "We couldn't load this information." }: { onRetry?: () => void; message?: string }) {
  return <div className="flex flex-col items-center justify-center rounded-[26px] border border-rose-200 bg-rose-50/70 px-6 py-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><AlertCircle className="h-6 w-6" /></span><h3 className="mt-4 text-base font-semibold text-slate-900">Something went wrong</h3><p className="mt-1 max-w-sm text-sm text-rose-700">{message}</p>{onRetry ? <button type="button" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"><RefreshCw className="h-4 w-4" />Retry</button> : null}</div>
}
