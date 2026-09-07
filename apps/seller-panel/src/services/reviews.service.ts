import { api } from './api'

export async function getSellerReviews<T = unknown>(params: Record<string, unknown>) { const { data } = await api.get<T>('/seller/reviews', { params }); return data }
export async function replyToSellerReview<T = unknown>(id: string, text: string) { const { data } = await api.post<T>(`/seller/reviews/${id}/reply`, { text }); return data }
export async function reportSellerReview<T = unknown>(id: string, reason: string) { const { data } = await api.post<T>(`/seller/reviews/${id}/report`, { reason }); return data }
