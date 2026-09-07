import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { OrderStatusBadge } from '@/components/ui/DesignSystem'
import { fetchCustomerOrders, type CustomerOrder } from '@/services/orders'
import { formatCurrency } from '@/utils/format'

export function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = () => {
    setLoading(true)
    setError(null)
    fetchCustomerOrders()
      .then((items) => setOrders([...new Map(items.map((item) => [item.id, item])).values()]))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load your orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <div className="space-y-6">
      <PageShell title="Orders" description="Track order status, payments, delivery, and purchased products from your account." />
      {loading && <LoadingState variant="list" />}
      {!loading && error && <ErrorState title="Orders unavailable" message="We could not load your orders right now. Please try again." action={<button type="button" onClick={loadOrders} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
      {!loading && !error && orders.length === 0 && <EmptyState title="You haven't placed any orders yet" message="Your purchases and delivery updates will appear here." action={<Link to="/shop" className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Start shopping</Link>} />}
      {!loading && !error && orders.length > 0 && <div className="space-y-4">{orders.map((order) => {
        const sellers = [...new Set((order.items || []).map((item) => item.sellerId).filter(Boolean))]
        return <Link key={order.id} to={`/account/orders/${order.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Order #{order.id}</p><p className="mt-2 text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</p><p className="mt-2 text-sm text-slate-600">{order.items?.length || 0} item(s) · {sellers.length || 'Seller'} seller record(s)</p></div><div className="flex flex-wrap items-center gap-3 md:justify-end"><OrderStatusBadge status={order.status} /><OrderStatusBadge status={order.payment?.status ? `Payment: ${order.payment.status}` : 'Payment pending'} /><OrderStatusBadge status={order.shipment?.status ? `Delivery: ${order.shipment.status}` : 'Delivery pending'} /><span className="text-xl font-black text-slate-900">{formatCurrency(order.total)}</span></div></div><div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">{order.items?.slice(0, 3).map((item) => <span key={item.id} className="mr-4">{item.name} x{item.quantity}</span>)}</div></Link>
      })}</div>}
    </div>
  )
}
