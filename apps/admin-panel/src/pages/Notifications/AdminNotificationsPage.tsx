import { useEffect, useState } from 'react'
import { Bell, Clock, CheckCircle, AlertCircle, Package, TrendingUp, Ticket, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAdminNotifications, getAdminNotificationDestination, markAdminNotificationRead, markAllAdminNotificationsRead, AdminNotification } from '../../services/notifications'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '../../components/feedback/AdminFeedback'

const notificationTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  SELLER_APPLICATION: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700', label: 'Seller Application' },
  NEW_ORDER: { icon: <Package className="h-4 w-4" />, color: 'bg-green-100 text-green-700', label: 'New Order' },
  PAYMENT: { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700', label: 'Payment' },
  WITHDRAWAL_REQUEST: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700', label: 'Withdrawal Request' },
  REFUND_REQUEST: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-100 text-red-700', label: 'Refund Request' },
  SUPPORT_TICKET: { icon: <Ticket className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700', label: 'Support Ticket' },
  PRODUCT_REPORT: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700', label: 'Product Report' },
  LOW_INVENTORY: { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-700', label: 'Low Inventory' },
}

export function AdminNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [searchText, setSearchText] = useState('')

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getAdminNotifications()
      setNotifications(data)
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load notifications.')
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    let filtered = notifications
    if (filterUnread) {
      filtered = filtered.filter((n) => !n.readAt)
    }
    if (filterType) {
      filtered = filtered.filter((n) => n.type === filterType)
    }
    if (searchText) {
      const query = searchText.toLowerCase()
      filtered = filtered.filter((n) => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query))
    }
    setFilteredNotifications(filtered)
  }, [notifications, filterType, filterUnread, searchText])

  const handleMarkRead = async (notification: AdminNotification) => {
    if (notification.readAt) return
    try {
      await markAdminNotificationRead(notification.id)
      setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead()
      setNotifications(notifications.map((n) => ({ ...n, readAt: new Date().toISOString() })))
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const openNotification = async (notification: AdminNotification) => {
    await handleMarkRead(notification)
    navigate(getAdminNotificationDestination(notification))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  const uniqueTypes = Array.from(new Set(notifications.map((n) => n.type)))
  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <AdminLayout>
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        </div>
        <p className="text-sm text-slate-600">Monitor all admin notifications including orders, payments, seller applications, and system alerts.</p>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Total:</span>
          <span className="font-semibold text-slate-900">{notifications.length}</span>
          {unreadCount > 0 && (
            <>
              <span className="text-sm text-slate-500">•</span>
              <span className="text-sm font-medium text-slate-700">Unread:</span>
              <span className="font-semibold text-blue-600">{unreadCount}</span>
            </>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-medium text-slate-900">Filters</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Search</label>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">All types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {notificationTypeConfig[type]?.label || type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filterUnread}
                onChange={(e) => setFilterUnread(e.target.checked)}
                className="h-4 w-4 rounded border-slate-200 text-blue-600 focus:ring-1 focus:ring-blue-300"
              />
              <span className="text-sm font-medium text-slate-700">Unread only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-medium text-slate-900">Notifications ({filteredNotifications.length})</h3>
        {loading ? (
          <AdminTableSkeleton columns={3} />
        ) : loadError ? (
          <AdminErrorState onRetry={loadNotifications} message={loadError} />
        ) : filteredNotifications.length === 0 ? (
          <AdminEmptyState title="No notifications found" message="Try adjusting your filters or check back when new activity arrives." action={searchText || filterType || filterUnread ? { label: 'Clear filters', onClick: () => { setSearchText(''); setFilterType(''); setFilterUnread(false) } } : undefined} />
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notification) => {
              const config = notificationTypeConfig[notification.type] || { icon: <Bell className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700', label: notification.type }
              const isUnread = !notification.readAt

              return (
                <div
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  className={`flex cursor-pointer gap-4 p-4 transition hover:bg-slate-50 ${isUnread ? 'bg-blue-50' : ''}`}
                >
                  {/* Icon */}
                  <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${config.color}`}>{config.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>{notification.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{notification.message}</p>
                        {notification.entityId && <p className="mt-1 text-xs text-slate-500">ID: {notification.entityId}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnread && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>

                  {/* Status */}
                  {isUnread ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkRead(notification)
                      }}
                      className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                    >
                      Mark read
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <CheckCircle className="h-4 w-4" />
                      Read
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  )
}
