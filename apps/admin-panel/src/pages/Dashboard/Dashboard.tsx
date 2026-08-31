import { useEffect, useState } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { KpiCards } from '../../components/dashboard/KpiCards'
import { SalesTrendChart } from '../../components/dashboard/SalesTrendChart'
import { FulfillmentCard } from '../../components/dashboard/FulfillmentCard'
import { TopSellers } from '../../components/dashboard/TopSellers'
import { RecentOrders } from '../../components/dashboard/RecentOrders'
import { SupportQueue } from '../../components/dashboard/SupportQueue'
import { OperationsPanel } from '../../components/dashboard/OperationsPanel'
import { getAdminOverview } from '../../services/admin.service'
import type { AdminOverview } from '../../types'

export function Dashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)

  useEffect(() => {
    void getAdminOverview().then(setOverview)
  }, [])

  if (!overview) {
    return (
      <AdminLayout>
        <div className="rounded-[26px] bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading dashboard...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="mb-6 flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Marketplace overview</p>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">This month</div>
          <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Export
          </button>
          <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm">
            Create report
          </button>
        </div>
      </header>

      <KpiCards items={overview.kpis} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <SalesTrendChart values={overview.salesBars} />
        <FulfillmentCard />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TopSellers sellers={overview.topSellers} />
        <RecentOrders orders={overview.recentOrders} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SupportQueue items={overview.supportQueue} />
        <OperationsPanel />
      </section>
    </AdminLayout>
  )
}
