import type { ReactNode } from 'react'

type SellerCardProps = { children: ReactNode; title?: string; className?: string }

export function SellerCard({ children, title, className = '' }: SellerCardProps) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{title ? <h2 className="text-sm font-bold text-slate-900">{title}</h2> : null}{title ? <div className="mt-4">{children}</div> : children}</section>
}
