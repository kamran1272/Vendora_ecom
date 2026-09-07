import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'

export function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Payment methods" description="Review the payment option currently enabled for customer checkout." />
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Available at checkout</p>
            <h2 className="mt-2 text-xl font-black text-slate-900">Stripe payment</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Payment details are collected securely during checkout. Vendora does not store card numbers in this customer app.</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Enabled</span>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No saved payment methods are stored on this account yet. Choose Stripe during checkout to continue.</div>
        <Link to="/cart" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Go to cart</Link>
      </Card>
    </div>
  )
}