import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, persistSellerRefreshToken, persistSellerSession } from '../../services/api'

type LoginResponse = {
  accessToken?: string
  access_token?: string
  refreshToken?: string
  refresh_token?: string
  user?: { role?: string; name?: string; email?: string }
}

export function SellerLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
      const token = data.accessToken || data.access_token
      if (!token) throw new Error('The login response did not include an access token.')
      if (data.user?.role && data.user.role !== 'SELLER') throw new Error('This account is not registered as a seller.')
      persistSellerSession(token, data.user)
      persistSellerRefreshToken(data.refreshToken || data.refresh_token)
      navigate('/seller/dashboard', { replace: true })
    } catch (loginError: any) {
      setError(loginError?.response?.data?.message || loginError?.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf2f8] p-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vendora seller panel</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Sign in to your shop</h1>
        <p className="mt-2 text-sm text-slate-500">Use your seller account credentials to continue.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
          {error ? <div role="alert" className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-[#2d80d8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
          <p className="text-center text-sm text-slate-500">Don&apos;t have an account? <Link to="/users/registration" className="font-medium text-[#2d80d8] hover:underline">Register your shop</Link></p>
        </form>
      </section>
    </main>
  )
}
