import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { apiRequest } from '@/services/api'

type Question = { id: string; subject?: string; question: string; answer?: string | null; status?: string; createdAt: string }

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => { apiRequest<Question[]>('/product-queries/mine').then(setQuestions).catch(() => setError(true)).finally(() => setLoading(false)) }, [])
  return <div className="space-y-6"><PageShell title="My product questions" description="Track questions you have asked sellers and their answers." />{loading ? <LoadingState variant="list" /> : error ? <ErrorState title="Questions unavailable" message="We could not load your product questions right now." /> : !questions.length ? <EmptyState title="No questions yet" message="Ask a seller about a product while browsing the marketplace." action={<Link to="/shop" className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Browse products</Link>} /> : <div className="space-y-3">{questions.map((item) => <Card key={item.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900">{item.subject || 'Product question'}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.status || (item.answer ? 'Answered' : 'Open')}</span></div><p className="mt-3 text-sm text-slate-700">{item.question}</p>{item.answer && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><strong>Seller answer:</strong> {item.answer}</p>}<p className="mt-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></Card>)}</div>}</div>
}
