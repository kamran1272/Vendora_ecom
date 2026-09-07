import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SearchBar } from '@/components/layout/SearchBar'
import { NotificationBadge } from '@/components/layout/NotificationBadge'
import { SELLER_REGISTRATION_URL } from '@/config/customer'
import { fetchCatalogCategories, type CatalogCategory } from '@/services/catalog'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { DEFAULT_CURRENCY } from '@/utils/format'

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Brands', href: '/brands' },
  { label: 'Support', href: '/support' },
]

const drawerLinks = [
  ...navigationItems,
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Account', href: '/account' },
  { label: 'Orders', href: '/account/orders' },
]

function VendoraLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="Vendora home">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f2d4d] text-xl font-black text-[#f59a36] shadow-sm">V</div>
      <span className="text-2xl font-black tracking-tight text-[#1f2d4d]">Vendo<span className="text-[#f59a36]">ra</span></span>
    </div>
  )
}

export function CustomerHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0))
  const wishlistCount = useWishlistStore((state) => state.ids.length)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    let active = true
    fetchCatalogCategories()
      .then((items) => { if (active) setCategories([...new Map(items.map((item) => [item.id, item])).values()].slice(0, 10)) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-200 bg-[#1f2d4d] text-xs text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2">
          <p className="truncate font-medium">Shop trusted stores across the Vendora marketplace</p>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <Link to="/account/orders" className="hover:text-orange-200">Track order</Link>
            <Link to="/support" className="hover:text-orange-200">Help center</Link>
            <span className="text-white/70">English</span>
            <span className="text-white/70">{DEFAULT_CURRENCY}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-700 md:hidden">☰</button>
          <Link to="/" className="shrink-0"><VendoraLogo /></Link>

          <div className="hidden min-w-0 flex-1 md:flex"><SearchBar /></div>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/account/wishlist" className="relative hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 lg:flex">Wishlist{wishlistCount > 0 && <span className="rounded-full bg-orange-400 px-1.5 py-0.5 text-[10px] text-white">{wishlistCount}</span>}</Link>
            <NotificationBadge />
            <Link to="/account" className="hidden h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 sm:flex">Account</Link>
            <Link to="/cart" className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600">Cart{cartCount > 0 && <span className="rounded-full bg-orange-400 px-1.5 py-0.5 text-[10px] text-white">{cartCount}</span>}</Link>
          </div>
        </div>

        <div className="mt-3 md:hidden"><SearchBar mobile /></div>
      </div>

      <nav ref={menuRef} className="hidden border-t border-slate-200 bg-slate-50 md:block" aria-label="Customer navigation">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-1 px-4 py-2 md:flex-row md:items-center md:gap-2">
          {navigationItems.map((item) => <Link key={item.href} to={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-brand-600">{item.label}</Link>)}
          <a href={SELLER_REGISTRATION_URL} onClick={() => setMenuOpen(false)} className="md:ml-auto rounded-lg px-3 py-2 text-sm font-bold text-brand-600 transition hover:bg-indigo-50">Become a seller</a>
        </div>
      </nav>

      {categories.length > 0 && <nav className="hidden border-b border-slate-100 bg-white xl:block" aria-label="Category navigation">
        <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-4 py-2 lg:px-8">
          {categories.map((category) => <Link key={category.id} to={`/category/${encodeURIComponent(category.slug || category.name.toLowerCase())}`} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">{category.name}</Link>)}
        </div>
      </nav>}

      {menuOpen && <div className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
      {menuOpen && <aside className="fixed inset-x-0 top-[7.8rem] z-50 mx-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden" aria-label="Mobile menu">
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-3">
          <p className="text-sm font-bold text-slate-900">Browse Vendora</p>
          <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100" aria-label="Close menu">Close</button>
        </div>
        <div className="mt-2 grid gap-1">
          {drawerLinks.map((item, index) => <Link key={`${item.href}-${index}`} to={item.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-700">{item.label}{item.label === 'Wishlist' && wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>)}
          <a href={SELLER_REGISTRATION_URL} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50">Become a seller</a>
        </div>
      </aside>}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden" aria-label="Mobile navigation">
        {[['Home', '/'], ['Shop', '/shop'], ['Categories', '/categories'], ['Wishlist', '/account/wishlist'], ['Cart', '/cart']].map(([label, href]) => <Link key={href} to={href} className="flex min-h-11 flex-col items-center justify-center rounded-xl px-1 text-[0.68rem] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><span aria-hidden="true" className="text-base">{label === 'Home' ? '⌂' : label === 'Shop' ? '⌕' : label === 'Categories' ? '▦' : label === 'Wishlist' ? '♡' : '🛒'}</span><span>{label}</span></Link>)}
      </nav>
    </header>
  )
}
