import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AddToCartButton, DiscountBadge, PriceDisplay, RatingStars, StockBadge, WishlistButton } from '@/components/ui/DesignSystem'

type ProductCardProps = {
  product: {
    id?: string
    slug?: string
    name: string
    price: number
    oldPrice?: number
    discountPercent?: number
    shop?: string
    seller?: string
    badge?: string
    rating?: number
    reviewCount?: number
    inStock?: boolean
    category?: string
    imageUrl?: string
    hoverImageUrl?: string
    quickView?: boolean
    stockStatus?: string
    flashSale?: boolean
    isNew?: boolean
    isFeatured?: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const [imageLoading, setImageLoading] = useState(Boolean(product.imageUrl))
  const [isHovered, setIsHovered] = useState(false)

  const currentPrice = Number(product.price)
  const oldPrice = Number(product.oldPrice ?? currentPrice)
  const discountPercent = product.discountPercent ?? Math.max(0, Math.round(((oldPrice - currentPrice) / Math.max(oldPrice, 1)) * 100))
  const reviewCount = product.reviewCount ?? 0
  const badgeText = product.badge || (product.flashSale ? 'Flash sale' : product.isNew ? 'New' : product.isFeatured ? 'Featured' : undefined)
  const sellerName = product.shop || product.seller || 'Vendora seller'
  const productId = product.id ?? product.slug ?? product.name
  const productHref = product.id ? `/products/${product.id}` : product.slug ? `/products/${product.slug}` : '/products'

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative">
        <Link to={productHref} className="block">
          <div
            className="relative aspect-[4/3] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50"
          >
            {product.imageUrl && !imageFailed ? (
              <>
                {imageLoading && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-label="Loading product image" />}
                <img
                  src={isHovered && product.hoverImageUrl ? product.hoverImageUrl : product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  onLoad={() => setImageLoading(false)}
                  onError={() => { setImageLoading(false); setImageFailed(true) }}
                  className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Image unavailable</div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <DiscountBadge percent={discountPercent} />
              {badgeText && (
                <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  {badgeText}
                </span>
              )}
            </div>

            <div className="absolute right-3 top-3 flex gap-2">
              <WishlistButton productId={productId} />
            </div>

          </div>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex min-h-7 items-start justify-between gap-2">
          <span className="max-w-[62%] truncate rounded-full bg-orange-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#d97706]">
            {product.category || 'Category unavailable'}
          </span>
          <span className="shrink-0"><StockBadge inStock={product.inStock} label={product.stockStatus} /></span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{sellerName}</p>
          <Link to={productHref} className="mt-1 block min-h-[3.25rem] line-clamp-2 text-lg font-bold leading-snug text-slate-900 hover:text-[#1f2d4d] sm:text-xl">
            {product.name}
          </Link>
        </div>

        <div className="min-h-6"><RatingStars rating={product.rating} reviewCount={reviewCount} /></div>

        <div className="min-h-9"><PriceDisplay price={currentPrice} oldPrice={oldPrice > currentPrice ? oldPrice : undefined} /></div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <AddToCartButton product={{ id: productId, name: product.name, price: currentPrice, shop: sellerName, imageUrl: product.imageUrl, inStock: product.inStock }} className="flex-1" />
        </div>
      </div>
    </article>
  )
}
