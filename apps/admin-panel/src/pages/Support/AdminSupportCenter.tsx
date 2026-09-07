import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Paperclip, Send } from 'lucide-react'
import { io } from 'socket.io-client'
import {
  closeAdminConversation,
  fetchAdminChatConversations,
  fetchAdminChatAttachment,
  fetchAdminChatMessages,
  markAdminConversationRead,
  markAdminConversationSeen,
  reopenAdminConversation,
  searchAdminChatMessages,
  sendAdminChatMessage,
  setAdminConversationTyping,
  updateAdminConversation,
  type ChatConversation,
  type ChatMessage,
} from '../../services/chat'
import { AdminLayout } from '../../layouts/AdminLayout'
import { useAdminAuth } from '../../auth/AdminAuthContext'

const ticketCategories = ['ORDER', 'PAYMENT', 'REFUND', 'SHIPPING', 'SELLER', 'PRODUCT', 'ACCOUNT', 'TECHNICAL', 'OTHER']
const ticketStatuses = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']
const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

function isImageAttachment(message: ChatMessage) {
  return message.type === 'IMAGE' || Boolean(message.attachmentUrl?.startsWith('data:image') || message.attachmentUrl?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i))
}

function getConversationName(conversation: ChatConversation) {
  return conversation.seller?.user?.name || conversation.customer?.name || conversation.shop?.name || 'Support conversation'
}

function getConversationRole(conversation: ChatConversation) {
  if (conversation.seller) return 'Seller'
  if (conversation.customer) return 'Customer'
  return 'Support'
}

function getConversationContact(conversation: ChatConversation) {
  return conversation.seller?.user?.email || conversation.customer?.email || conversation.shop?.name || conversation.subject || 'No contact details'
}

function isAdminMessage(message: ChatMessage) {
  return ['ADMIN', 'SUPPORT_AGENT'].includes(String(message.senderRole).toUpperCase())
}

function AuthenticatedAdminChatImage({ message }: { message: ChatMessage }) {
  const [source, setSource] = useState<string | null>(message.attachmentUrl?.startsWith('data:') ? message.attachmentUrl : null)

  useEffect(() => {
    if (!message.attachmentUrl || message.attachmentUrl.startsWith('data:')) return
    let objectUrl = ''
    let active = true
    void fetchAdminChatAttachment(message.id).then((blob) => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setSource(objectUrl)
    }).catch(() => undefined)
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [message.id, message.attachmentUrl])

  if (!source) return <div className="mt-2 flex h-24 w-40 items-center justify-center rounded-lg bg-white/10 text-xs opacity-70">Loading image...</div>
  return <a href={source} target="_blank" rel="noreferrer"><img src={source} alt={message.attachmentName || 'Chat attachment'} className="mt-2 max-h-48 max-w-full rounded-lg object-contain" /></a>
}

