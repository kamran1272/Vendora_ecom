import { PageShell } from '@/components/common/PageShell'

export function AdminSellersPendingPage() {
  const pendingApplications = [
    { name: 'NorthPeak Studio', owner: 'Ariana Cole', email: 'ariana@northpeakstudio.com', submitted: '2026-08-21', category: 'Electronics', risk: 'Low', status: 'Awaiting review' },
    { name: 'Luma Home', owner: 'Marcus Lee', email: 'marcus@lumahome.com', submitted: '2026-08-24', category: 'Home', risk: 'Medium', status: 'Awaiting review' },
    { name: 'Summit Goods', owner: 'Tina Brooks', email: 'tina@summitgoods.co', submitted: '2026-08-26', category: 'Sports', risk: 'Low', status: 'Awaiting review' }
  ]

  return (
    <div className="space-y-6">
      <PageShell title="Pending sellers" description="Review new seller registrations, storefront readiness, and marketplace fit before approving the shop." />

      <div className="space-y-4">
        {pendingApplications.map((shop) => (
          <div key={shop.name} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{shop.name}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{shop.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Owner: {shop.owner} • {shop.email}</p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">Approve</button>
                <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700">Reject</button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submitted</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.submitted}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.category}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.risk}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Storefront</p>
                <p className="mt-2 text-base font-semibold text-slate-800">Profile complete</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review notes</p>
              <p className="mt-2 text-sm text-slate-600">Store details, contact information, shipping policy, and business profile are submitted. Admin should verify supplier legitimacy, brand alignment, and final marketplace readiness.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
