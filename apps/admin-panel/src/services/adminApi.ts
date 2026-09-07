import {
  closeAdminConversation,
  fetchAdminChatConversations,
  fetchAdminChatMessages,
  markAdminConversationRead,
  reopenAdminConversation,
  searchAdminChatMessages,
  sendAdminChatMessage,
  setAdminConversationTyping,
  updateAdminConversation,
} from './chat'
import { showAdminToast } from '../components/feedback/AdminToast'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'

export type AdminApiErrorCode = 'NETWORK' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER' | 'UNKNOWN'

export class AdminApiError extends Error {
  constructor(public readonly code: AdminApiErrorCode, public readonly status: number | undefined, message: string) {
    super(message)
    this.name = 'AdminApiError'
  }
}

function getErrorMessage(payload: string, status: number) {
  if (!payload || payload.trim().startsWith('<')) return ''
  try {
    const parsed = JSON.parse(payload) as { message?: string | string[]; error?: string }
    if (Array.isArray(parsed.message)) return parsed.message.join(' ')
    const message = parsed.message || parsed.error || ''
    return typeof message === 'string' && message.length < 240 ? message : ''
  } catch {
    return payload.length < 240 ? payload : ''
  }
}

function classifyStatus(status: number): AdminApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 429) return 'RATE_LIMIT'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

export function notifyAdminApiError(error: AdminApiError) {
  const messages: Record<AdminApiErrorCode, { title: string; message: string }> = {
    NETWORK: { title: 'Connection problem', message: 'The server could not be reached. Check your connection and try again.' },
    UNAUTHORIZED: { title: 'Session expired', message: 'Please sign in again to continue.' },
    FORBIDDEN: { title: 'Access denied', message: 'Your account does not have permission to perform this action.' },
    NOT_FOUND: { title: 'Not found', message: 'The requested record could not be found.' },
    CONFLICT: { title: 'Already exists', message: error.message || 'This change conflicts with existing data.' },
    VALIDATION: { title: 'Check your input', message: error.message || 'Review the highlighted fields and try again.' },
    RATE_LIMIT: { title: 'Too many requests', message: 'Please wait a moment before trying again.' },
    SERVER: { title: 'Service unavailable', message: 'Something went wrong on the server. Please try again shortly.' },
    UNKNOWN: { title: 'Request failed', message: error.message || 'Please try again.' },
  }
  const copy = messages[error.code]
  showAdminToast({ tone: error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN' || error.code === 'VALIDATION' || error.code === 'NOT_FOUND' || error.code === 'CONFLICT' || error.code === 'RATE_LIMIT' || error.code === 'SERVER' || error.code === 'UNKNOWN' ? 'error' : 'warning', ...copy })
  if (error.code === 'UNAUTHORIZED') {
    localStorage.removeItem('vendora_admin_access_token')
    localStorage.removeItem('vendora_admin_refresh_token')
    localStorage.removeItem('vendora_admin_user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('refreshToken')

    if (window.location.pathname !== '/admin/login') {
      window.location.assign('/admin/login?reason=session_expired')
    }
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function refreshAdminAccessToken() {
  const refreshToken = localStorage.getItem('vendora_admin_refresh_token') || localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) return null

  const data = await response.json() as { accessToken?: string; access_token?: string; refreshToken?: string; refresh_token?: string }
  const accessToken = data.accessToken || data.access_token
  const nextRefreshToken = data.refreshToken || data.refresh_token
  if (!accessToken) return null

  localStorage.setItem('vendora_admin_access_token', accessToken)
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('accessToken', accessToken)
  if (nextRefreshToken) {
    localStorage.setItem('vendora_admin_refresh_token', nextRefreshToken)
    localStorage.setItem('refresh_token', nextRefreshToken)
    localStorage.setItem('refreshToken', nextRefreshToken)
  }
  return accessToken
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(init.headers || {}),
      },
    })
  } catch {
    const error = new AdminApiError('NETWORK', undefined, 'The server could not be reached.')
    notifyAdminApiError(error)
    throw error
  }

  if (response.status === 401 && !new Headers(init.headers).get('X-Auth-Retry')) {
    try {
      const accessToken = await refreshAdminAccessToken()
      if (accessToken) {
        const headers = new Headers(init.headers)
        headers.set('X-Auth-Retry', '1')
        headers.set('Authorization', `Bearer ${accessToken}`)
        return apiRequest<T>(path, { ...init, headers })
      }
    } catch {
      // Fall through to the standard session-expired handling.
    }
  }

  if (!response.ok) {
    const text = await response.text()
    const status = classifyStatus(response.status)
    const fallback = status === 'NOT_FOUND' ? 'The requested record could not be found.' : status === 'CONFLICT' ? 'This change conflicts with existing data.' : status === 'RATE_LIMIT' ? 'Please wait a moment before trying again.' : `Request failed with status ${response.status}.`
    const error = new AdminApiError(status, response.status, getErrorMessage(text, response.status) || fallback)
    notifyAdminApiError(error)
    throw error
  }

  const text = await response.text()
  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

async function apiMutation<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>): Promise<T> {
  const result = await apiRequest<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
  showAdminToast({ tone: 'success', title: 'Changes saved', message: 'The requested marketplace change was completed successfully.' })
  return result
}

