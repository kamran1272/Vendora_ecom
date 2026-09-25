import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryCard, BrandCard, Card, ProductGrid } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { ProductCard } from '@/components/ui/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { fetchMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace'
import { SELLER_REGISTRATION_URL } from '@/config/customer'
import { formatCurrency } from '@/utils/format'
import { resolveProductImageUrl } from '@/utils/productImage'

function toProductCard(product: MarketplaceProduct, badge?: string) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    oldPrice: product.oldPrice,
    shop: product.shop || product.seller,
    badge: badge || product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount ?? 0,
    inStock: product.inStock,
    category: product.category,
    imageUrl: product.images?.[0],
    hoverImageUrl: product.images?.[1],
  }
}

export function HomePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetchMarketplaceProducts({ limit: 60, sort: 'newest' })
      .then((response) => {
        if (active) setProducts(response.items)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [products])

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean))].slice(0, 8), [products])
  const sellers = useMemo(() => [...new Set(products.map((product) => product.shop || product.seller).filter(Boolean))].slice(0, 6), [products])
  const featured = products.slice(0, 8)
  const deals = products.filter((product) => product.oldPrice && product.oldPrice > product.price).slice(0, 8)
  const bestSelling = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 8)
  const heroProduct = products.find((product) => product.images?.[0])

  return (
    <div className="space-y-16 pb-12">
      <section className="overflow-hidden rounded-[2rem] bg-[#1f2d4d] text-white shadow-[0_24px_60px_rgba(31,45,77,0.2)]">
        <div className="grid min-h-[420px] items-center gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-200">Trusted marketplace</span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] md:text-5xl xl:text-6xl">Discover products <span className="text-orange-300">from independent sellers you can trust.</span></h1>
            <p className="mt-5 text-base leading-7 text-slate-200 md:text-lg">Track live inventory, compare offers, and shop directly from participating stores in one connected marketplace experience.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="rounded-xl bg-[#f59a36] px-5 py-3 font-bold text-white transition hover:bg-[#ee7c22]">Shop now</Link>
              <Link to="/categories" className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white transition hover:bg-white/10">Browse categories</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Live inventory</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Verified sellers</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Fast checkout</span>
            </div>
          </div>

          {heroProduct ? (
            <Link to={`/products/${heroProduct.id}`} className="group relative block overflow-hidden rounded-[1.75rem] bg-white/10 p-3 ring-1 ring-white/15">
              <div className="relative overflow-hidden rounded-[1.4rem]">
                <img src={resolveProductImageUrl(heroProduct.images?.[0])} alt={heroProduct.name} className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105 md:h-[380px]" />
              </div>
              <div className="absolute inset-x-7 bottom-7 rounded-2xl bg-white/95 p-4 text-slate-900 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Featured pick</p>
                <p className="mt-1 font-bold">{heroProduct.name}</p>
                <p className="mt-1 text-sm text-slate-500">{heroProduct.shop || heroProduct.seller}</p>
              </div>
            </Link>
          ) : <div className="hidden lg:block" />}
        </div>
      </section>

      {!loading && !error && products.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ['Live catalog', `${products.length}+ products currently listed`],
            ['Seller stores', `${sellers.length} stores represented in this view`],
            ['Shop with confidence', 'Real availability and seller information'],
          ].map(([title, message]) => (
            <Card key={title} className="border-transparent bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{message}</p>
            </Card>
          ))}
        </section>
      )}

      {loading && <LoadingState />}
      {!loading && error && <ErrorState title="Marketplace unavailable" message="We could not load the live catalog right now. Please try again." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} />}
      {!loading && !error && products.length === 0 && <EmptyState title="The marketplace is waiting for its first products" message="There are no active products to feature yet. Browse the shop again later." action={<Link to="/shop" className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Browse the shop</Link>} />}

      {!loading && !error && categories.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Discover" title="Shop by category" subtitle="Explore categories represented by active marketplace inventory." actionLabel="All categories" actionTo="/categories" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map(([name, count]) => <CategoryCard key={name} name={name} description={`${count} product${count === 1 ? '' : 's'} available`} href={`/category/${encodeURIComponent(name.toLowerCase())}`} />)}
          </div>
        </section>
      )}

      {!loading && !error && featured.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Latest arrivals" title="Fresh from the marketplace" subtitle="Recently published inventory from active sellers." actionLabel="Shop all" actionTo="/shop?sort=newest" />
          <ProductGrid>{featured.map((product) => <ProductCard key={product.id} product={toProductCard(product)} />)}</ProductGrid>
        </section>
      )}

      {!loading && !error && deals.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Deals" title="Offers available now" subtitle="Only products with a current original price and sale price appear here." actionLabel="View deals" actionTo="/shop?sort=price-low-to-high" />
          <ProductGrid>{deals.map((product) => <ProductCard key={product.id} product={toProductCard(product, 'Sale')} />)}</ProductGrid>
        </section>
      )}

      {!loading && !error && bestSelling.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Popular" title="Best selling products" subtitle="Sorted using the popularity value supplied by the marketplace API." actionLabel="Shop all" actionTo="/shop?sort=top-selling" />
          <ProductGrid>{bestSelling.map((product) => <ProductCard key={product.id} product={toProductCard(product, 'Popular')} />)}</ProductGrid>
        </section>
      )}

      {!loading && !error && brands.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Brands" title="Brands in the catalog" subtitle="Brand names are derived from the current product inventory." actionLabel="Browse products" actionTo="/shop" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">{brands.map((brand) => <BrandCard key={brand} name={brand} />)}</div>
        </section>
      )}

      {!loading && !error && sellers.length > 0 && (
        <section className="space-y-5">
          <SectionHeader eyebrow="Seller stores" title="Discover active shops" subtitle="Seller names shown here come directly from live product records." actionLabel="Explore shops" actionTo="/shops" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sellers.map((seller) => <Link key={seller} to={`/search?seller=${encodeURIComponent(seller)}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(31,45,77,0.04)] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-sm font-black text-orange-700">{seller.slice(0, 1).toUpperCase()}</span><p className="truncate font-bold text-slate-900 group-hover:text-brand-700">{seller}</p></div><p className="mt-3 text-sm text-slate-500">View products from this seller <span className="text-brand-600">→</span></p></Link>)}</div>
        </section>
      )}
    </div>
  )
}
