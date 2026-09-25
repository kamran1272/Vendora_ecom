import { apiRequest } from '@/services/api'

export type { ChatConversation, ChatMessage } from '@vendora/shared'

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations')
}

export async function fetchChatMessages(conversationId: string, page = 1, limit = 50) {
  return apiRequest<{ data: ChatMessage[]; page: number; limit: number; total: number }>(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
  )
}

export async function createChatConversation(payload: Record<string, unknown>) {
  return apiRequest<ChatConversation>('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendChatMessage(conversationId: string, payload: Record<string, unknown>) {
  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function markConversationRead(conversationId: string) {
  return apiRequest<{ id: string }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
  })
}
