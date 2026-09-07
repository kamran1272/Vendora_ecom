import { useEffect, useState } from 'react'
import { Flag, Loader2, MessageCircle, Search, Star, X } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { api } from '../../services/api'
import { getSellerReviews, reportSellerReview, replyToSellerReview } from '../../services/reviews.service'

type ReviewReply = { id: string; authorId: string; authorName: string; text: string; date: string; isSeller: boolean }
type SellerReview = { id: string; customer: { name: string; email?: string }; product: { id: string; name: string }; rating: number; title?: string | null; text: string; images: string[]; date: string; status: string; replies: ReviewReply[]; reportCount: number }
type ReviewResponse = { items: SellerReview[]; products: Array<{ id: string; name: string }>; page: number; limit: number; total: number; totalPages: number }

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={value <= rating ? 'currentColor' : 'none'} />)}</span>
}

function statusTone(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (status === 'HIDDEN') return 'bg-slate-100 text-slate-600 ring-slate-200'
  return 'bg-amber-50 text-amber-700 ring-amber-200'
}

export function SellerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponse | null>(null)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('')
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [savingReply, setSavingReply] = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      setReviews(await getSellerReviews<ReviewResponse>({ page, limit: 10, search: search || undefined, rating: rating || undefined, productId: productId || undefined, from: from || undefined, to: to || undefined }))
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load seller reviews.')
    } finally { setLoading(false) }
  }

  useEffect(() => { const timer = window.setTimeout(() => void loadReviews(), 250); return () => window.clearTimeout(timer) }, [page, search, rating, productId, from, to])

  const reply = async () => {
    if (!replyId || !replyText.trim() || savingReply) return
    setSavingReply(true)
    setError('')
    try {
      await replyToSellerReview(replyId, replyText.trim())
      setReplyId(null)
      setReplyText('')
      setNotice('Reply published successfully.')
      await loadReviews()
    } catch (replyError: any) { setError(replyError?.response?.data?.message || replyError?.message || 'Unable to publish reply.') } finally { setSavingReply(false) }
  }

  const report = async (review: SellerReview) => {
    const reason = window.prompt('Why are you reporting this review?', 'This review violates marketplace policy.')
    if (!reason?.trim()) return
    setReportingId(review.id)
    setError('')
    try { await reportSellerReview(review.id, reason.trim()); setNotice('Review reported to marketplace moderation.'); await loadReviews() } catch (reportError: any) { setError(reportError?.response?.data?.message || reportError?.message || 'Unable to report review.') } finally { setReportingId(null) }
  }

  const clearFilters = () => { setSearch(''); setRating(''); setProductId(''); setFrom(''); setTo(''); setPage(1) }

  return <SellerLayout title="Product reviews" subtitle="Read customer feedback and respond on behalf of your seller account.">
    <div className="space-y-5">
      {notice ? <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(130px,1fr))]"><label className="relative block"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search customer, product, review..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2d80d8] focus:ring-2 focus:ring-blue-100" /></label><select value={rating} onChange={(event) => { setRating(event.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select><select value={productId} onChange={(event) => { setProductId(event.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All products</option>{reviews?.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><label className="text-xs text-slate-500">From<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700" /></label><label className="text-xs text-slate-500">To<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700" /></label></div><div className="mt-3 flex justify-end"><button type="button" onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-slate-900">Clear filters</button></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-900">Customer reviews</h2><p className="mt-1 text-sm text-slate-500">{reviews?.total ?? 0} review{reviews?.total === 1 ? '' : 's'} found</p></div><button type="button" onClick={() => void loadReviews()} className="text-sm font-semibold text-[#1d5fb9]">Refresh</button></div>{loading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-slate-100" />)}</div> : !reviews?.items.length ? <div className="p-14 text-center"><MessageCircle className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-medium text-slate-600">No reviews match your filters.</p><p className="mt-1 text-xs text-slate-500">New customer reviews will appear here once they are linked to your products.</p></div> : <div className="divide-y divide-slate-200">{reviews.items.map((review) => <article key={review.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">{review.customer.name.charAt(0).toUpperCase()}</div><div><div className="font-semibold text-slate-900">{review.customer.name}</div><div className="mt-1 text-xs text-slate-500">{review.product.name} · {new Date(review.date).toLocaleDateString()}</div></div></div><div className="flex items-center gap-3"><Stars rating={review.rating} /><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusTone(review.status)}`}>{review.status}</span></div></div><div className="mt-4 rounded-xl bg-slate-50 p-4"><div className="font-semibold text-slate-800">{review.title || 'Customer review'}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.text}</p>{review.images.length ? <div className="mt-3 flex flex-wrap gap-2">{review.images.map((image, index) => <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer"><img src={image} alt="Customer review" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" /></a>)}</div> : null}</div>{review.replies.map((replyItem) => <div key={replyItem.id} className="mt-3 ml-4 rounded-xl border border-sky-100 bg-sky-50 p-3"><div className="text-xs font-semibold text-sky-800">{replyItem.isSeller ? 'Your reply' : replyItem.authorName} · {new Date(replyItem.date).toLocaleDateString()}</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{replyItem.text}</p></div>)}<div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-slate-500">{review.reportCount ? `${review.reportCount} report${review.reportCount === 1 ? '' : 's'} submitted` : 'No reports'}</div><div className="flex gap-2"><button type="button" onClick={() => { setReplyId(review.id); setReplyText('') }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"><MessageCircle size={15} /> Reply</button><button type="button" disabled={reportingId === review.id} onClick={() => void report(review)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Flag size={15} /> {reportingId === review.id ? 'Reporting...' : 'Report'}</button></div></div>{replyId === review.id ? <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-200 bg-white p-3 sm:flex-row"><textarea autoFocus rows={3} maxLength={2000} value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write a helpful response to the customer..." className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" /><div className="flex shrink-0 gap-2 sm:flex-col"><button type="button" disabled={!replyText.trim() || savingReply} onClick={() => void reply()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2d80d8] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingReply ? <Loader2 size={15} className="animate-spin" /> : null} Publish</button><button type="button" onClick={() => setReplyId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Cancel</button></div></div> : null}</article>)}</div>}{!loading && reviews && reviews.items.length ? <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-500"><span>Page {reviews.page} of {reviews.totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= reviews.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div> : null}</section>
    </div>
  </SellerLayout>
}
