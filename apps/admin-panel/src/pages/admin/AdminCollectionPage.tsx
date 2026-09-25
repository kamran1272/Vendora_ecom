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

export type AdminBulkAction = {
  label: string
  tone?: 'primary' | 'secondary' | 'danger'
  onClick: (row: Record<string, unknown>) => Promise<void>
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
  productCards?: boolean
  bulkActions?: AdminBulkAction[]
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

function textValue(row: Record<string, unknown>, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && value !== '') return String(value)
  }
  return fallback
}

function numericValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return 0
}

function imageCandidates(row: Record<string, unknown>) {
  const value = row.image ?? row.imageUrl ?? row.images
  const values: unknown[] = []
  const collect = (candidate: unknown) => {
    if (!candidate) return
    if (Array.isArray(candidate)) {
      candidate.forEach(collect)
      return
    }
    if (typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>
      collect(record.url ?? record.src ?? record.path ?? record.imageUrl)
      return
    }
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (!trimmed) return
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed !== candidate) {
          collect(parsed)
          return
        }
      } catch {
        // Keep ordinary URLs and paths as-is.
      }
      values.push(trimmed)
    }
  }
  collect(value)
  return values.filter((candidate, index) => typeof candidate === 'string' && values.indexOf(candidate) === index) as string[]
}

