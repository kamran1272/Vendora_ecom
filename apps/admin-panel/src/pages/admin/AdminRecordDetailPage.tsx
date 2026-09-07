import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminContentSkeleton, AdminErrorState, AdminEmptyState } from '../../components/feedback/AdminFeedback'

type AdminRecord = Record<string, unknown>

type AdminRecordDetailPageProps = {
  title: string
  description: string
  fetcher: () => Promise<unknown>
  backPath: string
  backLabel: string
}

function normalizeRecords(value: unknown): AdminRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is AdminRecord => Boolean(item) && typeof item === 'object')
  if (!value || typeof value !== 'object') return []
  const response = value as { items?: unknown; data?: unknown }
  if (Array.isArray(response.items)) return normalizeRecords(response.items)
  if (Array.isArray(response.data)) return normalizeRecords(response.data)
  return [value as AdminRecord]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export function AdminRecordDetailPage({ title, description, fetcher, backPath, backLabel }: AdminRecordDetailPageProps) {
  const { id } = useParams()
  const [record, setRecord] = useState<AdminRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const records = normalizeRecords(await fetcher())
        const found = records.find((item) => String(item.id ?? item._id ?? '') === String(id))
        if (!active) return
        if (!found) {
          setError(`The requested ${title.toLowerCase()} could not be found.`)
          return
        }
        setRecord(found)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : `Unable to load ${title.toLowerCase()}.`)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [fetcher, id, title])

  const entries = record ? Object.entries(record).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key)) : []

  return (
    <AdminLayout>
      <div className="space-y-6 p-1 sm:p-2 lg:p-3">
        <div className="flex items-center justify-between gap-4">
          <Link to={backPath} className="text-sm font-medium text-slate-600 hover:text-slate-900">← {backLabel}</Link>
          {id ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">ID {id}</span> : null}
        </div>
        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Record detail</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
        </header>
        {loading ? <AdminContentSkeleton /> : null}
        {!loading && error ? <AdminErrorState message={error} /> : null}
        {!loading && record ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="grid gap-4 md:grid-cols-2">
              {entries.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{key.replaceAll('_', ' ')}</dt>
                  <dd className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-900">{formatValue(value)}</dd>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
              Created {formatValue(record.createdAt)}{record.updatedAt ? ` · Updated ${formatValue(record.updatedAt)}` : ''}
            </div>
          </section>
        ) : !loading && !error ? <AdminEmptyState title={`No ${title.toLowerCase()} found`} message="The requested record is no longer available." /> : null}
      </div>
    </AdminLayout>
  )
}