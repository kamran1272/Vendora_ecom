import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/store/auth'
import { SELLER_REGISTRATION_URL } from '@/config/customer'

const accountLinks = [
  { label: 'Overview', href: '/account' },
  { label: 'Profile', href: '/account/profile' },
  { label: 'Orders', href: '/account/orders' },
  { label: 'Addresses', href: '/account/addresses' },
  { label: 'Payment methods', href: '/account/payment-methods' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Reviews', href: '/account/reviews' },
  { label: 'Notifications', href: '/account/notifications' },
  { label: 'Support and messages', href: '/account/messages' },
]

async function fetchProfile() {
  return apiRequest<AuthUser>('/auth/profile')
}

export function AccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchProfile()
      .then((data) => { if (active) setProfile(data) })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageShell title="My account" description="Manage your orders, wishlist, support conversations, and signed-in profile." />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24">
          <nav aria-label="Account navigation" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {accountLinks.map((item) => <Link key={item.href} to={item.href} className={`block shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold ${location.pathname === item.href ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>{item.label}</Link>)}
            <button type="button" onClick={handleLogout} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">Log out</button>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {error && <ErrorState message="We could not load your account details right now. Please try again." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
          <Card className="p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Profile</p>{loading ? <LoadingState variant="list" className="mt-5" /> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-slate-500">Name</p><p className="mt-1 font-semibold text-slate-900">{profile?.name || 'Name unavailable'}</p></div><div><p className="text-sm text-slate-500">Email</p><p className="mt-1 font-semibold text-slate-900">{profile?.email || 'Email unavailable'}</p></div><div><p className="text-sm text-slate-500">Phone</p><p className="mt-1 font-semibold text-slate-900">{String(profile?.phone || 'Phone unavailable')}</p></div><div><p className="text-sm text-slate-500">Account role</p><p className="mt-1 font-semibold capitalize text-slate-900">{String(profile?.role || 'customer').toLowerCase()}</p></div></div>}</Card>
          <div className="grid gap-4 sm:grid-cols-2"><Link to="/account/orders" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300"><p className="font-bold text-slate-900">Orders</p><p className="mt-2 text-sm text-slate-500">Track purchases and delivery status.</p></Link><Link to="/account/wishlist" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300"><p className="font-bold text-slate-900">Wishlist</p><p className="mt-2 text-sm text-slate-500">Manage saved products and move them to cart.</p></Link><Link to="/account/messages" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300"><p className="font-bold text-slate-900">Support</p><p className="mt-2 text-sm text-slate-500">Continue conversations with Vendora support.</p></Link><a href={SELLER_REGISTRATION_URL} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300"><p className="font-bold text-slate-900">Become a seller</p><p className="mt-2 text-sm text-slate-500">Open seller registration in the Seller Panel.</p></a></div>
        </div>
      </div>
    </div>
  )
}
