export type KpiItem = {
  label: string
  value: string
  delta: string
  tone: 'emerald' | 'sky' | 'violet' | 'rose'
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
  status: 'Paid' | 'Pending' | 'Shipped' | 'Returned'
}

export type SupportItem = {
  title: string
  count: number
  color: string
}

export type AdminOverview = {
  kpis: KpiItem[]
  salesBars: number[]
  topSellers: SellerSummary[]
  recentOrders: RecentOrder[]
  supportQueue: SupportItem[]
}
