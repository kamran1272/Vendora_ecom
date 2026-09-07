import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Sparkles, BarChart3, Box, LockKeyhole, Users } from 'lucide-react'
import { useAdminAuth } from '../auth/AdminAuthContext'
import { showAdminToast } from '../components/feedback/AdminToast'

function VendoraMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 rounded-2xl bg-[#1f2d4d] p-2 shadow-lg shadow-slate-800/20">
        <svg viewBox="0 0 160 160" className="h-full w-full" aria-label="Vendora logo" role="img">
          <defs>
            <linearGradient id="vendora-admin-mark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f9b24a" />
              <stop offset="100%" stopColor="#f38a2d" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="63" fill="#1f2d4d" />
          <path d="M55 74c0-15 12-27 27-27h18c15 0 27 12 27 27v10c0 14-5 25-15 34L88 118l-23-20C55 90 50 79 50 68V74Z" fill="url(#vendora-admin-mark)" />
          <path d="M80 47c-13 0-24 9-27 21h54c-3-12-14-21-27-21Z" fill="#f7ab43" opacity="0.95" />
          <path d="M82 26c8 0 15 7 15 15v14H67V41c0-8 7-15 15-15Z" fill="#1f2d4d" />
          <path d="M64 50c0-16 13-29 29-29s29 13 29 29" fill="none" stroke="#1f2d4d" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Vendora</div>
        <div className="text-xl font-black tracking-tight text-slate-900">Admin Control Center</div>
      </div>
    </div>
  )
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated, isLoading, hasAdminAccess } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setError('Your session has expired. Please sign in again.')
      showAdminToast({ tone: 'warning', title: 'Session expired', message: 'Your session has expired. Please sign in again.' })
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#edf3f8_38%,_#edf2f7_100%)] px-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-[#f39a3d]" aria-label="Loading admin portal" />
      </div>
    )
  }

  if (isAuthenticated && hasAdminAccess()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const featureCards = useMemo(
    () => [
      { icon: BarChart3, label: 'Market analytics', value: '24/7 live' },
      { icon: Box, label: 'Catalog controls', value: 'Fast reviews' },
      { icon: Users, label: 'Seller & users', value: 'Operational' },
      { icon: LockKeyhole, label: 'Security', value: 'Protected' },
    ],
    [],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both your email and password.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await login(trimmedEmail, trimmedPassword)
      navigate('/admin/dashboard', { replace: true })
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Invalid email or password.'
      if (message === 'Unable to connect to the server. Please try again.') {
        setError('Unable to connect to the server. Please try again.')
      } else if (message === 'Administrator access is required.') {
        setError('Administrator access is required.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(243,154,61,0.18),_transparent_30%),linear-gradient(135deg,#1f2d4d_0%,#23345c_45%,#1a2740_100%)] text-slate-900">
      <div className="absolute -left-12 top-8 h-60 w-60 rounded-full bg-[#f39a3d]/20 blur-3xl" />
      <div className="absolute bottom-0 right-[-4rem] h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 xl:px-12">
        <section className="hidden rounded-[34px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.18)] backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
          <div>
            <VendoraMark />
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f9c57c]">Secure operations</p>
              <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white">Admin Control Center</h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-200">Manage marketplace health, seller operations, order flow, revenue insights, and platform compliance from one trusted dashboard.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {featureCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/25 p-4 text-left backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f39a3d]/15 text-[#f7b767]">
                  <Icon size={18} />
                </div>
                <div className="mt-4 text-sm font-medium text-slate-200">{label}</div>
                <div className="mt-1 text-xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-100">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Protected access for authorized administrators only</span>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:p-7 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1f2d4d] text-xs font-black text-white shadow-lg shadow-slate-900/10">V</div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Vendora</div>
                <div className="text-lg font-bold text-slate-900">Admin sign in</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" /> Secure
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to your admin account</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-slate-700">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#f39a3d] focus:bg-white focus:ring-4 focus:ring-[#f39a3d]/10"
                placeholder="admin@example.com"
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#f39a3d] focus:bg-white focus:ring-4 focus:ring-[#f39a3d]/10"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  onClick={() => setVisible((current) => !current)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#1f2d4d] focus:ring-[#f39a3d]" />
                <span>Remember me</span>
              </label>
              <button type="button" className="font-medium text-[#1f2d4d] transition hover:text-[#f39a3d]" aria-label="Reset password">
                Forgot password?
              </button>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert" aria-live="assertive">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1f2d4d] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#172341] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs leading-6 text-slate-500">
            Authorized administrators only
          </div>
        </section>
      </div>
    </div>
  )
}
