import { apiRequest } from '@/services/api'

export type ChatConversation = {
  id: string
  type: string
  subject?: string | null
  status?: string | null
  priority?: string | null
  lastMessageAt?: string | null
  customerId?: string | null
  sellerId?: string | null
  shopId?: string | null
  productId?: string | null
  orderId?: string | null
  unreadCount?: number
  customer?: {
    id: string
    name: string
    email: string
  } | null
  seller?: {
    id: string
    user?: {
      id: string
      name: string
      email: string
    }
  } | null
  messages?: ChatMessage[]
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderRole?: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'SYSTEM' | string
  content: string | null
  type?: string
  createdAt: string
  readAt?: string | null
  sender?: {
    id: string
    name: string
    email: string
  }
}

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
