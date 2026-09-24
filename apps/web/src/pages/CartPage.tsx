import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { Button } from '@/components/ui/DesignSystem'
import { getCartSubtotal, useCartStore } from '@/store/cart'
import { useAuth } from '@/store/auth'
import { useToastStore } from '@/store/toast'
import { formatCurrency } from '@/utils/format'

export function CartPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const items = useCartStore((state) => state.items)
  const summary = useCartStore((state) => state.summary)
  const loadForUser = useCartStore((state) => state.loadForUser)
  const refreshQuote = useCartStore((state) => state.refreshQuote)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clear = useCartStore((state) => state.clear)
  const showToast = useToastStore((state) => state.show)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    loadForUser(user.id)
      .then(() => refreshQuote(String(user.id)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load cart.'))
      .finally(() => setLoading(false))
  }, [loadForUser, refreshQuote, user?.id])

  const subtotal = summary?.subtotal ?? (isAuthenticated ? 0 : getCartSubtotal(items))
  const shipping = summary?.shipping
  const tax = summary?.tax
  const discount = summary?.discount
  const total = summary?.total
  const sellerGroups = [...new Map(items.map((item) => [item.sellerId || item.shop || 'seller', item.shop || 'Seller'])).entries()].map(([sellerId, sellerName]) => ({
    sellerId,
    sellerName,
    items: items.filter((item) => (item.sellerId || item.shop || 'seller') === sellerId),
  }))

  const runCartMutation = async (action: string, mutation: () => Promise<unknown>) => {
    if (pendingAction) return
    setPendingAction(action)
    setError(null)
    try {
      await mutation()
      showToast({ tone: 'success', title: 'Cart updated', message: action === 'clear' ? 'Your cart was cleared.' : 'Cart quantity updated.' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your cart.')
      showToast({ tone: 'error', title: 'Cart update failed', message: 'Please try again.' })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageShell title="Shopping cart" description="Review your items, confirm quantities, and proceed to checkout securely." />
      {error && <ErrorState message="We could not update your cart right now. Please try again." action={<button type="button" onClick={() => { if (user?.id) { setLoading(true); setError(null); void loadForUser(user.id).finally(() => setLoading(false)) } }} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        {!isAuthenticated && items.length === 0 ? <EmptyState title="Your cart is empty" message="Discover products from trusted marketplace sellers and add your favorites here." action={<button type="button" onClick={() => navigate('/shop')} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Continue shopping</button>} /> : loading ? <LoadingState variant="list" /> : items.length ? (
          <>
            <div className="space-y-6">
              {sellerGroups.map((group) => (
                <section key={group.sellerId} aria-labelledby={`seller-${group.sellerId}`}>
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
                    <h2 id={`seller-${group.sellerId}`} className="font-bold text-slate-900">Seller: {group.sellerName}</h2>
                    <span className="text-sm font-semibold text-slate-500">Seller subtotal: {formatCurrency(getCartSubtotal(group.items))}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-200" aria-hidden="true" />}
                      <div>
                        <p className="text-lg font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.shop || 'Seller information unavailable'}</p>
                        {item.variant && <p className="mt-1 text-sm text-slate-500">Variant: {item.variant}</p>}
                        <p className="mt-2 text-slate-600">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                    <button type="button" disabled={Boolean(pendingAction)} onClick={() => void runCartMutation(`remove-${item.id}`, () => removeItem(item.id))} className="text-sm font-semibold text-rose-600 disabled:opacity-50">{pendingAction === `remove-${item.id}` ? 'Removing...' : 'Remove'}</button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button type="button" disabled={Boolean(pendingAction)} onClick={() => void runCartMutation(`decrease-${item.id}`, () => updateQuantity(item.id, item.quantity - 1))} className="h-9 w-9 rounded-full border border-slate-200 text-lg disabled:opacity-50">-</button>
                    <span className="min-w-10 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                    <button type="button" disabled={Boolean(pendingAction) || (item.stock !== undefined && item.quantity >= item.stock)} onClick={() => void runCartMutation(`increase-${item.id}`, () => updateQuantity(item.id, item.quantity + 1))} className="h-9 w-9 rounded-full border border-slate-200 text-lg disabled:opacity-50">+</button>
                  </div>
                  {item.stock !== undefined && <p className="mt-2 text-xs text-slate-500">{item.stock} available</p>}
                </div>
              ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-lg font-bold text-slate-900">
              <span>Subtotal: {formatCurrency(subtotal)}</span>{summary ? <><span>Shipping: {formatCurrency(shipping ?? 0)}</span><span>Tax: {formatCurrency(tax ?? 0)}</span>{(discount ?? 0) > 0 && <span className="text-emerald-600">Discount: -{formatCurrency(discount ?? 0)}</span>}<span>Total: {formatCurrency(total ?? 0)}</span></> : <span className="text-sm font-medium text-slate-500">Sign in to get a server-calculated total</span>}
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Button type="button" variant="secondary" disabled={Boolean(pendingAction)} loading={pendingAction === 'clear'} loadingLabel="Clearing..." onClick={() => void runCartMutation('clear', clear)}>Clear cart</Button>
              <Button type="button" onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
            </div>
          </>
        ) : <EmptyState title="Your cart is empty" message="Discover products from trusted marketplace sellers and add your favorites here." action={<button type="button" onClick={() => navigate('/shop')} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Continue shopping</button>} />}
      </div>
    </div>
  )
}
