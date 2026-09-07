import { useEffect, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { AddToCartButton, DiscountBadge, PriceDisplay, RatingStars, StockBadge } from '@/components/ui/DesignSystem'
import { fetchMarketplaceProduct, type MarketplaceProduct } from '@/services/marketplace'
import { useWishlistStore } from '@/store/wishlist'
import { useCartStore } from '@/store/cart'
import { useToastStore } from '@/store/toast'

export function WishlistPage() {
  const ids = useWishlistStore((state) => state.ids)
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const addItem = useCartStore((state) => state.addItem)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const showToast = useToastStore((state) => state.show)

  const uniqueIds = [...new Set(ids)]

  useEffect(() => {
    let active = true
    if (!uniqueIds.length) {
      setProducts([])
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    setError(null)
    Promise.all(uniqueIds.map((id) => fetchMarketplaceProduct(id).catch(() => null)))
      .then((items) => {
        if (!active) return
        const uniqueProducts = [...new Map(items.filter(Boolean).map((item) => [item!.id, item!])).values()]
        setProducts(uniqueProducts)
      })
      .catch(() => {
        if (active) setError('We could not load your saved products.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [ids, reloadKey])

  const removeProduct = (id: string, announce = true) => {
    toggleWishlist(id)
    setProducts((current) => current.filter((product) => product.id !== id))
    if (announce) showToast({ tone: 'info', title: 'Removed from wishlist', message: 'The product was removed from your wishlist.' })
  }

  const moveToCart = async (product: MarketplaceProduct) => {
    if (movingId || product.inStock === false) return
    setMovingId(product.id)
    try {
      await addItem({ id: product.id, name: product.name, price: product.price, shop: product.shop || product.seller, imageUrl: product.images?.[0], quantity: 1 })
      removeProduct(product.id, false)
      showToast({ tone: 'success', title: 'Moved to cart', message: `${product.name} was added to your cart.` })
    } catch {
      setError('This product could not be added to your cart. Please try again.')
      showToast({ tone: 'error', title: 'Could not move item', message: 'Please try again.' })
    } finally {
      setMovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageShell title="Wishlist" description="Save products for later, remove items, or move available products to your cart." />
      {error && <ErrorState message="We could not load your saved products right now. Please try again." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
      {loading && <LoadingState />}
      {!loading && !error && products.length === 0 && <EmptyState title="Your wishlist is waiting for favorites" message="Save products while browsing and they will appear here." action={<Link to="/shop" className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Explore products</Link>} />}
      {!loading && products.length > 0 && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => {
        const oldPrice = product.oldPrice && product.oldPrice > product.price ? product.oldPrice : undefined
        const discount = oldPrice ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : 0
        const seller = product.shop || product.seller
        return <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative h-52 bg-slate-100">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Image unavailable</div>}<div className="absolute left-3 top-3"><DiscountBadge percent={discount} /></div></div><div className="space-y-3 p-5"><div className="flex items-center justify-between gap-2"><StockBadge inStock={product.inStock} /><span className="text-sm text-slate-500">{seller}</span></div><h2 className="text-lg font-bold text-slate-900">{product.name}</h2><RatingStars rating={product.rating} /><PriceDisplay price={product.price} oldPrice={oldPrice} /><div className="flex flex-wrap gap-2 pt-2"><AddToCartButton product={{ id: product.id, name: product.name, price: product.price, shop: seller, imageUrl: product.images?.[0], inStock: product.inStock }} className="flex-1" /><button type="button" onClick={() => void moveToCart(product)} disabled={movingId === product.id || product.inStock === false} className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{movingId === product.id ? 'Moving...' : 'Move to cart'}</button><button type="button" onClick={() => removeProduct(product.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Remove</button></div></div></article>
      })}</div>}
    </div>
  )
}
