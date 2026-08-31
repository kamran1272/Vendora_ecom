import type { ReactNode } from 'react'
import { SellerSidebar } from '../components/sidebar/SellerSidebar'

type SellerLayoutProps = {
  children: ReactNode
}

export function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <div className="min-h-screen bg-[#edf2f8] p-2 text-slate-800 md:p-4">
      <div className="mx-auto flex max-w-[1500px] overflow-hidden border border-slate-200 bg-[#edf2f8] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <SellerSidebar />
        <div className="min-w-0 flex-1 bg-[#f3f5fa]">{children}</div>
      </div>
    </div>
  )
}
