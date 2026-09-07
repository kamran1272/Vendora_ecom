import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { clearSellerSession } from '../../services/api'
import { getSellerDashboard } from '../../services/dashboard.service'
import { fetchSellerChatConversations } from '../../services/chat'
import { useSellerLanguage } from '../../i18n/sellerLanguage'
import {
  BarChart3,
  Boxes,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileUp,
  Headphones,
  House,
  LockKeyhole,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  RotateCcw,
  ShoppingBag,
  Store,
  Ticket,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react'

type SidebarChild = {
  label: string
  route: string
  badge?: number
}

type SidebarItem = {
  label: string
  route?: string
  icon: ReactNode
  badge?: number
  children?: SidebarChild[]
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', route: '/seller/dashboard', icon: <House size={17} strokeWidth={1.9} /> },
  {
    label: 'Products',
    route: '/seller/products',
    icon: <Package size={17} strokeWidth={1.9} />,
    children: [
      { label: 'Products', route: '/seller/products' },
      { label: 'Product Reviews', route: '/seller/reviews' },
    ],
  },
  { label: 'Product Storehouse', route: '/seller/product/storehouse', icon: <Warehouse size={17} strokeWidth={1.9} /> },
  { label: 'Orders', route: '/seller/orders', icon: <ClipboardList size={17} strokeWidth={1.9} /> },
  {
    label: 'Package',
    route: '/seller/seller-packages',
    icon: <Package size={17} strokeWidth={1.9} />,
    children: [
      { label: 'Packages', route: '/seller/seller-packages' },
      { label: 'Purchase Packages', route: '/seller/packages-payment-list' },
    ],
  },
  {
    label: 'Traffic Packages',
    route: '/seller/seller-spread-packages',
    icon: <Megaphone size={17} strokeWidth={1.9} />,
    children: [
      { label: 'Traffic Packages', route: '/seller/seller-spread-packages' },
      { label: 'Purchase Traffic Packages', route: '/seller/spread-packages-payment-list' },
    ],
  },
  { label: 'Affiliate System', route: '/seller/affiliate', icon: <Users size={17} strokeWidth={1.9} /> },
  { label: 'Money Withdraw', route: '/seller/money-withdraw-requests', icon: <Wallet size={17} strokeWidth={1.9} /> },
  { label: 'Shop Setting', route: '/seller/shop', icon: <Store size={17} strokeWidth={1.9} /> },
  { label: 'Received Refund Request', route: '/refund-request', icon: <RotateCcw size={17} strokeWidth={1.9} /> },
  { label: 'Commission History', route: '/seller/commission-history', icon: <DollarSign size={17} strokeWidth={1.9} /> },
  { label: 'Product Queries', route: '/seller/product-queries', icon: <CircleHelp size={17} strokeWidth={1.9} /> },
  { label: 'Support Ticket', route: '/seller/support_ticket', icon: <Headphones size={17} strokeWidth={1.9} /> },
  { label: 'Uploaded Files', route: '/seller/uploads', icon: <FileUp size={17} strokeWidth={1.9} /> },
  { label: 'Transaction Password', route: '/seller/transaction', icon: <LockKeyhole size={17} strokeWidth={1.9} />, children: [{ label: 'Set Transaction Password', route: '/seller/transaction' }] },
  { label: 'Payment Settings', route: '/seller/payment-settings', icon: <CreditCard size={17} strokeWidth={1.9} /> },
]

type SellerProfile = {
  name: string
  shopName: string
  email: string
}

function getStoredSellerProfile(): SellerProfile {
  try {
    const user = JSON.parse(localStorage.getItem('vendora_user') || 'null')
    return {
      name: user?.name || 'Seller profile unavailable',
      shopName: user?.shopName || user?.name || 'Seller profile unavailable',
      email: user?.email || 'Email unavailable',
    }
  } catch {
    return { name: 'Seller profile unavailable', shopName: 'Seller profile unavailable', email: 'Email unavailable' }
  }
}

type SellerSidebarProps = {
  collapsed?: boolean
  mobile?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
}

const expandedStateKey = 'vendora-seller-sidebar-expanded'

export function SellerSidebar({ collapsed = false, mobile = false, onClose, onToggleCollapse }: SellerSidebarProps) {
  const { t } = useSellerLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(expandedStateKey)
      const parsed = stored ? JSON.parse(stored) : {}
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [seller, setSeller] = useState<SellerProfile>(() => getStoredSellerProfile())
  const [newOrderCount, setNewOrderCount] = useState<number | null>(null)
  const [unreadConversationCount, setUnreadConversationCount] = useState<number | null>(null)
  const navigationRef = useRef<HTMLElement | null>(null)
  const dashboardQuery = useQuery({ queryKey: ['seller-dashboard'], queryFn: getSellerDashboard, staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: false })

  useEffect(() => {
    setNewOrderCount(Math.max(0, Number(dashboardQuery.data?.orders?.newOrder) || 0))
  }, [dashboardQuery.data])

  useEffect(() => {
    const syncSeller = () => setSeller(getStoredSellerProfile())
    window.addEventListener('storage', syncSeller)
    return () => window.removeEventListener('storage', syncSeller)
  }, [])

  useEffect(() => {
    localStorage.setItem(expandedStateKey, JSON.stringify(expanded))
  }, [expanded])

  useEffect(() => {
    let active = true
    const loadUnreadConversations = async () => {
      try {
        const conversations = await fetchSellerChatConversations()
        const unreadCount = conversations.reduce((total, conversation) => total + Math.max(0, Number(conversation.unreadCount) || 0), 0)
        if (active) setUnreadConversationCount(unreadCount)
      } catch {
      }
    }

    void loadUnreadConversations()
    const refreshTimer = window.setInterval(() => void loadUnreadConversations(), 8_000)
    return () => {
      active = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    const navigation = navigationRef.current
    if (!navigation) return

    const savedScrollTop = Number(sessionStorage.getItem('seller-sidebar-scroll-top') || 0)
    window.requestAnimationFrame(() => {
      navigation.scrollTop = Number.isFinite(savedScrollTop) ? savedScrollTop : 0
    })

    const saveScrollPosition = () => {
      sessionStorage.setItem('seller-sidebar-scroll-top', String(navigation.scrollTop))
    }

    navigation.addEventListener('scroll', saveScrollPosition, { passive: true })
    return () => navigation.removeEventListener('scroll', saveScrollPosition)
  }, [])

  useEffect(() => {
    const nextState: Record<string, boolean> = {}

    sidebarItems.forEach((item) => {
      const activeChild = item.children?.some((child) => location.pathname === child.route || location.pathname.startsWith(`${child.route}/`))
      if (activeChild || (item.route && (location.pathname === item.route || location.pathname.startsWith(`${item.route}/`)))) {
        nextState[item.label] = true
      }
    })

    setExpanded((current) => ({ ...current, ...nextState }))
  }, [location.pathname])

  const handleLogout = () => {
    clearSellerSession()
    onClose?.()
    navigate('/users/login', { replace: true })
  }

  const renderNavLabel = (item: SidebarItem, isActive: boolean, isSubItem = false) => (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm">{item.icon}</span>
        {!collapsed || isSubItem ? <span className="truncate text-left">{({ Dashboard: t('dashboard'), Products: t('products'), 'Product Reviews': t('productReviews'), 'Product Storehouse': t('productStorehouse'), Orders: t('orders'), Package: t('packages'), Packages: t('packages'), 'Purchase Packages': t('purchasePackages'), 'Traffic Packages': t('trafficPackages'), 'Purchase Traffic Packages': t('purchaseTrafficPackages'), 'Affiliate System': t('affiliate'), 'Money Withdraw': t('moneyWithdraw'), Conversations: t('conversations'), 'Shop Setting': t('shopSetting'), 'Received Refund Request': t('receivedRefund'), 'Commission History': t('commissionHistory'), 'Product Queries': t('productQueries'), 'Support Ticket': t('supportTicket'), 'Uploaded Files': t('uploadedFiles'), 'Transaction Password': t('transactionPassword'), 'Payment Settings': t('paymentSettings') } as Record<string, string>)[item.label] || item.label}</span> : null}
      </span>
      {!collapsed && item.badge ? (
        <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
      {!collapsed && item.label === 'Orders' && newOrderCount ? (
        <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" role="status" aria-live="polite" aria-label={`${newOrderCount} new orders`}>
          {newOrderCount}
        </span>
      ) : null}
      {!collapsed && item.label === 'Conversations' && unreadConversationCount ? (
        <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" role="status" aria-live="polite" aria-label={`${unreadConversationCount} unread conversations`}>
          {unreadConversationCount}
        </span>
      ) : null}
      {!collapsed && item.children ? (
        <ChevronDown size={14} className={`transition-transform ${expanded[item.label] ? 'rotate-180' : ''}`} />
      ) : null}
      {collapsed && (item.badge || item.children || (item.label === 'Orders' && newOrderCount) || (item.label === 'Conversations' && unreadConversationCount)) ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white" role="status" aria-live="polite" aria-label={item.label === 'Orders' && newOrderCount ? `${newOrderCount} new orders` : item.label === 'Conversations' && unreadConversationCount ? `${unreadConversationCount} unread conversations` : undefined}>
          {item.label === 'Orders' && newOrderCount ? newOrderCount : item.label === 'Conversations' && unreadConversationCount ? unreadConversationCount : item.badge || (item.children ? '•' : '')}
        </span>
      ) : null}
      {!isSubItem && !collapsed && item.route && isActive && !item.children ? (
        <span className="ml-auto h-2 w-2 rounded-full bg-white/90" />
      ) : null}
    </>
  )

  const itemGroups = useMemo(
    () =>
      sidebarItems.map((item) => {
        const isParentActive = Boolean(
          (item.route && (location.pathname === item.route || location.pathname.startsWith(`${item.route}/`))) ||
            item.children?.some((child) => location.pathname === child.route || location.pathname.startsWith(`${child.route}/`)),
        )

        const isExpanded = expanded[item.label] ?? isParentActive

        return { item, isParentActive, isExpanded }
      }),
    [expanded, location.pathname],
  )

  return (
    <aside
      className={[
        'sticky top-0 flex h-screen shrink-0 flex-col self-start border-r border-[#e2e8f0] bg-white text-[#334155] shadow-[4px_0_18px_rgba(15,23,42,0.025)] transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-[264px]',
        mobile ? 'w-[280px] border-r-0 shadow-[0_8px_32px_rgba(15,23,42,0.12)]' : '',
      ].join(' ')}
    >
      <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white px-3 py-3">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3b82f6] text-sm font-bold text-white shadow-sm">
            {(seller.name || seller.shopName).slice(0, 1).toUpperCase()}
          </div>
          {!collapsed || mobile ? (
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold tracking-tight text-[#1e293b]">{seller.shopName}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#64748b]">seller workspace</div>
              <div className="mt-0.5 truncate text-xs text-[#64748b]">{seller.email}</div>
            </div>
          ) : null}
        </div>
        {mobile ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-600"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={collapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
            title={collapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
            onClick={onToggleCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      <nav ref={navigationRef} aria-label="Seller navigation" className="seller-nav-scroll flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {itemGroups.map(({ item, isParentActive, isExpanded }) => {
          const isClickableParent = Boolean(item.route)
          const itemContent = (
            <div className="relative flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2d80d8]/30">
              {renderNavLabel(item, isParentActive)}
            </div>
          )

          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-expanded={isExpanded}
                  title={collapsed ? item.label : undefined}
                  onClick={() => {
                    if (isClickableParent && !collapsed) {
                      navigate(item.route as string)
                    }
                    setExpanded((current) => ({ ...current, [item.label]: !current[item.label] }))
                    onClose?.()
                  }}
                  className={[
                    'flex w-full items-center rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#2d80d8]/15',
                    isParentActive ? 'bg-[#2d80d8] text-white shadow-[0_8px_18px_rgba(45,128,216,0.18)]' : 'text-slate-700 hover:bg-slate-100',
                    collapsed ? 'justify-center px-2 py-3' : 'justify-between px-2.5 py-2.5',
                  ].join(' ')}
                >
                  {renderNavLabel(item, isParentActive)}
                </button>

                {!collapsed && isExpanded ? (
                  <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.route || location.pathname.startsWith(`${child.route}/`)
                      return (
                        <NavLink
                          key={child.route}
                          to={child.route}
                          title={child.label}
                          onClick={onClose}
                          className={({ isActive }) =>
                            [
                              'flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#2d80d8]/15',
                              isActive || isChildActive ? 'bg-sky-50 text-[#1d5fb9] ring-1 ring-sky-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                            ].join(' ')
                          }
                        >
                          <span className="truncate">{child.label}</span>
                          {child.badge ? (
                            <span className="ml-2 inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {child.badge}
                            </span>
                          ) : null}
                        </NavLink>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.route as string}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex w-full items-center rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#2d80d8]/15',
                  isActive || isParentActive ? 'bg-[#2d80d8] text-white shadow-[0_8px_18px_rgba(45,128,216,0.18)]' : 'text-slate-700 hover:bg-slate-100',
                  collapsed ? 'justify-center' : 'justify-between',
                ].join(' ')
              }
            >
              {itemContent}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-[#e2e8f0] bg-white p-3">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          title={collapsed ? 'Logout' : undefined}
          className={[
            'flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100',
            collapsed ? 'justify-center' : 'justify-start',
          ].join(' ')}
        >
          <LogOut size={16} />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  )
}
