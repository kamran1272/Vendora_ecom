import { useEffect, useState } from 'react'
import { CategoryProductCount } from '../../components/dashboard/CategoryProductCount'
import { DashboardCards } from '../../components/dashboard/DashboardCards'
import { SalesStatCard } from '../../components/dashboard/SalesStatCard'
import { TopProducts } from '../../components/dashboard/TopProducts'
import { SellerSidebar } from '../../components/sidebar/SellerSidebar'
import { fallbackDashboard, getSellerDashboard } from '../../services/dashboard.service'
import type { SellerDashboardResponse } from '../../types'

const categoryCounts = [
  { name: 'Women Clothing & Fashion', count: 130 },
  { name: 'Men Clothing & Fashion', count: 54 },
  { name: 'Kids & toy', count: 7 },
  { name: 'Home Improvement & Tools', count: 3 },
  { name: 'Home decoration & Appliance', count: 3 },
]

const topProducts = [
  { id: 1, name: 'Women Fashion Bag', price: 66.9, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Green Casual Jacket', price: 58.0, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Modern Light Set', price: 42.0, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Blue Work Dress', price: 74.0, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Classic Leather Bag', price: 86.0, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'Light Beige Tote', price: 91.0, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'Trending Fashion Set', price: 68.0, image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'White Fashion Bundle', price: 75.0, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80' },
  { id: 9, name: 'Premium Office Tote', price: 88.0, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { id: 10, name: 'Soft White Jacket', price: 64.0, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80' },
  { id: 11, name: 'Blue Office Look', price: 72.0, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80' },
  { id: 12, name: 'Elegant Carry Bag', price: 99.9, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80' },
]

export function Dashboard() {
  const [dashboard, setDashboard] = useState<SellerDashboardResponse | null>(null)

  useEffect(() => {
    void getSellerDashboard().then((data) => setDashboard(data ?? fallbackDashboard))
  }, [])

  const currentDashboard = dashboard && dashboard.shop ? dashboard : fallbackDashboard

  if (!dashboard) {
    return <div className="p-6 text-slate-600">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-[#edf2f8] p-2 text-slate-800 md:p-4">
      <div className="mx-auto flex max-w-[1500px] overflow-hidden border border-slate-200 bg-[#edf2f8] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <SellerSidebar />

        <div className="min-w-0 flex-1 bg-[#f3f5fa]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="text-sm text-slate-500">Dashboard</div>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">🔔</button>
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">👤 {currentDashboard.shop.name}</button>
            </div>
          </header>

          <main className="space-y-6 p-6">
            <div className="mb-2">
              <div className="text-sm text-slate-500">Rating</div>
              <div className="mt-2 flex items-center gap-1 text-xl text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>{star <= currentDashboard.shop.rating ? '★' : '☆'}</span>
                ))}
              </div>
              {currentDashboard.shop.verified ? (
                <div className="mt-2 inline-flex rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Shop verified</div>
              ) : null}
            </div>

            <DashboardCards data={currentDashboard} />

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <SalesStatCard title="Sold Amount" subtitle="Your Sold Amount (Current day)" current={currentDashboard.sales.today} previous={currentDashboard.sales.yesterday} previousLabel="Last day" />
                <SalesStatCard title="Sold Amount" subtitle="Your sold amount (current month)" current={currentDashboard.sales.currentMonth} previous={currentDashboard.sales.lastMonth} previousLabel="Last Month" />
              </div>

              <CategoryProductCount categories={categoryCounts} />
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Today Views</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{currentDashboard.statistics.todayViews}</div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Orders</h3>
                <span className="text-xs text-slate-500">This Month</span>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-xs text-slate-500">New Order</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{currentDashboard.orders.newOrder}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Cancelled</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{currentDashboard.orders.cancelled}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">On delivery</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{currentDashboard.orders.onDelivery}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Delivered</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{currentDashboard.orders.delivered}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800">Purchased Package</h3>
                <div className="mt-5">
                  <div className="text-xs text-slate-500">Current Package:</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">{currentDashboard.packageInfo?.name ?? 'Silver Shop'}</div>
                  <div className="mt-4 text-sm text-slate-700">
                    Product Upload Limit: <strong>{currentDashboard.packageInfo?.uploadLimit ?? 200} Times</strong>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded bg-slate-200">
                    <div className="h-full rounded bg-[#287ed6]" style={{ width: '80%' }} />
                  </div>
                  <div className="mt-5 text-xs text-slate-500">Package Expires at: {currentDashboard.packageInfo?.expiresAt ?? '2027-07-31'}</div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800">Money Withdraw</h3>
                <button className="mt-8 inline-flex rounded border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Go to setting
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <button className="flex min-h-[110px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-[#287ed6] shadow-sm transition hover:bg-slate-50">
                <div className="text-center">
                  <div className="text-4xl leading-none">+</div>
                  <div className="mt-2 text-sm font-medium">Add New Product</div>
                </div>
              </button>

              <button className="flex min-h-[110px] items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                <div className="text-center">
                  <div className="text-2xl">⚙</div>
                  <div className="mt-2 text-sm font-medium">Shop Settings</div>
                </div>
              </button>

              <button className="flex min-h-[110px] items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                <div className="text-center">
                  <div className="text-2xl">💳</div>
                  <div className="mt-2 text-sm font-medium">Payment Settings</div>
                </div>
              </button>
            </div>

            <TopProducts products={topProducts} />

            <footer className="pt-2 text-center text-sm text-slate-500">© Vendora</footer>
          </main>
        </div>
      </div>
    </div>
  )
}
