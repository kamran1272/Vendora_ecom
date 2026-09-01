import { Link } from 'react-router-dom'
import { apiNavigationItems, categoryItems, productItems } from '@/data/marketplace'

const statPills = [
  { label: 'Free Shipping', text: 'On orders over $50', icon: '🚚' },
  { label: '24/7 Support', text: 'Customer support', icon: '☎️' },
  { label: 'Secure Payment', text: '100% secure payment', icon: '🔒' },
  { label: 'Easy Returns', text: '30 days return policy', icon: '↩️' },
  { label: 'Best Deals', text: 'Guaranteed best price', icon: '🏆' }
]

const categoryIcons: Record<string, string> = {
  Electronics: '🎧',
  Home: '🛋️',
  Fashion: '👕',
  Beauty: '🧴',
  Sports: '⚽',
  Books: '📚',
  Computers: '💻',
  Smartphones: '📱',
  'Home & Kitchen': '🏠',
  Automotive: '🚗'
}

const sectionGroups = [
  { title: 'New Products', products: productItems.slice(0, 5) },
  { title: 'Featured Products', products: productItems.slice(1, 6) },
  { title: 'Best Selling', products: productItems.slice(2, 7) },
  { title: 'Trending Categories', products: productItems.slice(3, 8) }
]

const summaryStats = [
  { label: 'Customers', value: '12.4k' },
  { label: 'Seller shops', value: '1.1k' },
  { label: 'Monthly sales', value: '$48k' },
  { label: 'Ratings', value: '4.9/5' }
]

const footerLinks = {
  about: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
    { label: 'Privacy Policy', href: '/privacy-policy' }
  ],
  help: [
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Support', href: '/support' }
  ],
  account: [
    { label: 'My Account', href: '/account' },
    { label: 'Wishlist', href: '/account/wishlist' },
    { label: 'Cart', href: '/cart' },
    { label: 'Orders', href: '/account/orders' }
  ]
}

