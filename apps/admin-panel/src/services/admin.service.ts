import { fetchAdminChatConversations } from './chat'
import { getAdminBrands, getAdminCategories, getAdminCommissions, getAdminOrders, getAdminPackages, getAdminPayments, getAdminProducts, getAdminRefunds, getAdminSellerApplications, getAdminSellers, getAdminUsers, getAdminWithdrawals } from './adminApi'
import type { DashboardOverview, PaymentRecord, RecentOrder, TopProductMetric, TopSellerMetric } from '../types'

export type DashboardRange = '7d' | '30d' | '365d' | 'custom'

const numberFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const compactNumberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

function toNumber(value: unknown): number {
  return Number(value ?? 0) || 0
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatMoney(value: number): string {
  return numberFormatter.format(value || 0)
}

function withinRange(dateValue: unknown, range: DashboardRange, customFrom?: string, customTo?: string): boolean {
  const date = toDate(dateValue)
  if (!date) return true

  const now = new Date()
  const from = customFrom ? new Date(customFrom) : new Date(now)
  const to = customTo ? new Date(customTo) : new Date(now)

  if (range === '7d') {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 7)
    return date >= cutoff && date <= now
  }

  if (range === '30d') {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 30)
    return date >= cutoff && date <= now
  }

  if (range === '365d') {
    const cutoff = new Date(now)
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    return date >= cutoff && date <= now
  }

  if (range === 'custom' && customFrom && customTo) {
    const start = new Date(customFrom)
    const end = new Date(customTo)
    end.setHours(23, 59, 59, 999)
    return date >= start && date <= end
  }

  return date >= from && date <= to
}

function getRangeBounds(range: DashboardRange, customFrom?: string, customTo?: string) {
  const now = new Date()
  const to = range === 'custom' && customTo ? new Date(`${customTo}T23:59:59.999`) : now
  const from = range === 'custom' && customFrom
    ? new Date(`${customFrom}T00:00:00.000`)
    : new Date(now.getTime() - (range === '7d' ? 6 : range === '365d' ? 364 : 29) * 24 * 60 * 60 * 1000)
  return { from, to }
}

function getPreviousRangeBounds(range: DashboardRange, customFrom?: string, customTo?: string) {
  const current = getRangeBounds(range, customFrom, customTo)
  const span = current.to.getTime() - current.from.getTime() + 1
  const to = new Date(current.from.getTime() - 1)
  return { from: new Date(to.getTime() - span + 1), to }
}

function inBounds(dateValue: unknown, bounds: { from: Date; to: Date }) {
  const date = toDate(dateValue)
  return Boolean(date && date >= bounds.from && date <= bounds.to)
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? '0.0%' : 'N/A'
  const delta = ((current - previous) / Math.abs(previous)) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

function buildDatedTrend(
  records: unknown[],
  range: DashboardRange,
  customFrom: string | undefined,
  customTo: string | undefined,
  valueOf: (record: Record<string, unknown>) => number,
) {
  const { from, to } = getRangeBounds(range, customFrom, customTo)
  const bucketCount = 7
  const span = Math.max(1, to.getTime() - from.getTime())
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: new Date(from.getTime() + (span * index) / bucketCount).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: 0,
  }))

  records.forEach((record) => {
    const item = record as Record<string, unknown>
    const date = toDate(item.createdAt ?? item.requestedAt ?? item.date)
    if (!date || date < from || date > to) return
    const index = Math.min(bucketCount - 1, Math.floor(((date.getTime() - from.getTime()) / span) * bucketCount))
    buckets[index].value += valueOf(item)
  })

  return buckets
}

function getStatusTone(status: string): RecentOrder['status'] {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('delivered')) return 'Delivered'
  if (normalized.includes('shipped')) return 'Shipped'
  if (normalized.includes('paid') || normalized.includes('completed')) return 'Paid'
  if (normalized.includes('returned')) return 'Returned'
  return 'Pending'
}

