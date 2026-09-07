import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { OrderStatusBadge, Card } from '@/components/ui/DesignSystem'
import { fetchCustomerOrder, type CustomerOrder } from '@/services/orders'
import { formatCurrency } from '@/utils/format'

function parseAddress(value?: string | null) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' ? parsed as Record<string, string> : { address: value }
  } catch {
    return { address: value }
  }
}

export function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrder = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchCustomerOrder(id)
      .then(setOrder)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load order details.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const address = parseAddress(order?.shippingAddress)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><PageShell title="Order details" description="Review products, payment, shipping, and the complete order timeline." /><Link to="/account/orders" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Back to orders</Link></div>
      {loading && <LoadingState variant="detail" />}
      {!loading && error && <ErrorState title="Order unavailable" message="We could not load this order right now. Please try again." action={<button type="button" onClick={loadOrder} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
      {!loading && !error && order && <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div className="space-y-6"><Card className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Order #{order.id}</p><p className="mt-2 text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</p></div><OrderStatusBadge status={order.status} /></div><div className="mt-6 space-y-3">{(order.items || []).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-sm text-slate-500">Quantity {item.quantity} · Seller {item.sellerId || 'Unavailable'}</p></div><p className="font-bold text-slate-900">{formatCurrency(Number(item.price) * item.quantity)}</p></div>)}</div></Card><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Order timeline</h2><div className="mt-5 space-y-4">{(order.statusHistory || []).map((event) => <div key={event.id} className="flex gap-3"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-brand-600" /><div><p className="font-semibold text-slate-900">{event.status}</p><p className="text-sm text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>{event.note && <p className="mt-1 text-sm text-slate-600">{event.note}</p>}</div></div>)}</div></Card></div><div className="space-y-6"><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Payment and delivery</h2><div className="mt-4 space-y-3 text-sm text-slate-600"><p><strong className="text-slate-900">Payment:</strong> {order.payment?.method || order.paymentMethod || 'Unavailable'} · {order.payment?.status || 'Pending'}</p><p><strong className="text-slate-900">Delivery:</strong> {order.shipment?.status || 'Pending'}</p>{order.shipment?.trackingNumber && <p><strong className="text-slate-900">Tracking:</strong> {order.shipment.trackingNumber}</p>}{order.shipment?.carrier && <p><strong className="text-slate-900">Carrier:</strong> {order.shipment.carrier}</p>}</div></Card><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Shipping address</h2>{address ? <div className="mt-4 space-y-1 text-sm text-slate-600">{Object.entries(address).map(([key, value]) => <p key={key}><span className="font-semibold capitalize text-slate-900">{key.replace(/([A-Z])/g, ' $1')}:</span> {value}</p>)}</div> : <p className="mt-4 text-sm text-slate-500">Shipping address unavailable.</p>}</Card><Card className="p-6"><div className="space-y-3 text-slate-700"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div></div></Card></div></div>}
    </div>
  )
}