export type AdminRecord = Record<string, unknown>

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type AdminQueryParams = Record<string, string | number | boolean | undefined>

export function buildAdminQueryString(params: AdminQueryParams = {}): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export type AdminUserQuery = {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  from?: string
  to?: string
}

function normalizeList<T extends AdminRecord>(payload: unknown): T[] {
  if (!payload) return []

  if (Array.isArray(payload)) return payload as T[]

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.data)) return record.data as T[]
  }

  return []
}

export async function getAdminUsers(params: AdminUserQuery = {}): Promise<AdminRecord[] | { items: AdminRecord[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search) query.set('search', params.search)
  if (params.role) query.set('role', params.role)
  if (params.status) query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  const search = query.toString()

  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[]; total?: number; page?: number; limit?: number; totalPages?: number } | AdminRecord[]>(`/admin/users${search ? `?${search}` : ''}`)

    if (response && typeof response === 'object' && !Array.isArray(response) && ('items' in response || 'total' in response || 'data' in response)) {
      const record = response as { items?: AdminRecord[]; data?: AdminRecord[]; total?: number; page?: number; limit?: number; totalPages?: number }
      const items = normalizeList<AdminRecord>(record)
      return {
        items,
        total: Number(record.total ?? items.length ?? 0),
        page: Number(record.page ?? params.page ?? 1),
        limit: Number(record.limit ?? params.limit ?? items.length ?? 20),
        totalPages: Number(record.totalPages ?? Math.max(1, Math.ceil((Number(record.total ?? items.length ?? 0) || 1) / (Number(record.limit ?? params.limit ?? 20) || 20)))),
      }
    }

    return normalizeList<AdminRecord>(response)
  } catch {
    return {
      items: [],
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      totalPages: 1,
    }
  }
}

export type AdminSellerQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
  from?: string
  to?: string
}

export async function getAdminSellers(params: AdminSellerQuery = {}): Promise<AdminRecord[] | { items: AdminRecord[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[]; total?: number; page?: number; limit?: number; totalPages?: number } | AdminRecord[]>(`/admin/sellers${query.toString() ? `?${query.toString()}` : ''}`)

    if (response && typeof response === 'object' && !Array.isArray(response) && ('items' in response || 'total' in response || 'data' in response)) {
      const record = response as { items?: AdminRecord[]; data?: AdminRecord[]; total?: number; page?: number; limit?: number; totalPages?: number }
      const items = normalizeList<AdminRecord>(record)
      return {
        items,
        total: Number(record.total ?? items.length ?? 0),
        page: Number(record.page ?? params.page ?? 1),
        limit: Number(record.limit ?? params.limit ?? items.length ?? 20),
        totalPages: Number(record.totalPages ?? Math.max(1, Math.ceil((Number(record.total ?? items.length ?? 0) || 1) / (Number(record.limit ?? params.limit ?? 20) || 20)))),
      }
    }

    return normalizeList<AdminRecord>(response)
  } catch {
    return {
      items: [],
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      totalPages: 1,
    }
  }
}

