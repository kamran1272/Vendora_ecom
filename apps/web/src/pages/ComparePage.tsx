import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { fetchMarketplaceProduct, type MarketplaceProduct } from '@/services/marketplace'
import { useWishlistStore } from '@/store/wishlist'

export function ComparePage() {
  const ids = useWishlistStore((state) => state.ids)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const compareIds = useMemo(() => ids.slice(0, 4), [ids])

  useEffect(() => {
    let active = true
    if (!compareIds.length) { setProducts([]); setLoading(false); return () => { active = false } }
    setLoading(true)
    Promise.all(compareIds.map((id) => fetchMarketplaceProduct(id).catch(() => null))).then((items) => {
      if (active) setProducts(items.filter(Boolean) as MarketplaceProduct[])
    }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [compareIds])

  return <div className="space-y-6"><PageShell title="Compare products" description="Compare saved products side by side before choosing what to buy." />{loading ? <LoadingState /> : error ? <ErrorState title="Comparison unavailable" message="We could not load your saved products." /> : !products.length ? <EmptyState title="Nothing to compare yet" message="Save products from the shop first, then compare up to four of them here." action={<Link to="/shop" className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Browse products</Link>} /> : <Card className="overflow-x-auto p-4"><div className="grid min-w-[640px] gap-3" style={{ gridTemplateColumns: `180px repeat(${products.length}, minmax(150px, 1fr))` }}>{[['Product', ...products.map((product) => product.name)], ['Price', ...products.map((product) => `$${product.price.toFixed(2)}`)], ['Seller', ...products.map((product) => product.shop || product.seller)], ['Rating', ...products.map((product) => `${product.rating.toFixed(1)} / 5`)], ['Availability', ...products.map((product) => product.inStock ? 'In stock' : 'Out of stock')]].map(([label, ...values]) => <div key={String(label)} className="contents"><div className="border-b border-slate-200 p-3 text-sm font-bold text-slate-700">{label}</div>{values.map((value, index) => <div key={`${label}-${index}`} className="border-b border-slate-200 p-3 text-sm text-slate-600">{value}</div>)}</div>)}</div></Card>}</div>
}
