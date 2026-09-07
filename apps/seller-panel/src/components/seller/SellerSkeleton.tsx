import { useSellerLanguage } from '../../i18n/sellerLanguage'

type SellerSkeletonProps = { rows?: number; className?: string }

export function SellerSkeleton({ rows = 6, className = '' }: SellerSkeletonProps) {
  const { t } = useSellerLanguage()
  return <div className={`space-y-3 rounded-xl border border-slate-200 bg-white p-5 ${className}`} aria-label={t('loading')}><div className="sr-only">{t('loading')}</div>{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-11 animate-pulse rounded-lg bg-slate-100" />)}</div>
}
