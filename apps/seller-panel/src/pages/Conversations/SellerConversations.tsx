import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  Circle,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  Smile,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { SellerLayout } from "../../components/layout/SellerLayout";
import {
  deleteSellerChatMessage,
  fetchSellerChatConversations,
  fetchSellerChatMessages,
  markSellerConversationRead,
  sendSellerChatMessage,
  type ChatConversation,
  type ChatMessage,
} from "../../services/chat";

type Failed = { content: string; payload: Record<string, unknown> };
const emojis = ["😀", "👍", "❤️", "🎉", "🙏", "😊", "🔥", "✅"];
const userId = () => {
  try {
    return String(
      JSON.parse(localStorage.getItem("vendora_user") || "{}").id || "",
    );
  } catch {
    return "";
  }
};
const nameOf = (item: ChatConversation) => {
  const participant = item.participants?.find(
    (entry) => entry.userId !== userId(),
  )?.user;
  if (participant?.name) return participant.name;
  if (item.type.includes("SUPPORT") || item.type.includes("ADMIN"))
    return "Vendora Support";
  return (
    item.customer?.name || item.seller?.user?.name || "Conversation participant"
  );
};
const typeOf = (item: ChatConversation) =>
  item.type.includes("ADMIN")
    ? "Admin"
    : item.type.includes("SUPPORT")
      ? "Support"
      : "Customer";
const timeOf = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";
const imageMessage = (message: ChatMessage) =>
  message.type === "IMAGE" ||
  Boolean(
    message.attachmentUrl?.startsWith("data:image") ||
    message.attachmentUrl?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i),
  );

