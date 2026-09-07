import { api } from './api'

export async function getSellerUploads<T = unknown>(params: Record<string, unknown>) { const { data } = await api.get<T>('/seller/uploads', { params }); return data }
export async function uploadSellerFile<T = unknown>(file: File) { const body = new FormData(); body.append('file', file); const { data } = await api.post<T>('/seller/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' } }); return data }
export async function deleteSellerUpload<T = unknown>(id: string) { const { data } = await api.delete<T>(`/seller/uploads/${id}`); return data }
