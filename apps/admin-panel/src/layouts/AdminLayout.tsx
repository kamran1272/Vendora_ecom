import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight, Menu, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AdminSidebar } from '../components/sidebar/AdminSidebar'
import { AdminHeaderUserMenu } from '../components/admin/AdminHeaderUserMenu'

type AdminLayoutProps = {
  children: ReactNode
}

import { FloatingBotChat } from '../components/chat/FloatingBotChat'
import { AdminNotificationBell } from '../components/notifications/AdminNotificationBell'

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem('vendora-admin-sidebar-collapsed') === 'true')

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('vendora-admin-sidebar-collapsed', String(next))
      return next
    })
  }

  const pageLabel = (() => {
    const labels: Record<string, string> = {
      '/admin/dashboard': 'Dashboard',
      '/admin/seller-applications': 'Seller Applications',
      '/admin/product-warehouse': 'Product Warehouse',
      '/admin/subscription-plans': 'Subscription Plans',
      '/admin/withdrawals': 'Withdrawals',
      '/admin/notifications': 'Notifications',
      '/admin/support': 'Support',
      '/admin/reports': 'Reports',
      '/admin/settings': 'Settings',
    }
    if (labels[location.pathname]) return labels[location.pathname]

    const section = location.pathname.split('/').filter(Boolean).at(-1) || 'dashboard'
    return section
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
  })()

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)] text-slate-800 antialiased">
      {sidebarOpen ? <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" /> : null}
      <AdminSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen min-w-0 overflow-x-clip transition-[padding] duration-300 ease-out ${sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[252px]'}`}>
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-2 border-b border-slate-200/90 bg-white/95 px-3 shadow-[0_1px_12px_rgba(15,23,42,0.03)] backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden" aria-label="Open navigation" title="Open navigation"><Menu className="h-5 w-5" /></button>
          <button type="button" onClick={toggleSidebar} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:inline-flex" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} aria-pressed={sidebarCollapsed} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="flex h-10 min-w-0 max-w-2xl flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-400 transition-colors focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input aria-label="Search for anything" placeholder="Search for anything..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
            <span className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">Ctrl /</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"><AdminNotificationBell /><AdminHeaderUserMenu /></div>
        </header>
        <div className="min-h-[calc(100vh-68px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Link to="/admin/dashboard" className="transition hover:text-indigo-600">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              <span className="text-slate-600" aria-current="page">{pageLabel}</span>
            </nav>
            {children}
          </div>
        </div>
      </main>

      <FloatingBotChat />
    </div>
  )
}
