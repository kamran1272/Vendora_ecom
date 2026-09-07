import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '../../components/feedback/AdminFeedback'

export type AdminColumn = {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

export type AdminRowAction = {
  label: string
  tone?: 'primary' | 'secondary' | 'danger'
  onClick: (row: Record<string, unknown>) => void | Promise<void>
  disabled?: (row: Record<string, unknown>) => boolean
}

type AdminCollectionPageProps = {
  title: string
  description: string
  fetcher: () => Promise<Record<string, unknown>[] | Record<string, unknown> | unknown[]>
  columns: AdminColumn[]
  actions?: Array<{ label: string; href?: string; onClick?: () => void; tone?: 'primary' | 'secondary' }>
  rowActions?: AdminRowAction[]
  emptyMessage?: string
  detailPath?: (row: Record<string, unknown>) => string
}

function getValue(row: Record<string, unknown>, key: string) {
  const value = row[key]
  if (value === null || value === undefined || value === '') return '—'
  return value
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return value.toLocaleString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function renderDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length > 0 ? value.map((item) => String(item)).join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function AdminCollectionPage({
  title,
  description,
  fetcher,
  columns,
  actions,
  rowActions,
  emptyMessage = 'No records are available yet.',
  detailPath,
}: AdminCollectionPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await fetcher()
      const data = Array.isArray(result) ? result : Array.isArray((result as { items?: unknown[] })?.items) ? (result as { items: unknown[] }).items : Array.isArray((result as { data?: unknown[] })?.data) ? (result as { data: unknown[] }).data : []
      setItems(data.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load records.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Marketplace management</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
              <p className="mt-2 text-slate-600">{description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(actions || []).map((action) => (
                action.href ? (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${action.tone === 'primary' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${action.tone === 'primary' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {action.label}
                  </button>
                )
              ))}
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          {loading ? (
            <AdminTableSkeleton columns={Math.min(columns.length + (rowActions?.length ? 1 : 0), 7)} />
          ) : error ? (
            <AdminErrorState onRetry={() => void load()} message={error} />
          ) : items.length === 0 ? (
            <AdminEmptyState title={`No ${title.toLowerCase()} found`} message={emptyMessage} />
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[980px] text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => (
                    <tr key={String(row.id ?? row.email ?? row.name ?? index)} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                      {columns.map((column) => {
                        const value = getValue(row, column.key)
                        const content = column.render ? column.render(value, row) : formatValue(value)

                        return (
                            <td key={`${String(row.id ?? index)}-${column.key}`} className="px-4 py-3 align-middle">
                            {detailPath && column.key === columns[0].key ? (
                              <Link to={detailPath(row)} className="font-semibold text-slate-900 transition hover:text-indigo-600">
                                {content}
                              </Link>
                            ) : (
                              content
                            )}
                          </td>
                        )
                      })}

                      {rowActions && rowActions.length > 0 ? (
                        <td className="border-l border-slate-100 px-4 py-3 align-middle">
                          <div className="flex flex-wrap gap-2">
                            {rowActions.map((action) => {
                              const isDisabled = action.disabled ? action.disabled(row) : false

                              return (
                                <button
                                  key={`${String(row.id ?? index)}-${action.label}`}
                                  type="button"
                                  onClick={() => void action.onClick(row)}
                                  disabled={isDisabled}
                                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    action.tone === 'danger'
                                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60'
                                      : action.tone === 'primary'
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
                                  }`}
                                >
                                  {action.label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export type AdminDetailAction = {
  label: string
  tone?: 'primary' | 'secondary' | 'danger'
  onClick: () => void | Promise<void>
  disabled?: boolean
}

export function AdminDetailPage({
  title,
  description,
  fetcher,
  emptyMessage = 'No detail available.',
  actions,
}: {
  title: string
  description: string
  fetcher: () => Promise<Record<string, unknown>>
  emptyMessage?: string
  actions?: AdminDetailAction[]
}) {
  const { id } = useParams()
  const [record, setRecord] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetcher()
        setRecord(data && typeof data === 'object' ? data : {})
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load details.')
        setRecord({})
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Marketplace detail</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-slate-600">{description}</p>
            </div>

            {actions && actions.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    disabled={action.disabled || actionLoading === action.label}
                    onClick={() => {
                      setActionLoading(action.label)
                      void Promise.resolve(action.onClick()).finally(() => setActionLoading(null))
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      action.tone === 'danger'
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60'
                        : action.tone === 'primary'
                          ? 'bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
                    }`}
                  >
                    {actionLoading === action.label ? 'Working…' : action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <div className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {loading ? (
            <div className="text-slate-500">Loading details…</div>
          ) : error ? (
            <div className="text-rose-600">{error}</div>
          ) : Object.keys(record).length === 0 ? (
            <div className="text-slate-500">{emptyMessage}</div>
          ) : (
            <>
              <div className="mb-6 grid gap-3 md:grid-cols-4">
                {Object.entries(record)
                  .filter(([key]) => ['name', 'shopName', 'sellerName', 'email', 'status', 'amount', 'total', 'currency'].includes(key))
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{key}</div>
                      <div className="mt-2 text-lg font-semibold text-slate-800">{renderDetailValue(value)}</div>
                    </div>
                  ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(record).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-slate-800">
                      {renderDetailValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
