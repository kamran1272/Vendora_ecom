export type AdminNotification = { id: string; type: string; title: string; message: string; entityId?: string | null; entityType?: string | null; readAt?: string | null; createdAt: string }

export function getAdminNotificationDestination(notification: AdminNotification) {
  const type = notification.type.toUpperCase()
  const entityType = notification.entityType?.toUpperCase()
  const id = notification.entityId

  if (entityType === 'ORDER' || type.includes('ORDER')) return id ? `/admin/orders/${id}` : '/admin/orders'
  if (entityType === 'PAYMENT' || type.includes('PAYMENT')) return id ? `/admin/payments/${id}` : '/admin/payments'
  if (entityType === 'WITHDRAWAL' || type.includes('WITHDRAW')) return id ? `/admin/withdrawals/${id}` : '/admin/withdrawals'
  if (entityType === 'REFUND' || type.includes('REFUND')) return id ? `/admin/refunds/${id}` : '/admin/refunds'
  if (entityType === 'WAREHOUSE_PRODUCT' || type === 'LOW_INVENTORY') return id ? `/admin/product-warehouse/${id}` : '/admin/product-warehouse'
  if (entityType === 'CONVERSATION' || type.includes('SUPPORT') || type.includes('CHAT') || type.includes('MESSAGE')) return '/admin/support'
  if (entityType === 'REVIEW_REPORT' || type.includes('PRODUCT_REPORT')) return '/admin/reviews'
  if (type.includes('SELLER_APPLICATION')) return id ? `/admin/seller-applications/${id}` : '/admin/seller-applications'
  return '/admin/notifications'
}
import { AdminApiError, notifyAdminApiError } from './adminApi'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
const token = () => localStorage.getItem('access_token') || localStorage.getItem('accessToken')

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers || {}) } })
  } catch {
    const error = new AdminApiError('NETWORK', undefined, 'The server could not be reached.')
    notifyAdminApiError(error)
    throw error
  }
  if (!response.ok) {
    const error = new AdminApiError(response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : response.status === 400 || response.status === 422 ? 'VALIDATION' : response.status >= 500 ? 'SERVER' : 'UNKNOWN', response.status, await response.text())
    notifyAdminApiError(error)
    throw error
  }
  return response.json() as Promise<T>
}

export const getAdminNotifications = () => request<AdminNotification[]>('/notifications/mine')
export const getAdminUnreadNotificationCount = () => request<{ count: number }>('/notifications/unread-count')
export const markAdminNotificationRead = (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' })
export const markAllAdminNotificationsRead = () => request('/notifications/read-all', { method: 'POST' })