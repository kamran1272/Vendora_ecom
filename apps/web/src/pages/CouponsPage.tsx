import { useEffect, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { apiRequest } from '@/services/api'

type Coupon = { id: string; code: string; description?: string; discountType?: string; discountValue?: number; expiresAt?: string | null; status?: string }

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => { apiRequest<Coupon[]>('/coupons').then(setCoupons).catch(() => setError(true)).finally(() => setLoading(false)) }, [])
  return <div className="space-y-6"><PageShell title="Coupons and offers" description="View active discount codes available for your marketplace orders." />{loading ? <LoadingState variant="list" /> : error ? <ErrorState title="Coupons unavailable" message="We could not load current offers right now." /> : !coupons.length ? <EmptyState title="No active coupons" message="New marketplace offers will appear here when they are available." /> : <div className="grid gap-4 sm:grid-cols-2">{coupons.map((coupon) => <Card key={coupon.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Coupon code</p><h2 className="mt-1 text-2xl font-black tracking-wide text-slate-900">{coupon.code}</h2></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{coupon.discountValue}{coupon.discountType === 'PERCENTAGE' ? '%' : ' off'}</span></div><p className="mt-3 text-sm text-slate-600">{coupon.description || 'Apply this offer at checkout when eligible.'}</p>{coupon.expiresAt && <p className="mt-3 text-xs text-slate-500">Expires {new Date(coupon.expiresAt).toLocaleDateString()}</p>}</Card>)}</div>}</div>
}
