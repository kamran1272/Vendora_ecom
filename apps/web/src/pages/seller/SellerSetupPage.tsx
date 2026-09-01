import { Link } from 'react-router-dom'

export function SellerSetupPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f59a36]">Seller onboarding</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Start selling on Vendora</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Set up your shop, complete your seller profile, and begin connecting your products to the marketplace.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Shop details</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Store name</p>
              <p className="mt-1 text-slate-500">Your public brand name</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Business type</p>
              <p className="mt-1 text-slate-500">Individual or company seller</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Marketplace setup</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Seller plan</p>
              <p className="mt-1 text-slate-500">Free, starter, and premium options</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Approval flow</p>
              <p className="mt-1 text-slate-500">Admin review before activation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/seller" className="rounded-full bg-[#1f2d4d] px-5 py-3 font-semibold text-white">Go to seller dashboard</Link>
        <Link to="/" className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Back to home</Link>
      </div>
    </div>
  )
}
