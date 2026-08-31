export function OperationsPanel() {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Operations</h3>
        <button className="text-sm font-medium text-sky-600">Manage</button>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-sm text-slate-500">Inventory health</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">84%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-sm text-slate-500">Active campaigns</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">26</div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="text-sm text-slate-500">Avg. delivery time</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">3.4 days</div>
        </div>
      </div>
    </div>
  )
}
