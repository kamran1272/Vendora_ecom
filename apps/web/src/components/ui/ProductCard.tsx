import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'

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
    quickView?: boolean
    stockStatus?: string
    flashSale?: boolean
    isNew?: boolean
    isFeatured?: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const isSaved = useWishlistStore((state) => state.ids.includes(product.id ?? product.slug ?? product.name))

  const currentPrice = Number(product.price)
  const oldPrice = Number(product.oldPrice ?? currentPrice)
  const discountPercent = product.discountPercent ?? Math.max(0, Math.round(((oldPrice - currentPrice) / Math.max(oldPrice, 1)) * 100))
  const reviewCount = product.reviewCount ?? 0
  const badgeText = product.badge || (product.flashSale ? 'Flash sale' : product.isNew ? 'New' : product.isFeatured ? 'Featured' : 'Popular')
  const sellerName = product.shop || product.seller || 'Vendora seller'
  const productId = product.id ?? product.slug ?? product.name
  const productHref = product.id ? `/products/${product.id}` : product.slug ? `/products/${product.slug}` : '/products'

  return (
    <article className="group overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <Link to={productHref} className="block">
          <div
            className="relative h-52 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50"
            style={
              product.imageUrl
                ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          >
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {discountPercent > 0 && (
                <span className="rounded-full bg-[#f59a36] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                  -{discountPercent}%
                </span>
              )}
              {badgeText && (
                <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  {badgeText}
                </span>
              )}
            </div>

            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-lg shadow-sm transition hover:bg-white ${isSaved ? 'text-[#f59a36]' : 'text-slate-700'}`}
                aria-label="Add to wishlist"
                onClick={(event) => {
                  event.preventDefault()
                  toggleWishlist(productId)
                }}
              >
                {isSaved ? '♥' : '♡'}
              </button>
            </div>

            {product.quickView && (
              <div className="absolute inset-x-3 bottom-3">
                <button
                  type="button"
                  className="w-full rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
                >
                  Quick view
                </button>
              </div>
            )}
          </div>
        </Link>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#d97706]">
            {product.category || 'Featured'}
          </span>
          <span className={`text-xs font-semibold ${product.inStock === false ? 'text-red-500' : 'text-emerald-600'}`}>
            {product.stockStatus || (product.inStock === false ? 'Out of stock' : 'In stock')}
          </span>
        </div>

        <div>
          <p className="text-sm text-slate-500">{sellerName}</p>
          <Link to={productHref} className="mt-2 block text-xl font-bold leading-snug text-slate-900 hover:text-[#1f2d4d]">
            {product.name}
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-base text-[#f59a36]">★</span>
          <span className="font-semibold text-slate-800">{product.rating ?? 4.8}</span>
          <span>({reviewCount > 0 ? reviewCount : 128} reviews)</span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-2xl font-black text-[#1f2d4d]">${currentPrice}</span>
          {oldPrice > currentPrice && (
            <>
              <span className="text-base text-slate-400 line-through">${oldPrice}</span>
              <span className="text-sm font-semibold text-emerald-600">Save {discountPercent}%</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={product.inStock === false}
            onClick={() => addItem({
              id: productId,
              name: product.name,
              price: currentPrice,
              shop: sellerName,
              imageUrl: product.imageUrl,
              quantity: 1,
            })}
          >
            {product.inStock === false ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
