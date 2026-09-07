import { useEffect, useState } from 'react'
import { BarChart3, Check, CircleDollarSign, Coins, Copy, Link2, MousePointerClick, RefreshCw, TrendingUp, UserPlus, Users } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getAffiliateDashboard } from '../../services/affiliate.service'

type AffiliateReferral = { id: string; name: string; email: string; status: string; date: string; convertedAt?: string | null }
type AffiliateCommission = { id: string; amount: number; status: string; orderId?: string | null; date: string; paidAt?: string | null; referral: string }
type AffiliateChartPoint = { label: string; clicks: number; registrations: number; conversions: number; earnings: number }
type AffiliateDashboard = { affiliateLink: string; affiliateCode: string; clicks: number; registrations: number; conversions: number; earnings: number; pendingEarnings: number; paidEarnings: number; chart: AffiliateChartPoint[]; referrals: AffiliateReferral[]; commissionHistory: AffiliateCommission[] }

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const date = (value: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))

function StatCard({ label, value, icon, tone = 'blue' }: { label: string; value: string | number; icon: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  const tones = { blue: 'bg-sky-50 text-sky-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' }
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-3 text-2xl font-black text-slate-900">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div></div></article>
}

function AffiliateChart({ points }: { points: AffiliateChartPoint[] }) {
  if (!points.length) return <div className="flex min-h-[230px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No affiliate activity has been recorded yet.</div>
  const max = Math.max(...points.flatMap((point) => [point.clicks, point.registrations, point.conversions]), 1)
  return <div className="overflow-x-auto"><div className="flex min-w-[620px] items-end gap-4 px-3 pt-5" style={{ height: 230 }}>{points.map((point) => <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-full w-full items-end justify-center gap-1"><div title={`${point.clicks} clicks`} className="w-1/3 rounded-t bg-sky-500" style={{ height: `${Math.max((point.clicks / max) * 100, point.clicks ? 4 : 0)}%` }} /><div title={`${point.registrations} registrations`} className="w-1/3 rounded-t bg-violet-500" style={{ height: `${Math.max((point.registrations / max) * 100, point.registrations ? 4 : 0)}%` }} /><div title={`${point.conversions} conversions`} className="w-1/3 rounded-t bg-emerald-500" style={{ height: `${Math.max((point.conversions / max) * 100, point.conversions ? 4 : 0)}%` }} /></div><span className="text-xs text-slate-500">{point.label}</span></div>)}</div><div className="mt-4 flex gap-4 px-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" />Clicks</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Registrations</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Conversions</span></div></div>
}

function statusTone(status: string) { return status === 'PAID' || status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === 'PENDING' || status === 'REGISTERED' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200' }

export function SellerAffiliatePage() {
  const [data, setData] = useState<AffiliateDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => { setLoading(true); setError(''); try { setData(await getAffiliateDashboard<AffiliateDashboard>()) } catch (loadError: any) { setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load affiliate dashboard.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])

  const copyLink = async () => {
    if (!data) return
    const link = `${window.location.origin}/?ref=${encodeURIComponent(data.affiliateCode)}`
    try { await navigator.clipboard.writeText(link) } catch { const input = document.createElement('input'); input.value = link; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove() }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const CopyIcon = copied ? Check : Copy

  return <SellerLayout title="Affiliate system" subtitle="Grow your network and track referral earnings from one workspace." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    {loading && !data ? <div className="space-y-5"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div></div> : error && !data ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}<button type="button" onClick={() => void load()} className="mt-4 block mx-auto rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Try again</button></div> : data ? <div className="space-y-6">
      {error ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div> : null}
      <section className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-sky-800"><Link2 size={16} />Your affiliate link</div><div className="mt-2 break-all font-mono text-sm text-slate-700">{window.location.origin}/?ref={data.affiliateCode}</div><p className="mt-2 text-xs text-slate-500">Share this link to attribute visits and registrations to your seller account.</p></div><button type="button" onClick={() => void copyLink()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2d80d8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f6dc5]"><CopyIcon size={16} />{copied ? 'Copied' : 'Copy affiliate link'}</button></div></section>
      <section aria-label="Affiliate statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Clicks" value={data.clicks} icon={<MousePointerClick size={19} />} /><StatCard label="Registrations" value={data.registrations} icon={<UserPlus size={19} />} tone="violet" /><StatCard label="Conversions" value={data.conversions} icon={<TrendingUp size={19} />} tone="green" /><StatCard label="Total earnings" value={currency.format(data.earnings)} icon={<Coins size={19} />} tone="amber" /><StatCard label="Pending earnings" value={currency.format(data.pendingEarnings)} icon={<RefreshCw size={19} />} tone="amber" /><StatCard label="Paid earnings" value={currency.format(data.paidEarnings)} icon={<Check size={19} />} tone="green" /><StatCard label="Conversion rate" value={`${data.registrations ? ((data.conversions / data.registrations) * 100).toFixed(1) : '0.0'}%`} icon={<BarChart3 size={19} />} /></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold text-slate-900">Affiliate performance</h2><p className="mt-1 text-sm text-slate-500">Monthly clicks, registrations, and conversions</p></div><div className="mt-5"><AffiliateChart points={data.chart} /></div></section>
      <section className="grid gap-6 xl:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><Users size={18} className="text-sky-600" /><div><h2 className="font-bold text-slate-900">Referral list</h2><p className="mt-1 text-xs text-slate-500">Recent people attributed to your link</p></div></div>{data.referrals.length ? <div className="divide-y divide-slate-100">{data.referrals.map((referral) => <div key={referral.id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{referral.name}</div><div className="truncate text-xs text-slate-500">{referral.email}</div></div><div className="text-right"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusTone(referral.status)}`}>{referral.status}</span><div className="mt-1 text-[11px] text-slate-400">{date(referral.date)}</div></div></div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No referrals have been recorded.</div>}</article><article className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><CircleDollarSign size={18} className="text-emerald-600" /><div><h2 className="font-bold text-slate-900">Commission history</h2><p className="mt-1 text-xs text-slate-500">Your latest affiliate earnings</p></div></div>{data.commissionHistory.length ? <div className="divide-y divide-slate-100">{data.commissionHistory.map((commission) => <div key={commission.id} className="flex items-center justify-between gap-3 px-5 py-4"><div><div className="text-sm font-semibold text-slate-800">{commission.orderId ? `Order ${commission.orderId.slice(0, 8)}` : 'Referral commission'}</div><div className="mt-1 text-xs text-slate-500">{date(commission.date)}</div></div><div className="text-right"><div className="font-bold text-emerald-700">{currency.format(commission.amount)}</div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusTone(commission.status)}`}>{commission.status}</span></div></div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No commission records have been created.</div>}</article></section>
    </div> : null}
  </SellerLayout>
}
