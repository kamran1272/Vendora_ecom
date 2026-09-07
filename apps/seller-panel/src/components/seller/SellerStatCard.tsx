import type { ReactNode } from 'react'

type SellerStatCardProps = { title: string; value: ReactNode; label?: string; icon?: ReactNode; className?: string }

export function SellerStatCard({ title, value, label, icon, className = '' }: SellerStatCardProps) {
  return <article className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-slate-700">{title}</p>{icon ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span> : null}</div><p className="mt-6 text-3xl font-black tracking-tight text-slate-900">{value}</p>{label ? <p className="mt-1 text-xs font-medium text-slate-500">{label}</p> : null}</article>
}
