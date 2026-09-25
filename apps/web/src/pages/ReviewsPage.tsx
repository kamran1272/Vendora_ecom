import { useEffect, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Card, RatingStars } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { useToastStore } from '@/store/toast'
import { apiRequest } from '@/services/api'
import { fetchCustomerOrders } from '@/services/orders'

type Review = { id: string; rating: number; title?: string | null; text: string; status?: string; createdAt: string }
type ReviewableProduct = { id: string; name: string; orderId: string }

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewableProducts, setReviewableProducts] = useState<ReviewableProduct[]>([])
  const [form, setForm] = useState({ productId: '', rating: '5', title: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const showToast = useToastStore((state) => state.show)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([apiRequest<Review[]>('/reviews/customer/current'), fetchCustomerOrders()])
      .then(([reviewData, orders]) => {
        setReviews([...new Map(reviewData.map((review) => [review.id, review])).values()])
        const products = orders.filter((order) => String(order.status).toUpperCase() === 'DELIVERED').flatMap((order) => (order.items || []).map((item) => ({ id: String(item.warehouseProductId || item.id), name: item.name, orderId: order.id })))
        setReviewableProducts([...new Map(products.map((product) => [product.id, product])).values()])
      })
      .catch(() => setError('We could not load your reviews right now. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(null); setMessage(null)
    if (!form.productId || !form.text.trim()) { setError('Choose a delivered product and write a review.'); setSaving(false); return }
    try {
      await apiRequest('/reviews', { method: 'POST', body: JSON.stringify({ productId: form.productId, rating: Number(form.rating), title: form.title.trim() || undefined, text: form.text.trim() }) })
      setMessage('Review saved and submitted for moderation.')
      showToast({ tone: 'success', title: 'Review submitted', message: 'Your review was sent for moderation.' })
      setForm({ productId: '', rating: '5', title: '', text: '' }); load()
    } catch { setError('We could not save your review right now. Please try again.'); showToast({ tone: 'error', title: 'Review submission failed', message: 'Please try again.' }) } finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <PageShell title="Reviews" description="Review products you have purchased and update an existing review instead of creating duplicates." />
    {error && <ErrorState message={error} action={<button type="button" onClick={load} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
    {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700" role="status">{message}</div>}
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-6"><h2 className="text-xl font-black text-slate-900">Write a review</h2><p className="mt-2 text-sm text-slate-500">Choose a product from one of your delivered orders.</p><form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Delivered product</span><select required value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500"><option value="">Select a product</option>{reviewableProducts.map((product) => <option key={`${product.orderId}-${product.id}`} value={product.id}>{product.name}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Rating</span><select value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Title</span><input value={form.title} placeholder="Summarize your experience" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Review</span><textarea required value={form.text} placeholder="What did you think?" onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label>
        <button type="submit" disabled={saving || !reviewableProducts.length} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Submitting...' : 'Submit review'}</button>
      </form></Card>
      <Card className="p-6"><h2 className="text-xl font-black text-slate-900">Your reviews</h2>{loading ? <LoadingState /> : reviews.length ? <div className="mt-5 space-y-4">{reviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-4 last:border-0"><div className="flex items-center justify-between gap-3"><RatingStars rating={review.rating} /><span className="text-xs font-semibold uppercase text-slate-500">{review.status || 'Pending'}</span></div><h3 className="mt-2 font-bold text-slate-900">{review.title || 'Product review'}</h3><p className="mt-1 text-sm text-slate-600">{review.text}</p></article>)}</div> : <EmptyState title="No reviews yet" message="Delivered products you review will appear here." />}</Card>
    </div>
  </div>
}
