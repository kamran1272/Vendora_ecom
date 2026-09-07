import { useEffect, useState } from 'react'
import { Check, Clock3, Loader2, RefreshCw, Sparkles, UploadCloud } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getSellerSubscriptionPackages, purchaseSellerSubscription } from '../../services/subscription.service'

type SellerPlan = { id: string; name: string; price: number; duration: number; productLimit: number; uploadLimit: number; features: string[]; current: boolean }
type PackageResponse = { packages: SellerPlan[]; currentPackage: (SellerPlan & { subscriptionId: string; startsAt: string; expiresAt?: string | null; status: string }) | null }

function currency(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : 'No expiry' }

export function SellerPackagesPage() {
  const [data, setData] = useState<PackageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try { setData(await getSellerSubscriptionPackages<PackageResponse>()) } catch (loadError: any) { setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load subscription packages.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const runAction = async (plan: SellerPlan, action: 'purchase' | 'upgrade' | 'renew') => {
    setWorkingId(plan.id); setError(''); setNotice('')
    try { const response = await purchaseSellerSubscription<{ message?: string }>(plan.id, action); setNotice(response.message || 'Subscription updated successfully.'); await load() } catch (actionError: any) { setError(actionError?.response?.data?.message || actionError?.message || 'Unable to update subscription.') } finally { setWorkingId(null) }
  }

  return <SellerLayout title="Seller packages" subtitle="Choose the subscription plan that matches your store growth." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    {loading && !data ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-slate-200" />)}</div> : error && !data ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}<button type="button" onClick={() => void load()} className="mt-4 block mx-auto rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Try again</button></div> : data ? <div className="space-y-6">
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {data.currentPackage ? <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Current package</div><h2 className="mt-1 text-xl font-black text-slate-900">{data.currentPackage.name}</h2><p className="mt-1 text-sm text-slate-600">Active since {date(data.currentPackage.startsAt)} · Expires {date(data.currentPackage.expiresAt)}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">Active subscription</span></div></section> : null}
      {!data.packages.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No active subscription packages are available.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.packages.map((plan, index) => { const current = data.currentPackage; const isCurrent = Boolean(current?.id === plan.id); const canUpgrade = Boolean(current && plan.price > current.price); const action: 'purchase' | 'upgrade' | 'renew' = isCurrent ? 'renew' : canUpgrade ? 'upgrade' : 'purchase'; const label = isCurrent ? 'Renew package' : canUpgrade ? 'Upgrade now' : 'Purchase package'; return <article key={plan.id} className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${isCurrent ? 'border-[#2d80d8] ring-2 ring-blue-100' : 'border-slate-200'}`}>{index === 1 ? <div className="absolute right-4 top-4 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">Popular</div> : null}{isCurrent ? <div className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Current</div> : null}<div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Sparkles size={20} /></div><div><h3 className="text-xl font-black text-slate-900">{plan.name}</h3><p className="text-sm text-slate-500">{plan.duration} days</p></div></div><div className="mt-6 flex items-end gap-1"><span className="text-4xl font-black tracking-tight text-slate-900">{currency(plan.price)}</span><span className="mb-1 text-sm text-slate-500">/ {plan.duration} days</span></div><div className="mt-6 space-y-3 border-y border-slate-100 py-5 text-sm"><div className="flex items-center gap-2 text-slate-700"><UploadCloud size={16} className="text-sky-600" /><span>Product limit: <strong>{plan.productLimit < 0 ? 'Unlimited' : plan.productLimit}</strong></span></div><div className="flex items-center gap-2 text-slate-700"><PackageIcon /><span>Upload limit: <strong>{plan.uploadLimit < 0 ? 'Unlimited' : plan.uploadLimit}</strong></span></div><div className="flex items-center gap-2 text-slate-700"><Clock3 size={16} className="text-sky-600" /><span>Duration: <strong>{plan.duration} days</strong></span></div></div><div className="mt-5 flex-1"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Included features</div>{plan.features.length ? <ul className="mt-3 space-y-2">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Standard seller tools</p>}</div><button type="button" disabled={workingId !== null} onClick={() => void runAction(plan, action)} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${isCurrent ? 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-[#2d80d8] text-white hover:bg-[#1f6dc5]'}`}>{workingId === plan.id ? <Loader2 size={16} className="animate-spin" /> : null}{label}</button></article> })}</div>}
    </div> : null}
  </SellerLayout>
}

function PackageIcon() { return <span className="inline-flex h-4 w-4 items-center justify-center text-sky-600"><Sparkles size={16} /></span> }
