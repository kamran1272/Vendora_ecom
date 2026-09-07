import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card, Badge } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { apiRequest } from '@/services/api'

type Notification = { id: string; type: string; title: string; message: string; entityId?: string | null; entityType?: string | null; readAt?: string | null; createdAt: string }
export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => { setLoading(true); setError(null); apiRequest<Notification[]>('/notifications/mine').then((items) => setNotifications([...new Map(items.map((item) => [item.id, item])).values()])).catch(() => setError('We could not load your notifications right now.')).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])
  const markRead = async (id: string) => { await apiRequest(`/notifications/${id}/read`, { method: 'PUT' }); setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)) }
  const markAll = async () => { await apiRequest('/notifications/read-all', { method: 'POST' }); setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))) }
  const unread = notifications.filter((item) => !item.readAt).length

  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><PageShell title="Notifications" description="Stay up to date with real order, payment, delivery, support, and system events." />{unread > 0 && <button type="button" onClick={() => void markAll()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Mark all as read</button>}</div>{error && <ErrorState message="We could not load your notifications right now. Please try again." action={<button type="button" onClick={load} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}{loading ? <LoadingState variant="list" /> : notifications.length === 0 ? <EmptyState title="You're all caught up" message="New order, payment, delivery, and support updates will appear here." /> : <div className="space-y-3">{notifications.map((item) => <Card key={item.id} className={`p-5 ${!item.readAt ? 'border-brand-200 bg-brand-50/30' : ''}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.title}</h2><Badge tone={!item.readAt ? 'accent' : 'neutral'}>{item.type}</Badge>{!item.readAt && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}</div><p className="mt-2 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div>{!item.readAt && <button type="button" onClick={() => void markRead(item.id)} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Mark read</button>}</div>{item.entityId && item.entityType === 'ORDER' && <Link to={`/account/orders/${item.entityId}`} className="mt-3 inline-block text-sm font-semibold text-brand-700">View related order</Link>}</Card>)}</div>}</div>
}
