import { FormEvent, useEffect, useState } from 'react'
import { Loader2, MessageCircle, RefreshCw } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { api } from '../../services/api'

type ProductQuery = {
  id: string
  subject: string
  question: string
  answer?: string | null
  status: string
  createdAt: string
  user?: { name?: string; email?: string }
  product?: { name?: string; sku?: string }
}

export function SellerProductQueriesPage() {
  const [queries, setQueries] = useState<ProductQuery[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<ProductQuery[]>('/product-queries/seller')
      setQueries(data)
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load product queries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const answer = async (event: FormEvent<HTMLFormElement>, query: ProductQuery) => {
    event.preventDefault()
    const text = (answers[query.id] || '').trim()
    if (!text) return
    setWorkingId(query.id)
    setError('')
    setNotice('')
    try {
      await api.patch(`/product-queries/${query.id}/answer`, { answer: text })
      setAnswers((current) => ({ ...current, [query.id]: '' }))
      setNotice('Product query answered successfully.')
      await load()
    } catch (answerError: any) {
      setError(answerError?.response?.data?.message || answerError?.message || 'Unable to answer product query.')
    } finally {
      setWorkingId(null)
    }
  }

  return <SellerLayout title="Product queries" subtitle="Answer customer questions about products listed in your store." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    <div className="space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}</div> : !queries.length ? <div className="p-14 text-center"><MessageCircle className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-semibold text-slate-600">No product queries found</p></div> : <div className="divide-y divide-slate-100">{queries.map((query) => <article key={query.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{query.subject}</h2><p className="mt-1 text-xs text-slate-500">{query.product?.name || 'Product'}{query.product?.sku ? ` · ${query.product.sku}` : ''} · {query.user?.name || query.user?.email || 'Customer'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{query.status}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{query.question}</p>{query.answer ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Your answer</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{query.answer}</p></div> : <form onSubmit={(event) => void answer(event, query)} className="mt-4 flex flex-col gap-3 sm:flex-row"><textarea required rows={2} value={answers[query.id] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [query.id]: event.target.value }))} placeholder="Write an answer to the customer" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2d80d8]" /><button type="submit" disabled={workingId === query.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2d80d8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{workingId === query.id ? <Loader2 size={15} className="animate-spin" /> : null}{workingId === query.id ? 'Sending...' : 'Answer query'}</button></form>}</article>)}</div>}
      </section>
    </div>
  </SellerLayout>
}
