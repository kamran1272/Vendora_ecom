import type { ReactNode } from 'react'
import { useSellerLanguage } from '../../i18n/sellerLanguage'

type SellerEmptyStateProps = { title?: string; description: string; icon?: ReactNode; action?: ReactNode; className?: string }

export function SellerEmptyState({ title = 'No records yet', description, icon, action, className = '' }: SellerEmptyStateProps) {
  const { t } = useSellerLanguage()
  return <div className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center ${className}`}>{icon ? <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">{icon}</span> : null}<p className="mt-4 text-sm font-semibold text-slate-700">{title === 'No records yet' ? t('noRecords') : title}</p><p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>
}
