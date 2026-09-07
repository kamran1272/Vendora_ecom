import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CircleDollarSign, ClipboardList, Package, RefreshCw, Store, Users, WalletCards } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getAdminOverview, type DashboardRange } from '../../services/admin.service'
import type { DashboardOverview } from '../../types'

const rangeOptions: Array<{ id: DashboardRange; label: string }> = [
  { id: '7d', label: 'This week' },
  { id: '30d', label: 'This month' },
  { id: '365d', label: 'This year' },
  { id: 'custom', label: 'Custom range' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function Dashboard() {
  const [range, setRange] = useState<DashboardRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOverview = async () => {
    setLoading(true)
    const nextOverview = await getAdminOverview(range, customFrom, customTo)
    setOverview(nextOverview)
    setLoading(false)
  }

  useEffect(() => {
    void loadOverview()
  }, [range, customFrom, customTo])

  const summaryCards = useMemo(
    () => [
      { label: 'Gross revenue', value: overview ? formatCurrency(overview.stats.grossRevenue) : '$0', tone: 'emerald', icon: CircleDollarSign },
      { label: 'Net revenue', value: overview ? formatCurrency(overview.stats.netRevenue) : '$0', tone: 'sky', icon: WalletCards },
      { label: 'GMV', value: overview ? formatCurrency(overview.stats.gmv) : '$0', tone: 'violet', icon: Activity },
      { label: 'Orders', value: overview ? String(overview.stats.orders) : '0', tone: 'amber', icon: ClipboardList },
      { label: 'Customers', value: overview ? String(overview.stats.customers) : '0', tone: 'slate', icon: Users },
      { label: 'Sellers', value: overview ? String(overview.stats.sellers) : '0', tone: 'rose', icon: Store },
      { label: 'Products', value: overview ? String(overview.stats.products) : '0', tone: 'sky', icon: Package },
      { label: 'Refunds', value: overview ? formatCurrency(overview.stats.refunds) : '$0', tone: 'rose', icon: RefreshCw },
      { label: 'Commissions', value: overview ? formatCurrency(overview.stats.commissions) : '$0', tone: 'violet', icon: WalletCards },
      { label: 'AOV', value: overview ? formatCurrency(overview.stats.averageOrderValue) : '$0', tone: 'emerald', icon: CircleDollarSign },
      { label: 'Conversion', value: overview ? `${overview.stats.conversionRate.toFixed(2)}%` : '0.00%', tone: 'slate', icon: Activity },
      { label: 'Active sellers', value: overview ? String(overview.stats.activeSellers) : '0', tone: 'sky', icon: Store },
      { label: 'Pending apps', value: overview ? String(overview.stats.pendingSellerApplications) : '0', tone: 'amber', icon: ClipboardList },
      { label: 'Low stock', value: overview ? String(overview.stats.lowStockProducts) : '0', tone: 'rose', icon: Package },
      { label: 'Support tickets', value: overview ? String(overview.stats.supportTickets) : '0', tone: 'violet', icon: Activity },
    ],
    [overview],
  )

  if (!overview && loading) {
    return (
      <AdminLayout>
        <div className="rounded-[26px] bg-white p-8 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading marketplace analytics…</div>
      </AdminLayout>
    )
  }

  const chartMax = (values: Array<{ label: string; value: number }>) => Math.max(1, ...values.map((item) => item.value))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Marketplace overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Executive dashboard</h2>
              <p className="mt-2 text-sm text-slate-500">A live view of your marketplace performance.</p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
                {rangeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRange(option.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      range === option.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {range === 'custom' ? (
                <div className="flex flex-wrap gap-2">
                  <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
                  <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
                </div>
              ) : null}

              <div className="flex gap-2">
                <button type="button" onClick={() => void loadOverview()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Refresh</button>
                <button type="button" onClick={() => {
                  const csv = [
                    ['Metric', 'Value'],
                    ...summaryCards.map((card) => [card.label, card.value]),
                  ].map((row) => row.join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `vendora-dashboard-${range}.csv`
                  link.click()
                  URL.revokeObjectURL(url)
                }} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-700">Export</button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <div key={card.label} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  card.tone === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : card.tone === 'sky'
                      ? 'bg-sky-50 text-sky-600'
                      : card.tone === 'violet'
                        ? 'bg-violet-50 text-violet-600'
                        : card.tone === 'amber'
                          ? 'bg-amber-50 text-amber-600'
                          : card.tone === 'rose'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-slate-100 text-slate-600'
                }`}><card.icon className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 text-sm font-medium leading-5 text-slate-500">{card.label}</span>
              </div>
              <p className="mt-5 truncate text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{card.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 2xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] 2xl:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Revenue</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Revenue trend</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Revenue</span>
                <span className="hidden font-semibold uppercase tracking-[0.14em] sm:inline">Current period</span>
              </div>
            </div>
            <div className="relative flex h-64 items-end gap-3 border-b border-l border-slate-200 bg-[linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:100%_25%] px-3 pt-4">
              {overview?.revenueTrend.map((point, index) => (
                <div key={`${point.label}-${index}`} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="pointer-events-none absolute bottom-[calc(var(--bar-height)+0.5rem)] left-1/2 z-20 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{formatCurrency(point.value)}</span>
                  <div className="w-full rounded-t-[12px] bg-gradient-to-t from-emerald-600 via-emerald-400 to-sky-400" style={{ '--bar-height': `${Math.max(18, (point.value / chartMax(overview.revenueTrend)) * 100)}%`, height: 'var(--bar-height)' } as React.CSSProperties} title={`${point.label}: ${formatCurrency(point.value)}`} />
                  <span className="text-xs text-slate-400">{point.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Orders</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Orders trend</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-sky-500" />Orders</div>
            </div>
            <div className="space-y-3">
              {overview?.ordersTrend.map((point, index) => (
                <div key={`${point.label}-order-${index}`} className="group space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{point.label}</span>
                    <span>{point.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100" title={`${point.label}: ${point.value} orders`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-[width]" style={{ width: `${Math.max(12, (point.value / chartMax(overview.ordersTrend)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Customers</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Current period</span>
            </div>
            <div className="space-y-3">
              {overview?.customersTrend.map((point, index) => (
                <div key={`${point.label}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span>{point.label}</span>
                  <strong className="font-semibold text-slate-800">{point.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Commission</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Current period</span>
            </div>
            <div className="space-y-3">
              {overview?.commissionTrend.map((point, index) => (
                <div key={`${point.label}-commission-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span>{point.label}</span>
                  <strong className="font-semibold text-slate-800">{formatCurrency(point.value)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Category sales</h3>
              <span className="text-sm font-medium text-sky-600">Live</span>
            </div>
            <div className="space-y-3">
              {overview?.categorySales.slice(0, 5).map((category, index) => (
                <div key={`${category.label}-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{category.label}</span>
                    <span>{formatCurrency(category.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${Math.min(100, (category.value / Math.max(1, ...overview.categorySales.map((item) => item.value))) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Performance</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Top sellers</h3>
              </div>
              <span className="text-sm text-slate-500">Revenue</span>
            </div>
            <div className="space-y-3">
              {overview?.topSellers.map((seller) => (
                <div key={seller.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div>
                    <div className="font-semibold text-slate-800">{seller.name}</div>
                    <div className="text-sm text-slate-500">{seller.orders} orders · {seller.rating.toFixed(1)}★</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatCurrency(seller.revenue)}</div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{seller.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Catalog</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Top products</h3>
              </div>
              <span className="text-sm text-slate-500">Units</span>
            </div>
            <div className="space-y-3">
              {overview?.topProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div>
                    <div className="font-semibold text-slate-800">{product.name}</div>
                    <div className="text-sm text-slate-500">{product.stock} in stock · {product.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-slate-500">{product.units} units</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Recent orders</h3>
              <Link to="/admin/orders" className="text-sm font-medium text-sky-600">All</Link>
            </div>
            <div className="space-y-3">
              {overview?.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div>
                    <div className="font-semibold text-slate-800">{order.id}</div>
                    <div className="text-sm text-slate-500">{order.customer}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{order.total}</div>
                    <div className={`mt-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      order.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : order.status === 'Shipped'
                          ? 'bg-violet-100 text-violet-700'
                          : order.status === 'Delivered'
                            ? 'bg-sky-100 text-sky-700'
                            : order.status === 'Returned'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                    }`}>{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Recent payments</h3>
              <Link to="/admin/payments" className="text-sm font-medium text-sky-600">View all</Link>
            </div>
            <div className="space-y-3">
              {overview?.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div>
                    <div className="font-semibold text-slate-800">{payment.id}</div>
                    <div className="text-sm text-slate-500">{payment.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</div>
                    <div className="mt-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{payment.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Support queue</h3>
            <Link to="/admin/support" className="text-sm font-medium text-sky-600">Open support</Link>
          </div>
          <div className="space-y-3">
            {overview?.supportQueue.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <div className="font-semibold text-slate-800">{ticket.customer}</div>
                  <div className="text-sm text-slate-500">{ticket.subject}</div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    ticket.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                  }`}>{ticket.priority}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{ticket.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
