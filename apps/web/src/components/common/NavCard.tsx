import { Link } from 'react-router-dom'

type NavCardProps = {
  title: string
  to: string
}

export function NavCard({ title, to }: NavCardProps) {
  return (
    <Link to={to} className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">Open section</p>
    </Link>
  )
}