export const getAdminOverview = async (
  range: DashboardRange = '30d',
  customFrom?: string,
  customTo?: string,
): Promise<DashboardOverview> => {
  const [orders, payments, sellers, products, users, applications, refunds, commissions, categories, brands, withdrawals] = await Promise.all([
    getAdminOrders().catch(() => []),
    getAdminPayments().catch(() => []),
    getAdminSellers().catch(() => []),
    getAdminProducts().catch(() => []),
    getAdminUsers().catch(() => []),
    getAdminSellerApplications().catch(() => []),
    getAdminRefunds().catch(() => []),
    getAdminCommissions().catch(() => []),
    getAdminCategories().catch(() => []),
    getAdminBrands().catch(() => []),
    getAdminWithdrawals().catch(() => []),
  ])

  const conversations = await fetchAdminChatConversations().catch(() => [])

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => withinRange((order as Record<string, unknown>).createdAt ?? (order as Record<string, unknown>).date, range, customFrom, customTo))
  const filteredPayments = (Array.isArray(payments) ? payments : []).filter((payment) => withinRange((payment as Record<string, unknown>).createdAt ?? (payment as Record<string, unknown>).date, range, customFrom, customTo))
  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => withinRange((user as Record<string, unknown>).createdAt ?? (user as Record<string, unknown>).joinedAt, range, customFrom, customTo))
  const filteredRefunds = (Array.isArray(refunds) ? refunds : []).filter((refund) => withinRange((refund as Record<string, unknown>).requestedAt ?? (refund as Record<string, unknown>).createdAt, range, customFrom, customTo))
  const filteredCommissions = (Array.isArray(commissions) ? commissions : []).filter((commission) => withinRange((commission as Record<string, unknown>).createdAt ?? (commission as Record<string, unknown>).date, range, customFrom, customTo))

  const previousBounds = getPreviousRangeBounds(range, customFrom, customTo)
  const previousOrders = (Array.isArray(orders) ? orders : []).filter((order) => inBounds((order as Record<string, unknown>).createdAt ?? (order as Record<string, unknown>).date, previousBounds))
  const previousUsers = (Array.isArray(users) ? users : []).filter((user) => inBounds((user as Record<string, unknown>).createdAt ?? (user as Record<string, unknown>).joinedAt, previousBounds))
  const previousSellers = (Array.isArray(sellers) ? sellers : []).filter((seller) => inBounds((seller as Record<string, unknown>).createdAt ?? (seller as Record<string, unknown>).registeredAt, previousBounds))
  const previousProducts = (Array.isArray(products) ? products : []).filter((product) => inBounds((product as Record<string, unknown>).createdAt, previousBounds))
  const previousRefunds = (Array.isArray(refunds) ? refunds : []).filter((refund) => inBounds((refund as Record<string, unknown>).requestedAt ?? (refund as Record<string, unknown>).createdAt, previousBounds))
  const previousCommissions = (Array.isArray(commissions) ? commissions : []).filter((commission) => inBounds((commission as Record<string, unknown>).createdAt ?? (commission as Record<string, unknown>).date, previousBounds))

  const grossRevenue = filteredOrders.reduce((sum, order) => sum + toNumber((order as Record<string, unknown>).total), 0)
  const refundAmount = filteredRefunds.reduce((sum, refund) => sum + toNumber((refund as Record<string, unknown>).amount), 0)
  const commissionAmount = filteredCommissions.reduce((sum, commission) => sum + toNumber((commission as Record<string, unknown>).commission ?? (commission as Record<string, unknown>).amount ?? 0), 0)
  const paymentVolume = filteredPayments.reduce((sum, payment) => sum + toNumber((payment as Record<string, unknown>).amount), 0)
  const netSales = Math.max(0, grossRevenue - refundAmount)
  const gmv = grossRevenue
  const netRevenue = Math.max(0, netSales - commissionAmount)
  // Snapshot metrics describe the current marketplace. Only trends and financial
  // flow metrics are scoped to the selected reporting period.
  const totalCustomers = Array.isArray(users) ? users.length : 0
  const totalSellers = Array.isArray(sellers) ? sellers.length : 0
  const totalProducts = Array.isArray(products) ? products.length : 0
  const activeSellers = (Array.isArray(sellers) ? sellers : []).filter((seller) => String((seller as Record<string, unknown>).status ?? '').toLowerCase() === 'active').length
  const pendingSellerApplications = (Array.isArray(applications) ? applications : []).filter((application) => String((application as Record<string, unknown>).status ?? '').toLowerCase().includes('pending')).length
  const lowStockProducts = (Array.isArray(products) ? products : []).filter((product) => toNumber((product as Record<string, unknown>).stock) <= 10).length
  const supportTickets = conversations.filter((conversation) => !['resolved', 'closed'].includes(String((conversation as Record<string, unknown>).status ?? '').toLowerCase())).length
  const averageOrderValue = filteredOrders.length ? grossRevenue / filteredOrders.length : 0
  const conversionRate = totalCustomers ? Math.min(100, (filteredOrders.length / totalCustomers) * 100) : 0
  const previousGrossRevenue = previousOrders.reduce((sum, order) => sum + toNumber((order as Record<string, unknown>).total), 0)
  const previousRefundAmount = previousRefunds.reduce((sum, refund) => sum + toNumber((refund as Record<string, unknown>).amount), 0)
  const previousCommissionAmount = previousCommissions.reduce((sum, commission) => sum + toNumber((commission as Record<string, unknown>).commission ?? (commission as Record<string, unknown>).amount), 0)
  const previousNetRevenue = Math.max(0, previousGrossRevenue - previousRefundAmount - previousCommissionAmount)

  const revenueTrend = buildDatedTrend(filteredOrders, range, customFrom, customTo, (order) => toNumber(order.total))
  const ordersTrend = buildDatedTrend(filteredOrders, range, customFrom, customTo, () => 1)
  const customersTrend = buildDatedTrend(filteredUsers, range, customFrom, customTo, () => 1)
  const commissionTrend = buildDatedTrend(filteredCommissions, range, customFrom, customTo, (commission) => toNumber(commission.commission ?? commission.amount))

  const orderItems: Array<Record<string, unknown>> = (Array.isArray(filteredOrders) ? filteredOrders : []).flatMap((order) => {
    const record = order as Record<string, unknown>
    return (Array.isArray(record.items) ? record.items : []).map((item) => ({
      ...(item as Record<string, unknown>),
      orderCreatedAt: record.createdAt,
    }))
  })
  const categorySales = [...orderItems.reduce((totals, item) => {
    const category = String(item.category ?? item.productCategory ?? 'Uncategorized')
    totals.set(category, (totals.get(category) ?? 0) + toNumber(item.price) * toNumber(item.quantity || 1))
    return totals
  }, new Map<string, number>())].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  const sellerPerformance = ((Array.isArray(sellers) ? sellers : []) as Array<Record<string, unknown>>).slice(0, 6).map((seller, index) => ({ label: String((seller as Record<string, unknown>).shopName ?? (seller as Record<string, unknown>).sellerName ?? `Seller ${index + 1}`), value: toNumber((seller as Record<string, unknown>).earnings ?? (seller as Record<string, unknown>).revenue ?? 0) }))

  const topSellers: TopSellerMetric[] = (Array.isArray(sellers) ? sellers : [])
    .slice(0, 5)
    .map((seller) => ({
      name: String((seller as Record<string, unknown>).shopName ?? (seller as Record<string, unknown>).sellerName ?? 'Seller'),
      revenue: toNumber((seller as Record<string, unknown>).earnings ?? (seller as Record<string, unknown>).revenue ?? 0),
      orders: toNumber((seller as Record<string, unknown>).orders ?? 0),
      rating: toNumber((seller as Record<string, unknown>).rating),
      status: String((seller as Record<string, unknown>).status ?? 'ACTIVE'),
    }))

  const productCatalog = new Map((Array.isArray(products) ? products : []).map((product) => [String((product as Record<string, unknown>).id), product as Record<string, unknown>]))
  const topProducts: TopProductMetric[] = [...orderItems.reduce((totals, item) => {
    const id = String(item.productId ?? item.warehouseProductId ?? item.name)
    const current = totals.get(id) ?? { name: String(item.name ?? 'Product'), revenue: 0, units: 0 }
    current.revenue += toNumber(item.price) * toNumber(item.quantity || 1)
    current.units += toNumber(item.quantity || 1)
    totals.set(id, current)
    return totals
  }, new Map<string, { name: string; revenue: number; units: number }>())].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([id, item]) => ({
    name: item.name,
    revenue: item.revenue,
    units: item.units,
    stock: toNumber(productCatalog.get(id)?.stock),
    status: String(productCatalog.get(id)?.status ?? 'UNKNOWN'),
  }))

  const recentOrders: RecentOrder[] = (Array.isArray(orders) ? orders : [])
    .slice(0, 5)
    .map((order) => ({
      id: String((order as Record<string, unknown>).id ?? '#0000'),
      customer: String((order as Record<string, unknown>).customerName ?? (order as Record<string, unknown>).customer ?? 'Customer'),
      total: formatMoney(toNumber((order as Record<string, unknown>).total)),
      status: getStatusTone(String((order as Record<string, unknown>).status ?? 'Pending')),
    }))

  const recentPayments: PaymentRecord[] = (Array.isArray(payments) ? payments : [])
    .slice(0, 5)
    .map((payment) => ({
      id: String((payment as Record<string, unknown>).id ?? 'txn_0000'),
      customer: String((payment as Record<string, unknown>).customer ?? 'Customer'),
      amount: toNumber((payment as Record<string, unknown>).amount),
      method: String((payment as Record<string, unknown>).method ?? 'Card'),
      status: String((payment as Record<string, unknown>).status ?? 'Completed'),
      date: String((payment as Record<string, unknown>).createdAt ?? (payment as Record<string, unknown>).date ?? new Date().toISOString()),
    }))

  const supportQueue = conversations.slice(0, 6).map((conversation, index) => ({
    id: String((conversation as Record<string, unknown>).id ?? `ticket-${index + 1}`),
    customer: String(((conversation as Record<string, unknown>).customer as { name?: unknown } | undefined)?.name ?? 'Customer'),
    subject: String((conversation as Record<string, unknown>).subject ?? (conversation as Record<string, unknown>).type ?? 'Support request'),
    priority: String((conversation as Record<string, unknown>).priority ?? 'NORMAL'),
    status: String((conversation as Record<string, unknown>).status ?? 'OPEN'),
    lastMessageAt: String((conversation as Record<string, unknown>).lastMessageAt ?? new Date().toISOString()),
  }))

  const kpis = [
    { label: 'Gross Revenue', value: formatMoney(grossRevenue), delta: formatDelta(grossRevenue, previousGrossRevenue), tone: 'emerald' as const },
    { label: 'Net Revenue', value: formatMoney(netRevenue), delta: formatDelta(netRevenue, previousNetRevenue), tone: 'sky' as const },
    { label: 'GMV', value: formatMoney(gmv), delta: formatDelta(gmv, previousGrossRevenue), tone: 'violet' as const },
    { label: 'Orders', value: String(filteredOrders.length), delta: formatDelta(filteredOrders.length, previousOrders.length), tone: 'amber' as const },
    { label: 'Customers', value: String(totalCustomers), delta: formatDelta(totalCustomers, previousUsers.length), tone: 'slate' as const },
    { label: 'Sellers', value: String(totalSellers), delta: formatDelta(totalSellers, previousSellers.length), tone: 'rose' as const },
    { label: 'Products', value: String(totalProducts), delta: formatDelta(totalProducts, previousProducts.length), tone: 'sky' as const },
    { label: 'Refunds', value: formatMoney(refundAmount), delta: formatDelta(refundAmount, previousRefundAmount), tone: 'rose' as const },
  ]

  const overview: DashboardOverview = {
    range,
    kpis,
    revenueTrend,
    ordersTrend,
    customersTrend,
    commissionTrend,
    categorySales,
    sellerPerformance,
    topSellers,
    topProducts,
    recentOrders,
    recentPayments,
    supportQueue,
    stats: {
      grossRevenue,
      netRevenue,
      gmv,
      orders: filteredOrders.length,
      customers: totalCustomers,
      sellers: totalSellers,
      products: totalProducts,
      refunds: refundAmount,
      commissions: commissionAmount,
      averageOrderValue,
      conversionRate,
      activeSellers,
      pendingSellerApplications,
      lowStockProducts,
      supportTickets,
    },
  }

  return overview
}

export const getAdminOverviewCompact = async (range: DashboardRange = '30d', customFrom?: string, customTo?: string) => {
  const overview = await getAdminOverview(range, customFrom, customTo)
  return {
    ...overview,
    kpis: overview.kpis.slice(0, 4),
    summary: overview.stats,
  }
}

export const formatCompactCurrency = (value: number): string => compactNumberFormatter.format(value)