export async function getAdminSellerById(id: string | number): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>(`/admin/sellers/${id}`)
  } catch {
    return {}
  }
}

export async function updateAdminSeller(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/sellers/${id}`, 'PATCH', payload)
}

export async function updateAdminSellerStatus(id: string | number, payload: { status?: string; isSuspended?: boolean }): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/sellers/${id}/status`, 'PATCH', payload)
}

export async function getAdminSellerProducts(id: string | number): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>(`/admin/sellers/${id}/products`)
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminSellerOrders(id: string | number): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>(`/admin/sellers/${id}/orders`)
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminSellerEarnings(id: string | number): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>(`/admin/sellers/${id}/earnings`)
  } catch {
    return { grossSales: 0, platformCommission: 0, netEarnings: 0, withdrawableBalance: 0, currency: 'USD' }
  }
}

export async function getAdminSellerApplications(): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/seller-applications')
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminSellerApplicationById(id: string | number): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>(`/admin/seller-applications/${id}`)
  } catch {
    return {}
  }
}

export async function updateSellerApplicationStatus(id: string | number, status: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/seller-applications/${id}/status`, 'PATCH', { status })
}

export async function requestSellerApplicationInfo(id: string | number, message: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/seller-applications/${id}/request-info`, 'POST', { message })
}

export async function messageSellerApplication(id: string | number, message: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/seller-applications/${id}/message`, 'POST', { message })
}

export async function getAdminProducts(): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/products')
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminProductById(id: string | number): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>(`/admin/products/${id}`)
  } catch {
    return {}
  }
}

export async function getAdminOrders(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/orders')
  return normalizeList<AdminRecord>(response)
}

export async function getAdminOrderById(id: string | number): Promise<AdminRecord> {
  return apiRequest<AdminRecord>(`/admin/orders/${id}`)
}

export async function cancelAdminOrder(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/orders/${id}/cancel`, 'POST')
}

export async function refundAdminOrder(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/orders/${id}/refund`, 'POST')
}

export async function contactAdminOrderParticipant(id: string | number, participant: 'customer' | 'seller', message: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/orders/${id}/contact-${participant}`, 'POST', { message })
}

export async function getAdminOrderDocument(id: string | number, document: 'invoice' | 'shipping-label'): Promise<AdminRecord> {
  return apiRequest<AdminRecord>(`/admin/orders/${id}/${document}`)
}

export async function getAdminPayments(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/payments')
  return normalizeList<AdminRecord>(response)
}

export async function getAdminWithdrawals(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/payouts')
  return normalizeList<AdminRecord>(response)
}

export async function getAdminWarehouseProducts(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/product-warehouse?limit=100')
  return normalizeList<AdminRecord>(response)
}

export async function updateAdminWarehouseProduct(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/product-warehouse/${id}`, 'PATCH', payload)
}

export async function updateAdminPayoutStatus(id: string | number, action: 'approve' | 'reject' | 'processing' | 'paid'): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/payouts/${id}/${action}`, 'POST')
}

export async function getAdminPayoutTransaction(id: string | number): Promise<AdminRecord> {
  return apiRequest<AdminRecord>(`/admin/payouts/${id}/transaction`)
}

export async function getAdminCategories(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/categories')
  return normalizeList<AdminRecord>(response)
}

export async function createAdminCategory(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/categories', 'POST', payload)
}

export async function updateAdminCategory(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/categories/${id}`, 'PATCH', payload)
}

export async function reorderAdminCategory(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/categories/${id}/reorder`, 'PATCH', payload)
}

export async function deleteAdminCategory(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/categories/${id}`, 'DELETE')
}

export async function getAdminBrands(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/brands')
  return normalizeList<AdminRecord>(response)
}

export async function createAdminBrand(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/brands', 'POST', payload)
}

export async function updateAdminBrand(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/brands/${id}`, 'PATCH', payload)
}

