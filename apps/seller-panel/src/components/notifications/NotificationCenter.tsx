import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, CheckCheck, ChevronRight, CircleDollarSign, CreditCard, FileText, LifeBuoy, Loader2, MessageCircle, Package, RefreshCw, RotateCcw, ShoppingCart, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notifications.service'

export type SellerNotification = {
  id: string
  type: string
  title: string
  message: string
  entityId?: string | null
  entityType?: string | null
  readAt?: string | null
  createdAt: string
}

type NotificationCenterProps = {
  mode?: 'dropdown' | 'page'
}

const categoryLabels: Record<string, string> = {
  ORDER: 'New order',
  NEW_ORDER: 'New order',
  ORDER_UPDATE: 'Order update',
  PAYMENT: 'Payment',
  PAYMENT_UPDATE: 'Payment update',
  WITHDRAWAL: 'Withdrawal',
  REFUND: 'Refund',
  CHAT_MESSAGE: 'Customer message',
  ADMIN_MESSAGE: 'Admin message',
  PRODUCT_REVIEW: 'Product review',
  PRODUCT_QUERY: 'Product query',
  SUPPORT_TICKET: 'Support ticket',
  SUPPORT_REPLY: 'Support reply',
  PACKAGE: 'Package',
  SYSTEM: 'System',
}

function notificationIcon(type: string) {
  const normalized = type.toUpperCase()
  if (normalized.includes('ORDER')) return <ShoppingCart size={17} />
  if (normalized.includes('CHAT') || normalized.includes('MESSAGE')) return <MessageCircle size={17} />
  if (normalized.includes('REVIEW')) return <Star size={17} />
  if (normalized.includes('REFUND')) return <RotateCcw size={17} />
  if (normalized.includes('SUPPORT')) return <LifeBuoy size={17} />
  if (normalized.includes('PAYMENT')) return <CircleDollarSign size={17} />
  if (normalized.includes('PACKAGE')) return <Package size={17} />
  if (normalized.includes('WITHDRAW')) return <CreditCard size={17} />
  return <FileText size={17} />
}

function category(type: string) {
  return categoryLabels[type.toUpperCase()] || type.split('_').join(' ').toLowerCase()
}

function destination(notification: SellerNotification) {
  const type = notification.type.toUpperCase()
  if (type.includes('ORDER')) return notification.entityId ? `/seller/orders/${notification.entityId}` : '/seller/orders'
  if (type.includes('WITHDRAW')) return '/seller/money-withdraw-requests'
  if (type.includes('REFUND')) return '/refund-request'
  if (type.includes('CHAT') || type.includes('MESSAGE')) return '/seller/conversations'
  if (type.includes('REVIEW')) return '/seller/reviews'
  if (type.includes('QUERY')) return '/seller/product-queries'
  if (type.includes('SUPPORT')) return '/seller/support_ticket'
  if (type.includes('PACKAGE')) return '/seller/seller-packages'
  return '/seller/notifications'
}

function time(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
  }
  return error instanceof Error ? error.message : fallback
}

export function NotificationCenter({ mode = 'dropdown' }: NotificationCenterProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<SellerNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (loadError: unknown) {
      setError(errorMessage(loadError, 'Unable to load notifications.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(timer)
  }, [])

  const unreadCount = notifications.filter((item) => !item.readAt).length
  const types = useMemo(() => [...new Set(notifications.map((item) => item.type.toUpperCase()))], [notifications])
  const visible = typeFilter ? notifications.filter((item) => item.type.toUpperCase() === typeFilter) : notifications

  const markRead = async (notification: SellerNotification) => {
    if (notification.readAt) return
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
    try { await markNotificationRead(notification.id) } catch { await load() }
  }

  const markAllRead = async () => {
    if (!unreadCount || working) return
    setWorking(true)
    try { await markAllNotificationsRead(); setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))) } catch (actionError: unknown) { setError(errorMessage(actionError, 'Unable to mark notifications as read.')) } finally { setWorking(false) }
  }

  const openNotification = async (notification: SellerNotification) => {
    await markRead(notification)
    navigate(destination(notification))
  }

  if (mode === 'dropdown') {
    return (
      <NotificationDropdown
        notifications={notifications.slice(0, 5)}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        onOpen={openNotification}
        onMarkRead={markRead}
        onMarkAll={markAllRead}
        onViewAll={() => navigate('/seller/notifications')}
        onRefresh={load}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {types.map((type) => <option key={type} value={type}>{category(type)}</option>)}
          </select>
          <button type="button" onClick={() => void markAllRead()} disabled={!unreadCount || working} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">
            <CheckCheck size={15} /> Mark all read
          </button>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-200 p-2 text-slate-600">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : !visible.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-500">
          <Bell className="mx-auto text-slate-300" size={36} />
          <p className="mt-3">No notifications found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {visible.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onOpen={openNotification} onMarkRead={markRead} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationRow({ notification, onOpen, onMarkRead }: { notification: SellerNotification; onOpen: (notification: SellerNotification) => Promise<void>; onMarkRead: (notification: SellerNotification) => Promise<void> }) {
  return (
    <div className={`border-b border-slate-100 p-3 last:border-0 ${notification.readAt ? 'bg-white' : 'bg-sky-50/60'}`}>
      <button type="button" onClick={() => void onOpen(notification)} className="flex w-full items-start gap-3 text-left transition hover:bg-sky-50/70 focus:outline-none focus:ring-2 focus:ring-blue-200">
        <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notification.readAt ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
          {notificationIcon(notification.type)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-slate-800">{notification.title}</strong>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{category(notification.type)}</span>
          </span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.message}</span>
          <span className="mt-2 block text-xs text-slate-400">{time(notification.createdAt)}</span>
        </span>
        {!notification.readAt ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" /> : null}
        <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />
      </button>
      {!notification.readAt ? (
        <button type="button" onClick={() => void onMarkRead(notification)} className="ml-11 mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
          <Check size={13} /> Mark as read
        </button>
      ) : null}
    </div>
  )
}

export function NotificationDropdown({ notifications, unreadCount, loading, error, onOpen, onMarkRead, onMarkAll, onViewAll, onRefresh }: { notifications: SellerNotification[]; unreadCount: number; loading: boolean; error: string; onOpen: (notification: SellerNotification) => Promise<void>; onMarkRead: (notification: SellerNotification) => Promise<void>; onMarkAll: () => Promise<void>; onViewAll: () => void; onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleDismiss = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleDismiss)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleDismiss)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button type="button" aria-label="Notifications" onClick={() => setOpen((value) => !value)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
        <Bell size={17} />
        {unreadCount ? <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label="Refresh notifications" onClick={() => void onRefresh()} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <RefreshCw size={14} />
              </button>
              <button type="button" onClick={() => void onMarkAll()} disabled={!unreadCount} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                <Check size={14} />
              </button>
            </div>
          </div>

          {error ? <div className="p-3 text-xs text-red-600">{error}</div> : null}
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-slate-500">
              <Loader2 size={16} className="mr-2 animate-spin" />Loading...
            </div>
          ) : notifications.length ? (
            <div className="max-h-[390px] overflow-y-auto">
              {notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} onOpen={async (item) => { await onOpen(item); setOpen(false) }} onMarkRead={onMarkRead} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">You are all caught up.</div>
          )}

          <button type="button" onClick={onViewAll} className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50">
            View all notifications <ChevronRight size={15} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
