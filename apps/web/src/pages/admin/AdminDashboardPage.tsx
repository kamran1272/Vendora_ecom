const adminSidebar = ['Dashboard', 'Users', 'Sellers', 'Products', 'Orders', 'Payments', 'Payouts', 'Reviews', 'Categories', 'Brands', 'Coupons', 'Marketing', 'CMS', 'Reports', 'Settings']

export function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f4f5f8] text-slate-900">
      <aside className="w-[260px] border-r border-slate-200 bg-white p-4">
        <div className="mb-6 flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b3df6] text-lg font-bold text-white">S</div>
          <div>
            <div className="text-xl font-black text-slate-900">Shopverse</div>
            <div className="text-xs text-slate-500">Admin Panel</div>
          </div>
        </div>

        <nav className="space-y-1">
          {adminSidebar.map((item, index) => (
            <button key={item} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${index === 0 ? 'bg-[#f0ebff] text-[#3d2fc2]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{index === 0 ? '◫' : '◧'}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl bg-[#f3edff] p-4">
          <div className="text-sm font-semibold text-[#4f37b5]">Premium Version</div>
          <div className="mt-2 text-xs text-slate-600">Get access to all features</div>
          <button className="mt-4 w-full rounded-xl bg-[#4a38cd] px-3 py-2 text-sm font-semibold text-white">Upgrade Now</button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg">☰</button>
            <div className="relative">
              <input placeholder="Search for anything..." className="w-[320px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg">🔔</button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg">✦</button>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#facc15] to-[#60a5fa] text-sm font-bold text-white">AD</div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">Admin User</div>
                <div className="text-[10px] text-slate-500">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black text-slate-900">Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">Home <span className="mx-2">›</span> Dashboard</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">May 23, 2024 - Jun 22, 2024</div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['Total Sales', '$125,430.50', '+12.5%', 'green'],
              ['Total Orders', '1,246', '+8.3%', 'blue'],
              ['Total Customers', '8,549', '+15.6%', 'pink'],
              ['Total Sellers', '532', '+9.1%', 'purple'],
              ['Total Products', '12,489', '+7.4%', 'orange']
            ].map(([label, value, delta, tint]) => (
              <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">{label.includes('Sales') ? '🛍️' : label.includes('Orders') ? '🛒' : label.includes('Customers') ? '👥' : label.includes('Sellers') ? '🏪' : '📦'}</div>
                  <div className={`rounded-full px-2 py-1 text-[11px] font-semibold ${tint === 'green' ? 'bg-emerald-100 text-emerald-700' : tint === 'blue' ? 'bg-blue-100 text-blue-700' : tint === 'pink' ? 'bg-pink-100 text-pink-700' : tint === 'purple' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>{delta}</div>
                </div>
                <div className="mt-4 text-sm text-slate-500">{label}</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.85fr_0.8fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Sales Overview</h2>
                <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">Monthly</button>
              </div>
              <div className="mt-6 flex h-60 items-end justify-between gap-2">
                {[40, 60, 48, 80, 65, 90, 76, 84, 68, 95, 72, 88].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center">
                    <div className="w-full rounded-t-2xl bg-gradient-to-t from-[#6c4af1] to-[#b7a5ff]" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Order Overview</h2>
                <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">Monthly</button>
              </div>
              <div className="mt-6 flex items-center justify-center">
                <div className="flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-[#4d2ec9] border-l-[#facc15] border-t-[#5eead4] border-r-[#f59e0b] text-3xl font-black text-slate-900">1,246</div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Recent Orders</h2>
                <button className="text-sm font-semibold text-[#4d2ec9]">View All</button>
              </div>
              <div className="mt-4 space-y-3">
                {['#ORD-7456', '#ORD-7455', '#ORD-7454', '#ORD-7453', '#ORD-7452'].map((id, index) => (
                  <div key={id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{id}</div>
                      <div className="text-xs text-slate-500">John Doe</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">${[299.99, 159.50, 89.99, 449.99, 39.99][index]}</div>
                      <div className={`text-[11px] font-medium ${index === 0 ? 'text-emerald-600' : index === 1 ? 'text-amber-600' : index === 2 ? 'text-blue-600' : index === 3 ? 'text-orange-600' : 'text-rose-600'}`}>
                        {['Delivered', 'Processing', 'Shipped', 'Pending', 'Cancelled'][index]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Sales Analytics</h2>
                <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">Monthly</button>
              </div>
              <div className="mt-6 text-4xl font-black text-slate-900">$125,430.50</div>
              <div className="mt-4 flex h-44 items-end justify-between gap-2">
                {[50, 90, 70, 110, 80, 120, 100].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-2xl bg-gradient-to-t from-[#845ef7] to-[#b69cff]" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Top Selling Products</h2>
                <button className="text-sm font-semibold text-[#4d2ec9]">View All</button>
              </div>
              <div className="mt-4 space-y-3">
                {['Apple iPhone 14 Pro', 'Sony WH-1000XM5 Headphones', 'Samsung Galaxy Watch 6', 'MacBook Air M2', 'Canon EOS R10'].map((name, index) => (
                  <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-lg">📦</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{name}</div>
                        <div className="text-[11px] text-slate-500">Sold: {index === 0 ? 245 : index === 1 ? 198 : index === 2 ? 156 : index === 3 ? 134 : 98}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800">${[12000, 66420, 51324, 130000, 58702][index]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Seller Summary</h2>
                <button className="text-sm font-semibold text-[#4d2ec9]">View All</button>
              </div>
              <div className="mt-4 space-y-3">
                {['Tech Store', 'Fashion Hub', 'Gadget World', 'Home Essentials', 'Book Haven'].map((name, index) => (
                  <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#facc15] to-[#f97316] text-xs font-bold text-white">{name[0]}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{name}</div>
                        <div className="text-[11px] text-slate-500">{[123, 98, 76, 54, 43][index]} Products</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900">${[25430, 18670, 15980, 11230, 7890][index]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
