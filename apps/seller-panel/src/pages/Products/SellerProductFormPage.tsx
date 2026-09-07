import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { FormActions } from '../../components/common/FormActions'
import { FormField as Field } from '../../components/common/FormField'
import { createSellerProduct, getSellerProduct, updateSellerProduct } from '../../services/products.service'

type ProductForm = {
  name: string
  slug: string
  description: string
  shortDescription: string
  category: string
  subcategory: string
  brand: string
  sku: string
  barcode: string
  price: string
  sellerMargin: string
  salePrice: string
  stock: string
  minimumOrder: string
  maximumOrder: string
  weight: string
  dimensions: string
  shippingInformation: string
  images: string
  thumbnail: string
  attributes: string
  variants: string
  status: string
}

const emptyForm: ProductForm = {
  name: '', slug: '', description: '', shortDescription: '', category: '', subcategory: '', brand: '', sku: '', barcode: '', price: '', sellerMargin: '0', salePrice: '', stock: '0', minimumOrder: '1', maximumOrder: '0', weight: '', dimensions: '', shippingInformation: '', images: '', thumbnail: '', attributes: '[]', variants: '[]', status: 'ACTIVE',
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2d80d8] focus:ring-2 focus:ring-blue-100'

export function SellerProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) return
    void getSellerProduct<Record<string, unknown>>(id).then((data) => setForm({ ...emptyForm, ...data, price: String(data.price ?? data.basePrice ?? ''), sellerMargin: String(data.sellerMargin ?? 0), salePrice: data.salePrice == null ? '' : String(data.salePrice), stock: String(data.stock ?? 0), minimumOrder: String(data.minimumOrder ?? 1), maximumOrder: String(data.maximumOrder ?? 0), weight: data.weight == null ? '' : String(data.weight), images: Array.isArray(data.images) ? data.images.join(',\n') : '', attributes: JSON.stringify(data.attributes || [], null, 2), variants: JSON.stringify(data.variants || [], null, 2) })).catch(() => setError('Unable to load product.')).finally(() => setLoading(false))
  }, [id])

  const update = (key: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setMessage('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const requiredFields: Array<[keyof ProductForm, string]> = [['name', 'Product name'], ['slug', 'Slug'], ['category', 'Category'], ['brand', 'Brand'], ['sku', 'SKU'], ['price', 'Price']]
    const missing = requiredFields.find(([key]) => !form[key].trim())
    if (missing) { setError(`${missing[1]} is required.`); return }
    if (Number(form.price) < 0 || Number(form.stock) < 0) { setError('Price and stock cannot be negative.'); return }
    if (form.salePrice && Number(form.salePrice) > Number(form.price)) { setError('Sale price cannot exceed price.'); return }
    if (Number(form.minimumOrder) < 1 || Number(form.maximumOrder) < 0) { setError('Order limits are invalid.'); return }

    let attributes: unknown[]
    let variants: unknown[]
    try { attributes = JSON.parse(form.attributes || '[]'); variants = JSON.parse(form.variants || '[]') } catch { setError('Attributes and variants must contain valid JSON arrays.'); return }
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), sellerMargin: Number(form.sellerMargin), salePrice: form.salePrice ? Number(form.salePrice) : null, stock: Number(form.stock), minimumOrder: Number(form.minimumOrder), maximumOrder: Number(form.maximumOrder), weight: form.weight ? Number(form.weight) : null, images: form.images.split(/[,\n]/).map((value) => value.trim()).filter(Boolean), attributes, variants }
      if (id) await updateSellerProduct(id, payload)
      else await createSellerProduct(payload)
      setMessage(id ? 'Product updated successfully.' : 'Product created successfully.')
      window.setTimeout(() => navigate('/seller/products'), 500)
    } catch (saveError: unknown) { setError(saveError instanceof Error ? saveError.message : 'Unable to save product.') } finally { setSaving(false) }
  }

  return <SellerLayout title={id ? 'Edit product' : 'Create product'} subtitle={id ? 'Update the seller price and visibility for this warehouse-backed product.' : 'Create a product for your seller catalog.'} actions={<button type="button" onClick={() => navigate('/seller/products')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><ArrowLeft size={15} /> Back to products</button>}>
    {loading ? <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">Loading product...</div> : <form onSubmit={submit} className="space-y-6">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}{message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Basic information</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Product name" required><input required value={form.name} onChange={(event) => update('name', event.target.value)} onBlur={() => !form.slug && update('slug', slugify(form.name))} className={inputClass} /></Field><Field label="Slug" required><input required value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} className={inputClass} /></Field><Field label="SKU" required><input required value={form.sku} onChange={(event) => update('sku', event.target.value)} className={inputClass} /></Field><Field label="Barcode"><input value={form.barcode} onChange={(event) => update('barcode', event.target.value)} className={inputClass} /></Field><Field label="Category" required><input required value={form.category} onChange={(event) => update('category', event.target.value)} className={inputClass} /></Field><Field label="Subcategory"><input value={form.subcategory} onChange={(event) => update('subcategory', event.target.value)} className={inputClass} /></Field><Field label="Brand" required><input required value={form.brand} onChange={(event) => update('brand', event.target.value)} className={inputClass} /></Field><Field label="Status"><select value={form.status} onChange={(event) => update('status', event.target.value)} className={inputClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field><Field label="Short description"><input value={form.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} className={inputClass} /></Field><Field label="Description"><textarea rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className={inputClass} /></Field></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Seller pricing and inventory</h2><p className="mt-1 text-xs text-slate-500">These values belong to your seller listing. The warehouse master price remains unchanged.</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Selling price" required><input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => update('price', event.target.value)} className={inputClass} /></Field><Field label="Seller margin"><input min="0" step="0.01" type="number" value={form.sellerMargin} onChange={(event) => update('sellerMargin', event.target.value)} className={inputClass} /></Field><Field label="Sale price"><input min="0" step="0.01" type="number" value={form.salePrice} onChange={(event) => update('salePrice', event.target.value)} className={inputClass} /></Field><Field label="Stock" required><input required min="0" type="number" value={form.stock} onChange={(event) => update('stock', event.target.value)} className={inputClass} /></Field><Field label="Minimum order"><input min="1" type="number" value={form.minimumOrder} onChange={(event) => update('minimumOrder', event.target.value)} className={inputClass} /></Field><Field label="Maximum order"><input min="0" type="number" value={form.maximumOrder} onChange={(event) => update('maximumOrder', event.target.value)} className={inputClass} /></Field><Field label="Weight"><input min="0" step="0.01" type="number" value={form.weight} onChange={(event) => update('weight', event.target.value)} className={inputClass} placeholder="kg" /></Field></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Media and shipping</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Thumbnail URL"><div className="relative"><ImagePlus size={16} className="absolute left-3 top-3 text-slate-400" /><input value={form.thumbnail} onChange={(event) => update('thumbnail', event.target.value)} className={`${inputClass} pl-9`} placeholder="https://..." /></div></Field><Field label="Product image URLs"><textarea rows={3} value={form.images} onChange={(event) => update('images', event.target.value)} className={inputClass} placeholder="One URL per line" /></Field><Field label="Dimensions"><input value={form.dimensions} onChange={(event) => update('dimensions', event.target.value)} className={inputClass} placeholder="30 x 20 x 10 cm" /></Field><Field label="Shipping information"><textarea rows={3} value={form.shippingInformation} onChange={(event) => update('shippingInformation', event.target.value)} className={inputClass} /></Field></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Attributes and variants</h2><p className="mt-1 text-xs text-slate-500">Use JSON arrays, for example: [{`{"name":"Color","value":"Blue"}`}] or [{`{"name":"Size","options":["S","M"]}`}].</p><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Attributes"><textarea rows={7} value={form.attributes} onChange={(event) => update('attributes', event.target.value)} className={`${inputClass} font-mono text-xs`} /></Field><Field label="Variants"><textarea rows={7} value={form.variants} onChange={(event) => update('variants', event.target.value)} className={`${inputClass} font-mono text-xs`} /></Field></div></section>
      <FormActions loading={saving} loadingLabel="Saving..." submitLabel="Save changes" success={message}><button type="button" onClick={() => navigate('/seller/products')} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button></FormActions>
    </form>}
  </SellerLayout>
}
