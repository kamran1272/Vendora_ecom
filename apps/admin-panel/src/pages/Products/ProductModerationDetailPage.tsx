import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminLayout } from '../../layouts/AdminLayout'
import {
  approveProduct,
  archiveProduct,
  deleteProduct,
  featureProduct,
  getAdminProductById,
  rejectProduct,
  suspendProduct,
  updateAdminWarehouseProduct,
} from '../../services/adminApi'

type ProductModerationRecord = {
  id?: string | number
  warehouseProductId?: string | number | null
  image?: string | string[] | null
  images?: string[] | null
  name?: string
  sku?: string
  seller?: string
  sellerId?: string | number | null
  shop?: string
  shopId?: string | number | null
  category?: string
  brand?: string
  price?: number | string
  stock?: number | string
  sales?: number | string
  rating?: number | string
  status?: string
  warehouseStatus?: string
  createdAt?: string
  description?: string
}

type TimelineItem = {
  label: string
  time: string
  detail: string
  tone: 'success' | 'warning' | 'neutral'
}

const statusTone: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  FEATURED: 'bg-violet-100 text-violet-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  SUSPENDED: 'bg-slate-200 text-slate-700',
  ARCHIVED: 'bg-zinc-200 text-zinc-700',
  DRAFT: 'bg-slate-200 text-slate-700',
}

function formatMoney(value: number | string | undefined) {
  const next = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(next)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function normalizeImages(value?: string | string[] | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  try {
    const parsed = JSON.parse(value as string)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : String(value).trim() ? [String(value)] : []
  } catch {
    return String(value).trim() ? [String(value)] : []
  }
}

function getRiskScore(record: ProductModerationRecord) {
  let score = 72
  const status = String(record.status ?? record.warehouseStatus ?? 'PENDING').toUpperCase()
  if (status === 'ACTIVE' || status === 'PUBLISHED' || status === 'FEATURED') score += 15
  if (status === 'REJECTED') score -= 30
  if (status === 'SUSPENDED' || status === 'ARCHIVED') score -= 20
  if (Number(record.stock ?? 0) <= 0) score -= 12
  if (Number(record.price ?? 0) <= 0) score -= 8
  if (String(record.seller ?? '').trim()) score += 4
  return Math.max(0, Math.min(100, score))
}

function getRiskTone(score: number) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-100'
  if (score >= 60) return 'text-amber-600 bg-amber-100'
  return 'text-rose-600 bg-rose-100'
}

