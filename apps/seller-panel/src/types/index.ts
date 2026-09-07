export type SellerDashboardResponse = {
  shop: {
    name: string
    role?: string
    rating: number | null
    verified: boolean
    logo?: string | null
    description?: string | null
  }
  statistics: {
    products: number
    totalOrders: number
    totalSales: number
    todayViews: number | null
  }
  sales: {
    today: number
    yesterday: number
    currentMonth: number
    lastMonth: number
  }
  orders: {
    newOrder: number
    pending?: number
    processing?: number
    cancelled: number
    onDelivery: number
    delivered: number
    thisMonth?: {
      newOrder: number
      cancelled: number
      onDelivery: number
      delivered: number
    }
  }
  categoryCounts?: Array<{ name: string; count: number }>
  topProducts?: Array<{ id: string | number; name: string; price: number; image: string }>
  packageInfo?: {
    name: string
    uploadLimit: number
    expiresAt: string | null
  }
  kpis?: {
    totalOrders: number
    pendingOrders: number
    processingOrders: number
    deliveredOrders: number
    totalSales: number
    totalProfit: number
    availableBalance: number
    pendingWithdrawal: number
    totalProducts: number
    lowStockProducts: number
    customerMessages: number
    pendingRefunds: number
    unreadNotifications?: number
  }
  charts?: {
    daily: SellerChartPoint[]
    weekly: SellerChartPoint[]
    monthly: SellerChartPoint[]
    yearly: SellerChartPoint[]
    orders: Array<{ status: string; count: number }>
    revenueProfit: SellerChartPoint[]
    productPerformance: SellerProductPerformance[]
  }
  recentOrders?: SellerRecentOrder[]
}

export type SellerChartPoint = {
  label: string
  revenue: number
  profit: number
  orders: number
}

export type SellerProductPerformance = {
  id: string
  name: string
  units: number
  revenue: number
  profit: number
  stock: number
  price?: number | null
  rating?: number | null
  image?: string | null
}

export type SellerRecentOrder = {
  id: string
  customer: string
  products: string
  amount: number
  profit: number
  paymentStatus: string
  pickupStatus: string
  deliveryStatus: string
  date: string
  canProcess: boolean
  canContact: boolean
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
