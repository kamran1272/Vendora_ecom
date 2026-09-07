import type { SellerProduct } from '../types'

export const getSellerProducts = async (): Promise<SellerProduct[]> => {
  try {
    const response = await fetch('/api/seller/products')
    if (!response.ok) {
      return []
    }

    return (await response.json()) as SellerProduct[]
  } catch {
    return []
  }
}
