import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Button, Card } from '@/components/ui/DesignSystem'
import { ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { apiRequest } from '@/services/api'
import { useAuth, type AuthUser } from '@/store/auth'

export function ProfilePage() {
  const cachedUser = useAuth((state) => state.user)
  const [profile, setProfile] = useState<AuthUser | null>(cachedUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    apiRequest<AuthUser>('/auth/profile')
      .then((data) => { if (active) setProfile(data) })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageShell title="Profile" description="Review the customer information currently associated with your Vendora account." />
        <Link to="/account" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">Back to account</Link>
      </div>
      {error && <ErrorState title="Profile unavailable" message="We could not load your profile right now. Please try again." action={<Button type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</Button>} />}
      {loading ? <LoadingState variant="detail" /> : !error && <Card className="p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-sm text-slate-500">Name</p><p className="mt-1 text-lg font-bold text-slate-900">{profile?.name || 'Name unavailable'}</p></div><div><p className="text-sm text-slate-500">Email</p><p className="mt-1 text-lg font-bold text-slate-900">{profile?.email || 'Email unavailable'}</p></div><div><p className="text-sm text-slate-500">Phone</p><p className="mt-1 font-semibold text-slate-900">{String(profile?.phone || 'Phone unavailable')}</p></div><div><p className="text-sm text-slate-500">Account role</p><p className="mt-1 font-semibold capitalize text-slate-900">{String(profile?.role || 'customer').toLowerCase()}</p></div></div><div className="mt-8 flex flex-wrap gap-3"><Link to="/account/addresses" className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Manage addresses</Link><Link to="/support" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">Contact support</Link></div></Card>}
    </div>
  )
}