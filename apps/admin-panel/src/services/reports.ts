const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
import { AdminApiError, notifyAdminApiError } from './adminApi'
const token = () => localStorage.getItem('access_token') || localStorage.getItem('accessToken')

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    const error = new AdminApiError('NETWORK', undefined, 'The server could not be reached.')
    notifyAdminApiError(error)
    throw error
  }
  if (!response.ok) {
    const error = new AdminApiError(response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : response.status === 400 || response.status === 422 ? 'VALIDATION' : response.status >= 500 ? 'SERVER' : 'UNKNOWN', response.status, await response.text())
    notifyAdminApiError(error)
    throw error
  }
  return response.json() as Promise<T>
}

export interface ReportFilters {
  from?: string
  to?: string
  sellerId?: string
  categoryId?: string
}

// Sales Report
export interface SalesReportData {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    period: { from?: string; to?: string }
  }
  chartData: Array<{ date: string; revenue: number }>
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>
}

export const getSalesReport = (filters: ReportFilters) =>
  request<SalesReportData>(`/reports/sales?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Orders Report
export interface OrdersReportData {
  summary: {
    totalOrders: number
    completedOrders: number
    pendingOrders: number
    cancelledOrders: number
    period: { from?: string; to?: string }
  }
  statusDistribution: Array<{ status: string; count: number }>
  chartData: Array<{ date: string; count: number }>
  orders: Array<{
    id: string
    orderNumber: string
    customer: string
    email: string
    total: number
    status: string
    itemCount: number
    createdAt: Date
  }>
}

export const getOrdersReport = (filters: ReportFilters) =>
  request<OrdersReportData>(`/reports/orders?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Products Report
export interface ProductsReportData {
  summary: {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    period: { from?: string; to?: string }
  }
  chartData: Array<{ name: string; value: number }>
  products: Array<{
    id: string
    name: string
    sku: string
    category: string
    stock: number
    sold: number
    revenue: number
  }>
}

export const getProductsReport = (filters: ReportFilters) =>
  request<ProductsReportData>(`/reports/products?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Sellers Report
export interface SellersReportData {
  summary: {
    totalSellers: number
    activeSellers: number
    totalSellerRevenue: number
    period: { from?: string; to?: string }
  }
  chartData: Array<{ name: string; revenue: number }>
  sellers: Array<{
    id: string
    name: string
    shop: string
    email: string
    status: string
    orderCount: number
    revenue: number
  }>
}

export const getSellersReport = (filters: ReportFilters) =>
  request<SellersReportData>(`/reports/sellers?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Customers Report
export interface CustomersReportData {
  summary: {
    totalCustomers: number
    activeCustomers: number
    totalCustomerRevenue: number
    averageOrderValue: number
    period: { from?: string; to?: string }
  }
  chartData: Array<{ name: string; value: number }>
  customers: Array<{
    id: string
    name: string
    email: string
    phone: string
    orderCount: number
    totalSpent: number
    lastOrder: Date | null
  }>
}

export const getCustomersReport = (filters: ReportFilters) =>
  request<CustomersReportData>(`/reports/customers?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Financial Report
export interface FinancialReportData {
  summary: {
    grossRevenue: number
    vendoraCommission: number
    sellerEarnings: number
    paymentFees: number
    netRevenue: number
    totalOrders: number
    period: { from?: string; to?: string }
  }
  breakdown: Array<{ label: string; value: number }>
}

export const getFinancialReport = (filters: ReportFilters) =>
  request<FinancialReportData>(`/reports/financial?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Refunds Report
export interface RefundsReportData {
  summary: {
    totalRefunds: number
    totalRefundAmount: number
    approvedAmount: number
    pendingAmount: number
    approvalRate: number
    period: { from?: string; to?: string }
  }
  statusDistribution: Array<{ status: string; count: number }>
  reasonDistribution: Array<{ reason: string; count: number }>
  refunds: Array<{
    id: string
    orderId: string
    customer: string
    amount: number
    reason: string
    status: string
    requestedAt: Date
  }>
}

export const getRefundsReport = (filters: ReportFilters) =>
  request<RefundsReportData>(`/reports/refunds?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Withdrawals Report
export interface WithdrawalsReportData {
  summary: {
    totalWithdrawals: number
    totalWithdrawalAmount: number
    processedAmount: number
    pendingAmount: number
    averageWithdrawal: number
    period: { from?: string; to?: string }
  }
  statusDistribution: Array<{ status: string; count: number }>
  chartData: Array<{ status: string; count: number }>
  payouts: Array<{
    id: string
    seller: string
    shop: string
    amount: number
    status: string
    createdAt: Date
  }>
}

export const getWithdrawalsReport = (filters: ReportFilters) =>
  request<WithdrawalsReportData>(`/reports/withdrawals?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// Commissions Report
export interface CommissionsReportData {
  summary: {
    totalGMV: number
    totalCommission: number
    totalSellerEarnings: number
    averageCommissionRate: number
    period: { from?: string; to?: string }
  }
  chartData: Array<{ seller: string; gmv: number }>
  commissions: Array<{
    id: string
    seller: string
    shop: string
    gmv: number
    commission: number
    earnings: number
  }>
}

export const getCommissionsReport = (filters: ReportFilters) =>
  request<CommissionsReportData>(`/reports/commissions?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any)}`)

// CSV Export utility
export function exportToCSV(filename: string, data: any[]) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}
