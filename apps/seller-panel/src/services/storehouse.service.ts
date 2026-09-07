import { api } from './api'

export type WarehouseProduct = {
  id: string
  name: string
  sku: string
  barcode?: string | null
  images: string[]
  category?: string | null
  subcategory?: string | null
  brand?: string | null
  basePrice: number
  sellerMargin: number
  rating?: number | null
  discountPercentage?: number | null
  stock: number
  status: string
  sellerProductId?: string | null
  addedToStore?: boolean
  sellerPrice?: number
  sellerStatus?: string | null
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

export async function getWarehouseProducts(params: Record<string, string | number | undefined>, signal?: AbortSignal) {
  const { data } = await api.get<WarehouseResponse>('/seller/product/storehouse/search', { params, signal })
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
  const { data } = await api.post('/seller/product/storehouse/add', { warehouseProductIds: productIds })
  return data as {
    success: boolean
    code?: string
    message?: string
    addedCount?: number
    replacedCount?: number
    createdCount?: number
    alreadyExistsCount?: number
    failedCount?: number
    currentCount?: number
    productLimit?: number
    requestedCount?: number
    remainingSlots?: number
  }
}

export async function addAllWarehouseProducts(filters: Record<string, string | number>) {
  const { data } = await api.post('/seller/product/storehouse/add-all', filters)
  return data as { success: boolean; code?: string; message?: string; matchedCount?: number; batchLimit?: number; createdCount?: number; alreadyExistsCount?: number; failedCount?: number }
}

export async function removeWarehouseProduct(warehouseProductId: string) {
  const { data } = await api.delete(`/seller/product/storehouse/${warehouseProductId}`)
  return data as { success: boolean; message: string }
}
