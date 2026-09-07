import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, persistSellerRefreshToken, persistSellerSession } from '../../services/api'

type Mode = 'login' | 'register'

type SellerUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
  shopName?: string
}

type AuthResponse = {
  accessToken?: string
  access_token?: string
  token?: string
  refreshToken?: string
  refresh_token?: string
  user?: SellerUser
  message?: string
}

const defaultForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shopName: '',
  shopAddress: '',
  phone: '',
}

export function SellerAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>(() => (location.pathname.includes('registration') || location.pathname.includes('register') ? 'register' : 'login'))
  const [form, setForm] = useState(defaultForm)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const nextMode = location.pathname.includes('registration') || location.pathname.includes('register') ? 'register' : 'login'
    setMode(nextMode)
  }, [location.pathname])

  const isRegister = mode === 'register'

  const formTitle = useMemo(
    () => (isRegister ? 'Open your seller storefront' : 'Welcome back, seller'),
    [isRegister],
  )

  const updateField = (field: keyof typeof defaultForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (isRegister) {
        if (!accepted) {
          throw new Error('Please accept the seller agreement before submitting.')
        }

        if (!form.fullName || !form.email || !form.password || !form.shopName || !form.shopAddress) {
          throw new Error('Please complete all required seller registration fields.')
        }

        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        const { data } = await api.post<AuthResponse>('/seller/register', {
          name: form.fullName,
          email: form.email,
          password: form.password,
          shopName: form.shopName,
          shopAddress: form.shopAddress,
          phone: form.phone,
          countryCode: '1',
        })

        setSuccessMessage(data.message || 'Seller registration submitted successfully. Your account is pending approval.')
        setAccepted(false)
        setForm((current) => ({
          ...current,
          password: '',
          confirmPassword: '',
          shopName: '',
          shopAddress: '',
          phone: '',
        }))
        setMode('login')
        return
      }

      const { data } = await api.post<AuthResponse>('/auth/login', {
        email: form.email,
        password: form.password,
      })

      const token = data.accessToken || data.access_token || data.token
      if (!token) {
        throw new Error('Authentication token was not returned by the server.')
      }

      const user = data.user
      if (user?.role && user.role !== 'SELLER') {
        throw new Error('This account is not registered as a seller.')
      }

      persistSellerSession(token, user)
      persistSellerRefreshToken(data.refreshToken || data.refresh_token)
      navigate('/seller/dashboard', { replace: true })
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        (isRegister ? 'Unable to register your seller account.' : 'Unable to sign in.')

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#edf3f8] p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid lg:min-h-[760px] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative hidden overflow-hidden bg-[#0f172a] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),transparent_38%)]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                Vendora seller hub
              </div>

              <h1 className="mt-8 max-w-md text-4xl font-black leading-tight">
                Grow your store with a trusted marketplace.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-200">
                Launch faster, manage inventory, track orders, and monitor performance from one secure seller dashboard.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              {[
                'Centralized order and inventory tracking',
                'Seller approvals and storefront setup',
                'Secure access across all marketplace tools',
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sm text-sky-200">
                    ✓
                  </div>
                  <p className="text-sm text-slate-100">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-center bg-[#f8fafc] px-6 py-10 md:p-10">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    Marketplace access
                  </div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{formTitle}</h2>
                </div>

                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      navigate('/users/login', { replace: false })
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      mode === 'login' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register')
                      navigate('/users/registration', { replace: false })
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      mode === 'register' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isRegister
                  ? 'Create a seller account and start building your storefront immediately.'
                  : 'Use your seller credentials to enter the dashboard and manage your store.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {isRegister && (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
                      <input
                        required
                        value={form.fullName}
                        onChange={(event) => updateField('fullName', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Your name"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Shop name</span>
                      <input
                        required
                        value={form.shopName}
                        onChange={(event) => updateField('shopName', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Your storefront name"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Shop address</span>
                      <input
                        required
                        value={form.shopAddress}
                        onChange={(event) => updateField('shopAddress', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Street, city, country"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
                        <input
                          value={form.phone}
                          onChange={(event) => updateField('phone', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                          placeholder="+1"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                        <input
                          required
                          type="email"
                          value={form.email}
                          onChange={(event) => updateField('email', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                          placeholder="seller@company.com"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {!isRegister && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="seller@company.com"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    {isRegister ? 'Create password' : 'Password'}
                  </span>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="••••••••"
                  />
                </label>

                {isRegister && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</span>
                    <input
                      required
                      type="password"
                      value={form.confirmPassword}
                      onChange={(event) => updateField('confirmPassword', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="Repeat the password"
                    />
                  </label>
                )}

                {isRegister && (
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(event) => setAccepted(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm leading-6 text-slate-600">
                      I agree to the seller terms, marketplace rules, and payout policy.
                    </span>
                  </label>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? isRegister
                      ? 'Submitting...'
                      : 'Signing in...'
                    : isRegister
                      ? 'Create seller account'
                      : 'Access dashboard'}
                </button>
              </form>

              {!isRegister && (
                <div className="mt-6 text-center text-sm text-slate-500">
                  Need a seller account?{' '}
                  <Link to="/users/registration" className="font-semibold text-sky-600 hover:text-sky-700">
                    Register here
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
