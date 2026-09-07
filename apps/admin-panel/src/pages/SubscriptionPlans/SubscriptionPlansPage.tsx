import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { createSubscriptionPlan, deleteSubscriptionPlan, getSubscriptionPlans, updateSubscriptionPlan } from '../../services/adminApi'

type Plan = {
  id: string
  name: string
  price: number
  productLimit: number
  orderLimit: number
  storageLimit: number
  duration: number
  features: string[]
  analytics: boolean
  support: string
  featuredProducts: boolean
  customShop: boolean
  status: string
}

type PlanForm = Omit<Plan, 'id'>

const emptyForm: PlanForm = { name: '', price: 0, productLimit: -1, orderLimit: -1, storageLimit: -1, duration: 30, features: [], analytics: false, support: 'STANDARD', featuredProducts: false, customShop: false, status: 'ACTIVE' }
const numberValue = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function normalizePlans(payload: unknown): Plan[] {
  const source = Array.isArray(payload) ? payload : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items) ? (payload as { items: unknown[] }).items : []
  return source.map((raw) => {
    const value = raw as Partial<Plan> & { features?: unknown }
    let features: string[] = []
    if (Array.isArray(value.features)) {
      features = value.features.map(String)
    } else if (typeof value.features === 'string') {
      try {
        const parsed = JSON.parse(value.features)
        if (Array.isArray(parsed)) features = parsed.map(String)
      } catch {
        features = []
      }
    }

    return { id: String(value.id ?? ''), name: String(value.name ?? 'Unnamed plan'), price: numberValue(value.price), productLimit: numberValue(value.productLimit, -1), orderLimit: numberValue(value.orderLimit, -1), storageLimit: numberValue(value.storageLimit, -1), duration: numberValue(value.duration, 30), features, analytics: Boolean(value.analytics), support: String(value.support ?? 'STANDARD'), featuredProducts: Boolean(value.featuredProducts), customShop: Boolean(value.customShop), status: String(value.status ?? 'ACTIVE').toUpperCase() }
  })
}

const limitLabel = (value: number, unit: string) => value < 0 ? 'Unlimited' : `${value.toLocaleString()} ${unit}`

