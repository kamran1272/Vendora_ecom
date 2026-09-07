import { api } from './api'

export async function getChatConversations<T = unknown[]>() { const { data } = await api.get<T>('/chat/conversations'); return data }
export async function getChatMessages<T = unknown>(id: string, params?: Record<string, unknown>) { const { data } = await api.get<T>(`/chat/conversations/${id}/messages`, { params }); return data }
export async function sendChatMessage<T = unknown>(id: string, payload: Record<string, unknown>) { const { data } = await api.post<T>(`/chat/conversations/${id}/messages`, payload); return data }
export async function markChatRead<T = unknown>(id: string) { const { data } = await api.post<T>(`/chat/conversations/${id}/read`); return data }
export async function deleteChatMessage<T = unknown>(id: string) { const { data } = await api.delete<T>(`/chat/messages/${id}`); return data }
