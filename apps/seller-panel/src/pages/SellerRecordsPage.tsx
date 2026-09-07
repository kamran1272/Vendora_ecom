import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SellerLayout } from '../components/layout/SellerLayout'
import { SellerBreadcrumbs } from '../components/layout/SellerBreadcrumbs'
import { DataTable } from '../components/common/DataTable'
import { api } from '../services/api'

type SellerRecordsPageProps = { title: string; subtitle: string; endpoint: string; columns?: string[]; action?: 'withdraw' }

type RecordValue = Record<string, unknown>

function normalizeRecords(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value as RecordValue[]
  if (value && typeof value === 'object') {
    const object = value as RecordValue
    for (const key of ['items', 'data', 'records', 'orders', 'withdrawals', 'tickets']) if (Array.isArray(object[key])) return object[key] as RecordValue[]
    return [object]
  }
  return []
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function SellerRecordsPage({ title, subtitle, endpoint, columns, action }: SellerRecordsPageProps) {
  const { id } = useParams()
  const [rows, setRows] = useState<RecordValue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(endpoint.replace(':id', id || ''))
      const records = normalizeRecords(data)
      setRows(records)
      setError('')
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load this workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [endpoint, id])

  const submitWithdrawal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await api.post('/seller/withdrawals', { amount: Number(amount) })
      setAmount('')
      setMessage('Withdrawal request submitted.')
      await load()
    } catch (withdrawalError: any) {
      setError(withdrawalError?.response?.data?.message || withdrawalError?.message || 'Unable to submit withdrawal.')
    }
  }

  const keys = columns || [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((key) => !['id', 'createdAt', 'updatedAt'].includes(key)).slice(0, 6)
  const tableColumns = keys.map((key) => ({ key, label: key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase()), render: (row: RecordValue) => <span className="break-words">{formatValue(row[key])}</span> }))

  return (
    <SellerLayout title={title} subtitle={subtitle} actions={<button type="button" onClick={() => void load()} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">Refresh</button>}>
      <SellerBreadcrumbs items={[{ label: 'Seller', to: '/seller/dashboard' }, { label: title }]} />
      {message ? <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {action === 'withdraw' ? <form onSubmit={submitWithdrawal} className="mb-5 flex max-w-lg gap-2 rounded-lg border border-slate-200 bg-white p-4"><input required min="1" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Withdrawal amount" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm" /><button type="submit" className="rounded-md bg-[#2d80d8] px-4 py-2 text-sm font-semibold text-white">Request withdrawal</button></form> : null}
      <DataTable columns={tableColumns} rows={rows} loading={loading} error={error} onRetry={() => void load()} searchable searchPlaceholder={`Search ${title.toLowerCase()}`} rowKey={(row) => String(row.id || JSON.stringify(row))} emptyMessage="No records are available for this workspace." />
    </SellerLayout>
  )
}
