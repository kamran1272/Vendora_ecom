import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfoPanel, type ProductVariant } from '@/components/product/ProductInfoPanel'
import { RatingStars } from '@/components/ui/DesignSystem'
import { ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { ProductCard } from '@/components/ui/ProductCard'
import { fetchMarketplaceProduct, fetchMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace'
import { useCartStore } from '@/store/cart'

export function ProductDetailPage() {
  const { id, slug } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const productId = id ?? slug
  const [marketplaceProduct, setMarketplaceProduct] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<MarketplaceProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!productId) {
      setMarketplaceProduct(null)
      setLoadError('This product link is missing a product identifier.')
      setIsLoading(false)
      return () => { active = false }
    }

    setIsLoading(true)
    setLoadError(null)

    fetchMarketplaceProduct(productId)
      .then((product) => {
        if (active) {
          setMarketplaceProduct(product)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setMarketplaceProduct(null)
          setLoadError('We could not load this product. It may no longer be available.')
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [productId, reloadKey])

  useEffect(() => {
    const category = marketplaceProduct?.category
    if (!category) return

    let active = true
    fetchMarketplaceProducts({ category, limit: 8 })
      .then((response) => {
        if (active) setRelatedProducts(response.items.filter((item) => item.id !== productId).slice(0, 4))
      })
      .catch(() => {
        if (active) setRelatedProducts([])
      })

    return () => {
      active = false
    }
  }, [marketplaceProduct?.category, productId])

  const product = marketplaceProduct

  if (isLoading) {
    return <LoadingState variant="detail" />
  }

  if (loadError || !product) {
    return <ErrorState title="Product unavailable" message="We could not load this product right now. It may no longer be available." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />
  }

  const handleAddToCart = async (quantity: number, variant?: ProductVariant | null) => {
    await addItem({
      id: product.id,
      name: product.name,
      price: variant?.salePrice ?? variant?.price ?? product.price,
      shop: product.seller,
      variant: variant?.sku,
      stock: variant?.stock,
      quantity,
    })
  }

  const handlePurchase = async (quantity: number, variant?: ProductVariant | null) => {
    await handleAddToCart(quantity, variant)
    navigate('/checkout')
  }

  const specifications = product.specifications && typeof product.specifications === 'object' ? Object.entries(product.specifications) : []
  const questions = Array.isArray(product.questions) ? product.questions : []
  const reviews = Array.isArray(product.reviews) ? product.reviews : []

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Home</Link>
        <span>/</span>
        <Link to="/categories" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Categories</Link>
        <span>/</span>
        <Link to={`/category/${product.category.toLowerCase()}`} className="font-medium text-slate-600 hover:text-[#1f2d4d]">{product.category}</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ProductGallery title={product.name} images={product.images} />
        <ProductInfoPanel
          product={{
            name: product.name,
            rating: product.rating,
            reviewCount: product.reviewCount,
            price: product.price,
            oldPrice: product.oldPrice,
            discountPercent: product.discountPercent,
            stockStatus: product.stockStatus,
            inStock: product.inStock,
            seller: product.seller,
            stock: product.stock,
            description: product.description,
            shortSummary: product.shortSummary,
            variants: product.variants,
            variantGroups: product.variantGroups
          }}
          onAddToCart={handleAddToCart}
          onBuyNow={(quantity, variant) => handlePurchase(quantity, variant)}
          wishlistId={product.id}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {product.description && <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Product overview</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{product.description}</p>
          </section>}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Specifications</p>
            {specifications.length > 0 ? <div className="mt-5 grid gap-3 md:grid-cols-2">{specifications.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-base font-semibold text-slate-800">{String(value)}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No specifications have been provided for this product.</p>}
          </section>

          {(product.shippingInfo || product.returnPolicy) && <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipping & Returns</p><div className="mt-4 grid gap-4 md:grid-cols-2">{product.shippingInfo && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">Shipping</p><p className="mt-2 text-sm text-slate-600">{String(product.shippingInfo)}</p></div>}{product.returnPolicy && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">Returns</p><p className="mt-2 text-sm text-slate-600">{String(product.returnPolicy)}</p></div>}</div></section>}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reviews</p>
            <div className="mt-4"><RatingStars rating={product.rating} reviewCount={product.reviewCount} /></div>
            {reviews.length > 0 ? <div className="mt-5 space-y-3">{reviews.map((review: any, index: number) => <article key={review.id || index} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{review.customer?.name || review.customerName || 'Customer'}</span><RatingStars rating={review.rating} /></div><p className="mt-2 text-sm text-slate-600">{review.comment || review.text || 'No written review.'}</p></article>)}</div> : <p className="mt-4 text-sm text-slate-500">No written reviews are available for this product yet.</p>}
          </section>

          {questions.length > 0 && <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Questions & Answers</p>
            <div className="mt-4 space-y-4">{questions.map((item: any, index: number) => <div key={item.id || index} className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Q: {item.question || item.text}</p>{(item.answer || item.response) && <p className="mt-2 text-slate-600">A: {item.answer || item.response}</p>}</div>)}</div>
          </section>}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Seller information</p>
            <h3 className="mt-4 text-xl font-black text-slate-900">{product.seller}</h3>
            {product.sellerRating && <div className="mt-2"><RatingStars rating={product.sellerRating} /></div>}
            {product.sellerDescription && <p className="mt-3 text-sm leading-6 text-slate-600">{product.sellerDescription}</p>}
          </section>

        </div>
      </div>

      {relatedProducts.length > 0 && <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Related products</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">You may also like</h2>
          </div>
          <Link to="/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View more</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={{ id: item.id, slug: item.slug, name: item.name, price: item.price, oldPrice: item.oldPrice, shop: item.shop, badge: item.badge, rating: item.rating, inStock: item.inStock, category: item.category, imageUrl: item.images?.[0], hoverImageUrl: item.images?.[1], stockStatus: item.inStock ? 'In stock' : 'Sold out' }}
            />
          ))}
        </div>
      </section>}

    </div>
  )
}
