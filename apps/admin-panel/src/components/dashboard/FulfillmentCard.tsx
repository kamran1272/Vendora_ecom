export function FulfillmentCard() {
  return (
    <div className="rounded-[28px] bg-slate-900 p-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
      <p className="text-sm text-slate-300">Fulfillment</p>
      <h3 className="mt-3 text-3xl font-bold">92.4%</h3>

      <div className="mt-6 space-y-5">
        {[
          { label: 'On-time', value: 94, color: 'bg-emerald-400' },
          { label: 'Inventory health', value: 86, color: 'bg-cyan-400' },
          { label: 'Returns', value: 31, color: 'bg-rose-400' },
        ].map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
