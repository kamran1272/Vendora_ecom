import { ChangeEvent, FormEvent, RefObject, useEffect, useState } from 'react'
import { Check, CheckCheck, Download, FileText, Image as ImageIcon, Loader2, Maximize2, MessageCircle, Minimize2, Paperclip, Send, Smile, X } from 'lucide-react'
import { fetchSellerAttachment, type ChatMessage } from '../../services/seller-chat.service'

export type SellerAttachment = { name: string; url: string; type: 'IMAGE' | 'FILE' }
export type SellerAttachmentState = 'idle' | 'reading' | 'ready' | 'failed'
export type SellerFailedMessage = { content: string; attachment: SellerAttachment | null }

const emojis = ['😀', '👍', '❤️', '🎉', '🙏', '😊', '🔥', '✅']

function isImage(message: ChatMessage) {
  return message.type === 'IMAGE' || Boolean(message.attachmentUrl?.startsWith('data:image') || message.attachmentUrl?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i))
}

function timeOf(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function AuthenticatedChatImage({ message }: { message: ChatMessage }) {
  const [source, setSource] = useState<string | null>(message.attachmentUrl?.startsWith('data:') ? message.attachmentUrl : null)

  useEffect(() => {
    if (!message.attachmentUrl || message.attachmentUrl.startsWith('data:')) return
    let objectUrl = ''
    let active = true
    void fetchSellerAttachment(message.id).then((blob) => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setSource(objectUrl)
    }).catch(() => undefined)
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [message.id, message.attachmentUrl])

  if (!source) return <div className="mb-2 flex h-24 w-40 items-center justify-center rounded-lg bg-white/10 text-xs opacity-70">Loading image...</div>
  return <a href={source} target="_blank" rel="noreferrer"><img src={source} alt={message.attachmentName || 'Support attachment'} className="mb-2 max-h-48 max-w-full rounded-lg object-contain" /></a>
}

export function SellerSupportChatButton({ unreadCount, onOpen }: { unreadCount: number; onOpen: () => void }) {
  return <button type="button" aria-label="Open Vendora Support" onClick={onOpen} className="fixed bottom-5 right-3 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2d80d8] text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)] transition duration-200 hover:scale-105 hover:bg-[#2563eb] focus:outline-none focus:ring-4 focus:ring-blue-200 sm:bottom-6 sm:right-6"><MessageCircle size={23} strokeWidth={2.2} />{unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}</button>
}

export function SellerChatHeader({ online, unreadCount, onMinimize, onClose }: { online?: boolean; unreadCount: number; onMinimize: () => void; onClose: () => void }) {
  return <header className="flex items-center justify-between bg-[#2d80d8] px-4 py-3 text-white"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold">V</div><div className="min-w-0"><h2 className="truncate text-sm font-bold">Vendora Support</h2><p className="flex items-center gap-1 text-xs text-blue-100"><span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-300' : 'bg-slate-300'}`} />Customer Support · {online ? 'Online' : 'Offline'}</p></div></div><div className="flex items-center gap-1"><span className="sr-only">{unreadCount ? `${unreadCount} unread messages` : 'No unread messages'}</span><button type="button" aria-label="Minimize Vendora Support" onClick={onMinimize} className="rounded-lg p-2 text-blue-100 transition hover:bg-white/15 hover:text-white"><Minimize2 size={17} /></button><button type="button" aria-label="Close Vendora Support" onClick={onClose} className="rounded-lg p-2 text-blue-100 transition hover:bg-white/15 hover:text-white"><X size={18} /></button></div></header>
}

export function SellerMessageBubble({ message, userId, failure, onRetry }: { message: ChatMessage; userId: string; failure?: SellerFailedMessage; onRetry: (event: React.MouseEvent<HTMLButtonElement>, messageId: string) => void }) {
  const mine = message.senderId === userId
  return <div className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[84%] rounded-2xl px-3 py-2 ${mine ? 'rounded-br-md bg-[#2d80d8] text-white' : 'rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'}`}><p className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{mine ? 'Seller' : 'Vendora Support'}</p>{message.deletedAt ? <p className="text-sm italic opacity-60">Message deleted</p> : <>{message.attachmentUrl && isImage(message) ? <AuthenticatedChatImage message={message} /> : null}{message.attachmentUrl && !isImage(message) ? <a href={message.attachmentUrl} download={message.attachmentName || 'support-attachment'} target="_blank" rel="noreferrer" className={`mb-2 flex items-center gap-2 rounded-lg p-2 text-xs ${mine ? 'bg-white/10' : 'bg-slate-50'}`}><FileText size={16} /><span className="min-w-0 flex-1 truncate">{message.attachmentName || 'Download attachment'}</span><Download size={14} /></a> : null}{message.content ? <p className="whitespace-pre-wrap text-sm leading-5">{message.content}</p> : null}</>}<div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}><span>{timeOf(message.createdAt)}</span>{mine ? failure ? <><span className="text-red-200">Failed</span><button type="button" onClick={(event) => onRetry(event, message.id)} className="font-semibold underline">Retry</button></> : message.id.startsWith('pending-') ? <><Loader2 size={11} className="animate-spin" />Sending</> : message.read ? <CheckCheck size={12} /> : <Check size={12} /> : null}</div></div></div>
}

export function SellerMessageList({ messages, userId, failed, loading, loadingMessages, endRef, onRetry }: { messages: ChatMessage[]; userId: string; failed: Record<string, SellerFailedMessage>; loading: boolean; loadingMessages: boolean; endRef: RefObject<HTMLDivElement | null>; onRetry: (event: React.MouseEvent<HTMLButtonElement>, messageId: string) => void }) {
  if (loading) return <div className="flex-1 space-y-4 p-4" aria-label="Loading support chat"><div className="flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" /><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></div><div className="mt-8 flex justify-start"><div className="h-16 w-48 animate-pulse rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-slate-200" /></div><div className="flex justify-end"><div className="h-12 w-40 animate-pulse rounded-2xl rounded-br-md bg-blue-200" /></div></div>
  return <div className="flex-1 space-y-3 overflow-y-auto p-4">{!messages.length && !loadingMessages ? <div className="flex h-full min-h-48 flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-[#2d80d8]"><MessageCircle size={22} /></div><p className="mt-3 text-sm font-semibold text-slate-700">How can we help?</p><p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-500">Send a message and the Vendora support team will get back to you.</p></div> : null}{loadingMessages ? <div className="space-y-2" aria-label="Loading messages"><div className="h-10 w-40 animate-pulse rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-slate-200" /><div className="ml-auto h-8 w-28 animate-pulse rounded-2xl rounded-br-md bg-blue-200" /></div> : null}{messages.map((message, index) => <div key={message.id}>{!index || dateLabel(messages[index - 1].createdAt) !== dateLabel(message.createdAt) ? <div className="my-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>{dateLabel(message.createdAt)}</span><span className="h-px flex-1 bg-slate-200" /></div> : null}<SellerMessageBubble message={message} userId={userId} failure={failed[message.id]} onRetry={onRetry} /></div>)}<div ref={endRef} /></div>
}

export function SellerAttachmentPreview({ attachment, state, onRemove }: { attachment: SellerAttachment | null; state: SellerAttachmentState; onRemove: () => void }) {
  if (state === 'reading') return <div className="flex items-center gap-2 border-t border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800"><Loader2 size={14} className="animate-spin" />Preparing attachment...</div>
  if (!attachment) return null
  return <div className="flex items-center gap-2 border-t border-slate-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">{attachment.type === 'IMAGE' ? <ImageIcon size={14} /> : <Paperclip size={14} />}<span className="min-w-0 flex-1 truncate">{attachment.name}</span><span className="text-[10px] text-blue-600">Ready</span><button type="button" aria-label="Remove attachment" onClick={onRemove}><X size={14} /></button></div>
}

export function SellerChatComposer({ draft, attachment, attachmentState, emojiOpen, sending, sendingAttachment, fileRef, onSubmit, onAttach, onDraftChange, onEmojiToggle, onEmojiSelect, onRemoveAttachment }: { draft: string; attachment: SellerAttachment | null; attachmentState: SellerAttachmentState; emojiOpen: boolean; sending: boolean; sendingAttachment: boolean; fileRef: RefObject<HTMLInputElement | null>; onSubmit: (event: FormEvent) => void; onAttach: (event: ChangeEvent<HTMLInputElement>) => void; onDraftChange: (value: string) => void; onEmojiToggle: () => void; onEmojiSelect: (emoji: string) => void; onRemoveAttachment: () => void }) {
  return <><SellerAttachmentPreview attachment={attachment} state={attachmentState} onRemove={onRemoveAttachment} /><form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-3"><div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:bg-white"><input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip" onChange={onAttach} className="hidden" /><button type="button" aria-label="Attach image or file" disabled={attachmentState === 'reading' || sending} onClick={() => fileRef.current?.click()} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:opacity-40"><Paperclip size={17} /></button><div className="relative"><button type="button" aria-label="Add emoji" aria-expanded={emojiOpen} onClick={onEmojiToggle} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"><Smile size={17} /></button>{emojiOpen ? <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.16)]"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-600">Quick reactions</span><button type="button" aria-label="Close emoji picker" onClick={onEmojiToggle} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={13} /></button></div><div className="grid grid-cols-4 gap-1">{emojis.map((emoji) => <button key={emoji} type="button" aria-label={`Add ${emoji}`} onClick={() => onEmojiSelect(emoji)} className="flex h-9 w-9 items-center justify-center rounded-lg text-base leading-none transition hover:bg-blue-50">{emoji}</button>)}</div></div> : null}</div><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} rows={1} placeholder="Write a message..." aria-label="Message Vendora Support" className="min-h-9 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none" /><button type="submit" aria-label="Send support message" disabled={(!draft.trim() && !attachment) || sending || attachmentState === 'reading'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2d80d8] text-white transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button></div><p className="mt-2 px-1 text-[10px] text-slate-400">{sendingAttachment ? 'Uploading attachment...' : 'Enter to send · Shift+Enter for a new line · 5 MB max'}</p></form></>
}

export function SellerSupportChatWindow({ conversation, unreadCount, loading, error, messages, userId, failed, loadingMessages, minimized, endRef, draft, attachment, attachmentState, emojiOpen, sending, sendingAttachment, fileRef, onMinimize, onClose, onSubmit, onAttach, onDraftChange, onEmojiToggle, onEmojiSelect, onRemoveAttachment, onRetry }: any) {
  return <section className="fixed bottom-20 right-3 z-40 flex h-[calc(100vh-6rem)] max-h-[680px] w-[calc(100vw-1.5rem)] max-w-[410px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:bottom-24 sm:right-6" aria-label="Vendora Support chat"><SellerChatHeader online={conversation?.online} unreadCount={unreadCount} onMinimize={onMinimize} onClose={onClose} /><div className="flex min-h-0 flex-1 flex-col bg-slate-50" aria-busy={loading || loadingMessages}><SellerMessageList messages={messages} userId={userId} failed={failed} loading={loading} loadingMessages={loadingMessages} endRef={endRef} onRetry={onRetry} />{error ? <p role="alert" className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}{!loading ? <SellerChatComposer draft={draft} attachment={attachment} attachmentState={attachmentState} emojiOpen={emojiOpen} sending={sending} sendingAttachment={sendingAttachment} fileRef={fileRef} onSubmit={onSubmit} onAttach={onAttach} onDraftChange={onDraftChange} onEmojiToggle={onEmojiToggle} onEmojiSelect={onEmojiSelect} onRemoveAttachment={onRemoveAttachment} /> : null}</div></section>
}

export function SellerSupportMinimizedButton({ unreadCount, onRestore }: { unreadCount: number; onRestore: () => void }) {
  return <button type="button" onClick={onRestore} className="fixed bottom-5 right-3 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 transition hover:ring-blue-300 sm:bottom-6 sm:right-6"><MessageCircle size={17} className="text-[#2d80d8]" />Vendora Support<Maximize2 size={15} className="text-slate-400" />{unreadCount > 0 ? <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}</button>
}