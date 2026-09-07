import { AlertTriangle } from 'lucide-react'
import { useSellerLanguage } from '../../i18n/sellerLanguage'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({ title = 'Unable to load data.', description = 'Something went wrong while loading this information.', onRetry, compact = false }: ErrorStateProps) {
  const { t } = useSellerLanguage()
  return <div role="alert" className={`flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-center ${compact ? 'p-6' : 'min-h-56 p-10'}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm"><AlertTriangle size={21} /></span><p className="mt-4 text-sm font-bold text-rose-800">{title}</p><p className="mt-1 max-w-md text-sm text-rose-700">{description}</p>{onRetry ? <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">{t('tryAgain')}</button> : null}</div>
}
