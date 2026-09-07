import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useSellerLanguage } from '../../i18n/sellerLanguage'

type ConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'primary'
  children?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', loading = false, variant = 'danger', children, onCancel, onConfirm }: ConfirmModalProps) {
  const { language } = useSellerLanguage()
  const labels = { en: { confirm: 'Confirm', cancel: 'Cancel', working: 'Working...' }, 'zh-CN': { confirm: '确认', cancel: '取消', working: '处理中...' }, 'zh-TW': { confirm: '確認', cancel: '取消', working: '處理中...' }, ja: { confirm: '確認', cancel: 'キャンセル', working: '処理中...' }, ko: { confirm: '확인', cancel: '취소', working: '처리 중...' }, hi: { confirm: 'पुष्टि करें', cancel: 'रद्द करें', working: 'कार्य जारी...' }, vi: { confirm: 'Xác nhận', cancel: 'Hủy', working: 'Đang xử lý...' }, ms: { confirm: 'Sahkan', cancel: 'Batal', working: 'Sedang diproses...' }, th: { confirm: 'ยืนยัน', cancel: 'ยกเลิก', working: 'กำลังดำเนินการ...' }, id: { confirm: 'Konfirmasi', cancel: 'Batal', working: 'Memproses...' } }[language]
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusDialog = () => {
      const target = dialogRef.current?.querySelector<HTMLElement>(focusableSelector) || dialogRef.current
      target?.focus()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.requestAnimationFrame(focusDialog)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [loading, onCancel, open])

  if (!open) return null
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel() }}>
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
      <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" disabled={loading} onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">{labels.cancel}</button>
        <button type="button" disabled={loading} onClick={onConfirm} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}>{loading ? labels.working : confirmLabel === 'Confirm' ? labels.confirm : confirmLabel}</button>
      </div>
    </div>
  </div>
}
