import { useEffect, useState } from 'react'
import { SellerSidebar } from '../../components/sidebar/SellerSidebar'
import { getSellerProducts, type WarehouseProduct } from '../../services/product-warehouse.service'

export function Products() {
  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void getSellerProducts().then(setProducts).catch(() => setError('Unable to load your products.')).finally(() => setLoading(false))
  }, [])

  return <div className="min-h-screen bg-[#edf2f8] p-2 text-slate-800 md:p-4"><div className="mx-auto flex max-w-[1500px] overflow-hidden border border-slate-200 bg-[#edf2f8] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"><SellerSidebar /><main className="min-w-0 flex-1 bg-[#f3f5fa] p-6"><h1 className="text-xl font-semibold">My Products</h1><p className="mt-1 text-sm text-slate-500">Products connected to your shop from the central warehouse.</p>{error ? <div className="mt-4 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}{loading ? <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading products...</div> : products.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="aspect-square bg-slate-50"><img src={product.images[0]} alt="" className="h-full w-full object-cover" /></div><div className="p-4"><h2 className="line-clamp-2 font-medium">{product.name}</h2><p className="mt-2 text-sm text-slate-500">SKU: {product.sku}</p><div className="mt-3 flex justify-between text-sm"><span>${product.basePrice.toFixed(2)}</span><span className="text-slate-500">Stock: {product.stock}</span></div></div></article>)}</div> : <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No products have been added to your shop yet.</div>}</main></div></div>
}
