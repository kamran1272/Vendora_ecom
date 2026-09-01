export type MarketplaceProduct = {
  id: string
  name: string
  slug?: string
  category: string
  brand: string
  seller: string
  shop: string
  price: number
  oldPrice?: number
  rating: number
  popularity: number
  inStock: boolean
  attributes: string[]
  badge?: string
  description?: string
  images?: string[]
  stock?: number
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://127.0.0.1:4003/api'

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)

  if (!response.ok) {
    throw new Error(`Marketplace request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export async function fetchMarketplaceProducts(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const suffix = query.size ? `?${query.toString()}` : ''
  return apiRequest<{ items: MarketplaceProduct[]; total: number; page: number; limit: number; totalPages: number }>(`/public/products${suffix}`)
}

export async function fetchMarketplaceProduct(id: string) {
  return apiRequest<MarketplaceProduct>(`/public/products/${id}`)
}
