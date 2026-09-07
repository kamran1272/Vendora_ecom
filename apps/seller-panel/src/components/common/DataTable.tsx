import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { ErrorState } from './ErrorState'
import { useSellerLanguage } from '../../i18n/sellerLanguage'

type TableColumn<T> = {
  key: string
  label: string
  render?: (row: T) => ReactNode
  accessor?: (row: T) => unknown
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

type DataTableProps<T> = {
  columns: Array<TableColumn<T>>
  rows: T[]
  emptyMessage?: string
  rowKey: (row: T) => string
  loading?: boolean
  error?: string
  onRetry?: () => void
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  filter?: (row: T) => boolean
  selectable?: boolean
  bulkActions?: Array<{ label: string; onClick: (rows: T[]) => void; disabled?: boolean }>
  emptyAction?: { label: string; onClick: () => void }
}

export function DataTable<T>({ columns, rows, emptyMessage = 'No records found.', rowKey, loading = false, error = '', onRetry, pageSize = 10, searchable = false, searchPlaceholder = 'Search records', filter, selectable = false, bulkActions = [], emptyAction }: DataTableProps<T>) {
  const { t } = useSellerLanguage()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter && !filter(row)) return false
      if (!query) return true
      return columns.some((column) => String(column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key] ?? '').toLowerCase().includes(query))
    })
  }, [columns, filter, rows, search])

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return filteredRows
    return [...filteredRows].sort((first, second) => {
      const firstValue = column.accessor ? column.accessor(first) : (first as Record<string, unknown>)[sort.key]
      const secondValue = column.accessor ? column.accessor(second) : (second as Record<string, unknown>)[sort.key]
      const result = String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return sort.direction === 'asc' ? result : -result
    })
  }, [columns, filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedRows = rows.filter((row) => selectedKeys.has(rowKey(row)))
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedKeys.has(rowKey(row)))

  const toggleAll = () => setSelectedKeys((current) => {
    const next = new Set(current)
    if (allVisibleSelected) visibleRows.forEach((row) => next.delete(rowKey(row)))
    else visibleRows.forEach((row) => next.add(rowKey(row)))
    return next
  })

  if (loading) return <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5" aria-label="Loading records">{Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => <div key={index} className="h-11 animate-pulse rounded-lg bg-slate-100" />)}</div>
  if (error) return <ErrorState title={t('noRecords')} onRetry={onRetry} />
  if (!filteredRows.length) return <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Inbox size={24} /></span><p className="mt-4 text-sm font-semibold text-slate-700">{t('noRecords')}</p><p className="mt-1 max-w-sm text-sm text-slate-500">{emptyMessage}</p>{emptyAction ? <button type="button" onClick={emptyAction.onClick} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{emptyAction.label}</button> : null}</div>

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {searchable || selectedRows.length > 0 ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div className="flex min-w-[220px] flex-1 items-center gap-3">{searchable ? <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder={searchPlaceholder} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white" /> : null}<span className="text-xs text-slate-500">{filteredRows.length} records</span></div>{selectedRows.length ? <div className="flex flex-wrap gap-2">{bulkActions.map((action) => <button key={action.label} type="button" disabled={action.disabled} onClick={() => action.onClick(selectedRows)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">{action.label}</button>)}</div> : null}</div> : null}
    <div className="overflow-x-auto overscroll-x-contain"><table className="min-w-full text-left text-sm text-slate-700"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500"><tr>{selectable ? <th className="w-10 px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select visible rows" /></th> : null}{columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-4 py-3 text-${column.align || 'left'} font-semibold`}><button type="button" disabled={!column.sortable} onClick={() => column.sortable && setSort((current) => current?.key === column.key && current.direction === 'asc' ? { key: column.key, direction: 'desc' } : { key: column.key, direction: 'asc' })} className={column.sortable ? 'hover:text-sky-700' : ''}>{column.label}{sort?.key === column.key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>)}</tr></thead><tbody>{visibleRows.map((row) => <tr key={rowKey(row)} className={`border-t border-slate-200 align-top ${selectedKeys.has(rowKey(row)) ? 'bg-sky-50/60' : ''}`}>{selectable ? <td className="px-4 py-3"><input type="checkbox" checked={selectedKeys.has(rowKey(row))} onChange={() => setSelectedKeys((current) => { const next = new Set(current); const key = rowKey(row); if (next.has(key)) next.delete(key); else next.add(key); return next })} aria-label="Select row" /></td> : null}{columns.map((column) => <td key={`${rowKey(row)}-${column.key}`} className={`px-4 py-3 text-${column.align || 'left'}`}>{column.render ? column.render(row) : (row as Record<string, unknown>)[column.key] as ReactNode}</td>)}</tr>)}</tbody></table></div>
    {totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Next</button></div></div> : null}
  </div>
}
