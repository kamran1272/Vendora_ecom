import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
  [key: string]: unknown
}

const TOKEN_STORAGE_KEYS = ['access_token', 'accessToken'] as const
const USER_STORAGE_KEY = 'vendora_user'

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token') || localStorage.getItem('accessToken') || null
}

export function setStoredAuthToken(token: string | null) {
  if (typeof window === 'undefined') return

  if (token) {
    localStorage.setItem('access_token', token)
    localStorage.setItem('accessToken', token)
    return
  }

  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
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
  login: (data: { user?: AuthUser | null; token?: string | null; accessToken?: string | null }) => void
  logout: () => void
  hydrate: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (data) => {
        const token = data.token ?? data.accessToken ?? null
        const user = data.user ?? null

        if (token) {
          setStoredAuthToken(token)
        }
        if (user) {
          setStoredUser(user)
        }

        set({
          user,
          token,
          isAuthenticated: Boolean(token),
        })
      },
      logout: () => {
        clearStoredAuthSession()
        set({ user: null, token: null, isAuthenticated: false })
      },
      hydrate: () => {
        const token = getStoredAuthToken()
        const rawUser = localStorage.getItem(USER_STORAGE_KEY)

        set({
          token,
          user: rawUser ? JSON.parse(rawUser) : null,
          isAuthenticated: Boolean(token),
        })
      },
    }),
    {
      name: 'vendora-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

if (typeof window !== 'undefined') {
  useAuth.getState().hydrate()
}
