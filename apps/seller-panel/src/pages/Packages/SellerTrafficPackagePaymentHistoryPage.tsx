import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CircleDollarSign, CreditCard, Globe2, Package, RefreshCw, Search } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getTrafficPurchaseHistory } from '../../services/traffic.service'

type Purchase = { id: string; transactionId: string; package: { id: string; name: string }; amount: number; trafficAmount: number; paymentMethod: string; status: string; purchaseDate: string; expiryDate?: string | null }
type HistoryResponse = { items: Purchase[]; packages: Array<{ id: string; name: string }> }

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const number = new Intl.NumberFormat('en-US')
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : 'No expiry'
const traffic = (value: number) => value < 0 ? 'Unlimited' : number.format(value)

function statusTone(status: string) {
  if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'PAID') return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-red-50 text-red-700 ring-red-200'
}

export function SellerTrafficPackagePaymentHistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [packageId, setPackageId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true)
    setError('')
    try { setData(await getTrafficPurchaseHistory<HistoryResponse>()) } catch (loadError: any) { setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load traffic package history.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { setPage(1) }, [search, status, packageId, from, to])

  const filtered = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    const start = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Number.POSITIVE_INFINITY
    return data.items.filter((item) => { const purchaseDate = new Date(item.purchaseDate).getTime(); return (!query || item.transactionId.toLowerCase().includes(query) || item.package.name.toLowerCase().includes(query)) && (!status || item.status === status) && (!packageId || item.package.id === packageId) && purchaseDate >= start && purchaseDate <= end })
  }, [data, search, status, packageId, from, to])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return <SellerLayout title="Traffic purchase history" subtitle="Review promotional traffic package purchases and expiry dates." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    <div className="space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(130px,1fr))]"><label className="relative block"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transaction or package..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2d80d8]" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="EXPIRED">Expired</option></select><select value={packageId} onChange={(event) => setPackageId(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All packages</option>{data?.packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label className="text-xs text-slate-500">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" /></label><label className="text-xs text-slate-500">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" /></label></div><div className="mt-3 flex justify-end"><button type="button" onClick={() => { setSearch(''); setStatus(''); setPackageId(''); setFrom(''); setTo('') }} className="text-sm font-medium text-slate-500 hover:text-slate-900">Clear filters</button></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-900">Traffic package transactions</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} transaction{filtered.length === 1 ? '' : 's'}</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><CircleDollarSign size={17} /> Payment ledger</div></div>{loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div> : !visible.length ? <div className="p-14 text-center"><Package className="mx-auto text-slate-300" size={36} /><p className="mt-3 text-sm font-semibold text-slate-600">No traffic package purchases found.</p><p className="mt-1 text-xs text-slate-500">Purchases will appear here after a promotional package is bought.</p></div> : <div className="overflow-x-auto"><table className="min-w-[1120px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500"><tr>{['Transaction ID', 'Package', 'Amount', 'Traffic', 'Payment method', 'Status', 'Purchase date', 'Expiry date'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{visible.map((item) => <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-4 font-mono text-xs font-semibold text-slate-700">{item.transactionId}</td><td className="px-4 py-4 font-semibold text-slate-800">{item.package.name}</td><td className="px-4 py-4 font-semibold text-slate-800">{currency.format(item.amount)}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-2 text-slate-600"><Globe2 size={15} />{traffic(item.trafficAmount)} visits</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-2 text-slate-600"><CreditCard size={15} />{item.paymentMethod}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone(item.status)}`}>{item.status}</span></td><td className="whitespace-nowrap px-4 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><CalendarDays size={14} />{formatDate(item.purchaseDate)}</span></td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(item.expiryDate)}</td></tr>)}</tbody></table></div>}{!loading && visible.length ? <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div> : null}</section>
    </div>
  </SellerLayout>
}
