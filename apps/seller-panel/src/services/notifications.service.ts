import { api } from './api'

export type SellerNotification = { id: string; type: string; title: string; message: string; entityId?: string | null; entityType?: string | null; readAt?: string | null; createdAt: string }
export async function getMyNotifications() { const { data } = await api.get<SellerNotification[]>('/notifications/mine'); return data }
export async function markNotificationRead(id: string) { const { data } = await api.put(`/notifications/${id}/read`); return data }
export async function markAllNotificationsRead() { const { data } = await api.post('/notifications/read-all'); return data }
export async function getUnreadNotificationCount() { const { data } = await api.get<{ count: number }>('/notifications/unread-count'); return data.count }
