import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Boxes, CircleDollarSign, ClipboardList, LayoutDashboard, LifeBuoy, Package, Receipt, Settings, ShieldCheck, ShoppingBag, Store, Tags, Truck, Users, WalletCards, X } from 'lucide-react'

const navigationGroups = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', route: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', route: '/admin/users', icon: Users },
      { label: 'Sellers', route: '/admin/sellers', icon: Store },
      { label: 'Seller Applications', route: '/admin/seller-applications', icon: ShieldCheck },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', route: '/admin/products', icon: Package },
      { label: 'Product Warehouse', route: '/admin/product-warehouse', icon: Boxes },
      { label: 'Categories', route: '/admin/categories', icon: Tags },
      { label: 'Brands', route: '/admin/brands', icon: Receipt },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Subscription Plans', route: '/admin/subscription-plans', icon: WalletCards },
      { label: 'Orders', route: '/admin/orders', icon: ShoppingBag },
      { label: 'Payments', route: '/admin/payments', icon: CircleDollarSign },
      { label: 'Withdrawals', route: '/admin/withdrawals', icon: Truck },
      { label: 'Packages', route: '/admin/packages', icon: ClipboardList },
      { label: 'Refunds', route: '/admin/refunds', icon: CircleDollarSign },
      { label: 'Commissions', route: '/admin/commissions', icon: WalletCards },
    ],
  },
  {
    label: 'Insights & Care',
    items: [
      { label: 'Reviews', route: '/admin/reviews', icon: ClipboardList },
      { label: 'Support', route: '/admin/support', icon: LifeBuoy },
      { label: 'Reports', route: '/admin/reports', icon: BarChart3 },
      { label: 'Settings', route: '/admin/settings', icon: Settings },
    ],
  },
]

export function AdminSidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  const location = useLocation()
  const sidebarRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = sidebarRef.current
    if (!node) return

    const savedScroll = Number(window.sessionStorage.getItem('admin-sidebar-scroll') ?? '0')
    if (Number.isFinite(savedScroll) && savedScroll >= 0) {
      node.scrollTop = savedScroll
    }

    const handleScroll = () => {
      window.sessionStorage.setItem('admin-sidebar-scroll', String(node.scrollTop))
    }

    node.addEventListener('scroll', handleScroll)
    return () => node.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const saveSidebarScroll = () => {
    const node = sidebarRef.current
    if (node) {
      window.sessionStorage.setItem('admin-sidebar-scroll', String(node.scrollTop))
    }
  }

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 top-0 z-50 flex h-screen w-[252px] max-w-[calc(100vw-1.5rem)] shrink-0 -translate-x-full flex-col overflow-hidden border-r border-slate-200/90 bg-white px-4 py-5 text-slate-700 shadow-[8px_0_30px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out lg:translate-x-0 ${collapsed ? 'lg:w-[84px] lg:px-3' : ''} ${open ? 'translate-x-0' : ''}`}
      aria-label="Admin navigation"
    >
      <div className={`mb-7 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-2.5 py-2.5 ${collapsed ? 'lg:justify-center lg:border-transparent lg:bg-transparent lg:px-0' : ''}`}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">V<span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300" /></div>
        <div className={collapsed ? 'lg:hidden' : ''}><div className="text-lg font-bold tracking-tight text-slate-900">Vendora</div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Admin panel</div></div>
        <button type="button" onClick={onClose} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>

      <nav ref={sidebarRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-5 pr-1">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <div className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.route}
                  onClick={() => { saveSidebarScroll(); onClose() }}
                  preventScrollReset
                  className={({ isActive }) =>
                    `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                      isActive ? 'active bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-opacity group-[.active]:opacity-100" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`mt-4 shrink-0 rounded-2xl bg-slate-50 p-4 ${collapsed ? 'lg:hidden' : ''}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Vendora workspace</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">Marketplace control center</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Keep your operation moving with a clear view of every channel.</p>
      </div>
    </aside>
  )
}