export function ProductModerationDetailPage() {
  const { id } = useParams()
  const [record, setRecord] = useState<ProductModerationRecord>({})
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([
    { author: 'Compliance', message: 'Seller inventory volume is consistent with recent listing activity.', createdAt: '2026-09-01T10:00:00.000Z' },
    { author: 'Ops team', message: 'Quality check complete. No policy conflicts detected in the storefront metadata.', createdAt: '2026-09-01T12:00:00.000Z' },
  ])
  const [draftNote, setDraftNote] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('Inaccurate product details')
  const [rejectNote, setRejectNote] = useState('')
  const [formState, setFormState] = useState({
    name: '',
    category: '',
    brand: '',
    price: '',
    stock: '',
    status: 'ACTIVE',
    description: '',
  })

  const imageList = useMemo(() => normalizeImages(record.images ?? record.image), [record])
  const status = String(record.status ?? record.warehouseStatus ?? 'PENDING').toUpperCase()
  const riskScore = useMemo(() => getRiskScore(record), [record])
  const timeline = useMemo<TimelineItem[]>(() => {
    const createdAt = record.createdAt ?? new Date().toISOString()
    return [
      { label: 'Submitted to marketplace', time: formatDate(createdAt), detail: 'Listing was created from the seller inventory pipeline.', tone: 'neutral' },
      { label: 'Catalog validation', time: status === 'PENDING' ? 'In progress' : 'Completed', detail: 'The catalog metadata, images, and pricing were reviewed.', tone: status === 'PENDING' ? 'warning' : 'success' },
      { label: 'Seller approval check', time: status === 'ACTIVE' || status === 'PUBLISHED' || status === 'FEATURED' ? 'Cleared' : 'Pending', detail: 'Seller reputation and inventory quality were evaluated.', tone: status === 'ACTIVE' || status === 'PUBLISHED' || status === 'FEATURED' ? 'success' : 'warning' },
      { label: 'Current moderation state', time: status, detail: 'The listing is currently in the ' + status.toLowerCase().replace('_', ' ') + ' state.', tone: status === 'REJECTED' || status === 'SUSPENDED' || status === 'ARCHIVED' ? 'warning' : 'success' },
    ]
  }, [record, status])

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoading(true)
        const product = await getAdminProductById(id)
        setRecord(product ?? {})
        const initialImages = normalizeImages((product as ProductModerationRecord)?.images ?? (product as ProductModerationRecord)?.image)
        setSelectedImage(initialImages[0] ?? '')
        setFormState({
          name: String((product as ProductModerationRecord)?.name ?? ''),
          category: String((product as ProductModerationRecord)?.category ?? ''),
          brand: String((product as ProductModerationRecord)?.brand ?? ''),
          price: String((product as ProductModerationRecord)?.price ?? ''),
          stock: String((product as ProductModerationRecord)?.stock ?? ''),
          status: String((product as ProductModerationRecord)?.status ?? 'ACTIVE'),
          description: String((product as ProductModerationRecord)?.description ?? ''),
        })
      } catch {
        setRecord({})
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  const handleSaveEdit = async () => {
    if (!id || !record.warehouseProductId) return

    try {
      const warehousePayload = {
        name: formState.name || record.name,
        category: formState.category || record.category,
        brand: formState.brand || record.brand,
        description: formState.description || record.description,
        basePrice: Number(formState.price || record.price || 0),
        stock: Number(formState.stock || record.stock || 0),
        status: String(formState.status || record.status || 'ACTIVE').toUpperCase(),
      }

      await updateAdminWarehouseProduct(String(record.warehouseProductId), warehousePayload)

      const updated = await getAdminProductById(id)
      setRecord(updated ?? {})
      setShowEditModal(false)
    } catch {
      setShowEditModal(false)
    }
  }

  const handleReject = async () => {
    if (!id) return

    try {
      await rejectProduct(id)
      setNotes((current) => [{
        author: 'Admin',
        message: `Rejected for: ${rejectReason}${rejectNote ? ` — ${rejectNote}` : ''}`,
        createdAt: new Date().toISOString(),
      }, ...current])
      setShowRejectModal(false)
      setRejectReason('Inaccurate product details')
      setRejectNote('')
      const updated = await getAdminProductById(id)
      setRecord(updated ?? {})
    } catch {
      setShowRejectModal(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'feature' | 'archive' | 'delete') => {
    if (!id) return

    try {
      switch (action) {
        case 'approve':
          await approveProduct(id)
          break
        case 'reject':
          await rejectProduct(id)
          break
        case 'suspend':
          await suspendProduct(id)
          break
        case 'feature':
          await featureProduct(id)
          break
        case 'archive':
          await archiveProduct(id)
          break
        case 'delete':
          await deleteProduct(id)
          break
      }

      const updated = await getAdminProductById(id)
      setRecord(updated ?? {})
      window.location.reload()
    } catch {
      // keep the detail view stable and let the user retry
    }
  }

  const addNote = () => {
    if (!draftNote.trim()) return
    setNotes((current) => [{
      author: 'Admin',
      message: draftNote.trim(),
      createdAt: new Date().toISOString(),
    }, ...current])
    setDraftNote('')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading product moderation detail…</div>
      </AdminLayout>
    )
  }

  const summaryStats = [
    { label: 'Price', value: formatMoney(Number(record.price ?? 0)) },
    { label: 'Stock', value: `${Number(record.stock ?? 0)}` },
    { label: 'Sales', value: `${Number(record.sales ?? 0)}` },
    { label: 'Rating', value: `${Number(record.rating ?? 4.8).toFixed(1)} / 5` },
  ]

  const sellerHealth = [
    { label: 'Listing compliance', score: 92 },
    { label: 'Inventory health', score: Number(record.stock ?? 0) > 0 ? 88 : 46 },
    { label: 'Pricing integrity', score: Number(record.price ?? 0) > 0 ? 91 : 52 },
    { label: 'Support responsiveness', score: 84 },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  Marketplace listing
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusTone[status] ?? 'bg-slate-100 text-slate-700'}`}>
                  {status || 'PENDING'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{record.name ?? 'Product moderation review'}</h1>
                <p className="mt-2 text-sm text-slate-600">{record.sku ? `SKU ${record.sku}` : 'Marketplace product moderation'} • {record.shop ? `Shop: ${record.shop}` : 'Seller shop'} • {record.createdAt ? formatDate(record.createdAt) : 'Created recently'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleAction('approve')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">Approve</button>
              <button type="button" onClick={() => setShowRejectModal(true)} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">Reject</button>
              <button type="button" onClick={() => void handleAction('suspend')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Suspend</button>
              <button type="button" onClick={() => void handleAction('feature')} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">Feature</button>
              <button type="button" onClick={() => void handleAction('archive')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Archive</button>
              <button type="button" onClick={() => setShowEditModal(true)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Edit</button>
              <button type="button" onClick={() => void handleAction('delete')} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">Delete</button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Image gallery</h2>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{imageList.length} assets</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                  {selectedImage ? (
                    <img src={selectedImage} alt={record.name ?? 'Product'} className="h-[360px] w-full rounded-[18px] object-cover" />
                  ) : (
                    <div className="flex h-[360px] items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-white text-sm text-slate-500">No image provided</div>
                  )}
                </div>

                <div className="space-y-3">
                  {imageList.length > 0 ? imageList.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`w-full overflow-hidden rounded-[18px] border p-1 ${selectedImage === image ? 'border-slate-900' : 'border-slate-200'}`}
                    >
                      <img src={image} alt={`${record.name ?? 'Product'} view ${index + 1}`} className="h-24 w-full rounded-[14px] object-cover" />
                    </button>
                  )) : (
                    <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No gallery images available.</div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <h2 className="text-xl font-semibold text-slate-900">Product summary</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryStats.map((stat) => (
                  <div key={stat.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Description</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {record.description || 'No product description was provided for this listing yet.'}
                </p>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <h2 className="text-xl font-semibold text-slate-900">Moderation notes</h2>
              <div className="mt-5 space-y-3">
                {notes.map((note, index) => (
                  <div key={`${note.author}-${index}`} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{note.author}</span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{note.message}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <textarea
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="Add a moderation note for the review team..."
                />
                <button type="button" onClick={addNote} disabled={!draftNote.trim()} className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  Save note
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Seller risk summary</h2>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getRiskTone(riskScore)}`}>
                  {riskScore}% risk
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Seller</span>
                    <span className="font-semibold text-slate-900">{record.seller || 'Unknown seller'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                    <span>Shop</span>
                    <span className="font-semibold text-slate-900">{record.shop || 'No shop attached'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                    <span>Category</span>
                    <span className="font-semibold text-slate-900">{record.category || 'General'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                    <span>Brand</span>
                    <span className="font-semibold text-slate-900">{record.brand || 'Generic'}</span>
                  </div>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                    <span>Risk signal</span>
                    <span className="font-semibold text-slate-900">{riskScore >= 80 ? 'Low' : riskScore >= 60 ? 'Moderate' : 'High'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" style={{ width: `${Math.max(12, riskScore)}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {riskScore >= 80 ? 'Healthy storefront health with stable inventory and compliant pricing.' : riskScore >= 60 ? 'Listing should be reviewed for a few operational checks before full approval.' : 'This listing needs additional compliance review before it reaches the public marketplace.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <h2 className="text-xl font-semibold text-slate-900">Stock & pricing summary</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                  <span>List price</span>
                  <span className="font-semibold text-slate-900">{formatMoney(Number(record.price ?? 0))}</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                  <span>Inventory</span>
                  <span className="font-semibold text-slate-900">{Number(record.stock ?? 0)} units</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                  <span>Sales volume</span>
                  <span className="font-semibold text-slate-900">{Number(record.sales ?? 0)} sold</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                  <span>Warehouse status</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusTone[String(record.warehouseStatus ?? 'PUBLISHED').toUpperCase()] ?? 'bg-slate-100 text-slate-700'}`}>
                    {String(record.warehouseStatus ?? 'PUBLISHED').toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <h2 className="text-xl font-semibold text-slate-900">Marketplace health score</h2>
              <div className="mt-5 space-y-4">
                {sellerHealth.map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.score}/100</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Review timeline</h2>
              <div className="mt-5 space-y-4">
                {timeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`h-3.5 w-3.5 rounded-full ${item.tone === 'success' ? 'bg-emerald-500' : item.tone === 'warning' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                      {index !== timeline.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
                    </div>
                    <div className="flex-1 rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.time}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Edit listing</div>
                <h3 id="edit-product-title" className="mt-2 text-2xl font-semibold text-slate-900">Product details</h3>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Name</span>
                <input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Category</span>
                <input value={formState.category} onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Brand</span>
                <input value={formState.brand} onChange={(event) => setFormState((current) => ({ ...current, brand: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Price</span>
                <input type="number" value={formState.price} onChange={(event) => setFormState((current) => ({ ...current, price: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Stock</span>
                <input type="number" value={formState.stock} onChange={(event) => setFormState((current) => ({ ...current, stock: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Status</span>
                <select value={formState.status} onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400">
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="FEATURED">Featured</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Description</span>
                <textarea rows={4} value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
              <button type="button" onClick={() => void handleSaveEdit()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">Save changes</button>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-product-title">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Reject workflow</div>
                <h3 id="reject-product-title" className="mt-2 text-2xl font-semibold text-slate-900">Reason for rejection</h3>
              </div>
              <button type="button" onClick={() => setShowRejectModal(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                'Inaccurate product details',
                'Low-quality images',
                'Pricing or stock mismatch',
                'Policy violation',
                'Missing required seller info',
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRejectReason(option)}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-3 py-3 text-left text-sm ${rejectReason === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                >
                  <span>{option}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em]">{rejectReason === option ? 'Selected' : 'Choose'}</span>
                </button>
              ))}
            </div>

            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              rows={4}
              className="mt-5 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              placeholder="Add private review note to the seller or moderation log..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowRejectModal(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
              <button type="button" onClick={() => void handleReject()} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">Reject listing</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
