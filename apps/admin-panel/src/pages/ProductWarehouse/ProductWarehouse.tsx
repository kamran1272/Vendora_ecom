import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { CheckCircle2, Download, Eye, Pencil, Search, Trash2, X } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'

type Product = {
	id: string
	name: string
	sku: string
	category?: string
	brand?: string
	basePrice: number
	stock: number
	status: string
	description?: string | null
	images?: string[]
	attributes?: Array<{ name: string; value: string }>
	variants?: Array<{ name: string; options: string[] }>
	sourceId?: string
	externalProductId?: string | null
	externalSku?: string | null
	importedAt?: string | null
}

type ProviderProduct = Product & { externalProductId: string; images?: string[]; description?: string | null; attributes?: Array<{ name: string; value: string }>; variants?: Array<{ name: string; options: string[] }> }
type Summary = { total: number; active: number; importedToday: number; providers: number; failedImports: number }
type ImportHistory = { id: string; providerId: string; status: string; createdCount: number; updatedCount: number; failedCount: number; createdAt: string; completedAt?: string | null }

type Plan = {
	id: string
	name: string
	price: number
	productLimit: number
	duration: number
	status: string
}

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

const normalizeList = <T,>(value: unknown): T[] => {
	if (Array.isArray(value)) {
		return value as T[]
	}

	if (value && typeof value === 'object') {
		const record = value as { items?: unknown; data?: unknown }
		if (Array.isArray(record.items)) return record.items as T[]
		if (Array.isArray(record.data)) return record.data as T[]
	}

	return []
}

