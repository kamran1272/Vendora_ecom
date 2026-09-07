import { api } from './api'

export async function getSellerRefunds<T = unknown[]>() { const { data } = await api.get<T>('/seller/refunds'); return data }
export async function updateSellerRefund<T = unknown>(id: string, payload: Record<string, unknown>) { const { data } = await api.patch<T>(`/seller/refunds/${id}`, payload); return data }
