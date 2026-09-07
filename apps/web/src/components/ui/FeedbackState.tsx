import type { ReactNode } from 'react'

type FeedbackStateProps = {
  title?: string
  message?: string
  className?: string
  action?: ReactNode
}

export function LoadingState({ message = 'Loading...', className = '', variant = 'cards' }: FeedbackStateProps & { variant?: 'cards' | 'detail' | 'list' }) {
  if (variant === 'detail') {
    return <div className={`skeleton-shimmer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} role="status" aria-label={message}><div className="grid gap-6 lg:grid-cols-2"><div className="h-80 rounded-2xl bg-slate-100" /><div className="space-y-4"><div className="h-4 w-1/3 rounded bg-slate-100" /><div className="h-10 w-3/4 rounded bg-slate-100" /><div className="h-5 w-1/2 rounded bg-slate-100" /><div className="h-24 rounded bg-slate-100" /><div className="h-12 rounded bg-slate-100" /></div></div></div>
  }

  if (variant === 'list') {
    return <div className={`space-y-4 ${className}`} role="status" aria-label={message}>{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-shimmer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="h-4 w-1/3 rounded bg-slate-100" /><div className="mt-4 h-6 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /></div>)}</div>
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`} role="status" aria-live="polite" aria-label={message}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton-shimmer h-80 rounded-[1.7rem] border border-slate-200 bg-slate-100" />
      ))}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message = 'There is no data to display.', className = '', action }: FeedbackStateProps) {
  return (
    <div className={`rounded-[1.7rem] border border-dashed border-slate-300 bg-white p-10 text-center ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-600" aria-hidden="true">—</div>
      <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message = 'We could not load this information. Please try again.', className = '', action }: FeedbackStateProps) {
  return (
    <div className={`rounded-[1.7rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 ${className}`} role="alert">
      <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold" aria-hidden="true">!</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm">{message}</p>{action && <div className="mt-4">{action}</div>}</div></div>
    </div>
  )
}
