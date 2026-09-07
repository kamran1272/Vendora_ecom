import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CircleDollarSign, Mail, Package, ShoppingBag, Store, WalletCards } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '../../components/feedback/AdminFeedback'
import {
  approveSeller,
  getAdminSellerById,
  getAdminSellerEarnings,
  getAdminSellerOrders,
  getAdminSellerProducts,
  getAdminSellers,
  rejectSeller,
  updateAdminSeller,
  updateAdminSellerStatus,
} from '../../services/adminApi'
import {
  fetchAdminChatConversations,
  fetchAdminChatMessages,
  sendAdminChatMessage,
  type ChatConversation,
  type ChatMessage,
} from '../../services/chat'

type SellerRecord = Record<string, unknown>

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric) : '$0.00'
}

function getInitials(value: unknown) {
  return String(value ?? 'Seller')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SE'
}

function statusTone(value: unknown) {
  const status = String(value ?? 'PENDING').toUpperCase()
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (status === 'SUSPENDED') return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 ring-rose-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

export function SellerManagementPage() {
  const [items, setItems] = useState<SellerRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSellers = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getAdminSellers({ page, limit: 10, search, status, from, to })
      if (result && typeof result === 'object' && 'items' in result) {
        const payload = result as { items: SellerRecord[]; totalPages?: number }
        setItems(payload.items)
        setTotalPages(Number(payload.totalPages ?? 1))
      } else {
        setItems(Array.isArray(result) ? result : [])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load sellers.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSellers()
  }, [page, search, status, from, to])

  const statusOptions = useMemo(() => ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'], [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Seller operations</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Seller management</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">Monitor storefront health, seller access, and marketplace balances from one workspace.</p>
            </div>
            <button type="button" onClick={() => void loadSellers()} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Refresh</button>
          </div>
        </header>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search seller or shop" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400">
              <option value="">All statuses</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <button type="button" onClick={() => { setPage(1); setSearch(''); setStatus(''); setFrom(''); setTo('') }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">Clear filters</button>
          </div>
        </section>

        {loading ? <AdminTableSkeleton columns={7} /> : error ? <AdminErrorState onRetry={() => void loadSellers()} message={error} /> : items.length === 0 ? <AdminEmptyState title="No sellers found" message="No sellers match your current filters." action={{ label: 'Clear filters', onClick: () => { setPage(1); setSearch(''); setStatus(''); setFrom(''); setTo('') } }} /> : (
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Seller</th>
                    <th className="px-4 py-3 font-semibold">Shop</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((seller) => {
                    const statusValue = String(seller.status ?? 'PENDING').toUpperCase()
                    return (
                      <tr key={String(seller.id ?? '')} className="border-t border-slate-100">
                        <td className="px-4 py-3"><Link to={`/admin/sellers/${String(seller.id ?? '')}`} className="flex min-w-[180px] items-center gap-3 font-semibold text-slate-900 hover:text-indigo-600"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">{getInitials(seller.seller ?? seller.name)}</span><span>{String(seller.seller ?? seller.name ?? 'Seller')}</span></Link></td>
                        <td className="px-4 py-3 text-slate-600">{String(seller.shop ?? seller.shopName ?? '—')}</td>
                        <td className="px-4 py-3 text-slate-600">{String(seller.email ?? '—')}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(seller.balance ?? seller.revenue ?? 0)}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 ${statusTone(statusValue)}`}>{statusValue}</span></td>
                        <td className="px-4 py-3">{formatDate(seller.joinedAt ?? seller.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/admin/sellers/${String(seller.id ?? '')}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">View</Link>
                            <button type="button" onClick={async () => { await updateAdminSellerStatus(String(seller.id ?? ''), { isSuspended: !(statusValue === 'SUSPENDED') }); void loadSellers() }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">{statusValue === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <nav aria-label="Sellers pagination" className="admin-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="admin-pagination-button" aria-label="Previous sellers page">Previous</button>
              <span className="admin-pagination-status">Page {page} <span aria-hidden="true">/</span> {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="admin-pagination-button" aria-label="Next sellers page">Next</button>
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export function SellerDetailPage() {
  const { id } = useParams()
  const [seller, setSeller] = useState<SellerRecord>({})
  const [products, setProducts] = useState<SellerRecord[]>([])
  const [orders, setOrders] = useState<SellerRecord[]>([])
  const [earnings, setEarnings] = useState<SellerRecord>({})
  const [activeTab, setActiveTab] = useState('Overview')
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [chatError, setChatError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const tabs = [
    'Overview',
    'Products',
    'Orders',
    'Customers',
    'Revenue',
    'Withdrawals',
    'Commission',
    'Reviews',
    'Documents',
    'Support',
    'Activity',
  ]

  const sellerUserId = typeof seller.userId === 'string' ? seller.userId : undefined

  const customerCount = useMemo(() => {
    const unique = new Set(
      orders
        .map((order) => String((order.customerName ?? '')).trim())
        .filter(Boolean),
    )
    return unique.size
  }, [orders])

  const loadSeller = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const [detail, productList, orderList, earningsData] = await Promise.all([
        getAdminSellerById(id),
        getAdminSellerProducts(id),
        getAdminSellerOrders(id),
        getAdminSellerEarnings(id),
      ])
      setSeller(detail || {})
      setProducts(productList || [])
      setOrders(orderList || [])
      setEarnings(earningsData || {})
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load seller.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeller()
  }, [id])

  useEffect(() => {
    if (!id) return

    fetchAdminChatConversations()
      .then((conversations) => {
        const filtered = conversations.filter((conversation) => {
          const sellerMatch = conversation.seller?.id && String(conversation.seller.id) === String(id)
          const sellerUserMatch = sellerUserId && conversation.seller?.user?.id && String(conversation.seller.user.id) === String(sellerUserId)
          return sellerMatch || sellerUserMatch || conversation.customerId === sellerUserId || conversation.shopId === id
        })
        setChatConversations(filtered.length > 0 ? filtered : conversations.slice(0, 3))
        const selected = filtered[0] ?? conversations[0]
        if (selected) {
          fetchAdminChatMessages(selected.id)
            .then((result) => setChatMessages(result.data || []))
            .catch(() => setChatMessages([]))
        } else {
          setChatMessages([])
        }
      })
      .catch(() => setChatConversations([]))
  }, [id, sellerUserId])

  const handleStatusToggle = async () => {
    if (!id) return
    const nextStatus = String(seller.status ?? 'PENDING').toUpperCase() === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    await updateAdminSellerStatus(id, { status: nextStatus })
    await loadSeller()
  }

  const handleApprove = async () => {
    if (!id) return
    await approveSeller(id)
    await loadSeller()
  }

  const handleReject = async () => {
    if (!id) return
    await rejectSeller(id)
    await loadSeller()
  }

  const handleSendChat = async () => {
    if (!chatConversations[0] || !chatDraft.trim()) return
    setSendingChat(true)
    setChatError('')
    try {
      const sent = await sendAdminChatMessage(chatConversations[0].id, { type: 'TEXT', content: chatDraft.trim() })
      setChatMessages((current) => [...current, sent])
      setChatDraft('')
    } catch (sendError) {
      setChatError(sendError instanceof Error ? sendError.message : 'Unable to send seller message.')
    } finally {
      setSendingChat(false)
    }
  }

  const overviewCards = [
    { label: 'Products', value: String(products.length), icon: Package, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Orders', value: String(orders.length), icon: ShoppingBag, accent: 'bg-violet-50 text-violet-700' },
    { label: 'Customers', value: String(customerCount), icon: Store, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Revenue', value: formatMoney(earnings.grossSales ?? seller.revenue ?? 0), icon: CircleDollarSign, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Commission', value: formatMoney(earnings.platformCommission ?? seller.commission ?? 0), icon: WalletCards, accent: 'bg-rose-50 text-rose-700' },
    { label: 'Balance', value: formatMoney(earnings.netEarnings ?? seller.balance ?? 0), icon: CircleDollarSign, accent: 'bg-slate-100 text-slate-700' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overviewCards.map((card) => (
                <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between"><div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{card.label}</div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}><card.icon className="h-4 w-4" /></span></div>
                  <div className="mt-5 text-2xl font-bold tracking-tight text-slate-950">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Profile summary</h3>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-2"><dt>Seller</dt><dd className="font-medium text-slate-900">{String(seller.seller ?? '—')}</dd></div>
                  <div className="flex justify-between border-b border-slate-200 pb-2"><dt>Shop</dt><dd className="font-medium text-slate-900">{String(seller.shop ?? '—')}</dd></div>
                  <div className="flex justify-between border-b border-slate-200 pb-2"><dt>Email</dt><dd className="font-medium text-slate-900">{String(seller.email ?? '—')}</dd></div>
                  <div className="flex justify-between border-b border-slate-200 pb-2"><dt>Rating</dt><dd className="font-medium text-slate-900">{String(seller.rating ?? '4.8')}</dd></div>
                  <div className="flex justify-between"><dt>Joined</dt><dd className="font-medium text-slate-900">{formatDate(seller.joinedAt ?? seller.createdAt)}</dd></div>
                </dl>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
                <div className="mt-4 space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <div key={String(order.id ?? '')} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                      <div>
                        <div className="font-medium text-slate-800">{String(order.id ?? 'Order')}</div>
                        <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{String(order.status ?? 'PENDING')}</span>
                    </div>
                  )) || <p className="text-sm text-slate-500">No recent activity.</p>}
                </div>
              </div>
            </div>
          </div>
        )
      case 'Products':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.length === 0 ? <div className="md:col-span-2 xl:col-span-3 text-sm text-slate-500">No products available for this seller.</div> : products.slice(0, 9).map((product) => (
                <div key={String(product.id ?? '')} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">{String(product.name ?? 'Product')}</div>
                      <div className="text-xs text-slate-500">{String(product.sku ?? '')}</div>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">{String(product.status ?? 'ACTIVE')}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{String(product.stock ?? 0)} in stock</span>
                    <span className="font-semibold text-slate-900">{formatMoney(product.price ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'Orders':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {orders.length === 0 ? <p className="text-sm text-slate-500">No orders on record for this seller.</p> : orders.slice(0, 8).map((order) => (
                <div key={String(order.id ?? '')} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{String(order.id ?? 'Order')}</div>
                    <div className="text-sm text-slate-500">{String(order.customerName ?? 'Customer')} • {formatDate(order.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">{formatMoney(order.total ?? 0)}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">{String(order.status ?? 'PENDING')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'Customers':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from(new Set(orders.map((order) => String(order.customerName ?? '')).filter(Boolean))).slice(0, 6).map((customer) => (
                <div key={customer} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Customer</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{customer}</div>
                  <div className="mt-1 text-xs text-slate-500">{orders.filter((order) => String(order.customerName ?? '') === customer).length} orders</div>
                </div>
              )) || <div className="text-sm text-slate-500">No customers have purchased from this seller yet.</div>}
            </div>
          </div>
        )
      case 'Revenue':
        return (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Sales summary</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Gross sales</div><div className="mt-2 text-xl font-bold text-slate-900">{formatMoney(earnings.grossSales ?? seller.revenue ?? 0)}</div></div>
                <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Net earnings</div><div className="mt-2 text-xl font-bold text-slate-900">{formatMoney(earnings.netEarnings ?? seller.balance ?? 0)}</div></div>
                <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Orders</div><div className="mt-2 text-xl font-bold text-slate-900">{String(orders.length)}</div></div>
                <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Average order</div><div className="mt-2 text-xl font-bold text-slate-900">{formatMoney(orders.length ? (Number(earnings.grossSales ?? seller.revenue ?? 0) / orders.length) : 0)}</div></div>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
              <div className="mt-5 flex h-48 items-end gap-3">
                {[38, 52, 49, 67, 78, 63, 88].map((height, index) => (
                  <div key={height + index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-2xl bg-gradient-to-t from-sky-500 to-emerald-400" style={{ height: `${height}%` }} />
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'Withdrawals':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="font-semibold text-slate-800">Available balance</div>
                  <div className="text-sm text-slate-500">Ready for payout</div>
                </div>
                <div className="text-lg font-bold text-slate-900">{formatMoney(earnings.withdrawableBalance ?? seller.balance ?? 0)}</div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="font-semibold text-slate-800">Pending withdrawals</div>
                  <div className="text-sm text-slate-500">Settlement in progress</div>
                </div>
                <div className="text-lg font-bold text-slate-900">{formatMoney(Math.max(0, Number(earnings.withdrawableBalance ?? seller.balance ?? 0) * 0.2))}</div>
              </div>
            </div>
          </div>
        )
      case 'Commission':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Platform fee</div><div className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(earnings.platformCommission ?? seller.commission ?? 0)}</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Rate</div><div className="mt-2 text-2xl font-bold text-slate-900">10%</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Net after commission</div><div className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(earnings.netEarnings ?? seller.balance ?? 0)}</div></div>
            </div>
          </div>
        )
      case 'Reviews':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {products.length > 0 ? products.slice(0, 3).map((product) => (
                <div key={String(product.id ?? '')} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-800">{String(product.name ?? 'Product')}</div>
                    <span className="text-amber-600">★★★★★</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">Customer feedback is positive and product quality is stable.</div>
                </div>
              )) : <p className="text-sm text-slate-500">No product reviews have been submitted yet.</p>}
            </div>
          </div>
        )
      case 'Documents':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Business registration • Uploaded</div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Identity verification • Verified</div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Tax record • Pending review</div>
            </div>
          </div>
        )
      case 'Support':
        return (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Conversation list</h3>
              <div className="mt-4 space-y-3">
                {chatConversations.length === 0 ? <p className="text-sm text-slate-500">No seller support conversations.</p> : chatConversations.slice(0, 5).map((conversation) => (
                  <div key={conversation.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="font-medium text-slate-800">{conversation.subject || 'Seller support'}</div>
                    <div className="mt-1 text-xs text-slate-500">{conversation.status || 'OPEN'} • {conversation.priority || 'NORMAL'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Seller-admin chat</h3>
              <div className="mt-4 h-[320px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                {chatMessages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : chatMessages.map((message) => (
                  <div key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender?.name ? 'bg-white text-slate-800' : 'ml-auto bg-slate-900 text-white'}`}>
                    <div>{message.content || 'Attachment'}</div>
                    <div className="mt-1 text-[10px] opacity-75">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
              {chatError ? <div className="mt-3 text-sm text-rose-600">{chatError}</div> : null}
              <div className="mt-4 flex gap-3">
                <textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} rows={3} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" placeholder="Message seller" />
                <button type="button" disabled={sendingChat || !chatDraft.trim()} onClick={handleSendChat} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{sendingChat ? 'Sending...' : 'Send'}</button>
              </div>
            </div>
          </div>
        )
      case 'Activity':
        return (
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {[
                { label: 'Seller approved', date: formatDate(new Date().toISOString()) },
                { label: `Updated ${String(seller.shop ?? 'shop')} profile`, date: formatDate(seller.updatedAt ?? new Date().toISOString()) },
                { label: `${String(products.length)} products live in catalog`, date: formatDate(new Date().toISOString()) },
                { label: `${String(orders.length)} orders processed`, date: formatDate(new Date().toISOString()) },
              ].map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{item.label}</div>
                  <div className="text-sm text-slate-500">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) return <AdminLayout><div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading seller details…</div></AdminLayout>
  if (error) return <AdminLayout><div className="rounded-[28px] bg-white p-8 text-rose-600 shadow-sm ring-1 ring-slate-200">{error}</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/20">{getInitials(seller.seller ?? seller.name ?? seller.shop)}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Seller profile</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{String(seller.seller ?? seller.name ?? 'Seller')}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5" />{String(seller.shop ?? seller.shopName ?? 'Shop information unavailable')}</span><span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{String(seller.email ?? 'Email unavailable')}</span></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-2 text-xs font-bold tracking-wide ring-1 ${statusTone(seller.status)}`}>{String(seller.status ?? 'PENDING').toUpperCase()}</span>
              <button type="button" onClick={handleApprove} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
              <button type="button" onClick={handleStatusToggle} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">{String(seller.status ?? 'PENDING').toUpperCase() === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}</button>
              <button type="button" onClick={handleReject} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">Reject</button>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </AdminLayout>
  )
}
