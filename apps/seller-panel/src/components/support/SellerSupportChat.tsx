import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getSellerMessages, getSellerSupportConversation, markSellerMessagesRead, sendSellerMessage, uploadSellerAttachment, type ChatConversation, type ChatMessage } from '../../services/seller-chat.service'
import {
  SellerSupportChatButton,
  SellerSupportChatWindow,
  SellerSupportMinimizedButton,
  type SellerAttachment,
  type SellerAttachmentState,
  type SellerFailedMessage,
} from './SellerSupportChatParts'

const supportType = 'SELLER_SUPPORT'
const maxAttachmentSize = 5 * 1024 * 1024
const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'zip'])
const allowedMimeTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv', 'application/zip', 'application/x-zip-compressed', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])

function currentUserId() {
  try {
    return String(JSON.parse(localStorage.getItem('vendora_user') || '{}').id || '')
  } catch {
    return ''
  }
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const messages = new Map(current.map((message) => [message.id, message]))
  incoming.forEach((message) => messages.set(message.id, message))
  return [...messages.values()].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
}

export function SellerSupportChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachment, setAttachment] = useState<SellerAttachment | null>(null)
  const [attachmentState, setAttachmentState] = useState<SellerAttachmentState>('idle')
  const [failed, setFailed] = useState<Record<string, SellerFailedMessage>>({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingAttachment, setSendingAttachment] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const openRef = useRef(false)
  const failedRef = useRef<Record<string, SellerFailedMessage>>({})
  const userId = useMemo(() => currentUserId(), [])

  const loadConversation = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const supportConversation = await getSellerSupportConversation()
      setConversation((current) => current || supportConversation)
      setUnreadCount(openRef.current ? 0 : Math.max(0, Number(supportConversation.unreadCount) || 0))
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to connect to Vendora Support.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true)
    try {
      const result = await getSellerMessages(conversationId)
      setMessages((current) => mergeMessages(current.filter((message) => !message.id.startsWith('pending-') || failedRef.current[message.id]), result.data))
      await markSellerMessagesRead(conversationId)
      setUnreadCount(0)
      setConversation((current) => current ? { ...current, unreadCount: 0 } : current)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load support messages.')
    } finally {
      if (showLoading) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    void loadConversation(true)
    const timer = window.setInterval(() => void loadConversation(), 8_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open || !conversation) return
    void loadMessages(conversation.id)
    const timer = window.setInterval(() => void loadMessages(conversation.id, false), 5_000)
    return () => window.clearInterval(timer)
  }, [open, conversation?.id])

  useEffect(() => {
    if (!open || !conversation) return
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) return
    const socket = io((import.meta.env.VITE_SOCKET_URL as string | undefined) || '/ws/chat', { auth: { token }, transports: ['websocket', 'polling'] })
    socket.on('connect', () => socket.emit('joinConversation', { conversationId: conversation.id }))
    socket.on('message:new', (message: ChatMessage) => {
      if (message.conversationId === conversation.id) void loadMessages(conversation.id, false)
    })
    return () => { socket.disconnect() }
  }, [open, conversation?.id])

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open, minimized])

  const openChat = async () => {
    openRef.current = true
    setOpen(true)
    setMinimized(false)
    if (conversation) {
      setUnreadCount(0)
      void markSellerMessagesRead(conversation.id)
      return
    }
    setLoading(true)
    try {
      const created = await getSellerSupportConversation()
      setConversation(created)
      setUnreadCount(0)
      setError('')
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Unable to open Vendora Support.')
    } finally {
      setLoading(false)
    }
  }

  const closeChat = () => {
    openRef.current = false
    setOpen(false)
    setMinimized(false)
  }

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const isImageFile = file.type.startsWith('image/') && allowedExtensions.has(extension)
    if (!isImageFile && !allowedMimeTypes.has(file.type) && !allowedExtensions.has(extension)) {
      setAttachment(null)
      setAttachmentState('failed')
      setError('Unsupported file type. Use an image, PDF, DOC/DOCX, or common document file.')
      return
    }
    if (file.size > maxAttachmentSize) {
      setAttachment(null)
      setAttachmentState('failed')
      setError('Attachments must be 5 MB or smaller.')
      return
    }
    setAttachmentState('reading')
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({ name: file.name, url: String(reader.result), type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE' })
      setAttachmentState('ready')
    }
    reader.onerror = () => {
      setAttachment(null)
      setAttachmentState('failed')
      setError('This attachment could not be prepared. Please try another file.')
    }
    reader.readAsDataURL(file)
  }

  const send = async (event: FormEvent, retryId?: string) => {
    event.preventDefault()
    if (!conversation || sending) return
    const retry = retryId ? failed[retryId] : undefined
    const content = retry?.content || draft.trim()
    const selectedAttachment = retry?.attachment || attachment
    if (!content && !selectedAttachment) return
    const payload = { type: selectedAttachment?.type || 'TEXT', attachmentType: selectedAttachment?.type || null, content: content || null, attachmentUrl: selectedAttachment?.url || null, attachmentName: selectedAttachment?.name || null }
    const optimisticId = retryId || `pending-${Date.now()}`
    const optimistic: ChatMessage = { id: optimisticId, conversationId: conversation.id, senderId: userId, senderRole: 'SELLER', content: content || null, type: String(payload.type), attachmentUrl: selectedAttachment?.url || null, attachmentName: selectedAttachment?.name || null, createdAt: new Date().toISOString() }
    setMessages((current) => mergeMessages(current.filter((message) => message.id !== optimisticId && message.id !== retryId), [optimistic]))
    setFailed((current) => { const next = { ...current }; delete next[optimisticId]; failedRef.current = next; return next })
    setDraft('')
    setAttachment(null)
    setAttachmentState('idle')
    setEmojiOpen(false)
    setSending(true)
    setSendingAttachment(Boolean(selectedAttachment))
    setError('')
    let resolvedAttachment = selectedAttachment
    try {
      if (selectedAttachment?.url.startsWith('data:')) {
        const attachmentResponse = await fetch(selectedAttachment.url)
        const attachmentBlob = await attachmentResponse.blob()
        const uploaded = await uploadSellerAttachment(attachmentBlob, selectedAttachment.name)
        resolvedAttachment = { ...selectedAttachment, name: uploaded.filename, url: uploaded.url }
      }
      const sent = await sendSellerMessage(conversation.id, { ...payload, attachmentType: resolvedAttachment?.type || null, attachmentUrl: resolvedAttachment?.url || null, attachmentName: resolvedAttachment?.name || null })
      setMessages((current) => mergeMessages(current.filter((message) => message.id !== optimisticId && message.id !== sent.id), [sent]))
      setConversation((current) => current ? { ...current, lastMessageAt: sent.createdAt } : current)
    } catch (sendError) {
      setFailed((current) => { const next = { ...current, [optimisticId]: { content, attachment: resolvedAttachment } }; failedRef.current = next; return next })
      if (resolvedAttachment) setAttachmentState('failed')
      setError(sendError instanceof Error ? sendError.message : 'Message failed. Retry when connected.')
    } finally {
      setSending(false)
      setSendingAttachment(false)
    }
  }

  return <>{open && !minimized ? <SellerSupportChatWindow conversation={conversation} unreadCount={unreadCount} loading={loading} error={error} messages={messages} userId={userId} failed={failed} loadingMessages={loadingMessages} endRef={endRef} draft={draft} attachment={attachment} attachmentState={attachmentState} emojiOpen={emojiOpen} sending={sending} sendingAttachment={sendingAttachment} fileRef={fileRef} onMinimize={() => setMinimized(true)} onClose={closeChat} onSubmit={(event: FormEvent) => void send(event)} onAttach={readFile} onDraftChange={setDraft} onEmojiToggle={() => setEmojiOpen((value) => !value)} onEmojiSelect={(emoji: string) => { setDraft((value) => value + emoji); setEmojiOpen(false) }} onRemoveAttachment={() => { setAttachment(null); setAttachmentState('idle') }} onRetry={(event: React.MouseEvent<HTMLButtonElement>, messageId: string) => void send(event, messageId)} /> : null}{open && minimized ? <SellerSupportMinimizedButton unreadCount={unreadCount} onRestore={() => setMinimized(false)} /> : null}{!open ? <SellerSupportChatButton unreadCount={unreadCount} onOpen={() => void openChat()} /> : null}</>
}
