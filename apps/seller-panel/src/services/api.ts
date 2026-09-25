import axios from 'axios'
import { environment } from '../config/environment'
import { showSellerToast } from '../components/feedback/SellerToast'

export type SessionUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
  shopName?: string
  [key: string]: unknown
}

export const api = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const SELLER_TOKEN_STORAGE_KEY = 'vendora.seller.access'
const SELLER_REFRESH_STORAGE_KEY = 'vendora.seller.refresh'
const SELLER_USER_STORAGE_KEY = 'vendora.seller.user'
export function getSellerToken() {
  return localStorage.getItem(SELLER_TOKEN_STORAGE_KEY)
}

export function isSellerSession() {
  const token = getSellerToken()
  if (!token) return false
  try {
    const user = JSON.parse(localStorage.getItem(SELLER_USER_STORAGE_KEY) || 'null')
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return String(user?.role || '').toUpperCase() === 'SELLER' && String(payload?.role || '').toUpperCase() === 'SELLER'
  } catch {
    return false
  }
}

export function persistSellerSession(token: string, user?: SessionUser | null) {
  localStorage.setItem(SELLER_TOKEN_STORAGE_KEY, token)
  if (user) {
    localStorage.setItem(SELLER_USER_STORAGE_KEY, JSON.stringify(user))
  }
}

export function persistSellerRefreshToken(refreshToken?: string | null) {
  if (!refreshToken) return
  localStorage.setItem(SELLER_REFRESH_STORAGE_KEY, refreshToken)
}

function getSellerRefreshToken() {
  return localStorage.getItem(SELLER_REFRESH_STORAGE_KEY)
}

export function clearSellerSession() {
  localStorage.removeItem(SELLER_TOKEN_STORAGE_KEY)
  localStorage.removeItem(SELLER_REFRESH_STORAGE_KEY)
  localStorage.removeItem(SELLER_USER_STORAGE_KEY)
}

api.interceptors.request.use((config) => {
  const token = getSellerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    const method = String(response.config.method || 'get').toLowerCase()
    const url = String(response.config.url || '')
    const silentBackgroundRequest = /\/chat\/|\/notifications\//i.test(url)
    if (method !== 'get' && !silentBackgroundRequest && !/\/auth\/(login|register)/i.test(url)) {
      const message = /products\/bulk|products$/i.test(url) ? 'Product changes saved successfully.' : /products\//i.test(url) ? 'Product updated successfully.' : /orders\/.*status/i.test(url) ? 'Order status updated.' : /messages/i.test(url) ? 'Message sent.' : /withdrawals/i.test(url) ? 'Withdrawal request submitted.' : /shop/i.test(url) ? 'Settings saved.' : 'Changes saved successfully.'
      showSellerToast({ tone: 'success', title: 'Success', message })
    }
    return response
  },
  async (error) => {
    const status = error.response?.status as number | undefined
    const originalRequest = error.config as (typeof error.config & { _authRetry?: boolean }) | undefined
    const refreshToken = getSellerRefreshToken()

    if (status === 401 && refreshToken && originalRequest && !originalRequest._authRetry && !/\/auth\/(login|register|refresh)/i.test(String(originalRequest.url || ''))) {
      originalRequest._authRetry = true
      try {
        const { data } = await api.post<{ accessToken?: string; refreshToken?: string }>('/auth/refresh', { refreshToken })
        const nextToken = data.accessToken
        if (nextToken) {
          persistSellerSession(nextToken)
          persistSellerRefreshToken(data.refreshToken)
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${nextToken}`
          return api.request(originalRequest)
        }
      } catch {
        // Continue to the normal expired-session redirect.
      }
    }

    const messages: Record<number, { title: string; message: string }> = {
      400: { title: 'Check your input', message: 'Review the form details and try again.' },
      401: { title: 'Session expired', message: 'Please sign in again to continue.' },
      403: { title: 'Access denied', message: 'Your seller account cannot perform this action.' },
      404: { title: 'Not found', message: 'The requested record could not be found.' },
      409: { title: 'Conflict', message: 'This change conflicts with existing data.' },
      422: { title: 'Invalid data', message: 'Some submitted data needs attention.' },
      429: { title: 'Too many requests', message: 'Please wait a moment and try again.' },
      500: { title: 'Service unavailable', message: 'Something went wrong on the server. Please try again shortly.' },
    }
    const friendly = status ? messages[status] || (status >= 500 ? messages[500] : undefined) : { title: 'Connection problem', message: 'The server could not be reached. Check your connection and try again.' }
    if (friendly) {
      error.message = friendly.message
      showSellerToast({ tone: 'error', ...friendly, message: friendly.message })
    }

    if (status === 401) {
      clearSellerSession()
      if (window.location.pathname !== '/users/login') window.location.assign('/users/login')
    }
    return Promise.reject(error)
  },
)
