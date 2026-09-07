import type { ReactNode } from 'react'

type FormActionsProps = {
  loading?: boolean
  disabled?: boolean
  loadingLabel?: string
  submitLabel?: string
  success?: string
  children?: ReactNode
}

export function FormActions({ loading = false, disabled = false, loadingLabel = 'Saving...', submitLabel = 'Save changes', success, children }: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {success ? <p role="status" className="mr-auto text-sm font-medium text-emerald-700">{success}</p> : null}
      {children}
      <button type="submit" disabled={loading || disabled} className="rounded-lg bg-[#2d80d8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f6dc5] disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  )
}
