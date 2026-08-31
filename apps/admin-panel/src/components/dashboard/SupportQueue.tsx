import type { SupportItem } from '../../types'

type SupportQueueProps = {
  items: SupportItem[]
}

export function SupportQueue({ items }: SupportQueueProps) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Support queue</h3>
        <button className="text-sm font-medium text-sky-600">Open board</button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <span className={`inline-block h-3 w-3 rounded-full ${item.color}`} />
              <span className="font-medium text-slate-700">{item.title}</span>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
