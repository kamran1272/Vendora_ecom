import { useEffect, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Button, Card, RatingStars } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { useToastStore } from '@/store/toast'
import { apiRequest } from '@/services/api'

type Review = { id: string; productId?: string | null; warehouseProductId?: string | null; rating: number; title?: string | null; text: string; status?: string; createdAt: string }
export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [form, setForm] = useState({ productId: '', rating: '5', title: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const showToast = useToastStore((state) => state.show)

  const load = () => { setLoading(true); setError(null); apiRequest<Review[]>('/reviews/customer/current').then((data) => setReviews([...new Map(data.map((review) => [review.id, review])).values()])).catch(() => setError('We could not load your reviews right now. Please try again.')).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(null); setMessage(null)
    if (!form.productId.trim() || !form.text.trim()) { setError('Product ID and review text are required.'); setSaving(false); return }
    try {
      await apiRequest('/reviews', { method: 'POST', body: JSON.stringify({ productId: form.productId.trim(), rating: Number(form.rating), title: form.title.trim() || undefined, text: form.text.trim() }) })
      setMessage('Review saved and submitted for moderation.'); showToast({ tone: 'success', title: 'Review submitted', message: 'Your review was sent for moderation.' }); setForm({ productId: '', rating: '5', title: '', text: '' }); load()
    } catch { setError('We could not save your review right now. Please try again.'); showToast({ tone: 'error', title: 'Review submission failed', message: 'Please try again.' }) } finally { setSaving(false) }
  }

  return <div className="space-y-6"><PageShell title="Reviews" description="Review products you have purchased and update an existing review instead of creating duplicates." />{error && <ErrorState message={error} action={<button type="button" onClick={load} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}{message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700" role="status">{message}</div>}<div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Write a review</h2><p className="mt-2 text-sm text-slate-500">The current API accepts a product ID, rating, title, and written review.</p><form onSubmit={submit} className="mt-5 space-y-3"><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Product ID</span><input required value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} placeholder="Product ID from your order" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Rating</span><select value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Title</span><input value={form.title} placeholder="Summarize your experience" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Review</span><textarea required rows={5} value={form.text} placeholder="Tell other shoppers what you thought" onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label><Button type="submit" loading={saving} loadingLabel="Submitting...">Submit review</Button></form></Card><div className="space-y-3">{loading ? <LoadingState variant="list" /> : reviews.length === 0 ? <EmptyState title="You haven't reviewed any products yet" message="Your submitted product reviews will appear here." /> : reviews.map((review) => <Card key={review.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-slate-900">Product {review.productId || review.warehouseProductId}</p><RatingStars rating={review.rating} /></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{review.status || 'PENDING'}</span></div>{review.title && <h3 className="mt-3 font-bold text-slate-900">{review.title}</h3>}<p className="mt-2 text-slate-600">{review.text}</p><p className="mt-3 text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p></Card>)}</div></div></div>
}
