import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionTo
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actionLabel: string
  actionTo: string
}) {
  return (
    <div className="flex flex-col gap-4 border-l-4 border-orange-300 pl-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>}
      </div>
      <Link to={actionTo} className="inline-flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{actionLabel}<ArrowUpRight size={15} /></Link>
    </div>
  )
}
