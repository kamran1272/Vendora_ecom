import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAdminNotifications, getAdminNotificationDestination, getAdminUnreadNotificationCount, markAdminNotificationRead, markAllAdminNotificationsRead, type AdminNotification } from '../../services/notifications'

export function AdminNotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try { const [items, count] = await Promise.all([getAdminNotifications(), getAdminUnreadNotificationCount()]); setNotifications(items); setUnread(count.count) } catch { /* authenticated API may be unavailable during login */ }
  }

  useEffect(() => { void load(); const interval = window.setInterval(() => void load(), 10000); return () => window.clearInterval(interval) }, [])
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])
  const openNotification = async (notification: AdminNotification) => {
    if (!notification.readAt) await markAdminNotificationRead(notification.id)
    setOpen(false)
    navigate(getAdminNotificationDestination(notification))
  }
  const readAll = async () => { await markAllAdminNotificationsRead(); await load() }

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-haspopup="menu" aria-expanded={open} title={unread ? `${unread} unread notifications` : 'Notifications'} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Bell className="h-5 w-5" />{unread ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-5 text-white">{unread > 99 ? '99+' : unread}</span> : null}</button>{open ? <div className="absolute right-0 z-40 mt-3 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"><div className="flex items-center justify-between border-b border-slate-200 px-2 pb-3"><div><p className="font-semibold text-slate-900">Notifications</p><p className="text-xs text-slate-500">{unread} unread</p></div><button type="button" onClick={() => void readAll()} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600"><CheckCheck className="h-4 w-4" />Mark all read</button></div><div className="max-h-96 overflow-y-auto">{notifications.length ? notifications.map((item) => <button type="button" key={item.id} onClick={() => void openNotification(item)} className={`w-full border-b border-slate-100 px-2 py-3 text-left ${item.readAt ? 'opacity-60' : ''}`}><div className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" /><span><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-600">{item.message}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></span></div></button>) : <p className="p-5 text-center text-sm text-slate-500">No notifications yet.</p>}</div><button type="button" onClick={() => { setOpen(false); navigate('/admin/notifications') }} className="block w-full px-2 pt-3 text-center text-xs font-semibold text-indigo-600">View all</button></div> : null}</div>
}