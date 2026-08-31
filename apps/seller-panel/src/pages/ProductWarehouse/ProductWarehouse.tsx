import { useEffect, useMemo, useState } from 'react'
import { addWarehouseProducts, getSellerState, getWarehouseProducts, type SellerState, type WarehouseProduct } from '../../services/product-warehouse.service'
import { SellerSidebar } from '../../components/sidebar/SellerSidebar'

type LimitError = { currentCount: number; productLimit: number; requestedCount: number; remainingSlots: number }

export function ProductWarehouse() {
  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [selected, setSelected] = useState<WarehouseProduct[]>([])
  const [state, setState] = useState<SellerState | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [limitError, setLimitError] = useState<LimitError | null>(null)

  useEffect(() => {
    void getSellerState().then(setState).catch(() => setMessage('Unable to load your package information.'))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      void getWarehouseProducts({ page, limit: 24, search, category, brand, stockStatus, sort })
        .then((data) => {
          setProducts(data.items)
          setTotalPages(data.totalPages)
          setCategories(data.categories)
          setBrands(data.brands)
          setMessage('')
        })
        .catch(() => setMessage('Unable to load warehouse products.'))
        .finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [page, search, category, brand, stockStatus, sort])

  const selectedIds = useMemo(() => new Set(selected.map((product) => product.id)), [selected])
  const toggleProduct = (product: WarehouseProduct) => {
    if (product.stock <= 0) return
    setSelected((current) => selectedIds.has(product.id) ? current.filter((item) => item.id !== product.id) : [...current, product])
  }

  const submit = async () => {
    if (!selected.length || submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await addWarehouseProducts(selected.map((product) => product.id))
      if (result.code === 'PRODUCT_LIMIT_EXCEEDED') {
        setLimitError({ currentCount: result.currentCount || 0, productLimit: result.productLimit || 0, requestedCount: result.requestedCount || selected.length, remainingSlots: result.remainingSlots || 0 })
        return
      }
      if (result.code === 'PRODUCT_ALREADY_ADDED') {
        setMessage('Product already added to your shop.')
        return
      }
      if (!result.success) throw new Error(result.message)
      setMessage(result.message || 'Products added successfully.')
      setSelected([])
      void getSellerState().then(setState)
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to add products.')
    } finally {
      setSubmitting(false)
    }
  }

  const addAll = () => setSelected((current) => [...current, ...products.filter((product) => product.stock > 0 && !selectedIds.has(product.id))])
  const usage = state?.plan.productLimit && state.plan.productLimit > 0 ? Math.min(100, (state.currentCount / state.plan.productLimit) * 100) : 0

  return (
    <div className="min-h-screen bg-[#edf2f8] p-2 text-slate-800 md:p-4">
      <div className="mx-auto flex max-w-[1500px] overflow-hidden border border-slate-200 bg-[#edf2f8] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <SellerSidebar />
        <div className="min-w-0 flex-1 bg-[#f3f5fa]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <h1 className="text-base font-semibold">Product Warehouse</h1>
            {state ? <div className="text-right text-xs text-slate-500"><div>Current Plan: <span className="font-semibold text-slate-700">{state.plan.name}</span></div><div>{state.currentCount} / {state.plan.productLimit < 0 ? 'Unlimited' : state.plan.productLimit} products</div></div> : null}
          </header>
          <main className="space-y-4 p-4 md:p-6">
            {state && state.plan.productLimit > 0 ? <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="mb-2 flex justify-between text-xs text-slate-600"><span>Product limit usage</span><span>{usage.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${usage >= 80 ? 'bg-amber-500' : 'bg-[#2d80d8]'}`} style={{ width: `${usage}%` }} /></div>{usage >= 80 ? <p className="mt-2 text-xs text-amber-700">You are close to your product limit.</p> : null}</div> : null}
            {message ? <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div> : null}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_170px_150px_170px]"><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by Product Name/Barcode" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2d80d8]" /><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }} className="rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="">All Categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={brand} onChange={(event) => { setBrand(event.target.value); setPage(1) }} className="rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="">All Brands</option>{brands.map((item) => <option key={item}>{item}</option>)}</select><select value={stockStatus} onChange={(event) => { setStockStatus(event.target.value); setPage(1) }} className="rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="">Any Stock</option><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className="rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="price_low">Price low to high</option><option value="price_high">Price high to low</option></select></div>
                {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="animate-pulse rounded-md border border-slate-200 p-2"><div className="aspect-square rounded bg-slate-100" /><div className="mt-3 h-4 rounded bg-slate-100" /><div className="mt-2 h-3 w-1/2 rounded bg-slate-100" /></div>)}</div> : products.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => { const isSelected = selectedIds.has(product.id); return <button type="button" key={product.id} disabled={product.stock <= 0} onClick={() => toggleProduct(product)} className={`relative overflow-hidden rounded-md border p-2 text-left transition ${isSelected ? 'border-[#2d80d8] bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'} ${product.stock <= 0 ? 'cursor-not-allowed opacity-60' : ''}`}><div className={`absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${product.stock > 0 ? 'bg-emerald-600' : 'bg-red-500'}`}>{product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}</div>{isSelected ? <span className="absolute right-2 top-2 z-10 rounded-full bg-[#2d80d8] px-2 py-1 text-xs font-bold text-white">✓</span> : null}<div className="aspect-square bg-slate-50"><img src={product.images[0]} alt="" className="h-full w-full object-cover" /></div><div className="p-2"><div className="line-clamp-2 text-sm font-semibold text-slate-800">{product.name}</div><div className="mt-2 text-sm font-medium">${product.basePrice.toFixed(2)}</div><div className="text-xs text-emerald-700">Profit: ${product.sellerMargin.toFixed(2)}</div></div></button> })}</div> : <div className="rounded-md border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">No products found</div>}
                <div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {Math.max(1, totalPages)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
              </section>
              <aside className="flex min-h-[360px] flex-col rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="font-semibold">Selected Products</h2><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{selected.length}</span></div><div className="flex-1 divide-y divide-slate-100 overflow-auto">{selected.length ? selected.map((product) => <div key={product.id} className="flex items-center gap-3 py-3"><img src={product.images[0]} alt="" className="h-12 w-12 rounded object-cover" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{product.name}</div><div className="text-xs text-slate-500">${product.basePrice.toFixed(2)}</div></div><button type="button" onClick={() => setSelected((current) => current.filter((item) => item.id !== product.id))} className="text-xs text-red-600 hover:underline">Remove</button></div>) : <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center text-sm text-slate-500"><p className="font-medium text-slate-700">No products selected yet.</p><p className="mt-1">Select products from the warehouse to add them to your shop.</p></div>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><button type="button" onClick={addAll} disabled={loading || !products.length} className="rounded-md border border-[#2d80d8] px-3 py-2 text-sm font-medium text-[#2d80d8] disabled:opacity-40">Add all to My Product</button><button type="button" onClick={() => void submit()} disabled={!selected.length || submitting} className="rounded-md bg-[#2d80d8] px-3 py-2 text-sm font-medium text-white disabled:opacity-40">{submitting ? 'Adding products...' : 'Add to My Product'}</button></div></aside>
            </div>
          </main>
        </div>
      </div>
      {limitError ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Product Limit Reached</h2><p className="mt-2 text-sm text-slate-600">Your current <strong>{state?.plan.name || 'plan'}</strong> allows up to {limitError.productLimit} products.</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded bg-slate-50 p-3"><div className="text-slate-500">Current products</div><strong>{limitError.currentCount} / {limitError.productLimit}</strong></div><div className="rounded bg-slate-50 p-3"><div className="text-slate-500">Trying to add</div><strong>{limitError.requestedCount}</strong></div></div><p className="mt-4 text-sm text-slate-600">You can only add <strong>{limitError.remainingSlots}</strong> more products. Upgrade your plan to add more.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setLimitError(null)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Cancel</button><button type="button" onClick={() => setLimitError(null)} className="rounded-md bg-[#2d80d8] px-4 py-2 text-sm text-white">Upgrade Plan</button></div></div></div> : null}
    </div>
  )
}
