import { apiRequest } from '@/services/api'

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

export async function fetchMarketplaceProducts(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const suffix = query.size ? `?${query.toString()}` : ''
  const response = await apiRequest<{ items: MarketplaceProduct[]; total: number; page: number; limit: number; totalPages: number }>(`/public/products${suffix}`)
  const uniqueItems = [...new Map(response.items.map((item) => [item.id, item])).values()]
  return { ...response, items: uniqueItems }
}

export async function fetchMarketplaceProduct(id: string) {
  return apiRequest<MarketplaceProduct>(`/public/products/${id}`)
}
