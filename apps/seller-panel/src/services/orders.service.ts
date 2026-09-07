import { api } from './api'

export async function getSellerOrders<T = unknown[]>() { const { data } = await api.get<T>('/seller/orders'); return data }
export async function getSellerOrder<T = unknown>(id: string) { const { data } = await api.get<T>(`/seller/orders/${id}`); return data }
export async function updateSellerOrderStatus<T = unknown>(id: string, status: string) { const { data } = await api.patch<T>(`/seller/orders/${id}/status`, { status }); return data }
