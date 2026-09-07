export type SellerProductItem = {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  basePrice: number
  stock: number
  status: string
  images: string[]
}

export type SellerStorehouseItem = SellerProductItem & {
  sellerMargin: number
  barcode?: string | null
}
