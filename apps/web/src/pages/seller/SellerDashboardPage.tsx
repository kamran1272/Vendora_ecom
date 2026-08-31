const sidebarItems = [
  { label: 'Dashboard', active: false },
  { label: 'Shop', active: true },
  { label: 'Products', active: false },
  { label: 'Orders', active: false },
  { label: 'Customers', active: false },
  { label: 'Marketing', active: false },
  { label: 'Reports', active: false },
  { label: 'Reviews', active: false },
  { label: 'Coupons', active: false },
  { label: 'Withdrawals', active: false },
  { label: 'Earnings', active: false },
  { label: 'Inbox', active: false },
  { label: 'Settings', active: false },
  { label: 'Support', active: false }
]

const tabs = ['Shop Information', 'Shop Banner', 'Social Links', 'SEO Settings', 'Policy Settings']

export function SellerDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f4f5f8] text-slate-900">
      <aside className="w-[260px] border-r border-slate-200 bg-white p-4">
        <div className="mb-6 flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b3df6] text-lg font-bold text-white">S</div>
          <div>
            <div className="text-xl font-black text-slate-900">Shopverse</div>
            <div className="text-xs text-slate-500">Seller Panel</div>
          </div>
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${item.active ? 'bg-[#f0ebff] text-[#3d2fc2]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{item.label === 'Dashboard' ? '◫' : item.label === 'Shop' ? '◫' : '◧'}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl bg-[#f3edff] p-4">
          <div className="text-sm font-semibold text-[#4f37b5]">Upgrade to Premium</div>
          <div className="mt-2 text-xs text-slate-600">Unlock exclusive features</div>
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
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#facc15] to-[#f97316] text-sm font-bold text-white">JD</button>
            <div className="text-right">
              <div className="font-semibold text-slate-800">John Doe</div>
              <div className="text-xs text-slate-500">Seller</div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900">Shop Settings</h1>
              <p className="mt-2 text-sm text-slate-500">Dashboard <span className="mx-2">›</span> Shop <span className="mx-2">›</span> Shop Profile</p>
            </div>
            <button className="rounded-xl bg-[#4d2ec9] px-5 py-3 font-semibold text-white">View My Shop ↗</button>
          </div>

          <div className="mt-6 flex gap-3 border-b border-slate-200 bg-transparent">
            {tabs.map((tab, index) => (
              <button key={tab} className={`rounded-t-xl px-4 py-3 text-sm font-medium ${index === 0 ? 'border-b-2 border-[#4d2ec9] bg-white text-[#3d2fc2]' : 'text-slate-500'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <section className="space-y-6">
              <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-2xl font-black text-slate-900">Basic Information</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Shop Name *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="Tech World Store" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Shop Slug *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="tech-world-store" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Shop Email *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="support@techworldstore.com" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Phone Number</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="+1 202-555-0147" readOnly />
                  </label>
                  <label className="md:col-span-2 block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Shop Description *</span>
                    <textarea rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="We provide the best quality electronic products with affordable prices and excellent customer service." readOnly />
                  </label>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-2xl font-black text-slate-900">Address Information</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Address Line 1 *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="1234 Market Street" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Address Line 2</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="Suite 567 (Optional)" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Country *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="United States" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">State / Province *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="California" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">City *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="Los Angeles" readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Zip / Postal Code *</span>
                    <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value="90001" readOnly />
                  </label>
                </div>
              </div>

              <button className="rounded-xl bg-[#4d2ec9] px-5 py-3 text-sm font-semibold text-white">Save Changes</button>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-900">Shop Preview</h3>
                <div className="mt-4 rounded-[20px] bg-[#0d0d0f] p-4 text-white">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Best Quality Electronics</div>
                  <div className="mt-3 text-3xl font-black leading-tight">TECH WORLD STORE</div>
                </div>

                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4d2ec9] text-xl font-bold text-white">TW</div>
                  <div className="flex-1">
                    <div className="text-xl font-black text-slate-900">Tech World Store</div>
                    <div className="text-sm text-slate-500">tech-world-store</div>
                    <div className="mt-1 text-amber-500">★★★★★ <span className="text-slate-500">(123)</span></div>
                  </div>
                  <button className="rounded-xl bg-[#4d2ec9] px-4 py-2 text-sm font-semibold text-white">Visit Shop</button>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-900">Shop Banner</h3>
                <div className="mt-4 rounded-[20px] bg-[#0d0d0f] p-4 text-white">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Best Quality Electronics</div>
                  <div className="mt-3 text-2xl font-black leading-tight">TECH WORLD</div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 rounded-xl bg-[#f3edff] px-3 py-2 text-sm font-semibold text-[#4d2ec9]">Change</button>
                  <button className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Remove</button>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-900">Shop Policies</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button className="rounded-xl bg-[#ebfff2] p-3 text-left text-sm font-medium text-[#12824a]">Return Policy</button>
                  <button className="rounded-xl bg-[#eef3ff] p-3 text-left text-sm font-medium text-[#234db6]">Shipping Policy</button>
                  <button className="rounded-xl bg-[#fff2fb] p-3 text-left text-sm font-medium text-[#bf3d7c]">Privacy Policy</button>
                  <button className="rounded-xl bg-[#fff7e8] p-3 text-left text-sm font-medium text-[#b46d0d]">Terms & Conditions</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
