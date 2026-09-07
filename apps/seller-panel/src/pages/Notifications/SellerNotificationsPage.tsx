import { Bell } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { NotificationCenter } from '../../components/notifications/NotificationCenter'

export function SellerNotificationsPage() {
  return (
    <SellerLayout title="Notifications" subtitle="Stay up to date with orders, payments, messages, and seller activity.">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Bell size={19} /></span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notification center</h2>
            <p className="mt-1 text-sm text-slate-500">Latest activity from your seller account.</p>
          </div>
        </div>
        <NotificationCenter mode="page" />
      </div>
    </SellerLayout>
  )
}