function fallbackImage(name: string) {
  return `https://placehold.co/800x600/eef2ff/102451?text=${encodeURIComponent(name.slice(0, 28) || 'Vendora product')}`
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
  productCards = false,
  bulkActions = [],
}: AdminCollectionPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rowActionKey, setRowActionKey] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await fetcher()
      const data = Array.isArray(result) ? result : Array.isArray((result as { items?: unknown[] })?.items) ? (result as { items: unknown[] }).items : Array.isArray((result as { data?: unknown[] })?.data) ? (result as { data: unknown[] }).data : []
      setItems(data.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null))
      setSelectedIds([])
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

  const itemId = (row: Record<string, unknown>, index: number) => String(row.id ?? row._id ?? index)
  const selectedRows = items.filter((row, index) => selectedIds.includes(itemId(row, index)))
  const allSelected = items.length > 0 && selectedRows.length === items.length
  const toggleSelected = (row: Record<string, unknown>, index: number) => {
    const id = itemId(row, index)
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }
  const runBulkAction = async (action: AdminBulkAction) => {
    if (!selectedRows.length) return
    setBulkActionKey(action.label)
    setError('')
    try {
      await Promise.all(selectedRows.map((row) => action.onClick(row)))
      setSelectedIds([])
      await load()
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : `Unable to ${action.label.toLowerCase()}.`)
    } finally {
      setBulkActionKey(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="admin-page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Marketplace management</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
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

        {productCards ? (
          <>
            <section className="sticky top-[76px] z-20 flex flex-col gap-3 rounded-[22px] border border-indigo-200 bg-[#f7f9ff]/95 p-4 shadow-[0_12px_28px_rgba(16,36,81,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#102451]">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : items.map((row, index) => itemId(row, index)))} className="h-4 w-4 rounded border-slate-300 text-[#102451] focus:ring-[#ff7612]" />
                  Select all products
                </label>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">{selectedRows.length} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedRows.length > 0 && <button type="button" onClick={() => setSelectedIds([])} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Clear</button>}
                {bulkActions.map((action) => <button key={action.label} type="button" disabled={!selectedRows.length || bulkActionKey !== null} onClick={() => void runBulkAction(action)} className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.tone === 'danger' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : action.tone === 'primary' ? 'bg-[#102451] text-white hover:bg-[#1b2d5d]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{bulkActionKey === action.label ? `Processing ${selectedRows.length}...` : action.label}</button>)}
              </div>
            </section>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Total products', items.length, 'bg-indigo-50 text-indigo-700'],
                ['Active products', items.filter((row) => textValue(row, ['status'], '').toUpperCase() === 'ACTIVE').length, 'bg-emerald-50 text-emerald-700'],
                ['Brands', new Set(items.map((row) => textValue(row, ['brand', 'brandName'], '')).filter(Boolean)).size, 'bg-orange-50 text-orange-700'],
                ['Categories', new Set(items.map((row) => textValue(row, ['category', 'categoryName'], '')).filter(Boolean)).size, 'bg-sky-50 text-sky-700'],
                ['Sellers', new Set(items.map((row) => textValue(row, ['seller', 'sellerName', 'sellerId'], '')).filter(Boolean)).size, 'bg-violet-50 text-violet-700'],
                ['Shops', new Set(items.map((row) => textValue(row, ['shop', 'shopName', 'shopId'], '')).filter(Boolean)).size, 'bg-fuchsia-50 text-fuchsia-700'],
                ['In stock', items.filter((row) => numericValue(row, ['stock', 'quantity', 'inventory']) > 0).length, 'bg-teal-50 text-teal-700'],
                ['Units available', items.reduce((sum, row) => sum + numericValue(row, ['stock', 'quantity', 'inventory']), 0), 'bg-cyan-50 text-cyan-700'],
                ['Total sales', items.reduce((sum, row) => sum + numericValue(row, ['sales', 'totalSales', 'sold']), 0), 'bg-amber-50 text-amber-700'],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <span className={`h-3 w-3 rounded-full ${tone}`} />
                  </div>
                  <p className="mt-4 text-3xl font-black tracking-tight text-[#102451]">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </section>

            <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : error ? (
                <AdminErrorState onRetry={() => void load()} message={error} />
              ) : items.length === 0 ? (
                <AdminEmptyState title="No products found" message={emptyMessage} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {items.map((row, index) => {
                    const productName = textValue(row, ['name', 'title'], 'Unnamed product')
                    const images = imageCandidates(row)
                    const image = images[0] ?? fallbackImage(productName)
                    const status = textValue(row, ['status'], 'UNKNOWN').toUpperCase()
                    const actionsForCard = rowActions ?? []
                    const shopKey = textValue(row, ['shop', 'shopName', 'shopId'], 'Unknown shop')
                    const shopProductCount = items.filter((item) => textValue(item, ['shop', 'shopName', 'shopId'], 'Unknown shop') === shopKey).length
                    return (
                      <article key={String(row.id ?? index)} className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_16px_36px_rgba(16,36,81,0.12)]">
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                          <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-2 py-1.5 text-[10px] font-bold text-[#102451] shadow-sm backdrop-blur">
                            <input type="checkbox" checked={selectedIds.includes(itemId(row, index))} onChange={() => toggleSelected(row, index)} className="h-4 w-4 rounded border-slate-300 text-[#102451] focus:ring-[#ff7612]" />
                            Select
                          </label>
                          {image ? <img src={image} alt={productName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">No image</div>}
                                                    <img src={image} alt={productName} onError={(event) => { const target = event.currentTarget; const fallback = fallbackImage(productName); if (target.src !== fallback) target.src = fallback }} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {detailPath ? <Link to={detailPath(row)} className="line-clamp-2 font-bold text-[#102451] hover:text-indigo-700">{productName}</Link> : <h2 className="line-clamp-2 font-bold text-[#102451]">{productName}</h2>}
                              <p className="mt-1 truncate text-xs text-slate-500">{textValue(row, ['sku'], 'No SKU')}</p>
                            </div>
                            <p className="shrink-0 text-sm font-black text-[#ff7612]">{textValue(row, ['price'], '—')}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs"><div className="min-w-0"><p className="font-bold uppercase tracking-[0.12em] text-indigo-600">Shop identity</p><p className="truncate font-semibold text-[#102451]">{shopKey}</p></div><span className="shrink-0 rounded-full bg-white px-2 py-1 font-bold text-indigo-700">{shopProductCount} products</span></div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl bg-indigo-50 p-2.5"><p className="text-slate-500">Brand</p><p className="mt-1 truncate font-semibold text-indigo-900">{textValue(row, ['brand', 'brandName'])}</p></div>
                            <div className="rounded-xl bg-orange-50 p-2.5"><p className="text-slate-500">Category</p><p className="mt-1 truncate font-semibold text-orange-900">{textValue(row, ['category', 'categoryName'])}</p></div>
                            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-500">Seller</p><p className="mt-1 truncate font-semibold text-slate-800">{textValue(row, ['seller', 'sellerName'])}</p></div>
                            <div className="rounded-xl bg-teal-50 p-2.5"><p className="text-slate-500">Stock</p><p className="mt-1 font-semibold text-teal-900">{numericValue(row, ['stock', 'quantity', 'inventory']).toLocaleString()}</p></div>
                          </div>
                          {actionsForCard.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{actionsForCard.map((action) => <button key={action.label} type="button" disabled={rowActionKey !== null || (action.disabled ? action.disabled(row) : false)} onClick={() => { const key = `${String(row.id ?? index)}-${action.label}`; setRowActionKey(key); void Promise.resolve(action.onClick(row)).catch((actionError) => setError(actionError instanceof Error ? actionError.message : `Unable to ${action.label.toLowerCase()}.`)).finally(() => setRowActionKey(null)) }} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${action.tone === 'danger' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : action.tone === 'primary' ? 'bg-[#102451] text-white hover:bg-[#1b2d5d]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{rowActionKey === `${String(row.id ?? index)}-${action.label}` ? 'Working...' : action.label}</button>)}</div> : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}

        {!productCards ? <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          {loading ? (
            <AdminTableSkeleton columns={Math.min(columns.length + (rowActions?.length ? 1 : 0), 7)} />
          ) : error ? (
            <AdminErrorState onRetry={() => void load()} message={error} />
          ) : items.length === 0 ? (
            <AdminEmptyState title={`No ${title.toLowerCase()} found`} message={emptyMessage} />
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="admin-table min-w-[980px] text-left text-sm text-slate-700">
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
                        <td className="admin-actions-cell border-l border-slate-100 px-4 py-3 align-middle">
                          <div className="admin-row-actions">
                            {rowActions.map((action) => {
                              const isDisabled = action.disabled ? action.disabled(row) : false

                              return (
                                <button
                                  key={`${String(row.id ?? index)}-${action.label}`}
                                  type="button"
                                  onClick={() => {
                                    const key = `${String(row.id ?? index)}-${action.label}`
                                    setRowActionKey(key)
                                    void Promise.resolve(action.onClick(row))
                                      .then(() => load())
                                      .catch((actionError) => setError(actionError instanceof Error ? actionError.message : `Unable to ${action.label.toLowerCase()}.`))
                                      .finally(() => setRowActionKey(null))
                                  }}
                                  disabled={isDisabled || rowActionKey !== null}
                                  className={`admin-action-button rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    action.tone === 'danger'
                                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60'
                                      : action.tone === 'primary'
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
                                  }`}
                                >
                                  {rowActionKey === `${String(row.id ?? index)}-${action.label}` ? 'Working…' : action.label}
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
        </div> : null}
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
        <header className="admin-page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Marketplace detail</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
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