export function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanForm>(emptyForm)
  const [featureInput, setFeatureInput] = useState('')

  const loadPlans = async () => {
    setLoading(true)
    try { setPlans(normalizePlans(await getSubscriptionPlans())); setError('') }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load subscription plans.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadPlans() }, [])

  const updateField = <K extends keyof PlanForm>(field: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [field]: value }))
  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, features: [] }); setFeatureInput(''); setIsFormOpen(true) }
  const openEdit = (plan: Plan) => { setEditingId(plan.id); setForm({ ...plan, features: [...plan.features] }); setFeatureInput(''); setIsFormOpen(true) }
  const addFeature = () => { const feature = featureInput.trim(); if (feature && !form.features.includes(feature)) updateField('features', [...form.features, feature]); setFeatureInput('') }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) { setError('Plan name is required.'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, name: form.name.trim() }
      if (editingId) { await updateSubscriptionPlan(editingId, payload); setNotice('Subscription plan updated.') }
      else { await createSubscriptionPlan(payload); setNotice('Subscription plan created.') }
      setIsFormOpen(false); await loadPlans()
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save subscription plan.') }
    finally { setSaving(false) }
  }

  const changeStatus = async (plan: Plan) => {
    try { await updateSubscriptionPlan(plan.id, { status: plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); setNotice(`Plan ${plan.status === 'ACTIVE' ? 'deactivated' : 'activated'}.`); await loadPlans() }
    catch (statusError) { setError(statusError instanceof Error ? statusError.message : 'Unable to update plan status.') }
  }

  const remove = async (plan: Plan) => {
    if (!window.confirm(`Delete the ${plan.name} plan?`)) return
    try { await deleteSubscriptionPlan(plan.id); setNotice('Subscription plan deleted.'); await loadPlans() }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete subscription plan.') }
  }

  const activeCount = plans.filter((plan) => plan.status === 'ACTIVE').length
  const averagePrice = plans.length ? plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length : 0
  const featuredCount = plans.filter((plan) => plan.featuredProducts).length

  return (
    <AdminLayout>
      <div className="space-y-6 p-1 sm:p-2 lg:p-3">
        <header className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm uppercase tracking-[0.2em] text-slate-500">Revenue configuration</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Subscription plans</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Design the access tiers that power seller growth across the Vendora marketplace.</p></div><button type="button" onClick={openCreate} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">Create plan</button></div></header>
        {error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
        <section className="grid gap-4 md:grid-cols-3">{[['Active plans', activeCount, `${plans.length} total tiers`], ['Average cycle price', `$${averagePrice.toFixed(0)}`, 'Across configured tiers'], ['Featured catalog access', featuredCount, 'Plans include merchandising tools']].map(([label, value, detail]) => <div key={String(label)} className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}</section>
        {loading ? <div className="rounded-[26px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading plans...</div> : plans.length === 0 ? <div className="rounded-[26px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-semibold text-slate-900">No plans configured</h2><p className="mt-2 text-sm text-slate-500">Create the first seller subscription tier to start configuring marketplace access.</p><button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Create first plan</button></div> : <section className="grid gap-5 xl:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${plan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{plan.status}</span></div><p className="mt-2 text-sm text-slate-500">{plan.duration} day billing cycle</p></div><div className="text-right"><p className="text-3xl font-bold text-slate-900">${plan.price.toFixed(2)}</p><p className="text-xs text-slate-500">per cycle</p></div></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Products', limitLabel(plan.productLimit, 'items')], ['Orders', limitLabel(plan.orderLimit, 'orders')], ['Storage', limitLabel(plan.storageLimit, 'GB')], ['Support', plan.support.replace('_', ' ')]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold capitalize text-slate-900">{value}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">{plan.analytics ? <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Analytics</span> : null}{plan.featuredProducts ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Featured products</span> : null}{plan.customShop ? <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">Custom shop</span> : null}</div><div className="mt-5 border-t border-slate-200 pt-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(plan)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">Edit</button><button type="button" onClick={() => void changeStatus(plan)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">{plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => void remove(plan)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">Delete</button></div></div></article>)}</section>}
        {isFormOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.2em] text-slate-500">Plan configuration</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">{editingId ? 'Edit subscription plan' : 'Create subscription plan'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Close</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Plan name</span><input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" placeholder="Professional" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Price</span><input required min="0" type="number" step="0.01" value={form.price} onChange={(event) => updateField('price', numberValue(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Billing duration (days)</span><input required min="1" type="number" value={form.duration} onChange={(event) => updateField('duration', numberValue(event.target.value, 30))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Product limit</span><input type="number" value={form.productLimit} onChange={(event) => updateField('productLimit', numberValue(event.target.value, -1))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Order limit</span><input type="number" value={form.orderLimit} onChange={(event) => updateField('orderLimit', numberValue(event.target.value, -1))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Storage limit (GB)</span><input type="number" value={form.storageLimit} onChange={(event) => updateField('storageLimit', numberValue(event.target.value, -1))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" /></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Support level</span><select value={form.support} onChange={(event) => updateField('support', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"><option value="STANDARD">Standard</option><option value="PRIORITY">Priority</option><option value="DEDICATED">Dedicated</option></select></label><label><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{([['analytics', 'Analytics'], ['featuredProducts', 'Featured products'], ['customShop', 'Custom shop']] as const).map(([field, label]) => <label key={field} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form[field]} onChange={(event) => updateField(field, event.target.checked)} className="h-4 w-4 accent-slate-900" />{label}</label>)}</div><div className="mt-6"><span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Included features</span><div className="flex gap-2"><input value={featureInput} onChange={(event) => setFeatureInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addFeature() } }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white" placeholder="Campaign analytics" /><button type="button" onClick={addFeature} className="rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700">Add</button></div><div className="mt-3 flex flex-wrap gap-2">{form.features.map((feature) => <button type="button" key={feature} onClick={() => updateField('features', form.features.filter((item) => item !== feature))} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">{feature} x</button>)}</div></div><div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create plan'}</button></div></form></div> : null}
      </div>
    </AdminLayout>
  )
}