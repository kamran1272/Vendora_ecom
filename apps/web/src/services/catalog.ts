import { apiRequest } from '@/services/api'

export type CatalogCategory = {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  sortOrder?: number | null
}

export type CatalogBrand = {
  id: string
  name: string
  description?: string | null
  logo?: string | null
}

export type CatalogShop = {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  sellerId?: string | null
}

export function fetchCatalogCategories() {
  return apiRequest<CatalogCategory[]>('/categories')
}

export function fetchCatalogBrands() {
  return apiRequest<CatalogBrand[]>('/brands')
}

export function fetchCatalogShops() {
  return apiRequest<CatalogShop[]>('/shops')
}

export function fetchCatalogShop(id: string) {
  return apiRequest<CatalogShop>(`/shops/${encodeURIComponent(id)}`)
}
