import { api } from './api'

export async function getSellerProduct<T = unknown>(id: string) { const { data } = await api.get<T>(`/seller/products/${id}`); return data }
export async function createSellerProduct<T = unknown>(payload: Record<string, unknown>) { const { data } = await api.post<T>('/seller/products', payload); return data }
export async function updateSellerProduct<T = unknown>(id: string, payload: Record<string, unknown>) { const { data } = await api.patch<T>(`/seller/products/${id}`, payload); return data }
export async function deleteSellerProduct<T = unknown>(id: string) { const { data } = await api.delete<T>(`/seller/products/${id}`); return data }
