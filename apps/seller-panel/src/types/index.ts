export type SellerDashboardResponse = {
  shop: {
    name: string
    role?: string
    rating: number
    verified: boolean
  }
  statistics: {
    products: number
    totalOrders: number
    totalSales: number
    todayViews: number
  }
  sales: {
    today: number
    yesterday: number
    currentMonth: number
    lastMonth: number
  }
  orders: {
    newOrder: number
    cancelled: number
    onDelivery: number
    delivered: number
  }
  packageInfo?: {
    name: string
    uploadLimit: number
    expiresAt: string
  }
}

export type SellerProduct = {
  id: number
  name: string
  category: string
  qty: number
  basePrice: number
  sellingPrice: number
  costPrice: number
  featured: boolean
  image: string
}
