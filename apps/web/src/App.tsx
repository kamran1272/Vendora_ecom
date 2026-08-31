import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { CategoryPage } from '@/pages/CategoryPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { useAuth } from '@/store/auth'

type HeaderNavItem = {
  id: string
  label: string
  href: string
  enabled: boolean
}

const apiNavigationItems: HeaderNavItem[] = [
  { id: 'home', label: 'Home', href: '/', enabled: true },
  { id: 'categories', label: 'Categories', href: '/categories', enabled: true },
  { id: 'brands', label: 'Brands', href: '/brands', enabled: true },
  { id: 'products', label: 'Products', href: '/shop', enabled: true },
  { id: 'seller', label: 'Seller', href: '/seller', enabled: true },
  { id: 'register-shop', label: 'Register Your Shop', href: '/shops/create', enabled: true },
  { id: 'admin', label: 'Admin', href: '/admin', enabled: true }
]

const headerActions = [
  { key: 'account', label: 'Account', href: '/account', icon: '👤' },
  { key: 'wishlist', label: 'Wishlist', href: '/account/wishlist', icon: '♡' },
  { key: 'compare', label: 'Compare', href: '/account/compare', icon: '⇄' },
  { key: 'notifications', label: 'Notifications', href: '/account/notifications', icon: '🔔' },
  { key: 'cart', label: 'Cart', href: '/cart', icon: '🛒' }
]

const headerMeta = {
  language: 'English',
  currency: 'USD',
  searchPlaceholder: 'Search products...'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://127.0.0.1:4003/api'

function getStoredAccessToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('accessToken')
}

function getStoredUserRole(): string | null {
  const token = getStoredAccessToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return payload.role || null
  } catch {
    return null
  }
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const token = getStoredAccessToken()
  const role = getStoredUserRole()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

function VendoraLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
        <svg viewBox="0 0 160 160" className="h-full w-full" aria-label="Vendora logo" role="img">
          <defs>
            <linearGradient id="vendoraBag" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f9b24a" />
              <stop offset="100%" stopColor="#f38a2d" />
            </linearGradient>
          </defs>

          <circle cx="80" cy="80" r="63" fill="#1f2d4d" />
          <path
            d="M55 74c0-15 12-27 27-27h18c15 0 27 12 27 27v10c0 14-5 25-15 34L88 118l-23-20C55 90 50 79 50 68V74Z"
            fill="url(#vendoraBag)"
          />
          <path d="M80 47c-13 0-24 9-27 21h54c-3-12-14-21-27-21Z" fill="#f7ab43" opacity="0.95" />
          <path d="M48 76c0-19 14-35 32-39v38L48 76Z" fill="#1f2d4d" opacity="0.94" />
          <path d="M112 76c0-19-14-35-32-39v38l32 1Z" fill="#1f2d4d" opacity="0.94" />
          <path d="M82 26c8 0 15 7 15 15v14H67V41c0-8 7-15 15-15Z" fill="#1f2d4d" />
          <path d="M64 50c0-16 13-29 29-29s29 13 29 29" fill="none" stroke="#1f2d4d" strokeWidth="8" strokeLinecap="round" />
          <path d="M52 78L67 130h28l-12-52H52Z" fill="#1f2d4d" />
          <path d="M106 78L94 130H66l13-52h27Z" fill="#1f2d4d" />
          <path d="M84 48 L55 127L84 96L113 127L84 48Z" fill="#f7ab43" />
          <circle cx="83" cy="56" r="6" fill="#1f2d4d" />
        </svg>
      </div>

      <div className="flex items-end leading-none">
        <span className={compact ? 'text-[2.2rem] sm:text-[3.1rem]' : 'text-[2.8rem] sm:text-[6.2rem]'} style={{ fontWeight: 900, letterSpacing: '-0.08em', color: '#1f2d4d', fontFamily: 'Arial, sans-serif' }}>
          Vendo
        </span>
        <span className={compact ? 'text-[2.2rem] sm:text-[3.1rem]' : 'text-[2.8rem] sm:text-[6.2rem]'} style={{ fontWeight: 900, letterSpacing: '-0.08em', color: '#f39a3d', fontFamily: 'Arial, sans-serif' }}>
          ra
        </span>
      </div>
    </div>
  )
}

function App() {
  const navigation = apiNavigationItems.filter((item) => item.enabled)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-4 py-3">
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link to="/" className="flex items-center">
                <VendoraLogo compact />
              </Link>

              <label className="relative block min-w-[280px] flex-1">
                <span className="sr-only">Search</span>
                <input
                  type="search"
                  placeholder={headerMeta.searchPlaceholder}
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-700">
              <button className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">{headerMeta.language}</button>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">{headerMeta.currency}</button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {headerActions.map((action) => (
                <Link key={action.key} to={action.href} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700">☰</button>
            <Link to="/" className="flex flex-1 items-center justify-center">
              <VendoraLogo compact />
            </Link>
            <div className="flex items-center gap-2">
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg">⌕</button>
              <Link to="/cart" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg">🛒</Link>
            </div>
          </div>
        </div>

        <nav className="border-t border-slate-200 bg-slate-50/80">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3">
            {navigation.map((item) => (
              <Link key={item.id} to={item.href} className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-[#1f2d4d]">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<SearchPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/brands/:slug" element={<BrandPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/shops/:slug" element={<ShopDetailPage />} />
          <Route path="/shops/:slug/products" element={<ShopProductsPage />} />
          <Route path="/shops/:slug/top-selling" element={<ShopTopSellingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/account/profile" element={<ProtectedRoute><AccountProfilePage /></ProtectedRoute>} />
          <Route path="/account/orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
          <Route path="/account/orders/:id" element={<ProtectedRoute><AccountOrderDetailPage /></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute><AccountAddressesPage /></ProtectedRoute>} />
          <Route path="/account/wishlist" element={<ProtectedRoute><AccountWishlistPage /></ProtectedRoute>} />
          <Route path="/account/compare" element={<ProtectedRoute><AccountComparePage /></ProtectedRoute>} />
          <Route path="/account/reviews" element={<ProtectedRoute><AccountReviewsPage /></ProtectedRoute>} />
          <Route path="/account/questions" element={<ProtectedRoute><AccountQuestionsPage /></ProtectedRoute>} />
          <Route path="/account/notifications" element={<ProtectedRoute><AccountNotificationsPage /></ProtectedRoute>} />
          <Route path="/account/coupons" element={<ProtectedRoute><AccountCouponsPage /></ProtectedRoute>} />
          <Route path="/account/affiliate" element={<ProtectedRoute><AccountAffiliatePage /></ProtectedRoute>} />
          <Route path="/account/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
          <Route path="/shops/create" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerSetupPage /></ProtectedRoute>} />
          <Route path="/shops/:shopId" element={<ProtectedRoute><SellerShopOverviewPage /></ProtectedRoute>} />
          <Route path="/shops/:shopId/settings" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerShopSettingsPage /></ProtectedRoute>} />
          <Route path="/seller" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerDashboardPage /></ProtectedRoute>} />
          <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerDashboardPage /></ProtectedRoute>} />
          <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerProductsPage /></ProtectedRoute>} />
          <Route path="/seller/products/create" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerProductCreatePage /></ProtectedRoute>} />
          <Route path="/seller/products/:id/edit" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerProductEditPage /></ProtectedRoute>} />
          <Route path="/seller/products/:id/inventory" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerProductInventoryPage /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerOrdersPage /></ProtectedRoute>} />
          <Route path="/seller/orders/:id" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerOrderDetailPage /></ProtectedRoute>} />
          <Route path="/seller/customers" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerCustomersPage /></ProtectedRoute>} />
          <Route path="/seller/reviews" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerReviewsPage /></ProtectedRoute>} />
          <Route path="/seller/questions" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerQuestionsPage /></ProtectedRoute>} />
          <Route path="/seller/coupons" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerCouponsPage /></ProtectedRoute>} />
          <Route path="/seller/earnings" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerEarningsPage /></ProtectedRoute>} />
          <Route path="/seller/transactions" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerTransactionsPage /></ProtectedRoute>} />
          <Route path="/seller/withdrawals" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerWithdrawalsPage /></ProtectedRoute>} />
          <Route path="/seller/analytics" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerAnalyticsPage /></ProtectedRoute>} />
          <Route path="/seller/notifications" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerNotificationsPage /></ProtectedRoute>} />
          <Route path="/seller/settings" element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}><SellerSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminUserDetailPage /></ProtectedRoute>} />
          <Route path="/admin/sellers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSellersPage /></ProtectedRoute>} />
          <Route path="/admin/sellers/pending" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSellersPendingPage /></ProtectedRoute>} />
          <Route path="/admin/sellers/approved" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSellersApprovedPage /></ProtectedRoute>} />
          <Route path="/admin/sellers/suspended" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSellersSuspendedPage /></ProtectedRoute>} />
          <Route path="/admin/sellers/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSellerDetailPage /></ProtectedRoute>} />
          <Route path="/admin/shops" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminShopsPage /></ProtectedRoute>} />
          <Route path="/admin/shops/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminShopDetailPage /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminProductsPage /></ProtectedRoute>} />
          <Route path="/admin/products/pending" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminProductsPendingPage /></ProtectedRoute>} />
          <Route path="/admin/products/approved" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminProductsApprovedPage /></ProtectedRoute>} />
          <Route path="/admin/products/rejected" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminProductsRejectedPage /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/brands" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminBrandsPage /></ProtectedRoute>} />
          <Route path="/admin/attributes" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminAttributesPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminOrderDetailPage /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminPaymentsPage /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminTransactionsPage /></ProtectedRoute>} />
          <Route path="/admin/refunds" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminRefundsPage /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCommissionsPage /></ProtectedRoute>} />
          <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminPayoutsPage /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminReviewsPage /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminQuestionsPage /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCouponsPage /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminPromotionsPage /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminBannersPage /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminNotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/affiliate" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminAffiliatePage /></ProtectedRoute>} />
          <Route path="/admin/pages" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminPagesPage /></ProtectedRoute>} />
          <Route path="/admin/menus" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminMenusPage /></ProtectedRoute>} />
          <Route path="/admin/languages" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminLanguagesPage /></ProtectedRoute>} />
          <Route path="/admin/currencies" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCurrenciesPage /></ProtectedRoute>} />
          <Route path="/admin/shipping" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminShippingPage /></ProtectedRoute>} />
          <Route path="/admin/taxes" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminTaxesPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

