import { Link } from 'react-router-dom'
import { apiNavigationItems, headerActions } from '@/data/marketplace'

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
          <path d="M55 74c0-15 12-27 27-27h18c15 0 27 12 27 27v10c0 14-5 25-15 34L88 118l-23-20C55 90 50 79 50 68V74Z" fill="url(#vendoraBag)" />
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

export function Header() {
  const navigation = apiNavigationItems.filter((item) => item.enabled)

  return (
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
                placeholder="Search products..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <button className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">English</button>
            <button className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">USD</button>
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
  )
}
