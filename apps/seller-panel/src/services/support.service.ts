import { api } from './api'

export async function getSellerSupportTickets<T = unknown[]>() { const { data } = await api.get<T>('/seller/support-tickets'); return data }
export async function createSellerSupportTicket<T = unknown>(payload: Record<string, unknown>) { const { data } = await api.post<T>('/seller/support-tickets', payload); return data }
