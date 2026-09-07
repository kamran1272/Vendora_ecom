import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { showAdminToast } from '../components/feedback/AdminToast'

export type AdminUser = {
  id: string
  email: string
  name: string
  role: string
}

type AdminAuthContextValue = {
  adminUser: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  hasAdminAccess: () => boolean
}

const ADMIN_ACCESS_TOKEN_KEY = 'vendora_admin_access_token'
const ADMIN_REFRESH_TOKEN_KEY = 'vendora_admin_refresh_token'
const ADMIN_USER_KEY = 'vendora_admin_user'

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

function readStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(ADMIN_USER_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AdminUser
    return parsed && parsed.email && parsed.role ? parsed : null
  } catch {
    return null
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) || localStorage.getItem('access_token') || localStorage.getItem('accessToken') || null
}

function readStoredRefreshToken(): string | null {
  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) || localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken') || null
}

function clearStoredAdminSession() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
  localStorage.removeItem('access_token')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('refreshToken')
}

function isAdminRole(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => readStoredUser())
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreUser = readStoredUser()
    const storedToken = readStoredToken()
    if (restoreUser && storedToken && isAdminRole(restoreUser.role)) {
      setAdminUser(restoreUser)
      setToken(storedToken)
    } else {
      clearStoredAdminSession()
      setAdminUser(null)
      setToken(null)
    }
    setIsLoading(false)
  }, [])

  const persistSession = (nextUser: AdminUser, nextToken: string, nextRefreshToken?: string) => {
    setAdminUser(nextUser)
    setToken(nextToken)
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(nextUser))
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, nextToken)
    localStorage.setItem('access_token', nextToken)
    localStorage.setItem('accessToken', nextToken)

    if (nextRefreshToken) {
      localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, nextRefreshToken)
      localStorage.setItem('refresh_token', nextRefreshToken)
      localStorage.setItem('refreshToken', nextRefreshToken)
    }
  }

  const clearSession = () => {
    setAdminUser(null)
    setToken(null)
    clearStoredAdminSession()
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const payload = await response.text()
      let message = 'Invalid email or password.'
      try {
        const parsed = JSON.parse(payload) as { message?: string }
        if (parsed.message) {
          message = parsed.message
        }
      } catch {
        // Ignore parsing errors and fall back to generic invalid login message.
      }

      if (response.status === 401) {
        throw new Error(message.includes('not allowed') || message.includes('Administrator') ? 'Administrator access is required.' : 'Invalid email or password.')
      }

      if (response.status >= 500) {
        throw new Error('Unable to connect to the server. Please try again.')
      }

      throw new Error(message || 'Invalid email or password.')
    }

    const data = (await response.json()) as {
      user?: AdminUser
      accessToken?: string
      access_token?: string
      refreshToken?: string
      refresh_token?: string
      token?: string
    }

    const nextUser = data.user ?? null
    const nextToken = data.accessToken || data.access_token || data.token
    const nextRefreshToken = data.refreshToken || data.refresh_token

    if (!nextUser || !nextToken) {
      throw new Error('Unable to complete admin sign-in.')
    }

    if (!isAdminRole(nextUser.role)) {
      throw new Error('Administrator access is required.')
    }

    persistSession(nextUser, nextToken, nextRefreshToken)
    showAdminToast({ tone: 'success', title: 'Signed in', message: 'Welcome back to the admin control center.' })
  }

  const refreshSession = async () => {
    const refreshToken = readStoredRefreshToken()
    if (!refreshToken || !adminUser) {
      clearSession()
      return false
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        clearSession()
        return false
      }

      const data = (await response.json()) as {
        user?: AdminUser
        accessToken?: string
        access_token?: string
        refreshToken?: string
        refresh_token?: string
      }

      const nextUser = data.user || adminUser
      const nextToken = data.accessToken || data.access_token
      const nextRefreshToken = data.refreshToken || data.refresh_token

      if (!nextUser || !nextToken) {
        clearSession()
        return false
      }

      persistSession(nextUser, nextToken, nextRefreshToken)
      return true
    } catch {
      clearSession()
      return false
    }
  }

  const logout = async () => {
    clearSession()
    showAdminToast({ tone: 'info', title: 'Signed out', message: 'You have been signed out of the admin portal.' })
    window.location.assign('/admin/login')
  }

  const hasAdminAccess = () => Boolean(adminUser && isAdminRole(adminUser.role))

  const value = useMemo<AdminAuthContextValue>(
    () => ({ adminUser, isAuthenticated: Boolean(token && adminUser && isAdminRole(adminUser.role)), isLoading, login, logout, refreshSession, hasAdminAccess }),
    [adminUser, isLoading, token],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  }

  return context
}

export function AdminAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#edf3f8_38%,_#edf2f7_100%)] px-4 text-slate-700">
      <div className="flex w-full max-w-md flex-col items-center rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-[#f39a3d]" aria-label="Loading admin session" />
        <p className="mt-5 text-lg font-semibold text-slate-900">Authorizing admin access…</p>
        <p className="mt-2 text-sm text-slate-500">Checking your secure session.</p>
      </div>
    </div>
  )
}

export function AdminUnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#edf3f8_38%,_#edf2f7_100%)] px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-rose-200 bg-white p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl text-rose-600">!</div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Access denied</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Administrator access required</h1>
        <p className="mt-3 text-slate-600">This account does not have permission to use the Vendora admin portal.</p>
        <button type="button" onClick={() => navigate('/admin/login', { replace: true })} className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1f2d4d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172341]">Return to sign in</button>
      </div>
    </div>
  )
}

export function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading, hasAdminAccess } = useAdminAuth()
  const location = useLocation()

  if (isLoading) {
    return <AdminAuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!hasAdminAccess()) {
    return <Navigate to="/admin/unauthorized" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestAdminRoute() {
  const { isAuthenticated, isLoading, hasAdminAccess } = useAdminAuth()

  if (isLoading) {
    return <AdminAuthLoading />
  }

  if (isAuthenticated && hasAdminAccess()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}
