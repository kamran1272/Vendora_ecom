import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { createAdminCategory, deleteAdminCategory, getAdminCategories, reorderAdminCategory, updateAdminCategory } from '../../services/adminApi'

type Category = {
  id: string
  parentId: string | null
  name: string
  slug: string
  image: string | null
  seoTitle: string | null
  seoDescription: string | null
  status: string
  sortOrder: number
  children?: Array<{ id: string }>
}

type CategoryForm = Omit<Category, 'id' | 'children'>

const emptyForm: CategoryForm = {
  parentId: null,
  name: '',
  slug: '',
  image: '',
  seoTitle: '',
  seoDescription: '',
  status: 'ACTIVE',
  sortOrder: 0,
}

function normalizeCategories(payload: unknown): Category[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : []

  return source.map((item) => {
    const value = item as Partial<Category>
    return {
      id: String(value.id ?? ''),
      parentId: value.parentId ? String(value.parentId) : null,
      name: String(value.name ?? 'Unnamed category'),
      slug: String(value.slug ?? ''),
      image: value.image ?? null,
      seoTitle: value.seoTitle ?? null,
      seoDescription: value.seoDescription ?? null,
      status: String(value.status ?? 'ACTIVE').toUpperCase(),
      sortOrder: Number(value.sortOrder ?? 0),
      children: value.children ?? [],
    }
  })
}

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white'
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setCategories(normalizeCategories(await getAdminCategories()))
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const roots = useMemo(() => categories.filter((category) => !category.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [categories])
  const childrenOf = (parentId: string) => categories.filter((category) => category.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const setField = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => setForm((current) => ({ ...current, [field]: value }))

  const openCreate = (parentId: string | null = null) => {
    setEditingId(null)
    setForm({ ...emptyForm, parentId, sortOrder: categories.length })
    setFormOpen(true)
    setNotice('')
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({ parentId: category.parentId, name: category.name, slug: category.slug, image: category.image ?? '', seoTitle: category.seoTitle ?? '', seoDescription: category.seoDescription ?? '', status: category.status, sortOrder: category.sortOrder })
    setFormOpen(true)
    setNotice('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const slug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const payload = { ...form, name: form.name.trim(), slug }
      if (editingId) await updateAdminCategory(editingId, payload)
      else await createAdminCategory(payload)
      setFormOpen(false)
      setNotice(editingId ? 'Category updated.' : 'Category created.')
      await load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return
    try {
      await deleteAdminCategory(category.id)
      setNotice('Category deleted.')
      await load()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete category.')
    }
  }

  const toggle = async (category: Category) => {
    try {
      await updateAdminCategory(category.id, { status: category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      setNotice('Category status updated.')
      await load()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update category status.')
    }
  }

  const move = async (category: Category, direction: -1 | 1) => {
    const siblings = category.parentId ? childrenOf(category.parentId) : roots
    const index = siblings.findIndex((item) => item.id === category.id)
    const target = siblings[index + direction]
    if (!target) return
    try {
      await Promise.all([
        reorderAdminCategory(category.id, { sortOrder: target.sortOrder }),
        reorderAdminCategory(target.id, { sortOrder: category.sortOrder }),
      ])
      await load()
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'Unable to reorder category.')
    }
  }

  const renderRow = (category: Category, depth = 0): ReactNode => (
    <div key={category.id}>
      <div className="grid gap-3 border-t border-slate-200 px-4 py-4 md:grid-cols-[minmax(240px,1.5fr)_minmax(130px,1fr)_110px_80px_minmax(250px,1fr)] md:items-center" style={{ paddingLeft: `${16 + depth * 28}px` }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">{category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : null}</div>
          <div><div className="font-semibold text-slate-900">{category.name}</div><div className="text-xs text-slate-500">{depth ? 'Child category' : 'Parent category'}</div></div>
        </div>
        <div className="text-sm text-slate-500">/{category.slug}</div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${category.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{category.status}</span>
        <span className="text-sm text-slate-500">{category.sortOrder}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openCreate(category.id)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Add child</button>
          <button type="button" onClick={() => openEdit(category)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Edit</button>
          <button type="button" onClick={() => void toggle(category)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">{category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>
          <button type="button" onClick={() => void move(category, -1)} aria-label="Move up" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">↑</button>
          <button type="button" onClick={() => void move(category, 1)} aria-label="Move down" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">↓</button>
          <button type="button" onClick={() => void remove(category)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">Delete</button>
        </div>
      </div>
      {childrenOf(category.id).map((child) => renderRow(child, depth + 1))}
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-6 p-1 sm:p-2 lg:p-3">
        <header className="rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Catalog structure</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Categories</h1><p className="mt-2 text-sm text-slate-600">Build the storefront taxonomy, control visibility, and keep category SEO metadata organized.</p></div><button type="button" onClick={() => openCreate()} className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">Create category</button></div></header>
        {error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
        <section className="grid gap-4 md:grid-cols-3">{[['Total categories', categories.length], ['Parent categories', roots.length], ['Active categories', categories.filter((category) => category.status === 'ACTIVE').length]].map(([title, value]) => <div key={String(title)} className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></div>)}</section>
        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.04)]"><div className="hidden grid-cols-[minmax(240px,1.5fr)_minmax(130px,1fr)_110px_80px_minmax(250px,1fr)] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 md:grid"><span>Name</span><span>Slug</span><span>Status</span><span>Order</span><span>Actions</span></div>{loading ? <div className="p-10 text-sm text-slate-500">Loading categories...</div> : roots.length ? roots.map((category) => renderRow(category)) : <div className="p-10 text-center text-sm text-slate-500">No categories configured yet.</div>}</section>
        {formOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Taxonomy editor</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">{editingId ? 'Edit category' : 'Create category'}</h2></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Close</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Name</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} className={fieldClass()} /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Slug</span><input value={form.slug} onChange={(event) => setField('slug', event.target.value)} className={fieldClass()} placeholder="auto-generated" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Parent category</span><select value={form.parentId ?? ''} onChange={(event) => setField('parentId', event.target.value || null)} className={fieldClass()}><option value="">Root category</option>{categories.filter((category) => category.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Order</span><input type="number" value={form.sortOrder} onChange={(event) => setField('sortOrder', Number(event.target.value))} className={fieldClass()} /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Image URL</span><input value={form.image ?? ''} onChange={(event) => setField('image', event.target.value)} className={fieldClass()} placeholder="https://..." /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Status</span><select value={form.status} onChange={(event) => setField('status', event.target.value)} className={fieldClass()}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">SEO title</span><input value={form.seoTitle ?? ''} onChange={(event) => setField('seoTitle', event.target.value)} className={fieldClass()} /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">SEO description</span><textarea rows={4} value={form.seoDescription ?? ''} onChange={(event) => setField('seoDescription', event.target.value)} className={fieldClass()} /></label></div><div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save category'}</button></div></form></div> : null}
      </div>
    </AdminLayout>
  )
}