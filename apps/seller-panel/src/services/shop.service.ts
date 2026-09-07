import { api } from './api'

export async function getSellerShop<T = unknown>() { const { data } = await api.get<T>('/seller/shop'); return data }
export async function updateSellerShop<T = unknown>(payload: Record<string, unknown>) { const { data } = await api.patch<T>('/seller/shop', payload); return data }
