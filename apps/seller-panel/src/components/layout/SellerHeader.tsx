import { useEffect, useRef, useState } from 'react'
import { ChevronDown, CreditCard, Languages, LogOut, Menu, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearSellerSession } from '../../services/api'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { sellerLanguages, useSellerLanguage } from '../../i18n/sellerLanguage'

type BreadcrumbItem = {
  label: string
  to?: string
}

type SellerHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  onToggleSidebar: () => void
}

type SellerSessionUser = {
  name?: string
  shopName?: string
  email?: string
  role?: string
}

function getStoredSellerProfile(): SellerSessionUser {
  try {
    const raw = localStorage.getItem('vendora_user')
    const parsed = raw ? JSON.parse(raw) : null
    return {
      name: parsed?.name || 'Seller profile unavailable',
      shopName: parsed?.shopName || parsed?.name || 'Seller profile unavailable',
      email: parsed?.email || 'Email unavailable',
      role: parsed?.role || 'Role unavailable',
    }
  } catch {
    return { name: 'Seller profile unavailable', shopName: 'Seller profile unavailable', email: 'Email unavailable', role: 'Role unavailable' }
  }
}

export function SellerHeader({ title, subtitle, breadcrumbs, actions, onToggleSidebar }: SellerHeaderProps) {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useSellerLanguage()
  const [seller, setSeller] = useState<SellerSessionUser>(() => getStoredSellerProfile())
  const [profileOpen, setProfileOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const languageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncSeller = () => setSeller(getStoredSellerProfile())
    window.addEventListener('storage', syncSeller)
    return () => window.removeEventListener('storage', syncSeller)
  }, [])

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node
      if (!profileRef.current?.contains(target)) setProfileOpen(false)
      if (!languageRef.current?.contains(target)) setLanguageOpen(false)
    }
    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [])

  const shopName = seller.shopName || seller.name || 'My Shop'
  const initials = (shopName || 'My Shop')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'S'

  return (
    <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white px-3 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-4 md:px-6">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#334155] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb] focus:outline-none focus:ring-4 focus:ring-blue-100 xl:hidden"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="seller-page-title truncate text-[#1e293b]">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {actions ? <div className="flex max-w-[38vw] items-center gap-2 overflow-x-auto">{actions}</div> : null}

          <div className="flex items-center gap-2">
            <NotificationCenter />

            <div title="Money guarantee" className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-emerald-700 sm:px-3">
              <ShieldCheck size={17} aria-hidden="true" />
              <span className="hidden text-xs font-semibold sm:inline">Money guarantee</span>
              <span className="sr-only">Money guarantee</span>
            </div>

            <div ref={languageRef} className="relative">
              <button type="button" aria-label="Select language" aria-expanded={languageOpen} onClick={() => { setLanguageOpen((value) => !value); setProfileOpen(false) }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100">
                <Languages size={17} />
              </button>
              {languageOpen ? <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"><p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('language')}</p>{sellerLanguages.map((item) => <button key={item.code} type="button" onClick={() => { setLanguage(item.code); setLanguageOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${language === item.code ? 'bg-[#2d80d8] font-semibold text-white' : 'text-slate-700 hover:bg-slate-50'}`}><span className="text-base" aria-hidden="true">{item.flag}</span><span className="truncate">{item.label}</span>{language === item.code ? <span className="ml-auto text-[10px] font-semibold uppercase">{t('active')}</span> : null}</button>)}</div> : null}
            </div>

            <div ref={profileRef} className="relative">
              <button type="button" aria-label="Open seller profile menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setLanguageOpen(false) }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">{initials}</div>
                <div className="hidden min-w-0 text-left sm:block"><div className="max-w-[140px] truncate text-sm font-semibold text-slate-800">{shopName}</div></div>
                <ChevronDown size={15} className={`hidden text-slate-500 transition sm:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen ? <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"><div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-sm font-bold text-slate-900">{seller.name}</p><p className="truncate text-xs text-slate-500">{seller.email}</p></div><button type="button" onClick={() => { setProfileOpen(false); navigate('/seller/shop') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><UserRound size={16} /> {t('profile')}</button><button type="button" onClick={() => { setProfileOpen(false); navigate('/seller/shop') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Settings size={16} /> {t('shopSettings')}</button><button type="button" onClick={() => { setProfileOpen(false); navigate('/seller/payment-settings') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><CreditCard size={16} /> {t('paymentSettings')}</button><button type="button" onClick={() => { setProfileOpen(false); navigate('/seller/transaction') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><ShieldCheck size={16} /> {t('transactionPassword')}</button><button type="button" onClick={() => { clearSellerSession(); setProfileOpen(false); navigate('/users/login', { replace: true }) }} className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={16} /> {t('logout')}</button></div> : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
