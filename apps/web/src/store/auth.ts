import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
  [key: string]: unknown
}

const TOKEN_STORAGE_KEY = 'vendora.customer.access'
const USER_STORAGE_KEY = 'vendora.customer.user'
const REFRESH_STORAGE_KEY = 'vendora.customer.refresh'
export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_STORAGE_KEY)
}

export function setStoredAuthToken(token: string | null) {
  if (typeof window === 'undefined') return

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    return
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_STORAGE_KEY)
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    return
  }

  localStorage.removeItem(USER_STORAGE_KEY)
}

export function clearStoredAuthSession() {
  setStoredAuthToken(null)
  setStoredUser(null)
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  authChecked: boolean
  login: (data: { user?: AuthUser | null; token?: string | null; accessToken?: string | null; refreshToken?: string | null }) => void
  logout: () => void
  setAuthoritativeUser: (user: AuthUser) => void
  setAuthChecked: (checked: boolean) => void
  hydrate: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      authChecked: false,
      login: (data) => {
        const token = data.token ?? data.accessToken ?? null

        if (token) {
          setStoredAuthToken(token)
        }
        if ('refreshToken' in data && data.refreshToken) {
          localStorage.setItem(REFRESH_STORAGE_KEY, data.refreshToken)
        }
        setStoredUser(null)

        set({
          user: null,
          token,
          isAuthenticated: Boolean(token),
          authChecked: false,
        })
      },
      logout: () => {
        clearStoredAuthSession()
        set({ user: null, token: null, isAuthenticated: false, authChecked: true })
      },
      setAuthoritativeUser: (user) => {
        setStoredUser(user)
        set({ user, isAuthenticated: true })
      },
      setAuthChecked: (checked) => {
        set({ authChecked: checked })
      },
      hydrate: () => {
        const token = getStoredAuthToken()
        const rawUser = localStorage.getItem(USER_STORAGE_KEY)

        set({
          token,
          user: rawUser ? JSON.parse(rawUser) : null,
          isAuthenticated: Boolean(token),
          authChecked: !token,
        })
      },
    }),
    {
      name: 'vendora.customer.session',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

if (typeof window !== 'undefined') {
  useAuth.getState().hydrate()
}
