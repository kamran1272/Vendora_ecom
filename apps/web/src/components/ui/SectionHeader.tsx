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
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      <Link to={actionTo} className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 md:inline-flex">{actionLabel}</Link>
    </div>
  )
}
