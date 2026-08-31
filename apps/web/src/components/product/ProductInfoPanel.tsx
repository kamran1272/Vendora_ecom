import { useMemo, useState } from 'react'
import { ProductVariantSelector, type ProductVariantGroup } from '@/components/product/ProductVariantSelector'

export type ProductVariant = {
  sku: string
  price: number
  salePrice?: number
  stock: number
  image: string
  weight: string
  dimensions: string
  attributes: Record<string, string>
}

type ProductInfoPanelProps = {
  product: {
    name: string
    rating: number
    reviewCount: number
    price: number
    oldPrice?: number
    discountPercent?: number
    stockStatus: string
    inStock: boolean
    seller: string
    description: string
    shortSummary?: string
    variants?: ProductVariant[]
    variantGroups?: ProductVariantGroup[]
  }
}

export function ProductInfoPanel({ product }: ProductInfoPanelProps) {
  const discountPercent = product.discountPercent ?? Math.max(0, Math.round(((product.oldPrice ?? product.price) - product.price) / (product.oldPrice ?? product.price) * 100))

  const variantGroups = product.variantGroups ?? [
    { name: 'Color', values: ['Black', 'White', 'Red'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] }
  ]

  const defaultSelection = useMemo(
    () => Object.fromEntries(variantGroups.map((group) => [group.name, group.values[0]])),
    [variantGroups]
  )

  const [selected, setSelected] = useState<Record<string, string>>(defaultSelection)

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null

    return product.variants.find((variant) =>
      Object.entries(selected).every(([key, value]) => variant.attributes[key] === value)
    ) ?? product.variants[0]
  }, [product.variants, selected])

  const currentPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? product.price
  const currentStock = selectedVariant?.stock ?? (product.inStock ? 42 : 0)
  const currentSku = selectedVariant?.sku ?? 'N/A'
  const currentDimensions = selectedVariant?.dimensions ?? '—'
  const currentWeight = selectedVariant?.weight ?? '—'

  const handleVariantSelect = (groupName: string, value: string) => {
    setSelected((previous) => ({ ...previous, [groupName]: value }))
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-[#d97706]">Featured</span>
        <span>{product.stockStatus}</span>
      </div>

      <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">{product.name}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-[#f59a36]">★</span>
          <span className="font-semibold text-slate-900">{product.rating.toFixed(1)}</span>
        </div>
        <span>{product.reviewCount} reviews</span>
        <span className="text-emerald-600">{product.inStock ? 'In stock' : 'Out of stock'}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <span className="text-4xl font-black text-[#1f2d4d]">${currentPrice}</span>
        {product.oldPrice && (
          <>
            <span className="text-xl text-slate-400 line-through">${product.oldPrice}</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">Save {discountPercent}%</span>
          </>
        )}
      </div>

      <p className="mt-5 text-base text-slate-600">{product.shortSummary || product.description}</p>

      <div className="mt-6">
        <ProductVariantSelector groups={variantGroups} selected={selected} onSelect={handleVariantSelect} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>SKU: <strong className="text-slate-900">{currentSku}</strong></span>
          <span>Stock: <strong className={`font-semibold ${currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{currentStock > 0 ? `${currentStock} available` : 'Sold out'}</strong></span>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <span>Weight: <strong className="text-slate-900">{currentWeight}</strong></span>
          <span>Dimensions: <strong className="text-slate-900">{currentDimensions}</strong></span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          <button type="button" className="h-12 w-12 text-xl text-slate-700">−</button>
          <span className="w-12 text-center text-base font-semibold text-slate-900">1</span>
          <button type="button" className="h-12 w-12 text-xl text-slate-700">+</button>
        </div>

        <button type="button" className="flex-1 rounded-full bg-[#1f2d4d] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#14213d]">
          Add to cart
        </button>
        <button type="button" className="rounded-full bg-[#f59a36] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#ee7c22]">
          Buy now
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">♡ Wishlist</button>
        <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">⇄ Compare</button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Seller</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-900">{product.seller}</p>
            <p className="text-sm text-slate-500">Trusted marketplace seller</p>
          </div>
          <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Visit shop</button>
        </div>
      </div>
    </div>
  )
}