export function AdminSupportCenterPage() {
  const { adminUser } = useAdminAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [messageSearch, setMessageSearch] = useState('')
  const [typing, setTyping] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [inboxSearch, setInboxSearch] = useState('')
  const [inboxFilter, setInboxFilter] = useState('ALL')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const summary = useMemo(() => {
    const open = conversations.filter((item) => (item.status || 'OPEN') === 'OPEN').length
    const pending = conversations.filter((item) => (item.status || 'OPEN') === 'PENDING').length
    const resolved = conversations.filter((item) => (item.status || 'OPEN') === 'RESOLVED').length

    return { open, pending, resolved }
  }, [conversations])

  const visibleConversations = useMemo(() => {
    const search = inboxSearch.trim().toLowerCase()
    return conversations.filter((conversation) => {
      const haystack = [conversation.seller?.user?.name, conversation.seller?.user?.email, conversation.customer?.name, conversation.customer?.email, conversation.shop?.name, conversation.subject, conversation.messages?.[0]?.content].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !search || haystack.includes(search)
      const matchesFilter = inboxFilter === 'ALL' || inboxFilter === 'UNREAD' && Boolean(conversation.unreadCount) || inboxFilter === 'HIGH' && ['HIGH', 'URGENT'].includes(String(conversation.priority).toUpperCase()) || String(conversation.status || 'OPEN').toUpperCase() === inboxFilter
      return matchesSearch && matchesFilter
    })
  }, [conversations, inboxFilter, inboxSearch])

  useEffect(() => {
    let ignore = false

    fetchAdminChatConversations()
      .then((items) => {
        if (ignore) return
        setConversations(items)
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Unable to load conversations.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    const interval = window.setInterval(() => {
      fetchAdminChatConversations().then(setConversations).catch(() => undefined)
    }, 5000)

    return () => {
      ignore = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    setThreadLoading(true)
    const loadMessages = messageSearch.trim()
      ? searchAdminChatMessages(selectedId, messageSearch)
      : fetchAdminChatMessages(selectedId)

    loadMessages
      .then((result) => setMessages(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load messages.'))
      .finally(() => {
        setThreadLoading(false)
        markAdminConversationRead(selectedId).catch(() => undefined)
        markAdminConversationSeen(selectedId).catch(() => undefined)
      })

    const interval = window.setInterval(() => {
      const refresh = messageSearch.trim() ? searchAdminChatMessages(selectedId, messageSearch) : fetchAdminChatMessages(selectedId)
      refresh.then((result) => setMessages(result.data)).catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [selectedId, messageSearch])

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) return

    const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined
    const configuredApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
    const socketUrl = configuredSocketUrl || (configuredApiUrl?.startsWith('http') ? configuredApiUrl.replace(/\/api\/?$/, '') : 'http://127.0.0.1:4003')
    const socket = io(`${socketUrl}/ws/chat`, { auth: { token }, transports: ['websocket', 'polling'] })
    setConnectionStatus('connecting')
    socket.on('connect', () => {
      setConnectionStatus('connected')
      if (selectedId) socket.emit('joinConversation', { conversationId: selectedId })
    })
    socket.on('disconnect', () => setConnectionStatus('offline'))
    socket.on('connect_error', () => setConnectionStatus('offline'))
    socket.on('message:new', (message: ChatMessage) => {
      if (message.conversationId === selectedId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
      }
      fetchAdminChatConversations().then(setConversations).catch(() => undefined)
    })
    return () => { socket.disconnect() }
  }, [selectedId])

  const readAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Attachments must be 5 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAttachmentUrl(String(reader.result))
      setAttachmentName(file.name)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  useEffect(() => {
    if (selectedConversation) setAdminNotes(selectedConversation.adminNotes || '')
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if (!selectedId || (!draft.trim() && !attachmentUrl) || sending) return

    setSending(true)
    setError('')

    try {
      const message = await sendAdminChatMessage(selectedId, { type: attachmentUrl ? 'FILE' : 'TEXT', content: draft.trim(), attachmentUrl: attachmentUrl || undefined, attachmentName: attachmentName || undefined })
      setMessages((current) => [...current, message])
      setDraft('')
      setAttachmentUrl('')
      setAttachmentName('')
      const refreshed = await fetchAdminChatConversations()
      setConversations(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  const updateTicket = async (payload: Record<string, unknown>) => {
    if (!selectedId) return
    try {
      await updateAdminConversation(selectedId, payload)
      setConversations(await fetchAdminChatConversations())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update ticket.')
    }
  }

  const toggleConversationState = async () => {
    if (!selectedId || !selectedConversation) return
    const action = selectedConversation.status === 'CLOSED' ? reopenAdminConversation : closeAdminConversation
    await action(selectedId)
    setConversations(await fetchAdminChatConversations())
  }

  return (
    <AdminLayout>
    <div className="support-page space-y-6 p-1 text-slate-800 sm:p-2 lg:p-3">
      <div className="support-workspace mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:h-[calc(100vh-9.5rem)] lg:min-h-[640px] lg:flex-col">
        <div className="support-header border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">Admin operations</div>
              <h1 className="text-2xl font-black text-slate-900">Support center</h1>
            </div>
            <div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : connectionStatus === 'connecting' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Reconnecting'}</span><div className="rounded-full bg-[#1f2d4d] px-4 py-2 text-sm font-semibold text-white shadow-sm">{conversations.reduce((total, item) => total + (item.unreadCount || 0), 0)} unread</div></div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="support-stat support-stat-open rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-sky-700">Open</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{summary.open}</div>
            </div>
            <div className="support-stat support-stat-pending rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-700">Pending</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{summary.pending}</div>
            </div>
            <div className="support-stat support-stat-resolved rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Resolved</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{summary.resolved}</div>
            </div>
          </div>
        </div>

        <div className={`support-grid grid min-h-[620px] gap-0 lg:min-h-0 lg:flex-1 ${selectedConversation ? 'lg:grid-cols-[300px_minmax(0,1fr)_260px]' : 'lg:grid-cols-[330px_minmax(0,1fr)]'}`}>
          <aside className={`support-queue ${selectedConversation ? 'hidden lg:block' : 'block'} border-r border-slate-200 bg-slate-50 p-4`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Queue</h2>
              <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700">{conversations.length}</span>
            </div>
            <input value={inboxSearch} onChange={(event) => setInboxSearch(event.target.value)} placeholder="Search seller, shop, subject, message" className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <div className="mb-4 flex flex-wrap gap-1.5">
              {['ALL', 'UNREAD', 'OPEN', 'PENDING', 'CLOSED', 'HIGH'].map((filter) => <button key={filter} type="button" onClick={() => setInboxFilter(filter)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${inboxFilter === filter ? 'bg-[#1f2d4d] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{filter}</button>)}
            </div>

            {loading ? (
              <div className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading support queue...</div>
            ) : visibleConversations.length === 0 ? (
              <div className="rounded-xl bg-white p-4 text-sm text-slate-500">No support conversations.</div>
            ) : (
              <div className="space-y-3">
                {visibleConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === conversation.id ? 'border-[#1f2d4d] bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-slate-900">{getConversationName(conversation)}</p>
                      {conversation.unreadCount ? (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{getConversationRole(conversation)} · {getConversationContact(conversation)}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{conversation.messages?.[0]?.content || 'No messages yet'}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{conversation.category || (conversation.seller ? 'SELLER' : 'OTHER')}</span>
                      <span className={conversation.online ? 'text-emerald-600' : 'text-slate-400'}>{conversation.online ? 'Online' : 'Offline'}</span>
                      <span>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : 'Just now'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className={`support-thread ${selectedConversation ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-8 text-slate-500">Select a conversation to review.</div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <button type="button" onClick={() => setSelectedId(null)} aria-label="Back to conversations" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><ArrowLeft size={18} /></button>
                      <div>
                      <h2 className="truncate text-xl font-bold text-slate-900">{getConversationName(selectedConversation)}</h2>
                      <p className="text-sm text-slate-500">{getConversationRole(selectedConversation)} · {getConversationContact(selectedConversation)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {selectedConversation.status || 'OPEN'}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {selectedConversation.priority || 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="support-messages min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] p-4 overscroll-contain">
                  {threadLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading conversation history...</div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">No messages in this case yet.</div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`support-message-row flex ${message.senderRole === 'SYSTEM' ? 'justify-center' : isAdminMessage(message) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`support-message max-w-[75%] rounded-2xl px-4 py-2 ${message.senderRole === 'SYSTEM' ? 'bg-slate-100 text-slate-500' : message.senderRole === 'ADMIN' ? 'bg-[#1f2d4d] text-white' : message.senderRole === 'SELLER' ? 'bg-[#2d80d8] text-white' : message.senderRole === 'SUPPORT_AGENT' ? 'bg-amber-50 text-slate-800 ring-1 ring-amber-200' : 'bg-white text-slate-800 ring-1 ring-slate-200'}`}>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{message.senderRole || 'SYSTEM'}</p><p className="text-sm">{message.content || '(attachment)'}</p>
                          {message.attachmentUrl && isImageAttachment(message) ? <AuthenticatedAdminChatImage message={message} /> : null}
                          {message.attachmentUrl && !isImageAttachment(message) ? <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-sky-600 underline">{message.attachmentName || 'Open attachment'}</a> : null}
                          <p className={`mt-1 text-[10px] ${message.senderId ? 'text-slate-500' : 'text-slate-200'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.senderId ? ' · Read' : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="support-composer border-t border-slate-200 p-4">
                  <div className="support-ticket-fields mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="support-field"><span>Find in conversation</span><input aria-label="Find in conversation" value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search messages" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="support-field"><span>Topic</span><select aria-label="Conversation topic" value={selectedConversation.category || 'OTHER'} onChange={(event) => void updateTicket({ category: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{ticketCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    <label className="support-field"><span>Priority</span><select aria-label="Conversation priority" value={selectedConversation.priority || 'NORMAL'} onChange={(event) => void updateTicket({ priority: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                    <label className="support-field"><span>Status</span><select aria-label="Conversation status" value={selectedConversation.status || 'OPEN'} onChange={(event) => void updateTicket({ status: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{ticketStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                  </div>
                  <label className="support-field mb-3"><span>Internal note <em>Only visible to admins</em></span><textarea aria-label="Internal admin note" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} onBlur={() => void updateTicket({ adminNotes })} rows={2} placeholder="Add context for the support team..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                  <div className="mb-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void toggleConversationState()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">{selectedConversation.status === 'CLOSED' ? 'Reopen' : 'Close conversation'}</button><span className="text-xs text-slate-500">{selectedConversation.typing ? 'Someone is typing...' : typing ? 'Typing...' : 'Live updates every 5 seconds'}</span></div>
                  {error ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
                  <div className="mb-3 flex items-center gap-2"><input ref={fileRef} type="file" className="hidden" onChange={readAttachment} /><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Paperclip size={16} /> Attach file</button>{attachmentName ? <span className="truncate text-xs text-slate-500">{attachmentName}</span> : <span className="text-xs text-slate-400">No attachment selected</span>}</div>
                  <div className="support-reply-row flex gap-3">
                    <textarea
                      value={draft}
                      onChange={(event) => { setDraft(event.target.value); const active = Boolean(event.target.value.trim()); setTyping(active); if (selectedId) { void setAdminConversationTyping(selectedId, active) } }}
                      rows={3}
                      placeholder="Write a reply to the customer or seller..."
                      className="min-h-[84px] min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1f2d4d] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || (!draft.trim() && !attachmentUrl)}
                      aria-label={sending ? 'Sending reply' : 'Send reply'}
                      title={sending ? 'Sending reply' : 'Send reply'}
                      className="support-send-button inline-flex h-[84px] w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f39a3d] text-white shadow-sm transition hover:bg-[#df8428] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Send size={19} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          {selectedConversation ? (
            <aside className="support-context hidden min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block">
              <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">{getConversationName(selectedConversation).slice(0, 1).toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900">{getConversationName(selectedConversation)}</h2><p className="text-xs text-slate-500">{getConversationRole(selectedConversation)}</p></div></div>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Contact</p><p className="mt-1 break-words font-medium text-slate-900">{getConversationContact(selectedConversation)}</p></div>
                {selectedConversation.shop ? <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Shop</p><p className="mt-1 font-medium text-slate-900">{selectedConversation.shop.name}</p></div> : null}
                {selectedConversation.order ? <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Order context</p><p className="mt-1 font-medium text-slate-900">#{selectedConversation.order.id}</p><p className="mt-1 text-xs text-slate-500">{selectedConversation.order.status} · ${Number(selectedConversation.order.total ?? 0).toFixed(2)}</p></div> : null}
                {selectedConversation.product ? <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Product context</p><p className="mt-1 font-medium text-slate-900">{selectedConversation.product.name}</p><p className="mt-1 text-xs text-slate-500">ID {selectedConversation.product.id}</p></div> : null}
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Assignment</p><p className="mt-1 font-medium text-slate-900">{selectedConversation.assignedAdminId === adminUser?.id ? `${adminUser?.name || 'Admin'} (you)` : selectedConversation.assignedAdminId || 'Unassigned'}</p><button type="button" disabled={!adminUser?.id} onClick={() => void updateTicket({ assignedAdminId: adminUser?.id })} className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Assign to me</button><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Priority</p><p className="mt-1 font-medium text-slate-900">{selectedConversation.priority || 'NORMAL'}</p></div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
    </AdminLayout>
  )
}
