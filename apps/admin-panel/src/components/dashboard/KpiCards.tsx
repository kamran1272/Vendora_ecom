import type { KpiItem } from '../../types'

type KpiCardsProps = {
  items: KpiItem[]
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                item.delta.startsWith('+')
                  ? item.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.tone === 'sky'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-violet-100 text-violet-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {item.delta}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
        </div>
      ))}
    </section>
  )
}
