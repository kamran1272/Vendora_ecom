import { getStoredAuthToken, useAuth } from '@/store/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'

export function getAuthToken() {
  return getStoredAuthToken()
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401) {
      useAuth.getState().logout()
    }
    throw new Error(data?.message || `Request failed with status ${response.status}`)
  }

  return (data as T) ?? ({} as T)
}