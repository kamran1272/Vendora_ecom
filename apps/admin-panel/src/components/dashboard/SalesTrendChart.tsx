type SalesTrendChartProps = {
  values: number[]
}

export function SalesTrendChart({ values }: SalesTrendChartProps) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Performance</p>
          <h3 className="text-xl font-semibold text-slate-900">Sales trend</h3>
        </div>
        <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">This year</span>
      </div>

      <div className="flex h-56 items-end gap-3">
        {values.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-[18px] bg-gradient-to-t from-violet-600 to-sky-400"
              style={{ height: `${value}%` }}
            />
            <span className="text-xs text-slate-400">{['J', 'F', 'M', 'A', 'M', 'J', 'J'][index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
