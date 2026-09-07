import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SellerHeader } from './SellerHeader'
import { SellerSidebar } from '../sidebar/SellerSidebar'
import type { ReactNode } from 'react'
import { useSellerLanguage } from '../../i18n/sellerLanguage'
import { SellerSupportChat } from '../support/SellerSupportChat'

export type SellerPageLayoutProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: Array<{ label: string; to?: string }>
  children: ReactNode
}

export function SellerPageLayout({ title, subtitle, actions, breadcrumbs, children }: SellerPageLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vendora-seller-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { t } = useSellerLanguage()
  const titleTranslations: Record<string, string> = { Dashboard: t('dashboard'), Products: t('products'), Conversations: t('conversations'), Orders: t('orders'), 'Product Storehouse': t('productStorehouse'), 'Seller Packages': t('packages'), 'Traffic Packages': t('trafficPackages'), 'Affiliate System': t('affiliate'), 'Money Withdraw': t('moneyWithdraw'), 'Shop Settings': t('shopSetting'), 'Transaction password': t('transactionPassword'), 'Product Queries': t('productQueries'), 'Support Ticket': t('supportTicket'), 'Uploaded Files': t('uploadedFiles'), 'Commission History': t('commissionHistory'), 'Received Refund Request': t('receivedRefund') }

  useEffect(() => {
    try {
      localStorage.setItem('vendora-seller-sidebar-collapsed', String(sidebarCollapsed))
    } catch {
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="flex h-screen min-w-0 overflow-hidden">
        <div className="xl:hidden">
          {mobileOpen ? (
            <>
              <button
                type="button"
                aria-label="Close navigation overlay"
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-slate-900/40"
              />
              <div className="fixed inset-y-0 left-0 z-50 flex">
                <SellerSidebar mobile onClose={() => setMobileOpen(false)} />
              </div>
            </>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <SellerSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SellerHeader
            title={titleTranslations[title] || title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
            actions={actions}
            onToggleSidebar={() => {
              if (window.innerWidth < 1280) {
                setMobileOpen((current) => !current)
                return
              }
              setSidebarCollapsed((current) => !current)
            }}
          />

          <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] p-3 sm:p-4 md:p-6 lg:p-7">
            {children}
            <SellerSupportChat />
          </main>
          <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-center sm:gap-2 sm:text-left">
            <span>© {new Date().getFullYear()} Vendora</span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">|</span>
            <span>Seller Panel</span>
          </footer>
        </div>
      </div>
    </div>
  )
}

export function SellerLayout(props: SellerPageLayoutProps) {
  return <SellerPageLayout {...props} />
}