const categoryItems = [
  { name: 'Electronics', description: 'Smart devices and gaming setups', href: '/categories/electronics' },
  { name: 'Home', description: 'Living essentials and interior upgrades', href: '/categories/home' },
  { name: 'Fashion', description: 'Fresh looks for every season', href: '/categories/fashion' },
  { name: 'Beauty', description: 'Premium routines and wellness picks', href: '/categories/beauty' },
  { name: 'Sports', description: 'Outdoor gear and performance essentials', href: '/categories/sports' },
  { name: 'Books', description: 'Learning, stories, and inspiration', href: '/categories/books' }
]

const brandItems = [
  { name: 'NorthPeak', tag: 'Smart living' },
  { name: 'Aural', tag: 'Audio + sound' },
  { name: 'Luma', tag: 'Home essentials' },
  { name: 'Volt', tag: 'Power & lifestyle' },
  { name: 'Summit', tag: 'Adventure gear' },
  { name: 'Nova', tag: 'Modern design' }
]

const productItems = [
  { name: 'Aero Bottle', price: '$42', shop: 'Summit Goods', badge: 'Best seller' },
  { name: 'Nova Lamp', price: '$89', shop: 'Luma Home', badge: 'New arrival' },
  { name: 'Pulse Watch', price: '$199', shop: 'Volt Studio', badge: 'Trending' },
  { name: 'Terra Backpack', price: '$74', shop: 'Trail Works', badge: 'Top rated' },
  { name: 'Smart Speaker', price: '$129', shop: 'NorthPeak Studio', badge: 'Featured' },
  { name: 'Echo Headset', price: '$149', shop: 'Aural Labs', badge: 'Popular' }
]

type HomepageSectionType = 'hero' | 'categories' | 'brands' | 'products' | 'promo' | 'seller' | 'cta'

type HomepageSectionConfig = {
  id: string
  type: HomepageSectionType
  enabled: boolean
  order: number
  title: string
  eyebrow?: string
  subtitle?: string
  description?: string
  background?: string
  mobileImage?: string
  desktopImage?: string
  image?: string
  banner?: { label: string; value: string }
  categoryIds?: string[]
  productIds?: string[]
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  items?: Array<string | { label: string; value: string }>
}

const homepageConfig: HomepageSectionConfig[] = [
  {
    id: 'hero',
    type: 'hero',
    enabled: true,
    order: 1,
    eyebrow: 'Multi-vendor marketplace',
    title: 'Shop trusted stores. Launch your own shop.',
    description: 'Vendora brings together shoppers, sellers, and admins in one commerce platform where every product belongs to a seller shop and every order flows through a connected marketplace ecosystem.',
    background: 'radial-gradient(circle_at_top_left,_rgba(245,154,54,0.18),_transparent_35%),linear-gradient(135deg,#1f2d4d_0%,#263a5b_55%,#1d2b48_100%)',
    mobileImage: '',
    desktopImage: '',
    cta: { label: 'Shop now', href: '/shop' },
    secondaryCta: { label: 'Open a shop', href: '/shops/create' }
  },
  {
    id: 'categories',
    type: 'categories',
    enabled: true,
    order: 2,
    eyebrow: 'Categories',
    title: 'Shop by category',
    subtitle: 'Curated collections from trusted sellers',
    categoryIds: ['electronics', 'home', 'fashion', 'beauty', 'sports', 'books']
  },
  {
    id: 'brands',
    type: 'brands',
    enabled: true,
    order: 3,
    eyebrow: 'Brands',
    title: 'Featured brands',
    subtitle: 'Popular names shoppers trust'
  },
  {
    id: 'new-products',
    type: 'products',
    enabled: true,
    order: 4,
    eyebrow: 'New products',
    title: 'Fresh arrivals',
    subtitle: 'Recently published by top sellers',
    productIds: ['aero-bottle', 'nova-lamp', 'pulse-watch', 'terra-backpack', 'smart-speaker', 'echo-headset']
  },
  {
    id: 'featured-products',
    type: 'products',
    enabled: true,
    order: 5,
    eyebrow: 'Featured products',
    title: 'Curated picks',
    subtitle: 'Handpicked opportunities and best deals',
    productIds: ['smart-speaker', 'nova-lamp', 'aero-bottle', 'pulse-watch', 'echo-headset', 'terra-backpack']
  },
  {
    id: 'top-selling-products',
    type: 'products',
    enabled: true,
    order: 6,
    eyebrow: 'Top selling',
    title: 'Best performers',
    subtitle: 'Products customers are buying the most',
    productIds: ['pulse-watch', 'smart-speaker', 'terra-backpack', 'echo-headset', 'aero-bottle', 'nova-lamp']
  },
  {
    id: 'promo-banners',
    type: 'promo',
    enabled: true,
    order: 7,
    eyebrow: 'Promotional offers',
    title: 'Explore exclusive deals and seller campaigns',
    subtitle: 'Seasonal drops, bundle discounts, and premium storefront offers',
    items: [
      { label: 'Weekend flash sale', value: 'Up to 50% off' },
      { label: 'Seller spotlight', value: 'New shops this week' },
      { label: 'Free shipping', value: 'On orders over $80' }
    ]
  },
  {
    id: 'seller-spotlight',
    type: 'seller',
    enabled: true,
    order: 8,
    eyebrow: 'Seller / shop section',
    title: 'Grow with your own storefront',
    subtitle: 'Create a custom shop, sell online, and manage your catalog with ease.',
    items: [
      'Multi-vendor marketplace ready',
      'Storefront management tools',
      'Insights for pricing and performance',
      'Payout and commission controls'
    ],
    cta: { label: 'Register your shop', href: '/shops/create' },
    secondaryCta: { label: 'Seller dashboard', href: '/seller' }
  },
  {
    id: 'footer-cta',
    type: 'cta',
    enabled: true,
    order: 9,
    title: 'Build a smarter marketplace.',
    eyebrow: 'Vendora',
    cta: { label: 'Create account', href: '/register' }
  }
]