export async function deleteAdminBrand(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/brands/${id}`, 'DELETE')
}

export async function getAdminPackages(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/packages')
  return normalizeList<AdminRecord>(response)
}

export async function createAdminPackage(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/packages', 'POST', payload)
}

export async function updateAdminPackage(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/packages/${id}`, 'PATCH', payload)
}

export async function deleteAdminPackage(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/packages/${id}`, 'DELETE')
}

export async function getAdminReviews(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/reviews')
  return normalizeList<AdminRecord>(response)
}

export async function updateAdminReviewStatus(id: string | number, status: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/reviews/${id}/status`, 'PATCH', { status })
}

export async function deleteAdminReview(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/reviews/${id}`, 'DELETE')
}

export async function replyToAdminReview(id: string | number, text: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/reviews/${id}/reply`, 'POST', { text })
}

export async function getAdminRefunds(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/refunds')
  return normalizeList<AdminRecord>(response)
}

export async function createAdminRefund(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/refunds', 'POST', payload)
}

export async function updateAdminRefundStatus(id: string | number, status: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/refunds/${id}/status`, 'PATCH', { status })
}

export async function getAdminCommissions(): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/commissions')
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminProductQueries(): Promise<AdminRecord[]> {
  const response = await apiRequest<AdminRecord[]>('/admin/product-queries')
  return normalizeList<AdminRecord>(response)
}

export async function getAdminCommissionOverview(query: { from?: string; to?: string; sellerId?: string; orderId?: string } = {}): Promise<AdminRecord> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value) })
  return apiRequest<AdminRecord>(`/admin/commission-overview${params.toString() ? `?${params.toString()}` : ''}`)
}

export async function getAdminReports(): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/reports')
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminSettings(): Promise<AdminRecord> {
  try {
    const response = await apiRequest<AdminRecord>('/admin/settings')
    return response && typeof response === 'object' ? response : {}
  } catch {
    return {}
  }
}

export async function updateAdminSettings(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/settings', 'PATCH', payload)
}

export async function getSubscriptionPlans(): Promise<AdminRecord[]> {
  const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>('/admin/subscription-plans')
  return normalizeList<AdminRecord>(response)
}

export async function createSubscriptionPlan(payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>('/admin/subscription-plans', 'POST', payload)
}

export async function updateSubscriptionPlan(id: string, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/subscription-plans/${id}`, 'PATCH', payload)
}

export async function deleteSubscriptionPlan(id: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/subscription-plans/${id}`, 'DELETE')
}

export async function getAdminDashboardOverview(): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>('/admin/dashboard')
  } catch {
    return {}
  }
}

export async function approveSeller(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/sellers/${id}/approve`, 'PATCH')
}

export async function rejectSeller(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/sellers/${id}/reject`, 'PATCH')
}

export async function approveSellerApplication(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/seller-applications/${id}/approve`, 'POST')
}

export async function rejectSellerApplication(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/seller-applications/${id}/reject`, 'POST')
}

export async function approveProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/approve`, 'PATCH')
}

export async function rejectProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/reject`, 'PATCH')
}

export async function suspendProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/suspend`, 'PATCH')
}

export async function featureProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/feature`, 'PATCH')
}

export async function archiveProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/archive`, 'PATCH')
}

export async function deleteProduct(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}`, 'DELETE')
}

export async function updateProductStatus(id: string | number, status: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/products/${id}/status`, 'PATCH', { status })
}

export async function approvePayout(id: string | number): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/payouts/${id}/approve`, 'POST')
}

export async function getAdminUserById(id: string | number): Promise<AdminRecord> {
  try {
    return await apiRequest<AdminRecord>(`/admin/users/${id}`)
  } catch {
    return {}
  }
}

export async function updateAdminUser(id: string | number, payload: Record<string, unknown>): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/users/${id}`, 'PATCH', payload)
}

export async function updateAdminUserStatus(id: string | number, payload: { status?: string; isBlocked?: boolean }): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/users/${id}/status`, 'PATCH', payload)
}

export async function deleteAdminUser(id: string | number): Promise<AdminRecord> {
  return apiRequest<AdminRecord>(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function resetAdminUserPassword(id: string | number, password: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/admin/users/${id}/reset-password`, 'POST', { password })
}