export function SellerConversationsPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    url: string;
    type: "IMAGE" | "FILE";
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [failed, setFailed] = useState<Record<string, Failed>>({});
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mobileInfo, setMobileInfo] = useState(false);
  const [error, setError] = useState("");
  const [inboxSearch, setInboxSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const currentUser = userId();
  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId],
  );
  const visibleConversations = useMemo(() => {
    const query = inboxSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [
        nameOf(conversation),
        conversation.subject,
        conversation.messages?.[0]?.content,
        conversation.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, inboxSearch]);

  const loadConversations = async (withLoading = false) => {
    if (withLoading) setLoading(true);
    try {
      const result = await fetchSellerChatConversations();
      setConversations(result);
      setSelectedId((current) =>
        current && result.some((item) => item.id === current)
          ? current
          : null,
      );
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load conversations.",
      );
    } finally {
      if (withLoading) setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, withLoading = true) => {
    if (withLoading) setThreadLoading(true);
    try {
      const result = await fetchSellerChatMessages(conversationId);
      setMessages(result.data);
      await markSellerConversationRead(conversationId);
      setConversations((items) =>
        items.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load messages.",
      );
    } finally {
      if (withLoading) setThreadLoading(false);
    }
  };

  useEffect(() => {
    void loadConversations(true);
    const timer = window.setInterval(() => void loadConversations(), 8000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
    const timer = window.setInterval(
      () => void loadMessages(selectedId, false),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [selectedId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Attachments must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({
        name: file.name,
        url: String(reader.result),
        type: file.type.startsWith("image/") ? "IMAGE" : "FILE",
      });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const send = async (retryId?: string) => {
    if (!selectedId || sending) return;
    const retry = retryId ? failed[retryId] : undefined;
    const content = retry?.content || draft.trim();
    if (!content && !attachment && !retry) return;
    const payload = retry?.payload || {
      type: attachment?.type || "TEXT",
      content: content || null,
      attachmentUrl: attachment?.url || null,
      attachmentName: attachment?.name || null,
      replyToId: replyingTo?.id || null,
    };
    const optimisticId = retryId || `pending-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      conversationId: selectedId,
      senderId: currentUser,
      content: content || null,
      type: String(payload.type),
      attachmentUrl: String(payload.attachmentUrl || "") || null,
      attachmentName: String(payload.attachmentName || "") || null,
      replyToId: String(payload.replyToId || "") || null,
      createdAt: new Date().toISOString(),
    };
    setMessages((items) =>
      retryId
        ? items.map((item) => (item.id === retryId ? optimistic : item))
        : [...items, optimistic],
    );
    setFailed((items) => {
      const next = { ...items };
      delete next[optimisticId];
      return next;
    });
    setDraft("");
    setAttachment(null);
    setReplyingTo(null);
    setSending(true);
    setError("");
    try {
      const sent = await sendSellerChatMessage(selectedId, payload);
      setMessages((items) =>
        items.map((item) => (item.id === optimisticId ? sent : item)),
      );
      void loadConversations();
    } catch (sendError) {
      setFailed((items) => ({
        ...items,
        [optimisticId]: { content, payload },
      }));
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Message failed. Retry when connected.",
      );
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (message: ChatMessage) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteSellerChatMessage(message.id);
      setMessages((items) =>
        items.map((item) =>
          item.id === message.id
            ? {
                ...item,
                deletedAt: new Date().toISOString(),
                content: null,
                attachmentUrl: null,
              }
            : item,
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message.",
      );
    }
  };

  return (
    <SellerLayout
      title="Conversations"
      subtitle="Customer, admin, and support communication in one workspace."
    >
      <div className="flex min-h-[calc(100vh-170px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <aside
          className={`${selected ? "hidden lg:block" : "block"} w-full shrink-0 border-r border-slate-200 bg-slate-50 lg:w-[320px]`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inbox</h2>
              <p className="mt-1 text-xs text-slate-500">
                {conversations.length} conversations
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadConversations(true)}
              aria-label="Refresh conversations"
              className="rounded-lg p-2 text-slate-500 hover:bg-white"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="border-b border-slate-200 p-3">
            <label className="sr-only" htmlFor="seller-conversation-search">Search conversations</label>
            <input id="seller-conversation-search" value={inboxSearch} onChange={(event) => setInboxSearch(event.target.value)} placeholder="Search conversations" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-white"
                />
              ))}
            </div>
          ) : !visibleConversations.length ? (
            <div className="p-5 text-sm text-slate-500">
              {conversations.length ? "No conversations match your search." : "No conversations yet."}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {visibleConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full rounded-xl p-3 text-left ${selectedId === conversation.id ? "bg-white shadow-sm ring-1 ring-sky-200" : "hover:bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                      {nameOf(conversation).charAt(0).toUpperCase()}
                      {conversation.online ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {nameOf(conversation)}
                        </span>
                        {conversation.unreadCount ? (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">
                          {conversation.messages?.[0]?.content ||
                            conversation.subject ||
                            "No messages yet"}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {timeOf(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {typeOf(conversation)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
        <section
          className={`${selected ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-slate-500">
              Select a conversation to start chatting.
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                  >
                    ←
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                    {nameOf(selected).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">
                      {nameOf(selected)}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selected.online ? "Online" : "Offline"} ·{" "}
                      {typeOf(selected)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileInfo((value) => !value)}
                  className="rounded-lg p-2 text-slate-500 lg:hidden"
                >
                  <UserRound size={18} />
                </button>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 md:p-6">
                {threadLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Loading messages...
                  </div>
                ) : !messages.length ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === currentUser;
                    const failure = failed[message.id];
                    return (
                      <div
                        key={message.id}
                        className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div className="relative max-w-[85%] md:max-w-[70%]">
                          <div
                            className={`rounded-2xl px-4 py-3 ${mine ? "rounded-br-md bg-[#2d80d8] text-white" : "rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"}`}
                          >
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">
                              {mine ? "Seller" : message.senderRole === "SUPPORT_AGENT" ? "Customer service" : message.senderRole === "ADMIN" ? "Admin" : "Customer"}
                            </p>
                            {message.deletedAt ? (
                              <p className="text-sm italic opacity-60">
                                Message deleted
                              </p>
                            ) : (
                              <>
                                {message.attachmentUrl &&
                                imageMessage(message) ? (
                                  <img
                                    src={message.attachmentUrl}
                                    alt={message.attachmentName || "Attachment"}
                                    className="mb-2 max-h-64 rounded-lg"
                                  />
                                ) : null}
                                {message.attachmentUrl &&
                                !imageMessage(message) ? (
                                  <a
                                    href={message.attachmentUrl}
                                    download={
                                      message.attachmentName || "attachment"
                                    }
                                    className="mb-2 flex items-center gap-2 underline"
                                  >
                                    <FileText size={16} />
                                    {message.attachmentName ||
                                      "Download attachment"}
                                  </a>
                                ) : null}
                                {message.content ? (
                                  <p className="whitespace-pre-wrap text-sm leading-6">
                                    {message.content}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </div>
                          <div
                            className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${mine ? "justify-end" : ""}`}
                          >
                            {timeOf(message.createdAt)}
                            {mine ? (
                              <CheckCheck
                                size={13}
                                className={
                                  message.read
                                    ? "text-sky-500"
                                    : "text-slate-300"
                                }
                              />
                            ) : null}
                            {failure ? (
                              <>
                                <span className="text-red-500">Failed</span>
                                <button
                                  type="button"
                                  onClick={() => void send(message.id)}
                                  className="font-semibold text-sky-600 underline"
                                >
                                  Retry
                                </button>
                              </>
                            ) : null}
                          </div>
                          {mine &&
                          !message.id.startsWith("pending-") &&
                          !message.deletedAt ? (
                            <>
                              <button
                                type="button"
                                title="Reply to message"
                                onClick={() => setReplyingTo(message)}
                                className="absolute -left-8 top-9 hidden rounded p-1 text-slate-400 hover:text-sky-500 group-hover:block"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button
                                type="button"
                                title="Delete message"
                                onClick={() => void deleteMessage(message)}
                                className="absolute -left-8 top-2 hidden rounded p-1 text-slate-400 hover:text-red-500 group-hover:block"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              {error ? (
                <div
                  role="alert"
                  className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
                >
                  {error}
                </div>
              ) : null}
              <footer className="border-t border-slate-200 bg-white p-3 md:p-4">
                {replyingTo ? (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    Replying to:{" "}
                    {replyingTo.content ||
                      replyingTo.attachmentName ||
                      "message"}
                    <button type="button" onClick={() => setReplyingTo(null)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
                <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:bg-white">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={readFile}
                    className="hidden"
                  />
                  {attachment ? (
                    <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-xs shadow">
                      <Paperclip size={14} />
                      {attachment.name}
                      <button type="button" onClick={() => setAttachment(null)}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    title="Attach file"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 text-slate-500"
                  >
                    <Paperclip size={18} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      title="Emoji"
                      onClick={() => setEmojiOpen((value) => !value)}
                      className="p-2 text-slate-500"
                    >
                      <Smile size={18} />
                    </button>
                    {emojiOpen ? (
                      <div className="absolute bottom-11 left-0 grid grid-cols-4 gap-1 rounded-xl border bg-white p-2 shadow">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setDraft((value) => value + emoji);
                              setEmojiOpen(false);
                            }}
                            className="p-1 text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message..."
                    className="min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    onClick={() => void send()}
                    disabled={sending || (!draft.trim() && !attachment)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d80d8] text-white disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>
                <div className="mt-2 px-2 text-[10px] text-slate-400">
                  Enter to send · Shift+Enter for a new line
                </div>
              </footer>
            </>
          )}
        </section>
        <aside
          className={`${mobileInfo ? "block" : "hidden"} w-full shrink-0 border-l border-slate-200 bg-white p-5 lg:block lg:w-[270px]`}
        >
          {selected ? (
            <>
              <h3 className="font-bold text-slate-900">Conversation info</h3>
              <div className="mt-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
                  {nameOf(selected).charAt(0).toUpperCase()}
                </div>
                <h4 className="mt-3 font-semibold text-slate-900">
                  {nameOf(selected)}
                </h4>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {selected.customer?.email ||
                    selected.seller?.user?.email ||
                    "Support channel"}
                </p>
              </div>
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Type</dt>
                  <dd className="mt-1">{typeOf(selected)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Subject</dt>
                  <dd className="mt-1">
                    {selected.subject || "General conversation"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Status</dt>
                  <dd className="mt-1">{selected.status || "OPEN"}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Select a conversation to view details.
            </p>
          )}
        </aside>
      </div>
    </SellerLayout>
  );
}
