import { api } from './api'

export type WarehouseProduct = {
  id: string
  name: string
  sku: string
  barcode?: string | null
  images: string[]
  category?: string | null
  brand?: string | null
  basePrice: number
  sellerMargin: number
  stock: number
  status: string
}

export type WarehouseResponse = {
  items: WarehouseProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
  categories: string[]
  brands: string[]
}

export type SellerState = {
  sellerId: string
  status: string
  currentCount: number
  remainingSlots: number | null
  plan: { name: string; productLimit: number; price: number; duration: number; features: string[] }
}

export async function getWarehouseProducts(params: Record<string, string | number | undefined>) {
  const { data } = await api.get<WarehouseResponse>('/seller/product-warehouse', { params })
  return data
}

export async function getSellerState() {
  const { data } = await api.get<SellerState>('/seller/subscription')
  return data
}

export async function getSellerProducts() {
  const { data } = await api.get<WarehouseProduct[]>('/seller/products')
  return data
}

export async function addWarehouseProducts(productIds: string[]) {
  const { data } = await api.post('/seller/product-warehouse/add', { productIds })
  return data as { success: boolean; code?: string; message?: string; addedCount?: number; currentCount?: number; productLimit?: number; requestedCount?: number; remainingSlots?: number }
}
