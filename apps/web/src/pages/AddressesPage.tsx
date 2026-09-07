import { useEffect, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { useToastStore } from '@/store/toast'
import { apiRequest } from '@/services/api'

type Address = { id: string; fullName: string; phone?: string | null; addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; country: string; isDefault: boolean }
type AddressForm = Omit<Address, 'id' | 'isDefault'> & { id?: string; isDefault: boolean }
const emptyForm: AddressForm = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '', isDefault: false }
export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const showToast = useToastStore((state) => state.show)

  const load = () => {
    setLoading(true); setError(null)
    apiRequest<Address[]>('/auth/addresses').then(setAddresses).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load addresses.')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const updateField = (field: keyof AddressForm, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null)
    try {
      await apiRequest<Address[]>('/auth/addresses', { method: 'POST', body: JSON.stringify(form) })
      setMessage(form.id ? 'Address updated.' : 'Address saved.'); showToast({ tone: 'success', title: form.id ? 'Address updated' : 'Address saved', message: 'Your delivery address is up to date.' }); setForm(emptyForm); load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save address.'); showToast({ tone: 'error', title: 'Address update failed', message: 'Please check the fields and try again.' }) } finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await apiRequest(`/auth/addresses/${id}`, { method: 'DELETE' })
      if (form.id === id) setForm(emptyForm)
      showToast({ tone: 'success', title: 'Address removed', message: 'The saved address was deleted.' })
      load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete address.')
      showToast({ tone: 'error', title: 'Address removal failed', message: 'Please try again.' })
    }
  }

  return <div className="space-y-6"><PageShell title="Addresses" description="Add, edit, delete, and choose one default delivery address for your orders." />{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700" role="alert">{error}</div>}{message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700" role="status">{message}</div>}<div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]"><Card className="p-6"><h2 className="text-xl font-black text-slate-900">{form.id ? 'Edit address' : 'Add address'}</h2><form onSubmit={save} className="mt-5 space-y-3">{(['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country'] as const).map((field) => <label key={field} className="block"><span className="mb-1 block text-sm font-semibold capitalize text-slate-700">{field.replace(/([A-Z])/g, ' $1')}{field !== 'phone' && field !== 'addressLine2' && <span className="text-rose-500"> *</span>}</span><input required={field !== 'phone' && field !== 'addressLine2'} value={String(form[field] || '')} onChange={(event) => updateField(field, event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" /></label>)}<label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isDefault} onChange={(event) => updateField('isDefault', event.target.checked)} /> Set as default address</label><div className="flex gap-3"><button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : form.id ? 'Update address' : 'Save address'}</button>{form.id && <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700">Cancel</button>}</div></form></Card><div className="space-y-3">{loading ? <Card className="p-6 text-slate-500">Loading addresses...</Card> : addresses.length === 0 ? <Card className="p-6 text-slate-500">No saved addresses yet.</Card> : addresses.map((address) => <Card key={address.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{address.fullName}</h3>{address.isDefault && <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">Default</span>}</div><p className="mt-2 text-sm leading-6 text-slate-600">{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.state} {address.postalCode}<br />{address.country}{address.phone && <><br />{address.phone}</>}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => setForm({ ...address, phone: address.phone || '', addressLine2: address.addressLine2 || '' })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Edit</button><button type="button" onClick={() => void remove(address.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Delete</button></div></div></Card>)}</div></div></div>
}