function HomePage() {
  const visibleSections = [...homepageConfig]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order)

  return <div className="space-y-10">{visibleSections.map((section) => renderHomepageSection(section))}</div>
}

function renderHomepageSection(section: HomepageSectionConfig) {
  switch (section.type) {
    case 'hero':
      return (
        <section
          key={section.id}
          className="grid gap-8 rounded-[2rem] p-8 text-white shadow-[0_20px_45px_rgba(31,45,77,0.18)] md:grid-cols-[1.5fr_1fr] md:p-12"
          style={{ background: section.background || 'linear-gradient(135deg,#1f2d4d_0%,#263a5b_55%,#1d2b48_100%)' }}
        >
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-orange-100">
              {section.eyebrow}
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">{section.title}</h1>
            <p className="mt-5 max-w-xl text-base text-slate-200 md:text-lg">{section.description}</p>
            <div className="mt-8 flex gap-4">
              {section.cta && (
                <Link to={section.cta.href} className="rounded-full bg-[#f59a36] px-5 py-3 font-semibold text-white shadow-md hover:bg-[#ee7c22]">
                  {section.cta.label}
                </Link>
              )}
              {section.secondaryCta && (
                <Link to={section.secondaryCta.href} className="rounded-full border border-white/40 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm hover:bg-white/10">
                  {section.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-white/10 p-5 backdrop-blur-sm ring-1 ring-white/10">
            <div className="grid gap-4">
              <div className="rounded-[1.2rem] bg-white p-4 text-slate-900 shadow-lg">
                <p className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-500">Featured shop</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">Smart Speaker</p>
                    <p className="text-sm text-slate-500">by NorthPeak Studio</p>
                  </div>
                  <span className="text-xl font-black text-[#1f2d4d]">$129</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Customers', value: '12.4k' },
                  { label: 'Seller shops', value: '1.1k' },
                  { label: 'Monthly sales', value: '$48k' },
                  { label: 'Ratings', value: '4.9/5' }
                ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} />)}
              </div>
            </div>
          </div>
        </section>
      )

    case 'categories': {
      const items = categoryItems.filter((item) => section.categoryIds?.includes(item.name.toLowerCase().replace(/\s+/g, '-')) || section.categoryIds?.length === 0)
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeader eyebrow={section.eyebrow || 'Categories'} title={section.title} subtitle={section.subtitle || ''} actionLabel="View all" actionTo="/categories" />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {(items.length ? items : categoryItems).map((category) => (
              <Link key={category.name} to={category.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <div className="mb-4 h-14 w-14 rounded-xl bg-gradient-to-br from-[#f59a36] to-[#f3c66c]" />
                <p className="text-lg font-bold text-slate-900">{category.name}</p>
                <p className="mt-2 text-sm text-slate-500">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )
    }

    case 'brands':
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeader eyebrow={section.eyebrow || 'Brands'} title={section.title} subtitle={section.subtitle || ''} actionLabel="View all brands" actionTo="/brands" />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {brandItems.map((brand) => (
              <div key={brand.name} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-[#1f2d4d]">
                  {brand.name.slice(0, 2)}
                </div>
                <p className="text-lg font-bold text-slate-900">{brand.name}</p>
                <p className="mt-2 text-sm text-slate-500">{brand.tag}</p>
              </div>
            ))}
          </div>
        </section>
      )

    case 'products': {
      const ids = section.productIds || []
      const selectedItems = ids.length > 0
        ? productItems.filter((product) => ids.includes(product.name.toLowerCase().replace(/\s+/g, '-')))
        : productItems

      return (
        <ProductSection
          key={section.id}
          eyebrow={section.eyebrow || 'Products'}
          title={section.title}
          subtitle={section.subtitle || ''}
          items={selectedItems}
        />
      )
    }

    case 'promo':
      return (
        <section key={section.id} className="rounded-[2rem] bg-gradient-to-r from-slate-100 to-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            {(section.items || []).map((promo) => {
              const item = typeof promo === 'string' ? { label: promo, value: '' } : promo
              return (
                <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{item.label}</p>
                  {item.value && <p className="mt-3 text-2xl font-black text-slate-900">{item.value}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )

    case 'seller':
      return (
        <section key={section.id} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{section.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">{section.title}</h2>
              <p className="mt-4 max-w-xl text-slate-600">{section.subtitle}</p>
              <div className="mt-6 flex gap-3">
                {section.cta && (
                  <Link to={section.cta.href} className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">{section.cta.label}</Link>
                )}
                {section.secondaryCta && (
                  <Link to={section.secondaryCta.href} className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700">{section.secondaryCta.label}</Link>
                )}
              </div>
            </div>
            <div className="grid gap-3">
              {(section.items || []).map((item, index) => (
                <div key={`${section.id}-${String(item)}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f59a36] text-sm font-bold text-white">{index + 1}</span>
                  <span>{typeof item === 'string' ? item : item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    case 'cta':
      return (
        <section key={section.id} className="rounded-[2rem] bg-[#1f2d4d] p-8 text-white shadow-[0_20px_48px_rgba(31,45,77,0.18)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">{section.eyebrow}</p>
              <h3 className="mt-2 text-3xl font-black">{section.title}</h3>
            </div>
            {section.cta && (
              <Link to={section.cta.href} className="rounded-full bg-[#f59a36] px-5 py-3 font-semibold text-white">{section.cta.label}</Link>
            )}
          </div>
        </section>
      )

    default:
      return null
  }
}

function ProductSection({ eyebrow, title, subtitle, items }: { eyebrow: string; title: string; subtitle: string; items: Array<{ name: string; price: string; shop: string; badge: string }> }) {
  return (
    <section className="space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actionLabel="View all" actionTo="/shop" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <div key={`${product.name}-${product.shop}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50" />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#d97706]">{product.badge}</span>
                <span className="text-lg font-black text-[#1f2d4d]">{product.price}</span>
              </div>
              <p className="text-sm text-slate-500">{product.shop}</p>
              <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Premium seller</span>
                <button className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, subtitle, actionLabel, actionTo }: { eyebrow?: string; title: string; subtitle?: string; actionLabel: string; actionTo: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      <Link to={actionTo} className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 md:inline-flex">{actionLabel}</Link>
    </div>
  )
}

function ShopPage() {
  const products = [
    { name: 'Aero Bottle', price: '$42', shop: 'Summit Goods' },
    { name: 'Nova Lamp', price: '$89', shop: 'Luma Home' },
    { name: 'Pulse Watch', price: '$199', shop: 'Volt Studio' },
    { name: 'Terra Backpack', price: '$74', shop: 'Trail Works' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Browse products</h2>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">4 items</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-100" />
            <div className="space-y-3 p-4">
              <p className="text-sm text-slate-500">{product.shop}</p>
              <h3 className="text-xl font-bold">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-brand-700">{product.price}</span>
                <button className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoriesPage() {
  const categories = ['Electronics', 'Home', 'Fashion', 'Beauty', 'Sports', 'Books']

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Categories</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <div key={category} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold">{category}</p>
            <p className="mt-2 text-sm text-slate-500">Curated collections and featured sellers.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandsPage() {
  const brands = ['Aural', 'NorthPeak', 'Luma', 'Volt', 'Summit', 'Nova']

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Brands</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {brands.map((brand) => (
          <div key={brand} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold">{brand}</p>
            <p className="mt-2 text-sm text-slate-500">Premium products and storefronts.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandPage() {
  return <PageShell title="NorthPeak" description="A premium brand collection offering smart home and lifestyle essentials." />
}

const marketplaceSearchCatalog = [
  { id: 'aero-bottle', name: 'Aero Bottle', category: 'Sports', brand: 'Summit', seller: 'Summit Goods', price: 42, rating: 4.9, inStock: true, attributes: ['travel', 'eco', 'insulated'], popularity: 98 },
  { id: 'nova-lamp', name: 'Nova Lamp', category: 'Home', brand: 'Nova', seller: 'Luma Home', price: 89, rating: 4.8, inStock: true, attributes: ['lighting', 'modern', 'decor'], popularity: 84 },
  { id: 'pulse-watch', name: 'Pulse Watch', category: 'Electronics', brand: 'Volt', seller: 'Volt Studio', price: 199, rating: 4.7, inStock: true, attributes: ['wearable', 'fitness', 'smart'], popularity: 92 },
  { id: 'terra-backpack', name: 'Terra Backpack', category: 'Sports', brand: 'Summit', seller: 'Trail Works', price: 74, rating: 4.6, inStock: false, attributes: ['outdoor', 'travel', 'waterproof'], popularity: 76 },
  { id: 'smart-speaker', name: 'Smart Speaker', category: 'Electronics', brand: 'NorthPeak', seller: 'NorthPeak Studio', price: 129, rating: 4.9, inStock: true, attributes: ['voice', 'audio', 'smart-home'], popularity: 95 },
  { id: 'echo-headset', name: 'Echo Headset', category: 'Electronics', brand: 'Aural', seller: 'Aural Labs', price: 149, rating: 4.8, inStock: true, attributes: ['audio', 'wireless', 'gaming'], popularity: 87 },
  { id: 'amber-hoodie', name: 'Amber Hoodie', category: 'Fashion', brand: 'Luma', seller: 'Luma Style', price: 64, rating: 4.5, inStock: true, attributes: ['cotton', 'casual', 'winter'], popularity: 72 },
  { id: 'glow-serum', name: 'Glow Serum', category: 'Beauty', brand: 'Nova', seller: 'Glow Atelier', price: 38, rating: 4.7, inStock: true, attributes: ['skincare', 'hydrating', 'organic'], popularity: 80 }
]

const searchSortOptions = [
  'relevance',
  'newest',
  'price-low-to-high',
  'price-high-to-low',
  'best-rated',
  'most-popular',
  'top-selling'
]

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = (searchParams.get('q') ?? searchParams.get('search') ?? '').trim().toLowerCase()
  const category = searchParams.get('category') ?? 'all'
  const brand = searchParams.get('brand') ?? 'all'
  const seller = searchParams.get('seller') ?? 'all'
  const priceMin = Number(searchParams.get('priceMin') ?? 0)
  const priceMax = Number(searchParams.get('priceMax') ?? 250)
  const minRating = Number(searchParams.get('rating') ?? 0)
  const availability = searchParams.get('availability') ?? 'all'
  const sort = searchParams.get('sort') ?? 'relevance'

  const filteredProducts = useMemo(() => {
    let results = [...marketplaceSearchCatalog]

    if (keyword) {
      results = results.filter((product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword) ||
        product.seller.toLowerCase().includes(keyword) ||
        product.attributes.some((attribute) => attribute.toLowerCase().includes(keyword))
      )
    }

    if (category !== 'all') {
      results = results.filter((product) => product.category === category)
    }

    if (brand !== 'all') {
      results = results.filter((product) => product.brand === brand)
    }

    if (seller !== 'all') {
      results = results.filter((product) => product.seller === seller)
    }

    results = results.filter((product) => product.price >= priceMin && product.price <= priceMax)
    results = results.filter((product) => product.rating >= minRating)

    if (availability !== 'all') {
      const availableOnly = availability === 'in-stock'
      results = results.filter((product) => product.inStock === availableOnly)
    }

    switch (sort) {
      case 'newest':
        return results.sort((a, b) => b.id.localeCompare(a.id))
      case 'price-low-to-high':
        return results.sort((a, b) => a.price - b.price)
      case 'price-high-to-low':
        return results.sort((a, b) => b.price - a.price)
      case 'best-rated':
        return results.sort((a, b) => b.rating - a.rating)
      case 'most-popular':
        return results.sort((a, b) => b.popularity - a.popularity)
      case 'top-selling':
        return results.sort((a, b) => b.popularity - a.popularity)
      case 'relevance':
      default:
        return results.sort((a, b) => {
          const aScore = (a.rating * 20) + a.popularity + (a.inStock ? 10 : 0)
          const bScore = (b.rating * 20) + b.popularity + (b.inStock ? 10 : 0)
          return bScore - aScore
        })
    }
  }, [keyword, category, brand, seller, priceMin, priceMax, minRating, availability, sort])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || value === '0') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const categories = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.category))]
  const brands = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.brand))]
  const sellers = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.seller))]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Search</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">
          {keyword ? `Results for "${keyword}"` : 'Search products'}
        </h2>
        <p className="mt-2 text-slate-600">
          {filteredProducts.length} products found across categories, brands, and trusted seller stores.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Keyword</label>
              <input
                value={keyword}
                onChange={(event) => updateParam('q', event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select value={category} onChange={(event) => updateParam('category', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {categories.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Brand</label>
              <select value={brand} onChange={(event) => updateParam('brand', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {brands.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All brands' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Seller</label>
              <select value={seller} onChange={(event) => updateParam('seller', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {sellers.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All sellers' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Price range</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(event) => updateParam('priceMin', event.target.value)}
                  placeholder="Min"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500"
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(event) => updateParam('priceMax', event.target.value)}
                  placeholder="Max"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Minimum rating</label>
              <select value={minRating} onChange={(event) => updateParam('rating', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                <option value="0">Any rating</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Availability</label>
              <select value={availability} onChange={(event) => updateParam('availability', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                <option value="all">All availability</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Attributes</label>
              <div className="flex flex-wrap gap-2">
                {['travel', 'smart', 'eco', 'wireless', 'outdoor', 'beauty'].map((attribute) => (
                  <button key={attribute} className="rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                    {attribute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Sort by</span>
                {searchSortOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => updateParam('sort', item)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${sort === item ? 'bg-[#1f2d4d] text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {item.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50" />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#d97706]">
                      {product.inStock ? 'In stock' : 'Sold out'}
                    </span>
                    <span className="text-lg font-black text-[#1f2d4d]">${product.price}</span>
                  </div>
                  <p className="text-sm text-slate-500">{product.seller}</p>
                  <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>⭐ {product.rating}</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.attributes.slice(0, 2).map((attribute) => (
                      <span key={attribute} className="rounded-full bg-slate-100 px-2 py-1 text-[0.7rem] text-slate-600">{attribute}</span>
                    ))}
                  </div>
                  <button className="mt-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add to cart</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ShopsPage() {
  return <PageShell title="Marketplace shops" description="Explore seller storefronts, specialty shops, and top-performing stores." />
}

function ShopDetailPage() {
  return <PageShell title="NorthPeak Studio" description="Shop storefront profile with seller bio, featured products, and trust signals." />
}

function ShopProductsPage() {
  return <PageShell title="NorthPeak Studio products" description="All products available from this shop in one storefront listing." />
}

function ShopTopSellingPage() {
  return <PageShell title="Top selling" description="Best-performing products from this shop and their trends." />
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Authentication failed')
      }

      const token = data.accessToken || data.access_token
      if (token) {
        localStorage.setItem('access_token', token)
        localStorage.setItem('accessToken', token)
      }

      if (data.user) {
        localStorage.setItem('vendora_user', JSON.stringify(data.user))
      }

      login({
        user: data.user ?? null,
        token: token ?? data.token ?? null,
        accessToken: token ?? data.token ?? null,
      })

      if (mode === 'register') {
        navigate('/login')
        return
      }

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200" onSubmit={handleSubmit}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{mode === 'login' ? 'Welcome back' : 'Create account'}</p>
      <h2 className="mt-3 text-3xl font-bold">{mode === 'login' ? 'Login to Vendora' : 'Join Vendora'}</h2>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-5">
        {mode === 'register' && (
          <Field
            label="Full name"
            placeholder="Your full name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
        )}
        <Field
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <Field
          label="Password"
          placeholder="••••••••"
          value={form.password}
          type="password"
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-8 rounded-full bg-brand-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
      </button>

      {mode === 'login' && (
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-slate-600">
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create account
          </Link>
          <Link to="/seller" className="font-medium text-slate-700 hover:text-slate-900">
            Become Seller
          </Link>
        </div>
      )}
    </form>
  )
}

function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Account recovery</p>
      <h2 className="mt-3 text-3xl font-bold">Forgot your password?</h2>
      <div className="mt-8">
        <Field label="Email" placeholder="you@example.com" />
      </div>
      <button className="mt-8 rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Send reset link</button>
    </div>
  )
}

function ResetPasswordPage() {
  return <PageShell title="Reset password" description="Set a new password for your Vendora account." />
}

function VerifyEmailPage() {
  return <PageShell title="Verify email" description="Confirm your email address and activate your account." />
}

function AccountPage() {
  return (
    <div className="space-y-6">
      <PageShell title="My account" description="Manage your profile, orders, saved items, reviews, notifications, and account settings." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NavCard title="Profile" to="/account/profile" />
        <NavCard title="Orders" to="/account/orders" />
        <NavCard title="Addresses" to="/account/addresses" />
        <NavCard title="Wishlist" to="/account/wishlist" />
        <NavCard title="Compare" to="/account/compare" />
        <NavCard title="Reviews" to="/account/reviews" />
        <NavCard title="Questions" to="/account/questions" />
        <NavCard title="Notifications" to="/account/notifications" />
        <NavCard title="Coupons" to="/account/coupons" />
        <NavCard title="Affiliate" to="/account/affiliate" />
        <NavCard title="Settings" to="/account/settings" />
      </div>
    </div>
  )
}

function AccountProfilePage() { return <PageShell title="Profile" description="Edit your personal profile information and account details." /> }
function AccountOrdersPage() { return <PageShell title="Orders" description="Track recent orders, delivery updates, and purchase history." /> }
function AccountOrderDetailPage() { return <PageShell title="Order details" description="View the product breakdown, status timeline, and payment summary for this order." /> }
function AccountAddressesPage() { return <PageShell title="Addresses" description="Manage saved delivery addresses and your default shipping preferences." /> }
function AccountWishlistPage() { return <PageShell title="Wishlist" description="Review the products you have saved for later purchase." /> }
function AccountComparePage() { return <PageShell title="Compare" description="Compare products side-by-side before making a purchase decision." /> }
function AccountReviewsPage() { return <PageShell title="Reviews" description="See your submitted reviews and feedback for past purchases." /> }
function AccountQuestionsPage() { return <PageShell title="Questions" description="Review product questions and follow-ups you have created or answered." /> }
function AccountNotificationsPage() { return <PageShell title="Notifications" description="Check platform updates, order alerts, and seller promotions." /> }
function AccountCouponsPage() { return <PageShell title="Coupons" description="View available offers, promo codes, and discount history." /> }
function AccountAffiliatePage() { return <PageShell title="Affiliate" description="Track referrals, click performance, and affiliate earnings." /> }
function AccountSettingsPage() { return <PageShell title="Settings" description="Update password, account preferences, notifications, and privacy controls." /> }

function AboutUsPage() {
  return (
    <div className="space-y-6">
      <PageShell title="About Vendora" description="A modern multivendor marketplace built for trusted shopping, seller growth, and seamless commerce." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Our mission</h3>
          <p className="mt-3 text-slate-600">To make shopping easier, safer, and more rewarding for customers while helping sellers grow sustainable businesses online.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">What we do</h3>
          <p className="mt-3 text-slate-600">We connect buyers and brands through a trusted marketplace that supports discovery, checkout, payments, reviews, and seller operations.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Why customers choose us</h3>
          <p className="mt-3 text-slate-600">Transparent listings, secure payments, verified sellers, competitive pricing, and responsive support across every order journey.</p>
        </div>
      </div>
    </div>
  )
}

function ContactPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Contact us" description="Reach out to the Vendora team for support, partnership requests, and marketplace questions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Customer support</h3>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>Email: support@vendora.com</li>
            <li>Phone: +1 (800) 123-4567</li>
            <li>Hours: Monday to Saturday, 9:00 AM - 8:00 PM</li>
            <li>Address: 123 Market Street, New York, USA</li>
          </ul>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Business inquiries</h3>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>Sales: sales@vendora.com</li>
            <li>Partnerships: partners@vendora.com</li>
            <li>Seller support: sellers@vendora.com</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function CareersPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Careers" description="Join the Vendora team and help build the next generation of trusted commerce." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Product</h3>
          <p className="mt-3 text-slate-600">Build intuitive shopping experiences for buyers and sellers.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Operations</h3>
          <p className="mt-3 text-slate-600">Improve fulfillment, customer happiness, and marketplace trust.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Engineering</h3>
          <p className="mt-3 text-slate-600">Create high-scale, secure, and reliable architecture for commerce.</p>
        </div>
      </div>
    </div>
  )
}

function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Privacy policy" description="How Vendora protects your data and respects your privacy across the marketplace." />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <ul className="space-y-4 text-slate-600">
          <li>We collect information needed to manage accounts, orders, and trust and safety checks.</li>
          <li>We use your data to process payments, fulfill orders, support customer service, and improve marketplace quality.</li>
          <li>We do not sell personal information to third parties.</li>
          <li>You can request account data updates, access, deletion, or privacy changes by reaching out to support.</li>
        </ul>
      </div>
    </div>
  )
}

function ShippingPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Shipping" description="Delivery options, shipping timelines, and fulfillment details for customers and sellers." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Standard</h3>
          <p className="mt-3 text-slate-600">3-5 business days across domestic orders.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Express</h3>
          <p className="mt-3 text-slate-600">1-2 business days with priority handling and tracking updates.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">International</h3>
          <p className="mt-3 text-slate-600">Varies by destination and carrier; customs rules apply.</p>
        </div>
      </div>
    </div>
  )
}

function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Returns" description="Easy return policies, rules, and support for your purchases." />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <ul className="space-y-4 text-slate-600">
          <li>Most items can be returned within 30 days of delivery if unused and in original condition.</li>
          <li>Damaged, defective, or incorrect items can be reported within 48 hours of arrival.</li>
          <li>Return shipping fees may apply depending on the seller and product type.</li>
          <li>Approved refunds are processed back to the original payment method.</li>
        </ul>
      </div>
    </div>
  )
}

function FAQPage() {
  return (
    <div className="space-y-6">
      <PageShell title="FAQ" description="Most common buyer and seller questions answered clearly and simply." />
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">How do I track my order?</h3>
          <p className="mt-2 text-slate-600">Order tracking appears in your account under Orders once the carrier starts delivery.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Can I sell on Vendora?</h3>
          <p className="mt-2 text-slate-600">Yes. Register a shop and complete the seller onboarding flow to submit products and storefront details.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">How are refunds processed?</h3>
          <p className="mt-2 text-slate-600">Refunds are reviewed by the seller and marketplace support before returning funds to the original payment source.</p>
        </div>
      </div>
    </div>
  )
}

function SupportPage() {
  return (
    <div className="space-y-6">
      <PageShell title="Support" description="Get help with orders, account access, payments, returns, and any issues while using Vendora." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Orders</h3>
          <p className="mt-3 text-slate-600">Track order status, delivery updates, and cancellations.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Payments</h3>
          <p className="mt-3 text-slate-600">Resolve failed payments, refunds, and charge issues.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Account</h3>
          <p className="mt-3 text-slate-600">Recover passwords, update profile details, and review account activity.</p>
        </div>
      </div>
    </div>
  )
}

function CartPage() {
  const [cart, setCart] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<any>('/cart/1')
      .then((data) => setCart(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageShell title="Shopping cart" description="Review your items, confirm quantities, and proceed to checkout securely." />
      {error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        {!cart ? (
          <p className="text-slate-500">Loading cart…</p>
        ) : cart.items?.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {cart.items.map((item: any) => (
                <div key={item.productId} className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-lg font-bold text-slate-900">{item.name}</p>
                  <p className="mt-2 text-slate-600">Qty: {item.quantity} • ${Number(item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-lg font-bold text-slate-900">Subtotal: ${Number(cart.subtotal || 0).toFixed(2)}</div>
              <div className="text-lg font-bold text-slate-900">Total: ${Number(cart.total || 0).toFixed(2)}</div>
              <button className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Proceed to checkout</button>
            </div>
          </>
        ) : (
          <p className="text-slate-500">Your cart is empty.</p>
        )}
      </div>
    </div>
  )
}

function SellerSetupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    transactionPassword: '',
    repeatTransactionPassword: '',
    shopName: '',
    certificateType: 'id_card',
    invitationCode: '',
  })
  const [certificateFront, setCertificateFront] = useState<File | null>(null)
  const [certificateBack, setCertificateBack] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.transactionPassword !== form.repeatTransactionPassword) {
      setError('Transaction passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        shopName: form.shopName,
        certificateType: form.certificateType,
        invitationCode: form.invitationCode,
        certificateFront: certificateFront?.name || null,
        certificateBack: certificateBack?.name || null,
      }

      const response = await fetch(`${API_BASE_URL}/sellers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message || 'Seller registration failed.')
      }

      setMessage('Seller registration submitted successfully. Your shop is now pending admin approval.')
      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        transactionPassword: '',
        repeatTransactionPassword: '',
        shopName: '',
        certificateType: 'id_card',
        invitationCode: '',
      })
      setCertificateFront(null)
      setCertificateBack(null)
    } catch (requestError: any) {
      setError(requestError?.message || 'Something went wrong while registering your shop.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <h1 className="text-3xl font-black text-slate-900">Register Your Shop</h1>
          <div className="mt-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <span>Register Your Shop</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          {message ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
          ) : null}

          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">Personal Info</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <FormInput label="Your name" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
              <FormInput label="Your Email" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <FormInput label="Phone" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
              <FormInput label="Your Password" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              <FormInput label="Repeat Password" name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
              <FormInput label="Transaction Password" name="transactionPassword" type="password" placeholder="Transaction Password" value={form.transactionPassword} onChange={handleChange} required />
              <FormInput label="Repeat Transaction Password" name="repeatTransactionPassword" type="password" placeholder="Repeat Transaction Password" value={form.repeatTransactionPassword} onChange={handleChange} required />
            </div>
          </section>

          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Basic Info</h2>
            <div className="space-y-5">
              <FormInput label="Shop Name" name="shopName" placeholder="Shop Name" value={form.shopName} onChange={handleChange} required />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Certificates Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="certificateType"
                  value={form.certificateType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
                >
                  <option value="id_card">Id card</option>
                  <option value="passport">Passport</option>
                  <option value="business_license">Business License</option>
                </select>
              </div>

              <FileInput label="Certificates Front" file={certificateFront} onChange={setCertificateFront} />
              <FileInput label="Certificates Back" file={certificateBack} onChange={setCertificateBack} />
              <FormInput label="Invitation Code" name="invitationCode" placeholder="Invitation Code" value={form.invitationCode} onChange={handleChange} required />
            </div>
          </section>

          <div className="mt-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Registering...' : 'Register Your Shop'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string
  name: string
  type?: string
  placeholder: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
      />
    </div>
  )
}

function FileInput({
  label,
  file,
  onChange,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
        />
        <p className="mt-2 text-xs text-slate-500">{file ? file.name : 'No file chosen'}</p>
      </div>
    </div>
  )
}

function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiRequest<any>('/sellers/dashboard/2'),
      apiRequest<any>('/sellers/earnings/2'),
    ])
      .then(([dashboardData, earningsData]) => {
        setDashboard({ ...dashboardData, ...earningsData })
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-8">
      <PageShell title="Seller dashboard" description="Manage your shop, inventory, orders, payouts, and sales insights from one place." />

      {error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Application status</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">{dashboard ? 'Seller data is live from the API' : 'Shop application is under admin review'}</h3>
            <p className="mt-2 text-sm text-slate-600">{dashboard ? `Revenue: $${Number(dashboard.revenue || 0).toFixed(2)} • Withdrawable: $${Number(dashboard.withdrawableBalance || 0).toFixed(2)}` : 'Your shop profile has been submitted and is awaiting approval before it becomes visible to shoppers.'}</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">{dashboard ? 'Connected' : 'Pending approval'}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={dashboard ? `$${Number(dashboard.revenue || 0).toFixed(2)}` : '$18.4k'} />
        <StatCard label="Orders" value={dashboard ? String(dashboard.orders || 342) : '342'} />
        <StatCard label="Products" value={dashboard ? String(dashboard.products || 1280) : '1,280'} />
        <StatCard label="Customers" value={dashboard ? String(dashboard.visitors || 4860) : '4,860'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Quick actions" content="Create a product, review new orders, manage inventory, and launch discount campaigns for your storefront." />
        <Panel title="Store health" content={dashboard ? `Net earnings: $${Number(dashboard.netEarnings || 0).toFixed(2)} • Commission: $${Number(dashboard.platformCommission || 0).toFixed(2)}` : 'Your shop is active, products are in stock, return rate is stable, and payout schedule is on track.'} />
      </div>
    </div>
  )
}

function SellerShopOverviewPage() {
  return <PageShell title="Shop overview" description="This page displays the seller storefront profile, featured products, trust metrics, and shop information." />
}

function SellerShopSettingsPage() {
  return <PageShell title="Shop settings" description="Update your shop details, branding, policies, payout method, and storefront preferences." />
}

function SellerProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageShell title="Products" description="Manage product listings, pricing, bundles, and catalog visibility." />
        <Link to="/seller/products/create" className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Add product</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NavCard title="Create product" to="/seller/products/create" />
        <NavCard title="Product inventory" to="/seller/products/123/inventory" />
        <NavCard title="Edit product" to="/seller/products/123/edit" />
      </div>
    </div>
  )
}

function SellerProductCreatePage() {
  const formSections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Product name', type: 'text', placeholder: 'Smart Speaker Pro' },
        { label: 'Category', type: 'select', options: ['Electronics', 'Home', 'Fashion', 'Beauty', 'Sports'] },
        { label: 'Brand', type: 'select', options: ['NorthPeak', 'Volt', 'Luma', 'Nova', 'Summit', 'Aural'] },
        { label: 'Description', type: 'textarea', placeholder: 'Describe the product features, benefits, and value proposition.' },
        { label: 'Short description', type: 'text', placeholder: 'Premium wireless speaker with smart connectivity.' }
      ]
    },
    {
      title: 'Media',
      fields: [
        { label: 'Main image', type: 'file', placeholder: 'Upload main image' },
        { label: 'Gallery', type: 'file', placeholder: 'Upload product gallery images' },
        { label: 'Video', type: 'text', placeholder: 'https://example.com/video.mp4' },
        { label: 'Documents', type: 'file', placeholder: 'Add spec sheet or documents' }
      ]
    },
    {
      title: 'Pricing',
      fields: [
        { label: 'Regular price', type: 'number', placeholder: '129.00' },
        { label: 'Sale price', type: 'number', placeholder: '119.00' },
        { label: 'Tax', type: 'number', placeholder: '8.5' },
        { label: 'Cost', type: 'number', placeholder: '84.00' }
      ]
    },
    {
      title: 'Inventory',
      fields: [
        { label: 'SKU', type: 'text', placeholder: 'SPP-BLK-M' },
        { label: 'Stock', type: 'number', placeholder: '25' },
        { label: 'Minimum quantity', type: 'number', placeholder: '1' },
        { label: 'Maximum quantity', type: 'number', placeholder: '10' },
        { label: 'Stock management', type: 'select', options: ['Track inventory', 'Do not track', 'Use low stock alert'] }
      ]
    },
    {
      title: 'Variations',
      fields: [
        { label: 'Attributes', type: 'text', placeholder: 'Color, Size' },
        { label: 'Options', type: 'text', placeholder: 'Black / White / Red, S / M / L / XL' },
        { label: 'Variant combinations', type: 'textarea', placeholder: 'Set combinations, SKUs, and variant-specific stock and pricing.' }
      ]
    },
    {
      title: 'Shipping',
      fields: [
        { label: 'Weight', type: 'text', placeholder: '1.4 kg' },
        { label: 'Length', type: 'text', placeholder: '18 cm' },
        { label: 'Width', type: 'text', placeholder: '12 cm' },
        { label: 'Height', type: 'text', placeholder: '8 cm' },
        { label: 'Shipping class', type: 'select', options: ['Standard', 'Express', 'Fragile', 'Heavy item'] }
      ]
    },
    {
      title: 'SEO',
      fields: [
        { label: 'Meta title', type: 'text', placeholder: 'Smart Speaker Pro | Vendora' },
        { label: 'Meta description', type: 'textarea', placeholder: 'Premium wireless speaker with room-filling sound and smart voice assistant support.' },
        { label: 'Slug', type: 'text', placeholder: 'smart-speaker-pro' },
        { label: 'Keywords', type: 'text', placeholder: 'speaker, smart home, wireless audio' }
      ]
    },
    {
      title: 'Policies',
      fields: [
        { label: 'Warranty', type: 'text', placeholder: '12 months manufacturer warranty' },
        { label: 'Return', type: 'text', placeholder: '30-day return window' },
        { label: 'Refund', type: 'text', placeholder: 'Refund available for unused items' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageShell title="Create product" description="Add a new listing with product details, media, pricing, inventory, shipping, and marketplace-ready metadata." />
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Save draft</button>
          <button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Submit for approval</button>
          <button className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Publish</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          {formSections.map((section) => (
            <section key={section.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900">{section.title}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Required
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {section.fields.map((field) => (
                  <label key={field.label} className={field.type === 'textarea' ? 'md:col-span-2 block' : 'block'}>
                    <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                    ) : field.type === 'select' ? (
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white">
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        <input type="file" className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                        <p className="mt-2">{field.placeholder}</p>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publishing status</p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-50 p-4">
              <span className="text-sm font-semibold text-brand-700">Draft</span>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">In progress</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li>• Required information is ready</li>
              <li>• Media upload is pending</li>
              <li>• SEO metadata recommended</li>
              <li>• Pricing and inventory check required</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <span className="h-8 w-16 rounded-full bg-brand-100" />
                  <span className="h-8 w-16 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex items-center gap-2"><input type="checkbox" /> Product name</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Category & brand</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Media assets</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Pricing & tax</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Inventory</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Variations</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Shipping details</label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
function SellerProductEditPage() { return <PageShell title="Edit product" description="Update product info, price, and catalog status for the live storefront." /> }
function SellerProductInventoryPage() { return <PageShell title="Inventory" description="Track stock levels, reorder points, variants, and fulfillment statuses." /> }
function SellerOrdersPage() { return <PageShell title="Orders" description="Review customer orders, status updates, shipping progress, and fulfillment tasks." /> }
function SellerOrderDetailPage() { return <PageShell title="Order details" description="View item details, buyer information, shipping, and payout status for this order." /> }
function SellerCustomersPage() { return <PageShell title="Customers" description="Manage buyers, repeat customers, support interactions, and purchase history." /> }
function SellerReviewsPage() { return <PageShell title="Reviews" description="Monitor product ratings, comments, and seller response activity." /> }
function SellerQuestionsPage() { return <PageShell title="Questions" description="Answer customer questions about products, shipping, and policies." /> }
function SellerCouponsPage() { return <PageShell title="Coupons" description="Create, edit, and monitor discount campaigns for product groups and storefront events." /> }
function SellerEarningsPage() {
  const [earnings, setEarnings] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<any>('/sellers/earnings/2')
      .then((data) => setEarnings(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageShell title="Earnings" description="Track gross sales, marketplace fees, commissions, and revenue summary reports." />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {earnings ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Gross sales" value={`$${Number(earnings.grossSales || 0).toFixed(2)}`} />
          <StatCard label="Platform commission" value={`$${Number(earnings.platformCommission || 0).toFixed(2)}`} />
          <StatCard label="Net earnings" value={`$${Number(earnings.netEarnings || 0).toFixed(2)}`} />
        </div>
      ) : (
        <p className="text-slate-500">Loading earnings…</p>
      )}
    </div>
  )
}
function SellerTransactionsPage() { return <PageShell title="Transactions" description="Review payouts, settlement activity, and payment history for your shop." /> }
function SellerWithdrawalsPage() { return <PageShell title="Withdrawals" description="Manage outgoing transfers, payout status, and withdrawal history requests." /> }
function SellerAnalyticsPage() { return <PageShell title="Analytics" description="Inspect conversions, performance trends, bestselling products, and traffic insights." /> }
function SellerNotificationsPage() { return <PageShell title="Notifications" description="View alerts about orders, support issues, product performance, and account updates." /> }
function SellerSettingsPage() { return <PageShell title="Seller settings" description="Update your store profile, payment information, tax settings, and marketplace preferences." /> }

function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-slate-900 p-8 text-white shadow-xl ring-1 ring-slate-700">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Admin access</p>
      <h2 className="mt-3 text-3xl font-bold">Login to admin panel</h2>
      <div className="mt-8 grid gap-5">
        <Field label="Admin email" placeholder="admin@vendora.com" />
        <Field label="Password" placeholder="••••••••" />
      </div>
      <div className="mt-8 flex gap-3">
        <button className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-900">Sign in</button>
        <Link to="/admin" className="rounded-full border border-slate-600 px-5 py-3 font-semibold text-white">Go to dashboard</Link>
      </div>
    </div>
  )
}

function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<any>('/admin/commission-overview')
      .then((data) => setSummary(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-8">
      <PageShell title="Admin dashboard" description="Monitor all marketplace operations, seller performance, product approvals, and platform revenue." />

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={summary ? String(summary.totalSellers || 0) : '24.8k'} />
        <StatCard label="Sellers" value={summary ? String(summary.activeSellers || 0) : '1.2k'} />
        <StatCard label="Commission" value={summary ? `$${Number(summary.totalCommission || 0).toFixed(2)}` : '$382k'} />
        <StatCard label="Payouts" value={summary ? `${summary.pendingPayouts || 0}` : '0'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Marketplace activity" content={summary ? `Platform revenue: $${Number(summary.totalRevenue || 0).toFixed(2)} • Pending payout amount: $${Number(summary.pendingPayoutAmount || 0).toFixed(2)}` : 'New seller applications, inventory alerts, and payment settlements are ready for review.'} />
        <Panel title="Operations" content="Orders, refunds, reviews, and payouts are organized by status to support quick approvals." />
      </div>
    </div>
  )
}

function AdminUsersPage() { return <PageShell title="Users" description="Manage customer accounts, status approvals, roles, and account activity." /> }
function AdminUserDetailPage() { return <PageShell title="User details" description="Review account profile, order activity, and platform engagement for this user." /> }
function AdminSellersPage() {
  return (
    <div className="space-y-8">
      <PageShell title="Sellers" description="Review the seller roster, approvals, performance, and storefront activity." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sellers" value="1,248" />
        <StatCard label="Pending approval" value="24" />
        <StatCard label="Approved" value="1,102" />
        <StatCard label="Suspended" value="18" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NavCard title="Pending sellers" to="/admin/sellers/pending" />
        <NavCard title="Approved sellers" to="/admin/sellers/approved" />
        <NavCard title="Suspended sellers" to="/admin/sellers/suspended" />
      </div>
    </div>
  )
}
function AdminSellersPendingPage() {
  const pendingApplications = [
    { name: 'NorthPeak Studio', owner: 'Ariana Cole', email: 'ariana@northpeakstudio.com', submitted: '2026-08-21', category: 'Electronics', risk: 'Low', status: 'Awaiting review' },
    { name: 'Luma Home', owner: 'Marcus Lee', email: 'marcus@lumahome.com', submitted: '2026-08-24', category: 'Home', risk: 'Medium', status: 'Awaiting review' },
    { name: 'Summit Goods', owner: 'Tina Brooks', email: 'tina@summitgoods.co', submitted: '2026-08-26', category: 'Sports', risk: 'Low', status: 'Awaiting review' }
  ]

  return (
    <div className="space-y-6">
      <PageShell title="Pending sellers" description="Review new seller registrations, storefront readiness, and marketplace fit before approving the shop." />

      <div className="space-y-4">
        {pendingApplications.map((shop) => (
          <div key={shop.name} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{shop.name}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{shop.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Owner: {shop.owner} • {shop.email}</p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">Approve</button>
                <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700">Reject</button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submitted</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.submitted}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.category}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{shop.risk}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Storefront</p>
                <p className="mt-2 text-base font-semibold text-slate-800">Profile complete</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review notes</p>
              <p className="mt-2 text-sm text-slate-600">Store details, contact information, shipping policy, and business profile are submitted. Admin should verify supplier legitimacy, brand alignment, and final marketplace readiness.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function AdminSellersApprovedPage() {
  const approvedSellers = [
    { name: 'NorthPeak Studio', owner: 'Ariana Cole', category: 'Electronics', listings: '184', revenue: '$42.8k', status: 'Live' },
    { name: 'Luma Home', owner: 'Marcus Lee', category: 'Home', listings: '98', revenue: '$18.6k', status: 'Live' },
    { name: 'Summit Goods', owner: 'Tina Brooks', category: 'Sports', listings: '126', revenue: '$27.4k', status: 'Live' },
    { name: 'Glow Atelier', owner: 'Nadia Khan', category: 'Beauty', listings: '74', revenue: '$16.1k', status: 'Live' }
  ]

  return (
    <div className="space-y-6">
      <PageShell title="Approved sellers" description="Manage active marketplace sellers and their storefront operations." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live sellers" value="1,102" />
        <StatCard label="New this month" value="46" />
        <StatCard label="Avg. revenue" value="$19.7k" />
        <StatCard label="Conversion" value="8.4%" />
      </div>

      <div className="space-y-4">
        {approvedSellers.map((seller) => (
          <div key={seller.name} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{seller.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{seller.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Owner: {seller.owner}</p>
              </div>

              <Link to="/admin/sellers/:id" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">View seller</Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{seller.category}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Listings</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{seller.listings}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revenue</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{seller.revenue}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
                <p className="mt-2 text-base font-semibold text-slate-800">Healthy</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function AdminSellersSuspendedPage() { return <PageShell title="Suspended sellers" description="Monitor restricted sellers and review account compliance actions." /> }
function AdminSellerDetailPage() { return <PageShell title="Seller details" description="Inspect shop activity, seller profile, products, and payouts for this seller." /> }
function AdminShopsPage() {
  return (
    <div className="space-y-8">
      <PageShell title="Shops" description="Audit storefronts, shop verification, listing quality, and brand health." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live shops" value="1,102" />
        <StatCard label="Pending review" value="24" />
        <StatCard label="Rejected" value="32" />
        <StatCard label="Under review" value="8" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NavCard title="Shop applications" to="/admin/sellers/pending" />
        <NavCard title="Approved shops" to="/admin/sellers/approved" />
        <NavCard title="Suspended shops" to="/admin/sellers/suspended" />
      </div>
    </div>
  )
}
function AdminShopDetailPage() { return <PageShell title="Shop details" description="Review shop performance, policy compliance, and product quality for this storefront." /> }
function AdminProductsPage() { return <PageShell title="Products" description="Moderate product catalog quality, pricing, digital compliance, and inventory health." /> }
function AdminProductsPendingPage() { return <PageShell title="Pending products" description="Review new products awaiting approval before going live." /> }
function AdminProductsApprovedPage() { return <PageShell title="Approved products" description="View all approved marketplace listings and catalog visibility." /> }
function AdminProductsRejectedPage() { return <PageShell title="Rejected products" description="Inspect denied listings and identify recurring marketplace policy issues." /> }
function AdminCategoriesPage() { return <PageShell title="Categories" description="Manage category hierarchy, placement, and storefront navigation structure." /> }
function AdminBrandsPage() { return <PageShell title="Brands" description="Review brand accounts, storefront presence, and compliance status." /> }
function AdminAttributesPage() { return <PageShell title="Attributes" description="Define product filters, product metadata, and merchandising options." /> }
function AdminOrdersPage() { return <PageShell title="Orders" description="Track all orders, status transitions, customer issues, and fulfillment performance." /> }
function AdminOrderDetailPage() { return <PageShell title="Order details" description="Inspect full order lifecycle, shipping data, payment records, and dispute notes." /> }
function AdminPaymentsPage() { return <PageShell title="Payments" description="Monitor gateway health, transaction intake, settlement batches, and payment methods." /> }
function AdminTransactionsPage() { return <PageShell title="Transactions" description="View all processed transactions and financial movement across the platform." /> }
function AdminRefundsPage() { return <PageShell title="Refunds" description="Review refund requests, dispute outcomes, and customer reimbursement status." /> }
function AdminCommissionsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<any>('/admin/commission-overview')
      .then((data) => setSummary(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageShell title="Commissions" description="Monitor marketplace commission split rules and revenue allocations." />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Total commission" value={`$${Number(summary.totalCommission || 0).toFixed(2)}`} />
          <StatCard label="Pending payouts" value={`${summary.pendingPayouts || 0}`} />
        </div>
      ) : (
        <p className="text-slate-500">Loading commission data…</p>
      )}
    </div>
  )
}

function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<any[]>('/admin/payouts')
      .then((data) => setPayouts(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageShell title="Payouts" description="Review seller disbursements, payout batches, and completed settlements." />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      <div className="space-y-3">
        {payouts.length ? payouts.map((payout: any) => (
          <div key={payout.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-bold text-slate-900">Seller #{payout.sellerId}</p>
            <p className="text-sm text-slate-600">Amount: ${Number(payout.amount || 0).toFixed(2)} • Status: {payout.status}</p>
          </div>
        )) : (
          <p className="text-slate-500">No payouts available yet.</p>
        )}
      </div>
    </div>
  )
}
function AdminReviewsPage() { return <PageShell title="Reviews" description="Moderate customer feedback, seller responses, and review policy compliance." /> }
function AdminQuestionsPage() { return <PageShell title="Questions" description="Moderate product questions, support conversations, and answer quality." /> }
function AdminCouponsPage() { return <PageShell title="Coupons" description="Create and monitor marketplace-wide coupon rules and discount policies." /> }
function AdminPromotionsPage() { return <PageShell title="Promotions" description="Manage marketing activities, landing campaigns, and promotional placement." /> }
function AdminBannersPage() { return <PageShell title="Banners" description="Maintain homepage banners, campaign announcements, and store placement assets." /> }
function AdminNotificationsPage() { return <PageShell title="Notifications" description="Send account alerts, compliance notices, and marketplace messaging to users and sellers." /> }
function AdminAffiliatePage() { return <PageShell title="Affiliate" description="Manage partnerships, referral rules, affiliate payouts, and network performance." /> }
function AdminPagesPage() { return <PageShell title="Pages" description="Create and edit static pages, policies, and marketplace informational content." /> }
function AdminMenusPage() { return <PageShell title="Menus" description="Control navigation menus, collections, and storefront hierarchy." /> }
function AdminLanguagesPage() { return <PageShell title="Languages" description="Manage locale settings, translations, and language support for the marketplace." /> }
function AdminCurrenciesPage() { return <PageShell title="Currencies" description="Configure supported currencies, exchange handling, and display rules." /> }
function AdminShippingPage() { return <PageShell title="Shipping" description="Manage shipping zones, services, pricing, and fulfillment options." /> }
function AdminTaxesPage() { return <PageShell title="Taxes" description="Configure tax classes, rules, and compliance settings for marketplaces and sellers." /> }
function AdminReportsPage() { return <PageShell title="Reports" description="Review platform insights, operational trends, and business health metrics." /> }
function AdminSettingsPage() { return <PageShell title="Settings" description="Control platform policy, security, marketplace defaults, and system configuration." /> }

function NotFoundPage() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <h2 className="text-3xl font-bold">Page not found</h2>
      <p className="mt-3 text-slate-600">The route you requested does not exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">
        Back home
      </Link>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 text-slate-600">{text}</p>
    </div>
  )
}

function Panel({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 text-slate-600">{content}</p>
    </div>
  )
}

function PageShell({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Vendora</p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      <p className="mt-3 text-slate-600">{description}</p>
    </div>
  )
}

function NavCard({ title, to }: { title: string; to: string }) {
  return (
    <Link to={to} className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">Open section</p>
    </Link>
  )
}

function Field({
  label,
  placeholder,
  value,
  type = 'text',
  onChange,
}: {
  label: string
  placeholder: string
  value?: string
  type?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-500 focus:bg-white"
      />
    </label>
  )
}

export default App
