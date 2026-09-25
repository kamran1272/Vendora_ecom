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
    <div className="marketplace-section-header flex flex-col gap-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-white via-indigo-50/70 to-orange-50/70 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102451] sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>}
      </div>
      <Link to={actionTo} className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#102451] bg-[#102451] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b2d5d]">{actionLabel}<ArrowUpRight size={15} /></Link>
    </div>
  )
}
