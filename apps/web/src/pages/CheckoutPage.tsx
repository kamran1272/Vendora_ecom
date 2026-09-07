import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Button, Card, OrderStatusBadge } from '@/components/ui/DesignSystem'
import { getCartSubtotal, useCartStore } from '@/store/cart'
import { useAuth } from '@/store/auth'
import { useToastStore } from '@/store/toast'
import { formatCurrency } from '@/utils/format'

const steps = ['Cart', 'Shipping address', 'Payment', 'Review']

type ShippingAddress = {
  fullName: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const items = useCartStore((state) => state.items)
  const summary = useCartStore((state) => state.summary)
  const checkout = useCartStore((state) => state.checkout)
  const [step, setStep] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [address, setAddress] = useState<ShippingAddress>({ fullName: user?.name || '', street: '', city: '', state: '', zip: '', country: '' })
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (!isAuthenticated && !user?.id) navigate('/login')
  }, [isAuthenticated, navigate, user?.id])

  useEffect(() => {
    setAddress((current) => ({ ...current, fullName: current.fullName || user?.name || '' }))
  }, [user?.name])

  const subtotal = getCartSubtotal(items)
  const shipping = summary?.shipping ?? (subtotal > 0 ? 12 : 0)
  const tax = summary?.tax ?? subtotal * 0.08
  const discount = summary?.discount ?? 0
  const total = summary?.total ?? subtotal + shipping + tax - discount
  const addressComplete = Object.values(address).every((value) => value.trim())

  const validateStep = () => {
    setError(null)
    if (!items.length) {
      setError('Your cart is empty.')
      return false
    }
    if (step === 1 && !addressComplete) {
      setError('Complete every shipping address field before continuing.')
      return false
    }
    if (step === 2 && !paymentMethod) {
      setError('Select a payment method before continuing.')
      return false
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const placeOrder = async () => {
    if (!user?.id || !validateStep()) return
    setLoading(true)
    setError(null)
    try {
      const result = await checkout(String(user.id), {
        paymentMethod,
        shippingAddress: address,
      })
      setOrderId(result.order.id)
      showToast({ tone: 'success', title: 'Order placed successfully', message: 'Your order has been confirmed.' })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete checkout. Please try again.')
      showToast({ tone: 'error', title: 'Checkout failed', message: 'We could not place your order. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (orderId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700" aria-hidden="true">✓</div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Thank you for your order</h1>
          <p className="mt-3 text-slate-600">Your order was created successfully and the purchased cart items were cleared by the server.</p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left"><p className="text-sm text-slate-500">Order number</p><p className="mt-1 font-bold text-slate-900">{orderId}</p><div className="mt-3"><OrderStatusBadge status="PENDING" /></div></div>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to={`/account/orders/${orderId}`} className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">View order</Link><Link to="/shop" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">Continue shopping</Link></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageShell title="Checkout" description="Complete the supported checkout steps securely. Final prices and totals come from the marketplace cart." />
      <nav aria-label="Checkout progress" className="grid gap-2 sm:grid-cols-4">{steps.map((label, index) => <div key={label} className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold ${index <= step ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}><span className="mr-2">{index + 1}</span>{label}</div>)}</nav>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700" role="alert">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          {step === 0 && <div><h2 className="text-xl font-black text-slate-900">Review cart</h2><div className="mt-5 space-y-4">{items.map((item) => <div key={`${item.id}-${item.variant || ''}`} className="flex items-center justify-between border-b border-slate-200 pb-3"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-sm text-slate-500">{item.shop || 'Seller unavailable'} · Qty {item.quantity}</p></div><p className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p></div>)}</div></div>}
          {step === 1 && <div><h2 className="text-xl font-black text-slate-900">Shipping address</h2><p className="mt-2 text-sm text-slate-500">Enter the address used by the order service for fulfillment.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(address).map(([field, value]) => <label key={field} className={field === 'street' ? 'sm:col-span-2' : ''}><span className="mb-1 block text-sm font-semibold capitalize text-slate-700">{field.replace(/([A-Z])/g, ' $1')}</span><input required value={value} placeholder={`Enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`} onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" autoComplete={field === 'fullName' ? 'name' : field === 'street' ? 'street-address' : field} /></label>)}</div></div>}
          {step === 2 && <div><h2 className="text-xl font-black text-slate-900">Payment method</h2><p className="mt-2 text-sm text-slate-500">The current checkout backend creates a pending Stripe payment record.</p><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-4"><input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" /><span><span className="block font-bold text-slate-900">Stripe payment</span><span className="mt-1 block text-sm text-slate-600">Payment confirmation is handled by the existing order/payment backend.</span></span></label></div>}
          {step === 3 && <div><h2 className="text-xl font-black text-slate-900">Review and place order</h2><div className="mt-5 space-y-3 text-sm text-slate-600"><p><strong className="text-slate-900">Ship to:</strong> {address.fullName}, {address.street}, {address.city}, {address.state}, {address.zip}, {address.country}</p><p><strong className="text-slate-900">Payment:</strong> Stripe payment</p><p><strong className="text-slate-900">Delivery:</strong> Standard delivery calculated by the cart service</p></div><Button type="button" onClick={placeOrder} disabled={!items.length} loading={loading} loadingLabel="Placing order..." className="mt-6 w-full">Place order</Button></div>}
        </Card>

        <Card className="h-fit p-6 lg:sticky lg:top-24"><h2 className="text-xl font-black text-slate-900">Order total</h2><div className="mt-5 space-y-3 text-slate-700"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(shipping)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatCurrency(tax)}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}<div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-black text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div></div><div className="mt-6 flex gap-3">{step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700">Back</button>}{step < steps.length - 1 && <button type="button" onClick={nextStep} disabled={loading || !items.length} className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Continue</button>}</div></Card>
      </div>
    </div>
  )
}
