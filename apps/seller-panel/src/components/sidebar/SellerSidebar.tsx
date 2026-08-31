import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type MenuItem = {
  label: string
  route: string
  icon: ReactNode
  badge?: number
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/seller/dashboard', icon: '◫' },
  { label: 'Products', route: '/seller/products', icon: '◧' },
  { label: 'Product Warehouse', route: '/seller/product-warehouse', icon: '▣' },
  { label: 'Orders', route: '/seller/orders', icon: '◬', badge: 1 },
  { label: 'Package', route: '/seller/package', icon: '▤' },
  { label: 'Traffic Packages', route: '/seller/traffic-packages', icon: '◎' },
  { label: 'Affiliate System', route: '/seller/affiliate', icon: '◍' },
  { label: 'Money Withdraw', route: '/seller/withdraw', icon: '◐' },
  { label: 'Conversations', route: '/seller/conversations', icon: '◔' },
  { label: 'Shop Setting', route: '/seller/settings', icon: '⚙' },
  { label: 'Received Refund Request', route: '/seller/refunds', icon: '↺' },
  { label: 'Commission History', route: '/seller/commission-history', icon: '◌' },
  { label: 'Product Queries', route: '/seller/product-queries', icon: '❓' },
  { label: 'Support Ticket', route: '/seller/support', icon: '✦' },
  { label: 'Uploaded Files', route: '/seller/uploaded-files', icon: '▭' },
  { label: 'Transaction Password', route: '/seller/transaction-password', icon: '◈' },
  { label: 'Payment Settings', route: '/seller/payment-settings', icon: '◉' },
]

export function SellerSidebar() {
  return (
    <aside className="w-[220px] shrink-0 border-r border-slate-200 bg-[#f6f8fb] p-4">
      <div className="mb-4 flex items-center justify-between gap-2 rounded bg-white px-3 py-2 shadow-sm">
        <button className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-lg text-slate-600">
          ☰
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600">
          🔔
        </button>
      </div>

      <div className="mb-6 rounded bg-[#f1f5f9] px-3 py-4 text-center shadow-inner">
        <div className="text-[1.65rem] font-black tracking-tight text-slate-800">Nede store</div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">seller</div>
      </div>

      <nav className="space-y-1 text-sm">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.route}
            className={({ isActive }) =>
              `flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition ${
                isActive ? 'bg-[#2d80d8] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge && !isActive ? (
                  <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
