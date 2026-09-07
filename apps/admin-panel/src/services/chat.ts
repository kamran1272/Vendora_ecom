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
  product?: { id: string; name: string } | null
  order?: { id: string; status: string; total: number } | null
  unreadCount?: number
  online?: boolean
  typing?: boolean
  category?: string | null
  adminNotes?: string | null
  assignedAdminId?: string | null
  aiEnabled?: boolean
  aiActive?: boolean
  humanTakeover?: boolean
  metadata?: string | null
  messages?: Array<{ id: string; content: string | null; createdAt: string; senderRole?: string }>
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
  shop?: { id: string; name: string } | null
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderRole?: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'SYSTEM' | string
  content: string | null
  type?: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  readAt?: string | null
  createdAt: string
  sender?: {
    id: string
    name: string
    email: string
  }
}

import { AdminApiError, notifyAdminApiError } from './adminApi'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'

function getAuthToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('accessToken')
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
    })
  } catch {
    const error = new AdminApiError('NETWORK', undefined, 'The server could not be reached.')
    notifyAdminApiError(error)
    throw error
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const code = response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : response.status === 400 || response.status === 422 ? 'VALIDATION' : response.status >= 500 ? 'SERVER' : 'UNKNOWN'
    const error = new AdminApiError(code, response.status, data?.message || `Request failed with status ${response.status}`)
    notifyAdminApiError(error)
    throw error
  }

  return (data as T) ?? ({} as T)
}

export async function fetchAdminChatConversations(): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations')
}

export async function fetchAdminChatMessages(conversationId: string, page = 1, limit = 50) {
  return apiRequest<{ data: ChatMessage[]; page: number; limit: number; total: number }>(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
  )
}

export async function searchAdminChatMessages(conversationId: string, search: string) {
  return apiRequest<{ data: ChatMessage[]; page: number; limit: number; total: number }>(`/chat/conversations/${conversationId}/messages?page=1&limit=100&search=${encodeURIComponent(search)}`)
}

export async function sendAdminChatMessage(conversationId: string, payload: Record<string, unknown>) {
  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminChatAttachment(messageId: string) {
  const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}/attachment`, {
    headers: {
      Accept: '*/*',
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },
  })
  if (!response.ok) throw new Error('Unable to load chat attachment.')
  return response.blob()
}

export async function markAdminConversationRead(conversationId: string) {
  return apiRequest<{ id: string }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
  })
}

export async function updateAdminConversation(conversationId: string, payload: Record<string, unknown>) {
  return apiRequest(`/chat/conversations/${conversationId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function closeAdminConversation(conversationId: string) {
  return apiRequest(`/chat/conversations/${conversationId}/close`, { method: 'POST' })
}

export async function reopenAdminConversation(conversationId: string) {
  return apiRequest(`/chat/conversations/${conversationId}/reopen`, { method: 'POST' })
}

export async function markAdminConversationSeen(conversationId: string) {
  return apiRequest(`/chat/conversations/${conversationId}/seen`, { method: 'POST' })
}

export async function setAdminConversationTyping(conversationId: string, active: boolean) {
  return apiRequest(`/chat/conversations/${conversationId}/typing`, { method: 'POST', body: JSON.stringify({ active }) })
}