export function ProductWarehouse() {
	const [products, setProducts] = useState<Product[]>([])
	const [plans, setPlans] = useState<Plan[]>([])
	const [form, setForm] = useState({
		name: '',
		sku: '',
		category: '',
		brand: '',
		basePrice: '',
		stock: '',
	})
	const [error, setError] = useState('')
	const [summary, setSummary] = useState<Summary | null>(null)
	const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([])
	const [provider, setProvider] = useState('dummyjson')
	const [externalQuery, setExternalQuery] = useState('')
	const [externalProducts, setExternalProducts] = useState<ProviderProduct[]>([])
	const [externalSelected, setExternalSelected] = useState<string[]>([])
	const [externalLoading, setExternalLoading] = useState(false)
	const [importing, setImporting] = useState(false)
 	const [confirmImport, setConfirmImport] = useState(false)
	const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
	const [history, setHistory] = useState<ImportHistory[]>([])
	const [catalogSearch, setCatalogSearch] = useState('')
	const [catalogCategory, setCatalogCategory] = useState('')
	const [catalogBrand, setCatalogBrand] = useState('')
	const [catalogStatus, setCatalogStatus] = useState('')
	const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
	const [editingProduct, setEditingProduct] = useState<Product | null>(null)
	const [savingProduct, setSavingProduct] = useState(false)
	const [categories, setCategories] = useState<string[]>([])
	const [brands, setBrands] = useState<string[]>([])

	const load = async () => {
		try {
			const [productResponse, planResponse, summaryResponse, providerResponse, historyResponse] = await Promise.all([
				api.get('/admin/product-warehouse', { params: { limit: 100, search: catalogSearch, category: catalogCategory, brand: catalogBrand, status: catalogStatus } }),
				api.get('/admin/subscription-plans'),
				api.get('/admin/product-warehouse/summary'),
				api.get('/admin/product-warehouse/providers'),
				api.get('/admin/product-warehouse/import/history?limit=10'),
			])

			const normalizedProducts = normalizeList<Product>(productResponse.data)
			const normalizedPlans = normalizeList<Plan>(planResponse.data)

			setProducts(
				normalizedProducts.map((product) => ({
					...product,
					basePrice: Number(product.basePrice ?? 0),
					stock: Number(product.stock ?? 0),
				})),
			)

			setPlans(
				normalizedPlans.map((plan) => ({
					id: String(plan.id ?? plan.name ?? 'plan'),
					name: String(plan.name ?? 'Plan'),
					price: Number(plan.price ?? 0),
					productLimit: Number(plan.productLimit ?? 0),
					duration: Number(plan.duration ?? 30),
					status: String(plan.status ?? 'ACTIVE'),
				})),
			)
			setSummary(summaryResponse.data)
			setProviders(providerResponse.data)
			setHistory(historyResponse.data || [])
			setCategories(Array.from(new Set(normalizedProducts.map((product) => product.category).filter(Boolean) as string[])).sort())
			setBrands(Array.from(new Set(normalizedProducts.map((product) => product.brand).filter(Boolean) as string[])).sort())
			if (!provider && providerResponse.data[0]?.id) setProvider(providerResponse.data[0].id)

			setError('')
		} catch {
			setError('Unable to load warehouse management data.')
		}
	}

	const searchExternal = async (event?: FormEvent) => {
		event?.preventDefault()
		setExternalLoading(true)
		setError('')
		try {
			const response = await api.get('/admin/product-warehouse/import/search', { params: { provider, query: externalQuery, page: 1, limit: 24 } })
			setExternalProducts(response.data.items || [])
			setExternalSelected([])
		} catch {
			setError('Unable to search the selected product provider.')
		} finally {
			setExternalLoading(false)
		}
	}

	const importExternal = async () => {
		if (!externalSelected.length || importing) return
		setImporting(true)
		setError('')
		try {
			const response = await api.post('/admin/product-warehouse/import', { provider, externalIds: externalSelected })
			const result = response.data as { createdCount: number; updatedCount: number; failedCount: number }
			setExternalSelected([])
			setExternalProducts([])
			setError(result.failedCount ? `${result.createdCount} created, ${result.updatedCount} updated, ${result.failedCount} failed.` : `${result.createdCount} created and ${result.updatedCount} updated successfully.`)
			await load()
		} catch {
			setError('Unable to import the selected products.')
		} finally {
			setImporting(false)
		}
	}

	useEffect(() => {
		void load()
	}, [catalogSearch, catalogCategory, catalogBrand, catalogStatus])

	const createProduct = async (event: FormEvent) => {
		event.preventDefault()
		setError('')

		try {
			await api.post('/admin/product-warehouse', {
				...form,
				basePrice: Number(form.basePrice),
				stock: Number(form.stock),
				status: 'PUBLISHED',
			})

			setForm({ name: '', sku: '', category: '', brand: '', basePrice: '', stock: '' })
			await load()
		} catch {
			setError('Unable to create warehouse product.')
		}
	}

	const toggle = async (product: Product) => {
		try {
			await api.patch(`/admin/product-warehouse/${product.id}`, {
				status: product.status === 'PUBLISHED' ? 'INACTIVE' : 'PUBLISHED',
			})
			await load()
		} catch {
			setError('Unable to update warehouse product status.')
		}
	}

	const updateProduct = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!editingProduct || savingProduct) return
		setSavingProduct(true)
		setError('')
		const formData = new FormData(event.currentTarget)
		try {
			const parseJsonField = (name: string, fallback: unknown) => {
				const value = String(formData.get(name) || '').trim()
				if (!value) return fallback
				const parsed = JSON.parse(value)
				if (!Array.isArray(parsed)) throw new Error(`${name} must be an array`)
				return parsed
			}
			await api.patch(`/admin/product-warehouse/${editingProduct.id}`, {
				name: String(formData.get('name') || '').trim(),
				sku: String(formData.get('sku') || '').trim(),
				description: String(formData.get('description') || '').trim() || null,
				category: String(formData.get('category') || '').trim() || null,
				brand: String(formData.get('brand') || '').trim() || null,
				basePrice: Number(formData.get('basePrice') || 0),
				stock: Number(formData.get('stock') || 0),
				status: String(formData.get('status') || 'PUBLISHED'),
				images: parseJsonField('images', editingProduct.images || []),
				attributes: parseJsonField('attributes', editingProduct.attributes || []),
				variants: parseJsonField('variants', editingProduct.variants || []),
			})
			setEditingProduct(null)
			await load()
		} catch (updateError) {
			setError(updateError instanceof SyntaxError ? 'Images, attributes, and variants must be valid JSON arrays.' : 'Unable to update warehouse product.')
		} finally {
			setSavingProduct(false)
		}
	}

	const remove = async (id: string) => {
		try {
			await api.delete(`/admin/product-warehouse/${id}`)
			await load()
		} catch {
			setError('Unable to delete warehouse product.')
		}
		setPendingDelete(null)
	}

	return (
		<AdminLayout>
			<div className="space-y-6 p-1 sm:p-2 lg:p-3">
				<header className="rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Catalog operations</p>
							<h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Product Warehouse</h1>
							<p className="mt-2 text-sm text-slate-600">Manage the approved catalog sellers can add to their storefronts.</p>
						</div>
					</div>
				</header>

				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
					{[['Total warehouse products', summary?.total ?? 0], ['Active products', summary?.active ?? 0], ['Imported today', summary?.importedToday ?? 0], ['Providers', summary?.providers ?? 0], ['Failed imports', summary?.failedImports ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value}</p></div>)}
				</section>

				<section className="rounded-[26px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Provider import</p><h2 className="mt-2 text-xl font-semibold">Search approved external catalogs</h2><p className="mt-1 text-sm text-slate-300">Products are normalized and stored in Vendora before sellers can see them.</p></div>
						<div className="flex flex-wrap gap-2"><select value={provider} onChange={(event) => setProvider(event.target.value)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white"><option className="text-slate-900" value="">Select provider</option>{providers.map((item) => <option className="text-slate-900" key={item.id} value={item.id}>{item.label}</option>)}</select><form onSubmit={(event) => void searchExternal(event)} className="flex min-w-[280px] flex-1 gap-2"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3"><Search size={16} className="shrink-0 text-slate-300" /><input value={externalQuery} onChange={(event) => setExternalQuery(event.target.value)} placeholder="Search provider products..." className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-400" /></div><button type="submit" disabled={externalLoading || !provider} className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{externalLoading ? 'Searching...' : 'Search'}</button></form></div>
					</div>
					{externalProducts.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{externalProducts.map((product) => { const selected = externalSelected.includes(product.externalProductId); return <button type="button" key={product.externalProductId} onClick={() => setExternalSelected((current) => selected ? current.filter((id) => id !== product.externalProductId) : [...current, product.externalProductId])} className={`rounded-2xl border p-3 text-left transition ${selected ? 'border-sky-300 bg-sky-400/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><div className="flex items-start justify-between gap-3"><span className="line-clamp-2 text-sm font-semibold">{product.name}</span>{selected ? <CheckCircle2 size={18} className="shrink-0 text-sky-300" /> : null}</div>{product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" /> : null}<p className="mt-2 text-xs text-slate-300">{product.brand || 'Unbranded'} · {product.category || 'Uncategorized'}</p><p className="mt-2 font-semibold">${Number(product.basePrice || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">· stock {product.stock}</span></p><p className="mt-2 line-clamp-2 text-xs text-slate-400">{product.description || 'No description available.'}</p><p className="mt-2 text-[11px] text-slate-400">{product.attributes?.length || 0} attributes · {product.variants?.length || 0} variants</p></button> })}</div> : null}
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-400">{externalSelected.length} selected · batches are limited to 50 products</span><button type="button" onClick={() => setConfirmImport(true)} disabled={!externalSelected.length || importing} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"><Download size={16} />{importing ? 'Importing...' : 'Import selected'}</button></div>
				</section>

				{error ? (
					<div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
				) : null}

				<div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
					<form onSubmit={createProduct} className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
						<div className="mb-5">
							<h2 className="text-xl font-semibold text-slate-900">Create warehouse product</h2>
							<p className="mt-1 text-sm text-slate-500">Add catalog items that sellers can later select.</p>
						</div>

						<div className="space-y-3">
							{(['name', 'sku', 'category', 'brand', 'basePrice', 'stock'] as const).map((field) => (
								<label key={field} className="block">
									<span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
										{field === 'basePrice' ? 'Base price' : field === 'stock' ? 'Stock' : field}
									</span>
									<input
										required={field === 'name' || field === 'sku' || field === 'basePrice'}
										value={form[field]}
										onChange={(event) => setForm({ ...form, [field]: event.target.value })}
										type={field === 'basePrice' || field === 'stock' ? 'number' : 'text'}
										placeholder={field === 'basePrice' ? '149.99' : field === 'stock' ? '100' : ''}
										className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
									/>
								</label>
							))}
						</div>

															<button
							type="submit"
							className="mt-5 w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800"
						>
							Create Product
						</button>
					</form>

					<section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
						<div className="mb-5 flex items-center justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold text-slate-900">Warehouse catalog</h2>
								<p className="mt-1 text-sm text-slate-500">Approved products available for seller activation.</p>
							</div>
							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
								{products.length} items
							</span>
						</div>
						<div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<label className="sm:col-span-2 xl:col-span-1"><span className="sr-only">Search warehouse catalog</span><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search name, SKU, barcode" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
							<select value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
							<select value={catalogBrand} onChange={(event) => setCatalogBrand(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</select>
							<select value={catalogStatus} onChange={(event) => setCatalogStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="PUBLISHED">Published</option><option value="INACTIVE">Inactive</option><option value="ARCHIVED">Archived</option></select>
						</div>

						<div className="overflow-x-auto">
							<table className="min-w-full text-left text-sm text-slate-700">
								<thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
									<tr>
										<th className="px-4 py-3 font-semibold">Product</th>
										<th className="px-4 py-3 font-semibold">SKU</th>
										<th className="px-4 py-3 font-semibold">Source / External ID</th>
										<th className="px-4 py-3 font-semibold">Category / Brand</th>
										<th className="px-4 py-3 font-semibold">Price</th>
										<th className="px-4 py-3 font-semibold">Stock</th>
										<th className="px-4 py-3 font-semibold">Status</th>
										<th className="px-4 py-3 font-semibold">Actions</th>
									</tr>
								</thead>
								<tbody>
									{products.length ? (
										products.map((product) => (
													<tr key={product.id} className="border-b border-slate-100 align-top transition hover:bg-slate-50/70">
												<td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
												<td className="px-4 py-3 text-slate-500">{product.sku}</td>
													<td className="px-4 py-3 text-xs text-slate-500"><div className="font-semibold text-slate-700">{product.sourceId || 'manual'}</div><div>{product.externalProductId || '—'}</div></td>
													<td className="px-4 py-3 text-xs text-slate-500"><div>{product.category || 'Uncategorized'}</div><div>{product.brand || 'Unbranded'}</div></td>
												<td className="px-4 py-3">${Number(product.basePrice ?? 0).toFixed(2)}</td>
												<td className="px-4 py-3">{product.stock}</td>
												<td className="px-4 py-3">
													<span
														className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
															product.status === 'PUBLISHED'
																? 'bg-emerald-100 text-emerald-700'
																: 'bg-slate-100 text-slate-600'
														}`}
													>
														{product.status}
													</span>
												</td>
												<td className="px-4 py-3">
													<div className="flex flex-wrap gap-2">
															<button type="button" onClick={() => setPreviewProduct(product)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"><Eye size={14} /> Preview</button>
															<button type="button" onClick={() => setEditingProduct(product)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"><Pencil size={14} /> Edit</button>
														<button
															type="button"
															onClick={() => void toggle(product)}
															className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
														>
															{product.status === 'PUBLISHED' ? 'Deactivate' : 'Activate'}
														</button>
														<button
															type="button"
																	onClick={() => setPendingDelete(product)}
															className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
														>
																	<Trash2 size={14} /> Delete
														</button>
													</div>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
												No warehouse products available yet.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>
				</div>

				{plans.length ? (
					<section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
						<div className="mb-4">
							<h2 className="text-xl font-semibold text-slate-900">Subscription plans</h2>
							<p className="mt-1 text-sm text-slate-500">Seller limits and upgrade options for warehouse access.</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
							{plans.map((plan) => (
								<div key={plan.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
									<div className="text-sm font-semibold text-slate-900">{plan.name}</div>
									<div className="mt-3 text-3xl font-semibold text-slate-900">${plan.price}</div>
									<div className="mt-2 text-sm text-slate-500">
										{plan.productLimit < 0 ? 'Unlimited' : `${plan.productLimit} products`} • {plan.duration} days
									</div>
									<div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
										{plan.status}
									</div>
								</div>
							))}
						</div>
					</section>
				) : null}

				<section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
					<div className="mb-4"><h2 className="text-xl font-semibold text-slate-900">Import history</h2><p className="mt-1 text-sm text-slate-500">Recent provider batches and their normalized results.</p></div>
					<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2">Failed</th><th className="px-3 py-2">Started</th></tr></thead><tbody>{history.length ? history.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="px-3 py-3 font-semibold text-slate-800">{item.providerId}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.failedCount ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status}</span></td><td className="px-3 py-3 text-emerald-700">{item.createdCount}</td><td className="px-3 py-3 text-sky-700">{item.updatedCount}</td><td className="px-3 py-3 text-rose-700">{item.failedCount}</td><td className="px-3 py-3 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td></tr>) : <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">No provider imports recorded yet.</td></tr>}</tbody></table></div>
				</section>

				{confirmImport ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Confirm warehouse import</h2><p className="mt-2 text-sm text-slate-600">Import {externalSelected.length} normalized product{externalSelected.length === 1 ? '' : 's'} from {provider}. Existing source/external ID matches will be updated, not duplicated.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmImport(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={externalSelected.length > 50 || importing} onClick={() => { setConfirmImport(false); void importExternal(); }} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Confirm import</button></div></div></div> : null}

				{previewProduct ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Warehouse preview</p><h2 className="mt-1 text-xl font-bold text-slate-900">{previewProduct.name}</h2><p className="mt-1 text-sm text-slate-500">{previewProduct.sourceId || 'manual'} · {previewProduct.externalProductId || previewProduct.sku}</p></div><button type="button" onClick={() => setPreviewProduct(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close preview"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Catalog data</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">SKU</dt><dd className="font-semibold text-slate-800">{previewProduct.sku}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Category</dt><dd>{previewProduct.category || '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Brand</dt><dd>{previewProduct.brand || '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Price</dt><dd>${Number(previewProduct.basePrice || 0).toFixed(2)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Stock</dt><dd>{previewProduct.stock}</dd></div></dl></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Normalized details</p><p className="mt-3 text-sm text-slate-600">{previewProduct.description || 'No description available.'}</p><p className="mt-3 text-xs text-slate-500">Attributes: {previewProduct.attributes?.map((item) => `${item.name}: ${item.value}`).join(', ') || 'None'}</p><p className="mt-2 text-xs text-slate-500">Variants: {previewProduct.variants?.map((item) => `${item.name} (${item.options.join(', ')})`).join('; ') || 'None'}</p></div></div>{previewProduct.images?.length ? <div className="mt-4 grid grid-cols-3 gap-2">{previewProduct.images.map((image) => <img key={image} src={image} alt={previewProduct.name} className="aspect-square w-full rounded-xl object-cover" />)}</div> : null}</div></div> : null}

					{editingProduct ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={(event) => void updateProduct(event)} role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Warehouse product</p><h2 className="mt-1 text-xl font-bold text-slate-900">Update catalog record</h2></div><button type="button" onClick={() => setEditingProduct(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close editor"><X size={18} /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name</span><input name="name" defaultValue={editingProduct.name} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">SKU</span><input name="sku" defaultValue={editingProduct.sku} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</span><select name="status" defaultValue={editingProduct.status} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="PUBLISHED">Published</option><option value="INACTIVE">Inactive</option><option value="ARCHIVED">Archived</option></select></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category</span><input name="category" defaultValue={editingProduct.category || ''} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Brand</span><input name="brand" defaultValue={editingProduct.brand || ''} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Base price</span><input name="basePrice" type="number" min="0" step="0.01" defaultValue={editingProduct.basePrice} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Stock</span><input name="stock" type="number" min="0" step="1" defaultValue={editingProduct.stock} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Description</span><textarea name="description" defaultValue={editingProduct.description || ''} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Images JSON array</span><textarea name="images" defaultValue={JSON.stringify(editingProduct.images || [], null, 2)} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Attributes JSON</span><textarea name="attributes" defaultValue={JSON.stringify(editingProduct.attributes || [], null, 2)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs" /></label><label><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Variants JSON</span><textarea name="variants" defaultValue={JSON.stringify(editingProduct.variants || [], null, 2)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditingProduct(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={savingProduct} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingProduct ? 'Saving...' : 'Save changes'}</button></div></form></div> : null}

				{pendingDelete ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Delete warehouse product?</h2><p className="mt-2 text-sm text-slate-600">This is allowed only when no seller assignments reference <strong>{pendingDelete.name}</strong>. Assigned products should be deactivated instead.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void remove(pendingDelete.id)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete</button></div></div></div> : null}
			</div>
		</AdminLayout>
	)
}
