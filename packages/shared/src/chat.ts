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
  product?: { id: string; name: string } | null
  order?: { id: string; status: string; total: number } | null
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
  replyToId?: string | null
}
