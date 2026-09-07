import { FormEvent, useEffect, useState } from 'react'
import { Eye, Globe2, ImagePlus, Loader2, MapPin, RefreshCw, Save, Store, X } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getSellerShop, updateSellerShop } from '../../services/shop.service'

type ShopSettings = {
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  contactEmail: string
  contactPhone: string
  country: string
  state: string
  city: string
  address: string
  postalCode: string
  facebook: string
  instagram: string
  tiktok: string
  youtube: string
  businessInformation: string
  returnPolicy: string
  shippingPolicy: string
  metaTitle: string
  metaDescription: string
  keywords: string
}

const emptySettings: ShopSettings = {
  name: '', slug: '', description: '', logo: '', banner: '', contactEmail: '', contactPhone: '', country: '', state: '', city: '', address: '', postalCode: '', facebook: '', instagram: '', tiktok: '', youtube: '', businessInformation: '', returnPolicy: '', shippingPolicy: '', metaTitle: '', metaDescription: '', keywords: '',
}
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2d80d8] focus:ring-2 focus:ring-blue-100'

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label> }
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">{icon}</span><h2 className="text-lg font-bold text-slate-900">{title}</h2></div><div className="mt-5">{children}</div></section> }

export function SellerShopSettingsPage() {
  const [form, setForm] = useState<ShopSettings>(emptySettings)
  const [savedForm, setSavedForm] = useState<ShopSettings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => { setLoading(true); setError(''); try { const data = await getSellerShop<ShopSettings>(); const next = { ...emptySettings, ...data }; setForm(next); setSavedForm(next) } catch (loadError: any) { setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load shop settings.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const update = (key: keyof ShopSettings, value: string) => { setForm((current) => ({ ...current, [key]: value })); setError(''); setNotice('') }
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!form.name.trim() || !form.slug.trim()) { setError('Shop name and slug are required.'); return } if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) { setError('Enter a valid contact email.'); return }; setSaving(true); setError(''); setNotice(''); try { const data = await updateSellerShop<ShopSettings>(form); const next = { ...emptySettings, ...data }; setForm(next); setSavedForm(next); setNotice('Shop settings saved successfully.') } catch (saveError: any) { setError(saveError?.response?.data?.message || saveError?.message || 'Unable to save shop settings.') } finally { setSaving(false) } }

  return <SellerLayout title="Shop settings" subtitle="Manage your storefront identity, policies, contact details, and SEO." actions={<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}>
    {loading ? <div className="space-y-5"><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div> : <form onSubmit={submit} className="space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}{notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      <Section title="General" icon={<Store size={18} />}><div className="grid gap-4 md:grid-cols-2"><Field label="Shop name"><input required value={form.name} onChange={(event) => update('name', event.target.value)} onBlur={() => !form.slug && update('slug', slugify(form.name))} className={inputClass} /></Field><Field label="Shop slug"><input required value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} className={inputClass} /></Field><Field label="Contact email"><input type="email" value={form.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} className={inputClass} /></Field><Field label="Contact phone"><input value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} className={inputClass} /></Field><Field label="Description"><textarea rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} md:col-span-2`} /></Field><Field label="Logo URL"><div className="relative"><ImagePlus size={16} className="absolute left-3 top-3 text-slate-400" /><input value={form.logo} onChange={(event) => update('logo', event.target.value)} className={`${inputClass} pl-9`} placeholder="https://..." /></div></Field><Field label="Banner URL"><div className="relative"><ImagePlus size={16} className="absolute left-3 top-3 text-slate-400" /><input value={form.banner} onChange={(event) => update('banner', event.target.value)} className={`${inputClass} pl-9`} placeholder="https://..." /></div></Field></div></Section>
      <Section title="Address" icon={<MapPin size={18} />}><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="Country"><input value={form.country} onChange={(event) => update('country', event.target.value)} className={inputClass} /></Field><Field label="State"><input value={form.state} onChange={(event) => update('state', event.target.value)} className={inputClass} /></Field><Field label="City"><input value={form.city} onChange={(event) => update('city', event.target.value)} className={inputClass} /></Field><Field label="Address"><input value={form.address} onChange={(event) => update('address', event.target.value)} className={`${inputClass} lg:col-span-2`} /></Field><Field label="Postal code"><input value={form.postalCode} onChange={(event) => update('postalCode', event.target.value)} className={inputClass} /></Field></div></Section>
      <Section title="Social" icon={<Globe2 size={18} />}><div className="grid gap-4 md:grid-cols-2"><Field label="Facebook"><input type="url" value={form.facebook} onChange={(event) => update('facebook', event.target.value)} className={inputClass} placeholder="https://facebook.com/..." /></Field><Field label="Instagram"><input type="url" value={form.instagram} onChange={(event) => update('instagram', event.target.value)} className={inputClass} placeholder="https://instagram.com/..." /></Field><Field label="TikTok"><input type="url" value={form.tiktok} onChange={(event) => update('tiktok', event.target.value)} className={inputClass} placeholder="https://tiktok.com/@..." /></Field><Field label="YouTube"><input type="url" value={form.youtube} onChange={(event) => update('youtube', event.target.value)} className={inputClass} placeholder="https://youtube.com/..." /></Field></div></Section>
      <Section title="Business" icon={<Store size={18} />}><div className="grid gap-4"><Field label="Business information"><textarea rows={5} value={form.businessInformation} onChange={(event) => update('businessInformation', event.target.value)} className={inputClass} /></Field><Field label="Return policy"><textarea rows={5} value={form.returnPolicy} onChange={(event) => update('returnPolicy', event.target.value)} className={inputClass} /></Field><Field label="Shipping policy"><textarea rows={5} value={form.shippingPolicy} onChange={(event) => update('shippingPolicy', event.target.value)} className={inputClass} /></Field></div></Section>
      <Section title="SEO" icon={<Globe2 size={18} />}><div className="grid gap-4"><Field label="Meta title"><input value={form.metaTitle} onChange={(event) => update('metaTitle', event.target.value)} className={inputClass} maxLength={60} /></Field><Field label="Meta description"><textarea rows={3} value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} className={inputClass} maxLength={160} /></Field><Field label="Keywords"><input value={form.keywords} onChange={(event) => update('keywords', event.target.value)} className={inputClass} placeholder="fashion, accessories, handmade" /></Field></div></Section>
      <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => { setForm(savedForm); setError(''); setNotice('Changes reset.') }} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Reset</button><button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700"><Eye size={16} /> Preview shop</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2d80d8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f6dc5] disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes</button></div>
    </form>}
    {preview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-900">Shop preview</h2><p className="text-xs text-slate-500">Previewing current unsaved values</p></div><button type="button" aria-label="Close preview" onClick={() => setPreview(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>{form.banner ? <img src={form.banner} alt="Shop banner" className="h-48 w-full object-cover" /> : <div className="h-32 bg-slate-100" />}<div className="-mt-10 px-6 pb-6"><div className="flex items-end gap-4">{form.logo ? <img src={form.logo} alt="Shop logo" className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-sky-100 text-2xl font-black text-sky-700 shadow">{form.name.charAt(0).toUpperCase() || 'S'}</div>}<div className="pb-1"><h3 className="text-2xl font-black text-slate-900">{form.name || 'Your shop'}</h3><p className="text-sm text-slate-500">/{form.slug || 'shop'}</p></div></div><p className="mt-5 text-sm leading-6 text-slate-600">{form.description || 'Your shop description will appear here.'}</p><div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><div><strong>Location</strong><p>{[form.city, form.state, form.country].filter(Boolean).join(', ') || 'Not provided'}</p></div><div><strong>Contact</strong><p>{form.contactEmail || form.contactPhone || 'Not provided'}</p></div></div></div></div></div> : null}
  </SellerLayout>
}
