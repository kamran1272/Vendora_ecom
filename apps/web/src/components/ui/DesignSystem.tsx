import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useToastStore } from '@/store/toast'
import { formatCurrency } from '@/utils/format'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  success = false,
  error = false,
  loadingLabel = 'Loading...',
  ariaLabel,
  className = '',
  onClick,
}: {
  children: ReactNode
  variant?: ButtonVariant
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  success?: boolean
  error?: boolean
  loadingLabel?: string
  ariaLabel?: string
  className?: string
  onClick?: () => void
}) {
  const variantClasses = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  }

  const stateClasses = success ? 'bg-emerald-600 text-white hover:bg-emerald-700' : error ? 'bg-rose-600 text-white hover:bg-rose-700' : variantClasses[variant]

  return (
    <button
      type={type}
      disabled={disabled || loading || success}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${stateClasses} ${className}`}
    >
      {loading ? loadingLabel : success ? 'Saved' : error ? 'Try again' : children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'danger' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    accent: 'bg-orange-50 text-orange-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-rose-50 text-rose-700',
  }

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function PriceDisplay({ price, oldPrice }: { price: number; oldPrice?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <span className="text-2xl font-black text-slate-900">{formatCurrency(price)}</span>
      {oldPrice !== undefined && oldPrice > price && <span className="text-sm text-slate-400 line-through">{formatCurrency(oldPrice)}</span>}
    </div>
  )
}

export function RatingStars({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  const value = Number(rating || 0)
  return (
    <div className="flex items-center gap-2 text-sm" aria-label={value ? `${value.toFixed(1)} out of 5 stars` : 'No rating yet'}>
      <span className="tracking-widest text-orange-400" aria-hidden="true">{value ? '★★★★★' : '☆☆☆☆☆'}</span>
      {value > 0 && <span className="font-semibold text-slate-800">{value.toFixed(1)}</span>}
      <span className="text-slate-500">{reviewCount ? `(${reviewCount})` : 'No reviews'}</span>
    </div>
  )
}

export function StockBadge({ inStock, label }: { inStock?: boolean; label?: string }) {
  return <Badge tone={inStock === false ? 'danger' : 'success'}>{label || (inStock === false ? 'Out of stock' : 'In stock')}</Badge>
}

export function DiscountBadge({ percent }: { percent: number }) {
  if (percent <= 0) return null
  return <Badge tone="accent">-{percent}%</Badge>
}

export function QuantitySelector({ value, min = 1, max, onChange }: { value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="h-11 w-11 text-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40">-</button>
      <span className="min-w-10 text-center text-sm font-bold text-slate-900">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={max !== undefined && value >= max} onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))} className="h-11 w-11 text-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40">+</button>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? <Link to={item.href} className="font-medium hover:text-brand-600">{item.label}</Link> : <span className="font-semibold text-slate-900">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export type ProductActionData = {
  id: string
  name: string
  price: number
  shop?: string
  imageUrl?: string
  inStock?: boolean
}

export function WishlistButton({ productId, className = '' }: { productId: string; className?: string }) {
  const isSaved = useWishlistStore((state) => state.ids.includes(productId))
  const toggle = useWishlistStore((state) => state.toggle)
  const showToast = useToastStore((state) => state.show)

  return (
    <button
      type="button"
      aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isSaved}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(productId)
        showToast({ tone: isSaved ? 'info' : 'success', title: isSaved ? 'Wishlist updated' : 'Saved to wishlist', message: isSaved ? 'Removed from wishlist.' : 'Added to wishlist.' })
      }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg transition hover:border-brand-400 hover:text-brand-600 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${isSaved ? 'heart-pop text-orange-500' : 'text-slate-600'} ${className}`}
    >
      {isSaved ? '♥' : '♡'}
    </button>
  )
}

export function AddToCartButton({ product, className = '' }: { product: ProductActionData; className?: string }) {
  const addItem = useCartStore((state) => state.addItem)
  const showToast = useToastStore((state) => state.show)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)

  const addToCart = async () => {
    if (loading || product.inStock === false) return
    setLoading(true)
    setError(false)
    setSuccess(false)
    try {
      await addItem({ ...product, quantity: 1 })
      setSuccess(true)
      showToast({ tone: 'success', title: 'Added to cart', message: `${product.name} was added to your cart.` })
      window.setTimeout(() => setSuccess(false), 1600)
    } catch {
      setError(true)
      showToast({ tone: 'error', title: 'Could not add item', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button disabled={product.inStock === false} loading={loading} loadingLabel="Adding..." success={success} error={error} onClick={() => void addToCart()} className="w-full">
        {product.inStock === false ? 'Out of stock' : 'Add to cart'}
      </Button>
      {error && <p className="mt-1 text-xs text-rose-600" role="alert">Could not add item.</p>}
    </div>
  )
}

export function ProductGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 ${className}`}>{children}</div>
}

export function CategoryCard({ name, description, href }: { name: string; description?: string; href: string }) {
  return (
    <Link to={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-brand-600" aria-hidden="true">{name.slice(0, 1)}</div>
      <h3 className="font-bold text-slate-900 group-hover:text-brand-600">{name}</h3>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    </Link>
  )
}

export function BrandCard({ name, description }: { name: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-black text-brand-600">{name.slice(0, 2).toUpperCase()}</div>
      <h3 className="mt-3 font-bold text-slate-900">{name}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export function OrderStatusBadge({ status }: { status?: string | null }) {
  const normalized = String(status || 'pending').toLowerCase()
  const tone = normalized === 'delivered' || normalized === 'completed' ? 'success' : normalized === 'cancelled' || normalized === 'failed' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{status || 'Pending'}</Badge>
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} role="status" aria-label="Loading" />
}
