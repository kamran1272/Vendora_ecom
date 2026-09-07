import type { ReactNode } from 'react'

type SellerQuickActionProps = { title: string; description: string; action: string; icon: ReactNode; onClick: () => void }

export function SellerQuickAction({ title, description, action, icon, onClick }: SellerQuickActionProps) {
  return <button type="button" onClick={onClick} className="group flex min-h-[142px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span><span><span className="mt-4 block text-sm font-bold text-slate-900">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span><span className="mt-3 text-xs font-bold text-blue-700">{action}</span></button>
}
