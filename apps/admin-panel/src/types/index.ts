export type KpiItem = {
  label: string
  value: string
  delta: string
  tone: 'emerald' | 'sky' | 'violet' | 'rose' | 'amber' | 'slate'
}

export type SellerSummary = {
  name: string
  sales: string
  rating: string
  orders: number
}

export type RecentOrder = {
  id: string
  customer: string
  total: string
  status: 'Paid' | 'Pending' | 'Shipped' | 'Delivered' | 'Returned'
}

export type SupportItem = {
  title: string
  count: number
  color: string
}

export type ChartPoint = {
  label: string
  value: number
}

export type TopSellerMetric = {
  name: string
  revenue: number
  orders: number
  rating: number
  status: string
}

export type TopProductMetric = {
  name: string
  revenue: number
  units: number
  stock: number
  status: string
}

export type PaymentRecord = {
  id: string
  customer: string
  amount: number
  method: string
  status: string
  date: string
}

export type SupportTicket = {
  id: string
  customer: string
  subject: string
  priority: string
  status: string
  lastMessageAt: string
}

export type DashboardOverview = {
  range: '7d' | '30d' | '365d' | 'custom'
  kpis: KpiItem[]
  revenueTrend: ChartPoint[]
  ordersTrend: ChartPoint[]
  customersTrend: ChartPoint[]
  commissionTrend: ChartPoint[]
  categorySales: ChartPoint[]
  sellerPerformance: ChartPoint[]
  topSellers: TopSellerMetric[]
  topProducts: TopProductMetric[]
  recentOrders: RecentOrder[]
  recentPayments: PaymentRecord[]
  supportQueue: SupportTicket[]
  stats: {
    grossRevenue: number
    netRevenue: number
    gmv: number
    orders: number
    customers: number
    sellers: number
    products: number
    refunds: number
    commissions: number
    averageOrderValue: number
    conversionRate: number
    activeSellers: number
    pendingSellerApplications: number
    lowStockProducts: number
    supportTickets: number
  }
}
