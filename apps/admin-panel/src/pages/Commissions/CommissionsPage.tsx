import { useEffect, useState } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getAdminCommissionOverview } from '../../services/adminApi'

type Row = { id: string; order: string; customer: string; customerEmail: string; seller: string; gmv: number; sellerEarnings: number; commission: number; paymentFees: number; refunds: number; netMarketplaceRevenue: number; status: string; date: string }
type Summary = { gmv: number; sellerEarnings: number; commission: number; paymentFees: number; refunds: number; netMarketplaceRevenue: number }
const money = (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`

export function CommissionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Summary>({ gmv: 0, sellerEarnings: 0, commission: 0, paymentFees: 0, refunds: 0, netMarketplaceRevenue: 0 })
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const result = await getAdminCommissionOverview({ from, to, sellerId, orderId })
      setRows(Array.isArray(result.rows) ? result.rows as Row[] : [])
      setSummary((result.summary ?? {}) as Summary)
      setSellers(Array.isArray(result.sellers) ? result.sellers as Array<{ id: string; name: string }> : [])
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load marketplace accounting.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const exportCsv = () => {
    const headers = ['Order', 'Customer', 'Seller', 'GMV', 'Seller earnings', 'Commission', 'Payment fees', 'Refunds', 'Net marketplace revenue', 'Status', 'Date']
    const values = rows.map((row) => [row.order, row.customer, row.seller, row.gmv, row.sellerEarnings, row.commission, row.paymentFees, row.refunds, row.netMarketplaceRevenue, row.status, row.date])
    const csv = [headers, ...values].map((line) => line.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'vendora-marketplace-accounting.csv'; anchor.click(); URL.revokeObjectURL(url)
  }

  return <AdminLayout><div className="space-y-6 p-1 sm:p-2 lg:p-3"><header className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm uppercase tracking-[0.2em] text-slate-500">Finance operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Marketplace accounting</h1><p className="mt-2 text-sm text-slate-600">Reconcile GMV, seller earnings, platform commission, payment costs, refunds, and net marketplace revenue.</p></div><button type="button" onClick={exportCsv} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Export CSV</button></div></header>{error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}<section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{[['GMV', summary.gmv], ['Seller earnings', summary.sellerEarnings], ['Vendora commission', summary.commission], ['Payment fees', summary.paymentFees], ['Refunds', summary.refunds], ['Net revenue', summary.netMarketplaceRevenue]].map(([title, value]) => <div key={String(title)} className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{title}</p><p className="mt-3 text-xl font-semibold text-slate-900">{money(value)}</p></div>)}</section><section className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><select value={sellerId} onChange={(event) => setSellerId(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All sellers</option>{sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select><input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><div className="flex gap-2"><button type="button" onClick={() => void load()} className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white">Apply</button><button type="button" onClick={() => { setFrom(''); setTo(''); setSellerId(''); setOrderId(''); void setTimeout(() => void load(), 0) }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700">Clear</button></div></div></section><section className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-slate-200">{loading ? <div className="p-10 text-sm text-slate-500">Loading accounting records...</div> : rows.length ? <div className="overflow-x-auto"><table className="min-w-[1350px] w-full text-left text-sm text-slate-700"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">GMV</th><th className="px-4 py-3">Seller earnings</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Fees</th><th className="px-4 py-3">Refunds</th><th className="px-4 py-3">Net revenue</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="px-4 py-4 font-semibold text-slate-900">{row.order}</td><td className="px-4 py-4">{row.customer}<div className="text-xs text-slate-500">{row.customerEmail}</div></td><td className="px-4 py-4">{row.seller}</td><td className="px-4 py-4">{money(row.gmv)}</td><td className="px-4 py-4">{money(row.sellerEarnings)}</td><td className="px-4 py-4">{money(row.commission)}</td><td className="px-4 py-4">{money(row.paymentFees)}</td><td className="px-4 py-4">{money(row.refunds)}</td><td className="px-4 py-4 font-semibold text-emerald-700">{money(row.netMarketplaceRevenue)}</td><td className="px-4 py-4">{String(row.status).replaceAll('_', ' ')}</td><td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">{row.date ? new Date(row.date).toLocaleString() : '—'}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center text-sm text-slate-500">No accounting records match the current filters.</div>}</section></div></AdminLayout>
}