type SalesStatCardProps = {
  title: string
  subtitle: string
  current: number
  previous: number
  previousLabel: string
}

export function SalesStatCard({ title, subtitle, current, previous, previousLabel }: SalesStatCardProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-3 text-2xl font-semibold text-slate-900">${current.toFixed(2)}</div>
      <div className="mt-2 text-xs text-slate-500">{previousLabel}: ${previous.toFixed(2)}</div>
    </div>
  )
}