export function HomePage() {
  const featuredProducts = productItems.slice(0, 5)

  return (
    <div className="bg-[#f5f6f9] text-slate-900">
      <div className="bg-[#f3642c] py-2 text-center text-sm font-medium text-white">
        Big Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
        <button className="ml-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#f3642c]">Shop Now</button>
      </div>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#f3f0ff] px-3 py-2 text-[#4d2ec9]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5b2e] text-xl font-black text-white">V</div>
            <div>
              <div className="text-xl font-black leading-none">Vendora</div>
              <div className="text-[10px] tracking-[0.14em] text-slate-500">SHOP MARKET</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <span>All Categories</span>
            <span className="text-xs">▾</span>
          </div>

          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="text-lg text-slate-400">⌕</span>
            <Link to="/products" className="w-full text-sm text-slate-400">Search for products, brands and more...</Link>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700">♡</button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700">⇄</button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700">🛒</button>
            <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Account</button>
            <Link to="/shops/create" className="rounded-full bg-[#ff5b2e] px-4 py-2 text-sm font-semibold text-white">Become a Seller</Link>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 border-t border-slate-200 px-5 py-3 text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-[#ff5b2e] px-4 py-2 text-white">Browse Categories</button>
            {apiNavigationItems.map((item) => (
              <Link key={item.id} to={item.href} className="px-2 py-1 hover:text-[#4d2ec9]">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="text-sm text-slate-500">English ▾</div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6">
        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_250px]">
          <aside className="rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-slate-200">
            {categoryItems.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                  index === 0 ? 'bg-[#fff1eb] font-semibold text-[#ff5b2e]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{categoryIcons[item.name] ?? '•'}</span>
                <span>{item.name}</span>
                <span className="ml-auto text-slate-400">›</span>
              </Link>
            ))}
          </aside>

          <section className="rounded-[28px] bg-gradient-to-r from-[#f5f5f5] via-[#f3effe] to-[#f5f2ff] p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 inline-flex rounded-full bg-[#ffefe7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3642c]">
              Mega Sale Offer
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
              <div>
                <h1 className="max-w-[520px] text-4xl font-black leading-[1.08] tracking-[-0.05em] text-slate-900 md:text-6xl">
                  Select Item <span className="text-[#f3642c]">Sale</span>
                </h1>
                <p className="mt-4 max-w-md text-lg text-slate-600">Create your signature style with premium gadgets, fashion essentials, and home upgrades at unbeatable prices.</p>
                <div className="mt-7 flex items-center gap-3">
                  <Link to="/products" className="inline-block rounded-xl bg-[#ff5b2e] px-5 py-3 font-semibold text-white">Shop Now</Link>
                  <span className="text-sm font-medium text-slate-500">30% OFF</span>
                </div>
              </div>

              <div className="relative flex min-h-[320px] items-center justify-center">
                <div className="absolute left-5 top-6 h-32 w-32 rounded-full bg-[#ffd7c4] blur-3xl" />
                <div className="absolute bottom-2 right-1 h-32 w-32 rounded-full bg-[#d9ceff] blur-3xl" />
                <div className="relative flex items-end gap-4">
                  <div className="flex h-48 w-36 items-center justify-center rounded-[26px] bg-gradient-to-b from-slate-200 to-slate-100 shadow-xl">
                    <div className="flex h-32 w-24 items-center justify-center rounded-[20px] bg-slate-900 text-4xl text-white">⌚</div>
                  </div>
                  <div className="flex h-56 w-40 items-center justify-center rounded-[28px] bg-gradient-to-b from-[#efeef5] to-[#ded5f8] shadow-xl">
                    <div className="flex h-40 w-28 items-center justify-center rounded-[20px] bg-[#20242f] text-5xl text-white">🎧</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <span>Flash Sale</span>
                <span className="rounded-full bg-[#ffe5e0] px-2 py-1 text-[#f1604d]">Up to 50% Off</span>
              </div>
              <div className="mt-5 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100 text-5xl">⌚</div>
              <Link to="/products" className="mt-4 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800">Shop Now →</Link>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">Top Selling</span>
                <span className="text-sm text-slate-500">Best of month</span>
              </div>
              <div className="mt-5 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-100 to-[#f4e9ff] text-5xl">🎧</div>
              <Link to="/products" className="mt-4 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800">Shop Now →</Link>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">Become a Seller</span>
              </div>
              <div className="mt-5 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ecf7ff] to-[#e8f7ff] text-5xl">🏪</div>
              <Link to="/shops/create" className="mt-4 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800">Join Now →</Link>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-5">
          {statPills.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efeaff] text-lg text-[#4d2ec9]">{item.icon}</div>
              <div>
                <div className="font-semibold text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500">{item.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900">Shop By Categories</h2>
          <Link to="/categories" className="text-sm font-semibold text-[#4d2ec9]">View All →</Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-5 xl:grid-cols-10">
          {categoryItems.map((item) => (
            <Link key={item.name} to={item.href} className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f3f5] text-4xl">{categoryIcons[item.name] ?? '•'}</div>
              <div className="mt-3 text-sm font-medium text-slate-700">{item.name}</div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-4">
            {summaryStats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {sectionGroups.map((group) => (
          <div key={group.title} className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900">{group.title}</h2>
              <Link to="/products" className="text-sm font-semibold text-[#4d2ec9]">View More →</Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {featuredProducts.map((product) => (
                <div key={product.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 p-5">
                    <div className="absolute left-3 top-3 rounded-full bg-[#ff496a] px-2 py-1 text-[10px] font-bold text-white">
                      {product.badge}
                    </div>
                    <div className="flex h-40 items-center justify-center text-6xl">
                      {product.category === 'Electronics' ? '🎧' : product.category === 'Home' ? '🛋️' : product.category === 'Fashion' ? '👕' : product.category === 'Beauty' ? '🧴' : '⚽'}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <Link to={`/products/${product.id}`} className="block text-sm font-medium text-slate-700 hover:text-[#4d2ec9]">
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-amber-500">★★★★★</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900">${product.price}</span>
                      <span className="text-sm text-slate-400 line-through">${(product.price * 1.18).toFixed(2)}</span>
                    </div>
                    <button className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <footer className="mt-14 rounded-[18px] border border-slate-200 bg-[#f7f7f8] px-6 py-5 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5b2e] text-xl font-black text-white shadow-sm">V</div>
                <div>
                  <div className="text-[2.15rem] font-black leading-none tracking-[-0.06em] text-[#1d2f5e]">Vendora</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shop Market</div>
                </div>
              </div>
              <p className="max-w-[260px] text-base leading-7 text-slate-600">
                Discover premium products and grow your store with Vendora.
              </p>
            </div>

            <div>
              <h3 className="mb-5 text-xl font-black uppercase tracking-[0.04em] text-[#1d2f5e]">About</h3>
              <ul className="space-y-3 text-[1.05rem] text-slate-600">
                <li><Link to="/about" className="hover:text-[#f36d22]">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-[#f36d22]">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-[#f36d22]">Careers</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-[#f36d22]">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-xl font-black uppercase tracking-[0.04em] text-[#1d2f5e]">Help</h3>
              <ul className="space-y-3 text-[1.05rem] text-slate-600">
                <li><Link to="/shipping" className="hover:text-[#f36d22]">Shipping</Link></li>
                <li><Link to="/returns" className="hover:text-[#f36d22]">Returns</Link></li>
                <li><Link to="/faq" className="hover:text-[#f36d22]">FAQ</Link></li>
                <li><Link to="/support" className="text-[#f36d22] hover:text-[#db5a1d]">Support</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-xl font-black uppercase tracking-[0.04em] text-[#1d2f5e]">Account</h3>
              <ul className="space-y-3 text-[1.05rem] text-slate-600">
                <li><Link to="/account" className="hover:text-[#f36d22]">My Account</Link></li>
                <li><Link to="/account/wishlist" className="hover:text-[#f36d22]">Wishlist</Link></li>
                <li><Link to="/cart" className="hover:text-[#f36d22]">Cart</Link></li>
                <li><Link to="/account/orders" className="hover:text-[#f36d22]">Orders</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <div className="mb-4 text-xl font-black uppercase tracking-[0.04em] text-[#1d2f5e]">Contact</div>
            <div className="space-y-2 text-[1.05rem] text-slate-600">
              <div><Link to="/contact" className="hover:text-[#f36d22]">support@vendora.com</Link></div>
              <div>+1 (800) 123-4567</div>
              <div>123 Market Street</div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-center text-[1.05rem] text-slate-500">
            © 2026 Vendora. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  )
}
