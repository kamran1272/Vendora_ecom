import type { ReactNode } from 'react'
import { AdminSidebar } from '../components/sidebar/AdminSidebar'

type AdminLayoutProps = {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-800">
      <div className="mx-auto flex max-w-[1600px] gap-6 p-4 lg:p-6">
        <AdminSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
