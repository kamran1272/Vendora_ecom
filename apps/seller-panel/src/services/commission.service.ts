import { api } from './api'

export async function getSellerCommissionHistory<T = unknown>(params: Record<string, unknown>) { const { data } = await api.get<T>('/seller/commission-history', { params }); return data }
