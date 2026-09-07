import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Eye,
  ExternalLink,
  CreditCard,
  ImageOff,
  Loader2,
  MessageCircle,
  MousePointerClick,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  ShieldCheck,
  Settings,
  Star,
  Tag,
  WalletCards,
  Wallet,
  Truck,
  XCircle,
} from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getSellerDashboard } from '../../services/dashboard.service'
import { updateSellerOrderStatus } from '../../services/orders.service'
import { getSellerWallet } from '../../services/withdrawals.service'
import { useSellerLanguage } from '../../i18n/sellerLanguage'
import type {
  SellerChartPoint,
  SellerDashboardResponse,
  SellerProductPerformance,
  SellerRecentOrder,
} from '../../types'

type ChartRange = 'today' | 'sevenDays' | 'thirtyDays' | 'thisMonth' | 'thisYear'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function formatMoney(value: number) {
  return money.format(Number.isFinite(value) ? value : 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function statusTone(value: string) {
  const normalized = value.toUpperCase()
  if (['PAID', 'DELIVERED', 'COMPLETED', 'APPROVED'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (['PENDING', 'REQUESTED', 'NEW', 'CONFIRMED'].includes(normalized)) return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (['CANCELLED', 'FAILED', 'REJECTED'].includes(normalized)) return 'bg-red-50 text-red-700 ring-red-200'
  return 'bg-sky-50 text-sky-700 ring-sky-200'
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm text-slate-500">{label}</div>
}

function PrimaryStatCard({ title, value, label, icon, tone }: { title: string; value: string | number; label: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'navy' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    navy: 'bg-slate-100 text-slate-700',
  }

  return <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-slate-700">{title}</p><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-6 text-3xl font-black tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></article>
}

function AnalyticsCard({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <article className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span><h2 className="text-sm font-bold text-slate-900">{title}</h2></div><div className="mt-4">{children}</div></article>
}

function NoData({ label = 'No data available' }: { label?: string }) {
  return <p className="text-sm text-slate-500">{label}</p>
}

function renderMoney(value: unknown) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? formatMoney(Number(value)) : <NoData />
}

function OrdersSummaryCard({ orders, onOpen }: { orders: SellerDashboardResponse['orders']['thisMonth']; onOpen: () => void }) {
  if (!orders) return <AnalyticsCard title="Orders This Month" icon={<ShoppingCart size={17} />}><NoData /></AnalyticsCard>

  const items = [
    { label: 'New Orders', count: orders.newOrder, icon: <Clock3 size={16} />, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Cancelled', count: orders.cancelled, icon: <XCircle size={16} />, tone: 'text-red-600 bg-red-50' },
    { label: 'On Delivery', count: orders.onDelivery, icon: <Truck size={16} />, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Delivered', count: orders.delivered, icon: <CheckCircle2 size={16} />, tone: 'text-emerald-600 bg-emerald-50' },
  ]

  return <AnalyticsCard title="Orders This Month" icon={<ShoppingCart size={17} />} className="xl:col-span-2"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{items.map((item) => <button key={item.label} type="button" onClick={onOpen} className="rounded-xl border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}>{item.icon}</span><span className="mt-3 block text-xs font-medium text-slate-500">{item.label}</span><span className="mt-1 block text-xl font-black text-slate-900">{item.count}</span></button>)}</div></AnalyticsCard>
}

function PackageSummaryCard({ packageInfo, productCount, onUpgrade }: { packageInfo: SellerDashboardResponse['packageInfo']; productCount: number; onUpgrade: () => void }) {
  if (!packageInfo) return <AnalyticsCard title="Purchased Package" icon={<WalletCards size={17} />} className="xl:col-span-2"><NoData /></AnalyticsCard>

  const uploadLimit = Number(packageInfo.uploadLimit)
  const remainingSlots = uploadLimit < 0 ? 'Unlimited' : Number.isFinite(uploadLimit) ? Math.max(uploadLimit - productCount, 0) : null
  const expiry = packageInfo.expiresAt ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(packageInfo.expiresAt)) : 'No expiration'

  return <AnalyticsCard title="Current Package" icon={<WalletCards size={17} />} className="xl:col-span-2"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="truncate text-xl font-black text-slate-900">{packageInfo.name || 'No data available'}</p><dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm"><div><dt className="text-xs text-slate-500">Product upload limit</dt><dd className="mt-1 font-bold text-slate-800">{uploadLimit < 0 ? 'Unlimited' : Number.isFinite(uploadLimit) ? uploadLimit : 'No data available'}</dd></div><div><dt className="text-xs text-slate-500">Expires</dt><dd className="mt-1 font-bold text-slate-800">{expiry}</dd></div><div><dt className="text-xs text-slate-500">Remaining product slots</dt><dd className="mt-1 font-bold text-blue-700">{remainingSlots ?? 'No data available'}</dd></div></dl></div><button type="button" onClick={onUpgrade} className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Upgrade Package <ArrowUpRight size={15} /></button></div></AnalyticsCard>
}

function SoldAmountCard({ sales, currency }: { sales: SellerDashboardResponse['sales']; currency: string | null }) {
  const formatConfiguredMoney = (value: unknown) => currency && value !== null && value !== undefined && Number.isFinite(Number(value))
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value))
    : null
  const periods = [['Current Day', sales.today], ['Last Day', sales.yesterday], ['Current Month', sales.currentMonth], ['Last Month', sales.lastMonth]]

  return <AnalyticsCard title="Sold Amount" icon={<CircleDollarSign size={17} />} className="xl:col-span-2"><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{periods.map(([label, value]) => <div key={String(label)}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatConfiguredMoney(value) ?? 'No data available'}</p></div>)}</div></AnalyticsCard>
}

function QuickActionCard({ title, description, action, icon, onClick }: { title: string; description: string; action: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex min-h-[142px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span><span><span className="mt-4 block text-sm font-bold text-slate-900">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">{action}<ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></button>
}

function TopProductsCarousel({ products }: { products: SellerProductPerformance[] }) {
  const [startIndex, setStartIndex] = useState(0)
  const visibleProducts = products.slice(startIndex, startIndex + 4)

  return <AnalyticsCard title="Top Products" icon={<Package size={17} />} className="xl:col-span-4"><div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Best-performing seller products</p>{products.length > 4 ? <div className="flex items-center gap-1"><button type="button" aria-label="Previous products" disabled={startIndex === 0} onClick={() => setStartIndex((value) => Math.max(value - 4, 0))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button><button type="button" aria-label="Next products" disabled={startIndex + 4 >= products.length} onClick={() => setStartIndex((value) => Math.min(value + 4, Math.max(products.length - 4, 0)))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button></div> : null}</div>{products.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleProducts.map((product) => <article key={product.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"><ProductImage src={product.image} alt={product.name} /><div className="mt-3 min-w-0"><h3 className="truncate text-sm font-bold text-slate-900" title={product.name}>{product.name}</h3><p className="mt-1 text-sm font-extrabold text-slate-900">{renderMoney(product.price)}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><p className="text-slate-500">Rating</p><p className="mt-1 font-semibold text-slate-700">{product.rating !== null && product.rating !== undefined && Number.isFinite(Number(product.rating)) ? `${Number(product.rating).toFixed(1)} / 5` : 'No approved reviews'}</p></div><div><p className="text-slate-500">Sales</p><p className="mt-1 font-semibold text-slate-700">{product.units}</p></div></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs"><span className="text-slate-500">Stock</span><span className={product.stock <= 0 ? 'font-semibold text-red-600' : product.stock <= 5 ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-600'}>{product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `Low stock (${product.stock})` : `In stock (${product.stock})`}</span></div></div></article>)}</div> : <div className="mt-4"><NoData /></div>}</AnalyticsCard>
}

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-100 text-slate-400" aria-label={`${alt} image unavailable`}><ImageOff size={24} /></div>
    return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="aspect-[4/3] w-full rounded-lg bg-slate-100 object-cover" />
}

function SalesStatisticsChart({ points }: { points: SellerChartPoint[] }) {
  if (!points.length) return <EmptyState label="No sales data available." />

  const width = 760
  const height = 270
  const padding = { top: 20, right: 48, bottom: 38, left: 52 }
  const maxSales = Math.max(...points.map((point) => point.revenue), 1)
  const maxOrders = Math.max(...points.map((point) => point.orders), 1)
  const x = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(points.length - 1, 1)
  const ySales = (value: number) => height - padding.bottom - (value / maxSales) * (height - padding.top - padding.bottom)
  const yOrders = (value: number) => height - padding.bottom - (value / maxOrders) * (height - padding.top - padding.bottom)
  const makePath = (key: 'sales' | 'orders') => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${key === 'sales' ? ySales(point.revenue) : yOrders(point.orders)}`).join(' ')
  const salesPath = makePath('sales')
  const areaPath = `${salesPath} L ${x(points.length - 1)} ${height - padding.bottom} L ${x(0)} ${height - padding.bottom} Z`
  const statusLabel = (value: string) => value.replace(/_/g, ' ')

  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] min-w-[620px] w-full" role="img" aria-label="Sales and orders statistics chart">{[0, 0.25, 0.5, 0.75, 1].map((step) => <line key={step} x1={padding.left} x2={width - padding.right} y1={ySales(maxSales * step)} y2={ySales(maxSales * step)} stroke="#e2e8f0" strokeDasharray="4 5" />)}<path d={areaPath} fill="#dbeafe" opacity="0.6" /><path d={salesPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d={makePath('orders')} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{points.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={x(index)} cy={ySales(point.revenue)} r="4" fill="#2563eb" /><circle cx={x(index)} cy={yOrders(point.orders)} r="3.5" fill="#16a34a" /><text x={x(index)} y={height - 12} textAnchor="middle" className="fill-slate-500 text-[10px]">{point.label}</text></g>)}</svg><div className="flex flex-wrap gap-4 px-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Sales</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-600" />Orders</span></div></div>
}

function OrdersTable({ orders, onRefresh }: { orders: SellerRecentOrder[]; onRefresh: () => Promise<void> }) {
  const navigate = useNavigate()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const processOrder = async (order: SellerRecentOrder) => {
    setProcessingId(order.id)
    setActionError('')
    try {
      await updateSellerOrderStatus(order.id, 'PROCESSING')
      await onRefresh()
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Unable to process this order.')
    } finally {
      setProcessingId(null)
    }
  }

  if (!orders.length) return <EmptyState label="Recent orders will appear here when customers place orders." />

  return <div>{actionError ? <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div> : null}<div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-500"><tr>{['Order ID', 'Customer', 'Products', 'Amount', 'Profit', 'Payment', 'Pickup', 'Delivery', 'Date', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-3 py-3 font-semibold text-slate-800">#{order.id.slice(0, 8)}</td><td className="px-3 py-3 text-slate-700">{order.customer}</td><td className="max-w-[220px] px-3 py-3 text-slate-600">{order.products}</td><td className="px-3 py-3 font-semibold text-slate-800">{formatMoney(order.amount)}</td><td className="px-3 py-3 font-semibold text-emerald-700">{formatMoney(order.profit)}</td>{[order.paymentStatus, order.pickupStatus, order.deliveryStatus].map((status, index) => <td key={`${order.id}-${index}`} className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusTone(status)}`}>{status}</span></td>)}<td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDate(order.date)}</td><td className="px-3 py-3"><div className="flex items-center gap-1.5"><button type="button" title="View order" aria-label={`View order ${order.id}`} onClick={() => navigate('/seller/orders')} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"><Eye size={15} /></button>{order.canProcess ? <button type="button" title="Process order" aria-label={`Process order ${order.id}`} disabled={processingId === order.id} onClick={() => void processOrder(order)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50">{processingId === order.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}</button> : null}{order.canContact ? <button type="button" title="Contact customer" aria-label={`Contact customer for ${order.id}`} onClick={() => navigate('/seller/conversations')} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"><MessageCircle size={15} /></button> : null}</div></td></tr>)}</tbody></table></div></div>
}

function DashboardSkeleton() {
  return <div className="space-y-6" aria-label="Loading dashboard"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div></div>
}

function RatingSection({ rating, verified }: { rating: number | null; verified: boolean }) {
  if (rating === null || rating === undefined || !Number.isFinite(Number(rating))) {
    return <section aria-label="Seller rating" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rating</p><p className="mt-2 text-sm text-slate-500">No approved reviews available.</p></div>{verified ? <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={16} /> Shop verified</span> : null}</section>
  }
  const normalizedRating = Math.min(5, Math.max(0, Number(rating) || 0))
  const filledStars = Math.round(normalizedRating)

  return <section aria-label="Seller rating" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rating</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1" aria-label={`${normalizedRating.toFixed(1)} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, index) => <Star key={index} size={20} className={index < filledStars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
        </div>
        <span className="text-sm font-bold text-slate-800">{normalizedRating.toFixed(1)} / 5</span>
      </div>
    </div>
    {verified ? <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={16} /> Shop verified</span> : null}
  </section>
}

export function Dashboard() {
  const navigate = useNavigate()
  const { t } = useSellerLanguage()
  const [range, setRange] = useState<ChartRange>('thisMonth')
  const [currency, setCurrency] = useState<string | null>(null)
  const dashboardQuery = useQuery({ queryKey: ['seller-dashboard'], queryFn: getSellerDashboard, staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: false })
  const dashboard = dashboardQuery.data
  const loading = dashboardQuery.isLoading
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : ''
  const loadDashboard = async () => { await dashboardQuery.refetch() }

  useEffect(() => {
    let active = true
    void getSellerWallet().then((wallet) => {
      if (active && wallet.currency) setCurrency(wallet.currency)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const kpis = dashboard?.kpis
  const chartSource: Record<ChartRange, 'daily' | 'weekly' | 'monthly' | 'yearly'> = { today: 'daily', sevenDays: 'weekly', thirtyDays: 'monthly', thisMonth: 'monthly', thisYear: 'yearly' }
  const selectedPoints = dashboard?.charts?.[chartSource[range]] ?? []
  const categoryCounts = dashboard?.categoryCounts ?? []
  const maxCategoryCount = Math.max(...categoryCounts.map((categoryItem) => Number(categoryItem.count)).filter((count) => Number.isFinite(count)), 0)

  return <SellerLayout title="Dashboard" subtitle="Live seller performance overview" actions={<button type="button" onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    {loading && !dashboard ? <DashboardSkeleton /> : error && !dashboard ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-800">Dashboard unavailable</p><p className="mt-2 text-sm text-red-700">{error}</p><button type="button" onClick={() => void loadDashboard()} className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Try again</button></div> : dashboard && kpis ? <div className="space-y-6">
      {error ? <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><span>{error}</span><button type="button" onClick={() => void loadDashboard()} className="font-semibold underline">Retry</button></div> : null}
      <RatingSection rating={dashboard.shop.rating} verified={dashboard.shop.verified} />
      <section aria-label="Seller statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PrimaryStatCard title={t('products')} value={kpis.totalProducts} label={t('totalProducts')} icon={<Package size={19} />} tone="blue" />
          <PrimaryStatCard title={t('orders')} value={kpis.totalOrders} label={t('ordersPlaced')} icon={<ShoppingCart size={19} />} tone="navy" />
          <PrimaryStatCard title={t('sales')} value={formatMoney(kpis.totalSales)} label={t('grossSellerSales')} icon={<CircleDollarSign size={19} />} tone="green" />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Sales Statistics</h2><p className="mt-1 text-sm text-slate-500">Sales and orders from your seller account</p></div><label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"><span className="sr-only">Sales statistics period</span><select value={range} onChange={(event) => setRange(event.target.value as ChartRange)} className="bg-transparent outline-none"><option value="today">Today</option><option value="sevenDays">7 Days</option><option value="thirtyDays">30 Days</option><option value="thisMonth">This Month</option><option value="thisYear">This Year</option></select><ChevronDown size={14} /></label></div><div className="mt-5"><SalesStatisticsChart points={selectedPoints} /></div></section>
      <section aria-label="Dashboard analytics" className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard title="Category-wise Product Count" icon={<Tag size={17} />} className="xl:col-span-2">
          {categoryCounts.length && maxCategoryCount > 0 ? <div className="space-y-4">{categoryCounts.slice(0, 5).map((categoryItem) => { const count = Number(categoryItem.count); const width = Number.isFinite(count) ? Math.max((count / maxCategoryCount) * 100, count > 0 ? 3 : 0) : 0; return <div key={categoryItem.name}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{categoryItem.name}</span><span className="shrink-0 font-bold text-slate-900">{Number.isFinite(count) ? count : 'No data available'}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${width}%` }} /></div></div> })}</div> : <NoData />}
        </AnalyticsCard>
        <OrdersSummaryCard orders={dashboard.orders.thisMonth} onOpen={() => navigate('/seller/orders')} />
        <PackageSummaryCard packageInfo={dashboard.packageInfo} productCount={kpis.totalProducts} onUpgrade={() => navigate('/seller/seller-packages')} />
        <SoldAmountCard sales={dashboard.sales} currency={currency} />
        <AnalyticsCard title={t('todayViews')} icon={<Eye size={17} />}>
          {Number.isFinite(dashboard.statistics.todayViews) ? <p className="text-3xl font-black text-slate-900">{dashboard.statistics.todayViews}</p> : <NoData label={t('noData')} />}
        </AnalyticsCard>
        <AnalyticsCard title="Quick Actions" icon={<MousePointerClick size={17} />} className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard title="Money Withdraw" description="Request a payout and review withdrawal status." action="Withdraw Money" icon={<Wallet size={18} />} onClick={() => navigate('/seller/money-withdraw-requests')} />
            <QuickActionCard title="Add New Product" description="Create a seller product from your catalog." action="Add Product" icon={<Plus size={18} />} onClick={() => navigate('/seller/products/create')} />
            <QuickActionCard title="Shop Settings" description="Update your storefront details and policies." action="Go to Settings" icon={<Settings size={18} />} onClick={() => navigate('/seller/shop')} />
            <QuickActionCard title="Payment Settings" description="Manage your seller payout and wallet preferences." action="Configure Now" icon={<CreditCard size={18} />} onClick={() => navigate('/seller/money-withdraw-requests')} />
          </div>
        </AnalyticsCard>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Recent Orders</h2><p className="mt-1 text-sm text-slate-500">The latest orders attributed to your seller account</p></div><button type="button" onClick={() => navigate('/seller/orders')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View all <ExternalLink size={14} /></button></div><div className="mt-5"><OrdersTable orders={dashboard.recentOrders ?? []} onRefresh={loadDashboard} /></div></section>
      <section aria-label={t('topProducts')}><TopProductsCarousel products={dashboard.charts?.productPerformance ?? []} /></section>
    </div> : <EmptyState label="No dashboard data is available for this seller account." />}
  </SellerLayout>
}

