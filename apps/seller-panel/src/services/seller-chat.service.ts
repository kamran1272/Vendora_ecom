import axios from 'axios'
import { api } from './api'
import type { ChatConversation, ChatMessage } from './chat'

export type { ChatConversation, ChatMessage } from './chat'

function chatError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return new Error('Your seller session has expired. Please sign in again.')
    if (status === 403) return new Error('You do not have permission to access this support conversation.')
    if (status === 413) return new Error('This attachment is too large. Please choose a smaller file.')
    if (status && status >= 500) return new Error('Vendora Support is temporarily unavailable. Please try again shortly.')
    return new Error(error.response?.data?.message || error.message || fallback)
  }
  return error instanceof Error ? error : new Error(fallback)
}

export async function getSellerSupportConversation() {
  try {
    const { data } = await api.get<ChatConversation[]>('/chat/conversations')
    const existing = data.find((conversation) => conversation.type === 'SELLER_SUPPORT')
    if (existing) return existing
    const created = await api.post<ChatConversation>('/chat/conversations', { type: 'SELLER_SUPPORT', subject: 'Seller support' })
    return created.data
  } catch (error) {
    throw chatError(error, 'Unable to load Vendora Support.')
  }
}

export async function getSellerMessages(conversationId: string, page = 1, limit = 50) {
  try {
    const { data } = await api.get<{ data: ChatMessage[]; page: number; limit: number; total: number }>(`/chat/conversations/${conversationId}/messages`, { params: { page, limit } })
    return data
  } catch (error) {
    throw chatError(error, 'Unable to load support messages.')
  }
}

export async function sendSellerMessage(conversationId: string, payload: Record<string, unknown>) {
  if (!String(payload.content || '').trim() && !payload.attachmentUrl) throw new Error('Enter a message or attach a file before sending.')
  try {
    const { data } = await api.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, payload)
    return data
  } catch (error) {
    throw chatError(error, 'Message failed. Please try again.')
  }
}

export async function uploadSellerAttachment(file: Blob, fileName: string) {
  const createFormData = () => {
    const formData = new FormData()
    formData.append('file', file, fileName)
    return formData
  }
  try {
    const response = await api.post<{ filename: string; mimeType: string; size: number; url: string }>('/seller/chat/upload', createFormData())
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const response = await api.post<{ filename: string; mimeType: string; size: number; url: string }>('/seller/uploads', createFormData())
        return response.data
      } catch (fallbackError) {
        throw chatError(fallbackError, 'Unable to upload the attachment.')
      }
    }
    throw chatError(error, 'Unable to upload the attachment.')
  }
}

export async function fetchSellerAttachment(messageId: string) {
  try {
    const { data } = await api.get<Blob>(`/chat/messages/${messageId}/attachment`, { responseType: 'blob' })
    return data
  } catch (error) {
    throw chatError(error, 'Unable to load the image attachment.')
  }
}

export async function markSellerMessagesRead(conversationId: string) {
  try {
    const { data } = await api.post<{ id: string }>(`/chat/conversations/${conversationId}/read`)
    return data
  } catch (error) {
    throw chatError(error, 'Unable to update message read status.')
  }
}