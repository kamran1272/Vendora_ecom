export function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f59a36]">Admin dashboard</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Marketplace overview</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Orders</p>
          <p className="mt-3 text-3xl font-black text-slate-900">1,284</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Sellers</p>
          <p className="mt-3 text-3xl font-black text-slate-900">98</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Products</p>
          <p className="mt-3 text-3xl font-black text-slate-900">4,240</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Revenue</p>
          <p className="mt-3 text-3xl font-black text-slate-900">$68k</p>
        </div>
      </div>
    </div>
  )
}
