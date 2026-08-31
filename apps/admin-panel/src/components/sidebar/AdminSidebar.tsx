import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Overview', route: '/admin/dashboard' },
  { label: 'Users', route: '/admin/users' },
  { label: 'Sellers', route: '/admin/sellers' },
  { label: 'Seller Applications', route: '/admin/seller-applications' },
  { label: 'Products', route: '/admin/products' },
  { label: 'Product Warehouse', route: '/admin/product-warehouse' },
  { label: 'Subscription Plans', route: '/admin/subscription-plans' },
  { label: 'Orders', route: '/admin/orders' },
  { label: 'Payments', route: '/admin/payments' },
  { label: 'Withdrawals', route: '/admin/withdrawals' },
  { label: 'Categories', route: '/admin/categories' },
  { label: 'Brands', route: '/admin/brands' },
  { label: 'Packages', route: '/admin/packages' },
  { label: 'Reviews', route: '/admin/reviews' },
  { label: 'Refunds', route: '/admin/refunds' },
  { label: 'Commissions', route: '/admin/commissions' },
  { label: 'Support', route: '/admin/support' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Settings', route: '/admin/settings' },
]

export function AdminSidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-slate-900 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] lg:block">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Vendora</div>
        <h1 className="mt-3 text-3xl font-semibold">Admin</h1>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.label}
            to={item.route}
            className={({ isActive }) =>
              `flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <span>{item.label}</span>
            <span className="rounded-full bg-slate-200/10 px-2 py-0.5 text-[10px] text-slate-300">•</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-4 shadow-lg">
        <p className="text-[10px] uppercase tracking-[0.22em] text-sky-100">Market pulse</p>
        <p className="mt-3 text-3xl font-bold">+18.6%</p>
        <p className="mt-1 text-sm text-sky-50">Monthly GMV</p>
      </div>
    </aside>
  )
}
