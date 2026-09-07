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
  online?: boolean
  typing?: boolean
  category?: string | null
  participants?: Array<{ userId: string; role: string; user?: { id: string; name: string; email: string } }>
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
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentType?: string | null
  deletedAt?: string | null
  read?: boolean
  replyToId?: string | null
  sender?: {
    id: string
    name: string
    email: string
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'

function getAuthToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('accessToken')
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const messages: Record<number, string> = { 400: 'Check your message and try again.', 401: 'Your session has expired. Please sign in again.', 403: 'You do not have permission to access this conversation.', 404: 'The conversation could not be found.', 500: 'The conversation service is unavailable. Please try again.' }
    throw new Error(messages[response.status] || (response.status >= 500 ? messages[500] : 'Unable to load conversation data.'))
  }

  return (data as T) ?? ({} as T)
}

export async function fetchSellerChatConversations(): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations')
}

export async function createSellerSupportConversation() {
  return apiRequest<ChatConversation>('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ type: 'SELLER_SUPPORT', subject: 'Seller support' }),
  })
}

export async function fetchSellerChatMessages(conversationId: string, page = 1, limit = 50) {
  return apiRequest<{ data: ChatMessage[]; page: number; limit: number; total: number }>(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
  )
}

export async function sendSellerChatMessage(conversationId: string, payload: Record<string, unknown>) {
  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadSellerChatFile(file: Blob, fileName: string) {
  const formData = new FormData()
  formData.append('file', file, fileName)
  const headers: Record<string, string> = {}
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let response = await fetch(`${API_BASE_URL}/seller/chat/upload`, { method: 'POST', body: formData, headers })
  if (response.status === 404) {
    const fallbackFormData = new FormData()
    fallbackFormData.append('file', file, fileName)
    response = await fetch(`${API_BASE_URL}/seller/uploads`, { method: 'POST', body: fallbackFormData, headers })
  }
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(response.status >= 500 ? 'The attachment service is unavailable. Please try again.' : data?.message || 'Unable to upload the attachment.')
  return data as { filename: string; mimeType: string; size: number; url: string }
}

export async function fetchSellerChatAttachment(messageId: string) {
  const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}/attachment`, { headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {} })
  if (!response.ok) throw new Error('Unable to load image attachment.')
  return response.blob()
}

export async function markSellerConversationRead(conversationId: string) {
  return apiRequest<{ id: string }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
  })
}

export async function deleteSellerChatMessage(messageId: string) {
  return apiRequest<{ id: string; deletedAt: string }>(`/chat/messages/${messageId}`, { method: 'DELETE' })
}
