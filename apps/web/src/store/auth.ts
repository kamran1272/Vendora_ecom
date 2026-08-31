import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
  [key: string]: unknown
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
        set({
          user: data.user ?? null,
          token,
          isAuthenticated: Boolean(token),
        })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('vendora_user')
        set({ user: null, token: null, isAuthenticated: false })
      },
      hydrate: () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
        const rawUser = localStorage.getItem('vendora_user')

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