export async function getAdminUserOrders(id: string | number): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>(`/admin/users/${id}/orders`)
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminUserPayments(id: string | number): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>(`/admin/users/${id}/payments`)
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function getAdminUserActivity(id: string | number): Promise<AdminRecord[]> {
  try {
    const response = await apiRequest<{ items?: AdminRecord[]; data?: AdminRecord[] } | AdminRecord[]>(`/admin/users/${id}/activity`)
    return normalizeList<AdminRecord>(response)
  } catch {
    return []
  }
}

export async function updateOrderStatus(id: string | number, status: string): Promise<AdminRecord> {
  return apiMutation<AdminRecord>(`/orders/${id}/status`, 'PATCH', { status })
}

export const adminUsersService = Object.freeze({
  list: getAdminUsers,
  getById: getAdminUserById,
  update: updateAdminUser,
  updateStatus: updateAdminUserStatus,
  delete: deleteAdminUser,
  resetPassword: resetAdminUserPassword,
  getOrders: getAdminUserOrders,
  getPayments: getAdminUserPayments,
  getActivity: getAdminUserActivity,
})

export const adminSellersService = Object.freeze({
  list: getAdminSellers,
  getById: getAdminSellerById,
  update: updateAdminSeller,
  updateStatus: updateAdminSellerStatus,
  getProducts: getAdminSellerProducts,
  getOrders: getAdminSellerOrders,
  getEarnings: getAdminSellerEarnings,
  getApplications: getAdminSellerApplications,
  getApplicationById: getAdminSellerApplicationById,
  approve: approveSeller,
  reject: rejectSeller,
})

export const adminProductsService = Object.freeze({
  list: getAdminProducts,
  getById: getAdminProductById,
  approve: approveProduct,
  reject: rejectProduct,
  suspend: suspendProduct,
  feature: featureProduct,
  archive: archiveProduct,
  delete: deleteProduct,
  updateStatus: updateProductStatus,
})

export const adminOrdersService = Object.freeze({
  list: getAdminOrders,
  getById: getAdminOrderById,
  cancel: cancelAdminOrder,
  refund: refundAdminOrder,
  contactParticipant: contactAdminOrderParticipant,
  getDocument: getAdminOrderDocument,
  updateStatus: updateOrderStatus,
})

export const adminPaymentsService = Object.freeze({
  list: getAdminPayments,
})

export const adminWithdrawalsService = Object.freeze({
  list: getAdminWithdrawals,
  updateStatus: updateAdminPayoutStatus,
  getTransaction: getAdminPayoutTransaction,
  approve: approvePayout,
})

export const adminCategoriesService = Object.freeze({
  list: getAdminCategories,
  create: createAdminCategory,
  update: updateAdminCategory,
  reorder: reorderAdminCategory,
  delete: deleteAdminCategory,
})

export const adminBrandsService = Object.freeze({
  list: getAdminBrands,
  create: createAdminBrand,
  update: updateAdminBrand,
  delete: deleteAdminBrand,
})

export const adminReviewsService = Object.freeze({
  list: getAdminReviews,
  updateStatus: updateAdminReviewStatus,
  delete: deleteAdminReview,
  reply: replyToAdminReview,
})

export const adminRefundsService = Object.freeze({
  list: getAdminRefunds,
  create: createAdminRefund,
  updateStatus: updateAdminRefundStatus,
})

export const adminCommissionsService = Object.freeze({
  list: getAdminCommissions,
  getOverview: getAdminCommissionOverview,
})

export const adminReportsService = Object.freeze({
  list: getAdminReports,
})

export const adminSettingsService = Object.freeze({
  get: getAdminSettings,
  update: updateAdminSettings,
})

export const adminSupportService = Object.freeze({
  listConversations: fetchAdminChatConversations,
  getMessages: fetchAdminChatMessages,
  searchMessages: searchAdminChatMessages,
  sendMessage: sendAdminChatMessage,
  markRead: markAdminConversationRead,
  updateConversation: updateAdminConversation,
  closeConversation: closeAdminConversation,
  reopenConversation: reopenAdminConversation,
  setTyping: setAdminConversationTyping,
})
