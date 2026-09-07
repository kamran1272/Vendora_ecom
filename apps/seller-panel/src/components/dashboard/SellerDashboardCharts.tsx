import { useMemo, useState } from 'react'
import type { SellerChartPoint, SellerProductPerformance } from '../../types'

type SalesRange = 'daily' | 'weekly' | 'monthly' | 'yearly'

type SellerDashboardChartsProps = {
  ranges: Record<SalesRange, SellerChartPoint[]>
  orders: Array<{ status: string; count: number }>
  revenueProfit: SellerChartPoint[]
  productPerformance: SellerProductPerformance[]
}

function money(value: number) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function chartPath(values: number[], width: number, height: number, max: number) {
  if (!values.length) return ''
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = height - (value / max) * height
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">{label}</div>
}

export function SellerDashboardCharts({ ranges, orders, revenueProfit, productPerformance }: SellerDashboardChartsProps) {
  const [range, setRange] = useState<SalesRange>('daily')
  const points = ranges[range]
  const maxSales = Math.max(...points.map((point) => point.revenue), 1)
  const maxRevenueProfit = Math.max(...revenueProfit.flatMap((point) => [point.revenue, point.profit]), 1)
  const maxProductRevenue = Math.max(...productPerformance.map((product) => product.revenue), 1)
  const orderTotal = orders.reduce((sum, item) => sum + item.count, 0)
  const orderRows = useMemo(() => [...orders].sort((a, b) => b.count - a.count), [orders])

  return (
    <section className="space-y-4" aria-label="Seller analytics">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sales Overview</h2>
              <p className="mt-1 text-xs text-slate-500">Revenue generated from your seller order items</p>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['daily', 'weekly', 'monthly', 'yearly'] as SalesRange[]).map((item) => (
                <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition ${range === item ? 'bg-white text-[#1d5fb9] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            {points.length ? (
              <>
                <div className="flex items-end justify-between gap-1">
                  {points.map((point) => (
                    <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full max-w-10 items-end rounded-t-lg bg-slate-100">
                        <div className="w-full rounded-t-lg bg-[#2d80d8] transition-all" style={{ height: `${Math.max((point.revenue / maxSales) * 100, 3)}%` }} title={`${point.label}: ${money(point.revenue)}`} />
                      </div>
                      <span className="max-w-14 truncate text-[10px] text-slate-500">{point.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{points.reduce((sum, point) => sum + point.orders, 0)} orders</span>
                  <strong className="text-slate-800">{money(points.reduce((sum, point) => sum + point.revenue, 0))} revenue</strong>
                </div>
              </>
            ) : <EmptyChart label={`No ${range} sales data available yet.`} />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Orders Overview</h2>
              <p className="mt-1 text-xs text-slate-500">Current order pipeline</p>
            </div>
            <span className="text-2xl font-black text-slate-900">{orderTotal}</span>
          </div>
          {orderRows.length ? (
            <div className="mt-6 space-y-4">
              {orderRows.map((item) => (
                <div key={item.status}>
                  <div className="mb-1 flex justify-between gap-3 text-xs"><span className="capitalize text-slate-600">{item.status.toLowerCase().split('_').join(' ')}</span><strong className="text-slate-800">{item.count}</strong></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${(item.count / Math.max(orderTotal, 1)) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <div className="mt-6"><EmptyChart label="No orders available yet." /></div>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Revenue vs Profit</h2>
          <p className="mt-1 text-xs text-slate-500">Monthly order-item performance</p>
          {revenueProfit.length ? (
            <div className="mt-5">
              <svg viewBox="0 0 600 220" role="img" aria-label="Revenue and profit chart" className="h-56 w-full overflow-visible">
                <path d={chartPath(revenueProfit.map((point) => point.revenue), 560, 180, maxRevenueProfit)} fill="none" stroke="#2d80d8" strokeWidth="4" strokeLinecap="round" />
                <path d={chartPath(revenueProfit.map((point) => point.profit), 560, 180, maxRevenueProfit)} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
                {revenueProfit.map((point, index) => <text key={point.label} x={revenueProfit.length === 1 ? 280 : (index / (revenueProfit.length - 1)) * 560} y="208" textAnchor="middle" className="fill-slate-400 text-[11px]">{point.label}</text>)}
              </svg>
              <div className="flex gap-4 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2d80d8]" />Revenue</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600" />Profit</span></div>
            </div>
          ) : <div className="mt-5"><EmptyChart label="No revenue data available yet." /></div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Product Performance</h2>
          <p className="mt-1 text-xs text-slate-500">Top products by seller revenue</p>
          {productPerformance.length ? (
            <div className="mt-5 space-y-4">
              {productPerformance.map((product) => (
                <div key={product.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-slate-700">{product.name}</span><span className="shrink-0 font-semibold text-slate-800">{money(product.revenue)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2d80d8]" style={{ width: `${Math.max((product.revenue / maxProductRevenue) * 100, 3)}%` }} /></div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{product.units} units sold</span><span>Profit {money(product.profit)} · Stock {product.stock}</span></div>
                </div>
              ))}
            </div>
          ) : <div className="mt-5"><EmptyChart label="No product sales available yet." /></div>}
        </div>
      </div>
    </section>
  )
}
