import { useEffect, useState } from 'react'
import { Check, Eye, Globe2, Loader2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getTrafficPackages, purchaseTrafficPackage } from '../../services/traffic.service'

type TrafficPackage = { id: string; name: string; slug: string; price: number; trafficLimit: number; duration: number; description?: string | null; features: string[] }

function currency(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) }
function traffic(value: number) { return value < 0 ? 'Unlimited' : new Intl.NumberFormat('en-US').format(value) }

export function SellerTrafficPackagesPage() {
  const [packages, setPackages] = useState<TrafficPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<TrafficPackage | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try { setPackages(await getTrafficPackages<TrafficPackage[]>()) } catch (loadError: any) { setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load traffic packages.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const purchase = async (item: TrafficPackage) => {
    setWorkingId(item.id); setError(''); setNotice('')
    try { const data = await purchaseTrafficPackage<{ message?: string }>(item.id); setNotice(data.message || 'Traffic package purchased successfully.') } catch (purchaseError: any) { setError(purchaseError?.response?.data?.message || purchaseError?.message || 'Unable to purchase traffic package.') } finally { setWorkingId(null) }
  }

  return <SellerLayout title="Traffic packages" subtitle="Promote your products and bring more qualified visitors to your store." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-slate-200" />)}</div> : error && !packages.length ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}<button type="button" onClick={() => void load()} className="mt-4 block mx-auto rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Try again</button></div> : <div className="space-y-6">
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {!packages.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No active traffic packages are available.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packages.map((item, index) => <article key={item.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{index === 1 ? <div className="absolute right-4 top-4 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">Recommended</div> : null}<div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Sparkles size={20} /></div><div><h2 className="text-xl font-black text-slate-900">{item.name}</h2><p className="text-sm text-slate-500">{item.duration} days promotion</p></div></div><div className="mt-6 text-4xl font-black tracking-tight text-slate-900">{currency(item.price)}</div>{item.description ? <p className="mt-3 min-h-10 text-sm leading-6 text-slate-600">{item.description}</p> : null}<div className="mt-5 space-y-3 border-y border-slate-100 py-5 text-sm"><div className="flex items-center gap-2 text-slate-700"><Globe2 size={17} className="text-sky-600" /><span>Traffic amount: <strong>{traffic(item.trafficLimit)} visits</strong></span></div><div className="flex items-center gap-2 text-slate-700"><TrendingUp size={17} className="text-emerald-600" /><span>Promotion duration: <strong>{item.duration} days</strong></span></div></div><div className="mt-5 flex-1"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Benefits</div>{item.features.length ? <ul className="mt-3 space-y-2">{item.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Marketplace promotion placement</p>}</div><div className="mt-6 grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={() => setSelected(item)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye size={16} /> Details</button><button type="button" disabled={workingId !== null} onClick={() => void purchase(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d80d8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f6dc5] disabled:opacity-50">{workingId === item.id ? <Loader2 size={16} className="animate-spin" /> : null} Purchase</button></div></article>)}</div>}
    </div>}
    {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.duration} day promotion</p></div><button type="button" aria-label="Close package details" onClick={() => setSelected(null)} className="text-xl text-slate-400">×</button></div><div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><div className="flex justify-between"><span>Price</span><strong>{currency(selected.price)}</strong></div><div className="flex justify-between"><span>Traffic amount</span><strong>{traffic(selected.trafficLimit)} visits</strong></div><div className="flex justify-between"><span>Duration</span><strong>{selected.duration} days</strong></div></div><button type="button" onClick={() => { setSelected(null); void purchase(selected) }} className="mt-5 w-full rounded-xl bg-[#2d80d8] px-4 py-3 text-sm font-semibold text-white">Purchase package</button></div></div> : null}
  </SellerLayout>
}
