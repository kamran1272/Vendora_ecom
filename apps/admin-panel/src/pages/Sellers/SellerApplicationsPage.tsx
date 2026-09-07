import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '../../components/feedback/AdminFeedback'
import {
  getAdminSellerApplications,
  getAdminSellerApplicationById,
  approveSellerApplication,
  rejectSellerApplication,
  requestSellerApplicationInfo,
  messageSellerApplication,
  updateSellerApplicationStatus,
} from '../../services/adminApi'

type SellerApplicationRecord = Record<string, unknown>

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFORMATION_REQUESTED'

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(value: unknown): string {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(amount) ? amount : 0)
}

function getInitials(value: unknown) {
  return String(value ?? 'Applicant')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AP'
}

function statusTone(status: string) {
  const normalized = String(status || 'PENDING').toUpperCase()
  if (normalized.includes('APPROV')) return 'bg-emerald-100 text-emerald-700'
  if (normalized.includes('REJECT')) return 'bg-rose-100 text-rose-700'
  if (normalized.includes('INFO')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

function getConfidenceScore(application: SellerApplicationRecord) {
  let score = 30
  const fields = [
    Boolean(application.applicantName ?? application.name),
    Boolean(application.email),
    Boolean(application.phone),
    Boolean(application.businessName ?? application.shopName),
    Boolean((application.documents as Record<string, unknown> | undefined)?.certificateFront),
    Boolean((application.documents as Record<string, unknown> | undefined)?.certificateBack),
    String(application.status ?? '').toUpperCase() !== 'PENDING',
  ]

  fields.forEach((hasField) => {
    if (hasField) score += 10
  })

  return Math.min(100, score)
}

function getChecklist(application: SellerApplicationRecord) {
  const documents = (application.documents as Record<string, unknown> | undefined) ?? {}
  const fields = [
    { label: 'Applicant identity verified', done: Boolean(application.applicantName ?? application.name) },
    { label: 'Business info captured', done: Boolean(application.businessName ?? application.shopName) },
    { label: 'Business email present', done: Boolean(application.email) },
    { label: 'Phone number disclosed', done: Boolean(application.phone) },
    { label: 'Identity document front uploaded', done: Boolean(documents.certificateFront) },
    { label: 'Identity document back uploaded', done: Boolean(documents.certificateBack) },
    { label: 'Application status confirmed', done: String(application.status ?? 'PENDING').toUpperCase() !== 'PENDING' },
  ]

  return fields
}

function getTimeline(application: SellerApplicationRecord) {
  const createdAt = application.createdAt ?? application.submittedAt ?? new Date().toISOString()
  const status = String(application.status ?? 'PENDING').toUpperCase()

  return [
    {
      label: 'Application submitted',
      time: formatDate(createdAt),
      active: true,
      detail: 'Seller onboarding request created by applicant.',
    },
    {
      label: 'Profile review',
      time: status === 'PENDING' ? 'Awaiting review' : formatDate(createdAt),
      active: status !== 'PENDING',
      detail: 'Admin checked seller identity and store profile details.',
    },
    {
      label: 'Document validation',
      time: Boolean((application.documents as Record<string, unknown> | undefined)?.certificateFront) ? 'Verified' : 'Pending',
      active: Boolean((application.documents as Record<string, unknown> | undefined)?.certificateFront),
      detail: 'Identity and business documents are under review.',
    },
    {
      label: 'Decision status',
      time: status === 'PENDING' ? 'Pending decision' : status,
      active: status !== 'PENDING',
      detail: 'Final approval or rejection is recorded against the application.',
    },
  ]
}

export function SellerApplicationsPage() {
  const [applications, setApplications] = useState<SellerApplicationRecord[]>([])
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminSellerApplications()
      setApplications(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load seller applications.')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredApplications = useMemo(() => {
    if (filter === 'ALL') return applications
    return applications.filter((application) => String(application.status ?? 'PENDING').toUpperCase() === filter)
  }, [applications, filter])

  const counts = useMemo(
    () => ({
      ALL: applications.length,
      PENDING: applications.filter((item) => String(item.status ?? 'PENDING').toUpperCase() === 'PENDING').length,
      APPROVED: applications.filter((item) => String(item.status ?? '').toUpperCase().includes('APPROV')).length,
      REJECTED: applications.filter((item) => String(item.status ?? '').toUpperCase().includes('REJECT')).length,
      INFORMATION_REQUESTED: applications.filter((item) => String(item.status ?? '').toUpperCase().includes('INFO')).length,
    }),
    [applications],
  )

  const handleApprove = async (applicationId: string | number) => {
    await approveSellerApplication(applicationId)
    await load()
  }

  const handleReject = async (applicationId: string | number) => {
    await rejectSellerApplication(applicationId)
    await load()
  }

  const handleRequestInfo = async (applicationId: string | number) => {
    const message = window.prompt('Ask the applicant for the missing documentation or details:', 'Please share your business registration and identification documents.')
    if (!message) return
    await requestSellerApplicationInfo(applicationId, message)
    await load()
  }

  const handleMessage = async (applicationId: string | number) => {
    const message = window.prompt('Send a direct message to the applicant:', 'Your application is under review. Please confirm the business details below.')
    if (!message) return
    await messageSellerApplication(applicationId, message)
    await load()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Seller onboarding</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Seller applications</h2>
              <p className="mt-2 text-slate-600">Review new registrations, validate documents, and activate approved sellers.</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {([
            ['ALL', 'Total', counts.ALL],
            ['PENDING', 'Pending', counts.PENDING],
            ['APPROVED', 'Approved', counts.APPROVED],
            ['REJECTED', 'Rejected', counts.REJECTED],
            ['INFORMATION_REQUESTED', 'Info requested', counts.INFORMATION_REQUESTED],
          ] as const).map(([status, label, count]) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-[24px] border p-4 text-left transition ${filter === status ? 'border-indigo-700 bg-indigo-700 text-white shadow-lg shadow-indigo-700/15' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40'}`}
            >
              <div className="text-xs uppercase tracking-[0.18em] opacity-75">{label}</div>
              <div className="mt-3 text-3xl font-bold">{count}</div>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          {loading ? (
            <AdminTableSkeleton columns={6} />
          ) : error ? (
            <AdminErrorState onRetry={() => void load()} message={error} />
          ) : filteredApplications.length === 0 ? (
            <AdminEmptyState title="No applications found" message="No seller applications match this filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Applicant</th>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => {
                    const record = application as Record<string, unknown>
                    const applicant = record.user as Record<string, unknown> | undefined
                    const shop = record.shop as Record<string, unknown> | undefined
                    const id = String(record.id ?? '')
                    const name = String(record.applicantName ?? record.name ?? applicant?.name ?? 'Applicant')
                    const business = String(record.businessName ?? record.shopName ?? shop?.name ?? '—')
                    const email = String(record.email ?? applicant?.email ?? '—')
                    const status = String(record.status ?? 'PENDING').toUpperCase()

                    return (
                      <tr key={id} className="border-t border-slate-100">
                        <td className="px-4 py-3 align-top">
                          <Link to={`/admin/seller-applications/${id}`} className="flex min-w-[190px] items-center gap-3 font-semibold text-slate-900 hover:text-indigo-600">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">{getInitials(name)}</span>
                            <span>{name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600">{business}</td>
                        <td className="px-4 py-3 align-top text-slate-600">{email}</td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>{status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3 align-top">{formatDate(application.submittedAt ?? application.createdAt)}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => void handleApprove(id)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white">Approve</button>
                            <button type="button" onClick={() => void handleReject(id)} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white">Reject</button>
                            <button type="button" onClick={() => void handleRequestInfo(id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">Request info</button>
                            <button type="button" onClick={() => void handleMessage(id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">Message</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export function SellerApplicationDetailPage() {
  const { id } = useParams()
  const [application, setApplication] = useState<SellerApplicationRecord>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [infoDraft, setInfoDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [notes, setNotes] = useState<Array<{ id: string; author: string; message: string; createdAt: string }>>([
    { id: 'seed-1', author: 'Ops team', message: 'Seller application received and queued for document validation.', createdAt: new Date().toISOString() },
    { id: 'seed-2', author: 'Compliance', message: 'Identity and storefront details look consistent with onboarding requirements.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ])
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const data = await getAdminSellerApplicationById(id)
      setApplication(data || {})
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load seller application.')
      setApplication({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  const status = String(application.status ?? 'PENDING').toUpperCase()
  const checklist = useMemo(() => getChecklist(application), [application])
  const confidenceScore = useMemo(() => getConfidenceScore(application), [application])
  const timeline = useMemo(() => getTimeline(application), [application])

  const handleApprove = async () => {
    if (!id) return
    await approveSellerApplication(id)
    await load()
  }

  const handleReject = async () => {
    if (!id) return
    await rejectSellerApplication(id)
    await load()
  }

  const handleRequestInfo = async () => {
    if (!id || !infoDraft.trim()) return
    setSubmitting(true)
    try {
      await requestSellerApplicationInfo(id, infoDraft.trim())
      setInfoDraft('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleMessage = async () => {
    if (!id || !messageDraft.trim()) return
    setSubmitting(true)
    try {
      await messageSellerApplication(id, messageDraft.trim())
      setNotes((current) => [{
        id: `note-${Date.now()}`,
        author: 'Admin',
        message: messageDraft.trim(),
        createdAt: new Date().toISOString(),
      }, ...current])
      setMessageDraft('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNote = () => {
    if (!noteDraft.trim()) return
    setNotes((current) => [{
      id: `note-${Date.now()}`,
      author: 'Admin',
      message: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    }, ...current])
    setNoteDraft('')
  }

  if (loading) {
    return <AdminLayout><div className="rounded-[30px] bg-white p-8 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading application…</div></AdminLayout>
  }

  if (error) {
    return <AdminLayout><div className="rounded-[30px] bg-white p-8 text-rose-600 shadow-sm ring-1 ring-slate-200">{error}</div></AdminLayout>
  }

  const documents = application.documents as Record<string, unknown> | undefined
  const certificateFront = typeof documents?.certificateFront === 'string' ? documents.certificateFront : ''
  const certificateBack = typeof documents?.certificateBack === 'string' ? documents.certificateBack : ''

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Application review</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{String((application as Record<string, unknown>).applicantName ?? (application as Record<string, unknown>).name ?? 'Seller application')}</h2>
              <p className="mt-2 text-slate-600">{String((application as Record<string, unknown>).businessName ?? (application as Record<string, unknown>).shopName ?? ((application as Record<string, unknown>).shop as Record<string, unknown> | undefined)?.name ?? 'New seller application')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-2 text-xs font-bold tracking-wide ${statusTone(status)}`}>{status.replace('_', ' ')}</span>
              <button type="button" onClick={() => void handleApprove()} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
              <button type="button" onClick={() => void handleReject()} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
              <button type="button" onClick={() => void handleRequestInfo()} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Request info</button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">Application overview</h3>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>{status.replace('_', ' ')}</span>
              </div>
              <dl className="mt-5 grid gap-3 md:grid-cols-2 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Applicant</dt><dd className="mt-2 font-semibold text-slate-900">{String((application as Record<string, unknown>).applicantName ?? (application as Record<string, unknown>).name ?? '—')}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Business</dt><dd className="mt-2 font-semibold text-slate-900">{String((application as Record<string, unknown>).businessName ?? (application as Record<string, unknown>).shopName ?? '—')}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</dt><dd className="mt-2 font-semibold text-slate-900">{String((application as Record<string, unknown>).email ?? '—')}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Phone</dt><dd className="mt-2 font-semibold text-slate-900">{String(application.phone ?? '—')}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Submitted</dt><dd className="mt-2 font-semibold text-slate-900">{formatDate(application.submittedAt ?? application.createdAt)}</dd></div>
                <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated revenue</dt><dd className="mt-2 font-semibold text-slate-900">{formatMoney((application as Record<string, unknown>).estimatedRevenue ?? 0)}</dd></div>
              </dl>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Applicant timeline</h3>
              <div className="mt-5 space-y-4">
                {timeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-3.5 w-3.5 rounded-full ${item.active ? 'bg-slate-900' : 'bg-slate-300'}`} />
                      {index !== timeline.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-800">{item.label}</div>
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.time}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Pending document checklist</h3>
              <div className="mt-5 space-y-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">Document review</h3>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${confidenceScore >= 80 ? 'bg-emerald-100 text-emerald-700' : confidenceScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {confidenceScore}% confidence
                </span>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Certificate front</div>
                  {certificateFront ? (
                    <img src={certificateFront} alt="Certificate front" className="mt-3 h-52 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No front document uploaded.</div>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Certificate back</div>
                  {certificateBack ? (
                    <img src={certificateBack} alt="Certificate back" className="mt-3 h-52 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No back document uploaded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Approval confidence</h3>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>Risk score</span>
                  <span className="font-semibold text-slate-900">{100 - confidenceScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" style={{ width: `${confidenceScore}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {confidenceScore >= 80 ? 'Highly likely to pass onboarding review with minimal follow-up.' : confidenceScore >= 60 ? 'Application is mostly complete but needs a quick document validation pass.' : 'Several fields need attention before approval can be safely recommended.'}
                </p>
              </div>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Request information</h3>
              <textarea value={infoDraft} onChange={(event) => setInfoDraft(event.target.value)} rows={4} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" placeholder="Ask for missing details or document clarification..." />
              <button type="button" disabled={submitting || !infoDraft.trim()} onClick={() => void handleRequestInfo()} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Sending…' : 'Request info'}</button>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Message applicant</h3>
              <textarea value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} rows={4} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" placeholder="Send a direct update to the applicant..." />
              <button type="button" disabled={submitting || !messageDraft.trim()} onClick={() => void handleMessage()} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Sending…' : 'Send message'}</button>
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Admin notes history</h3>
              <div className="mt-4 space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{note.author}</span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{note.message}</p>
                  </div>
                ))}
              </div>
              <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={3} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" placeholder="Add internal admin note..." />
              <button type="button" disabled={!noteDraft.trim()} onClick={handleAddNote} className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">Add note</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
