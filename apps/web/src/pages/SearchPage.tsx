import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { Pagination } from '@/components/catalog/Pagination'
import { Breadcrumbs } from '@/components/ui/DesignSystem'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { ProductCard } from '@/components/ui/ProductCard'
import { searchSortOptions } from '@/data/marketplace'
import { fetchMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [apiProducts, setApiProducts] = useState<MarketplaceProduct[]>([])
  const [fallbackProducts, setFallbackProducts] = useState<MarketplaceProduct[]>([])
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const keyword = (searchParams.get('q') ?? searchParams.get('search') ?? '').trim().toLowerCase()
  const category = searchParams.get('category') ?? 'all'
  const brand = searchParams.get('brand') ?? 'all'
  const seller = searchParams.get('seller') ?? 'all'
  const priceMin = Number(searchParams.get('priceMin') ?? 0)
  const priceMax = Number(searchParams.get('priceMax') ?? 1000000)
  const minRating = Number(searchParams.get('rating') ?? 0)
  const availability = searchParams.get('availability') ?? 'all'
  const sort = searchParams.get('sort') ?? 'relevance'
  const currentPage = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setLoadError(null)

    fetchMarketplaceProducts({
      search: keyword || undefined,
      category: category === 'all' ? undefined : category,
      brand: brand === 'all' ? undefined : brand,
      seller: seller === 'all' ? undefined : seller,
      sort: sort === 'relevance' ? undefined : sort,
      limit: 200,
    })
      .then((response) => {
        if (active) {
          setApiProducts(response.items)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setApiProducts([])
          setLoadError('We could not load the marketplace catalog. Please try again.')
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [keyword, category, brand, seller, sort, reloadKey])

  const sourceProducts = apiProducts

  const filteredProducts = useMemo(() => {
    let results = [...sourceProducts]

    if (keyword) {
      results = results.filter((product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword) ||
        product.seller.toLowerCase().includes(keyword) ||
        (product.attributes || []).some((attribute) => attribute.toLowerCase().includes(keyword))
      )
    }

    if (category !== 'all') results = results.filter((product) => product.category === category)
    if (brand !== 'all') results = results.filter((product) => product.brand === brand)
    if (seller !== 'all') results = results.filter((product) => product.seller === seller)
    const attribute = searchParams.get('attribute') ?? 'all'
    if (attribute !== 'all') results = results.filter((product) => product.attributes?.includes(attribute))
    results = results.filter((product) => product.price >= priceMin && product.price <= priceMax)
    results = results.filter((product) => product.rating >= minRating)

    if (availability !== 'all') {
      const value = availability === 'in-stock'
      results = results.filter((product) => product.inStock === value)
    }

    switch (sort) {
      case 'newest':
        return results.sort((a, b) => b.id.localeCompare(a.id))
      case 'price-low-to-high':
        return results.sort((a, b) => a.price - b.price)
      case 'price-high-to-low':
        return results.sort((a, b) => b.price - a.price)
      case 'best-rated':
        return results.sort((a, b) => b.rating - a.rating)
      case 'most-popular':
      case 'top-selling':
        return results.sort((a, b) => b.popularity - a.popularity)
      case 'relevance':
      default:
        return results.sort((a, b) => {
          const aScore = (a.rating * 20) + a.popularity + (a.inStock ? 10 : 0)
          const bScore = (b.rating * 20) + b.popularity + (b.inStock ? 10 : 0)
          return bScore - aScore
        })
    }
  }, [sourceProducts, keyword, category, brand, seller, searchParams, priceMin, priceMax, minRating, availability, sort])

  const noResultsKey = [keyword, category, brand, seller, searchParams.get('attribute') ?? 'all', priceMin, priceMax, minRating, availability, sort].join('|')

  useEffect(() => {
    if (isLoading || loadError || filteredProducts.length > 0) {
      setFallbackProducts([])
      setFallbackLoading(false)
      return
    }

    let active = true
    setFallbackLoading(true)

    fetchMarketplaceProducts({ limit: 200, sort: 'most-popular' })
      .then((response) => {
        if (active) setFallbackProducts(response.items)
      })
      .catch(() => {
        if (active) setFallbackProducts([])
      })
      .finally(() => {
        if (active) setFallbackLoading(false)
      })

    return () => {
      active = false
    }
  }, [noResultsKey, isLoading, loadError, filteredProducts.length])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || value === '0') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const resetFilters = () => {
    const next = new URLSearchParams()
    if (keyword) next.set('q', keyword)
    setSearchParams(next)
  }

  const categories = ['all', ...new Set(sourceProducts.map((product) => product.category))]
  const brands = ['all', ...new Set(sourceProducts.map((product) => product.brand))]
  const sellers = ['all', ...new Set(sourceProducts.map((product) => product.seller))]
  const itemsPerPage = 12
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const popularCategories = [...fallbackProducts.reduce((counts, product) => counts.set(product.category, (counts.get(product.category) ?? 0) + 1), new Map<string, number>())]
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 6)
    .map(([name]) => {
      return { name, href: `/search?category=${encodeURIComponent(name)}` }
    })
  const recommendedProducts = fallbackProducts
    .filter((product, index, products) => products.findIndex((candidate) => candidate.id === product.id) === index)
    .sort((productA, productB) => productB.popularity - productA.popularity)
    .slice(0, 4)

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop' }, ...(keyword ? [{ label: `Search: ${keyword}` }] : [])]} />
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Search</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{keyword ? `Results for "${keyword}"` : 'Search products'}</h2>
        <p className="mt-2 text-slate-600">{filteredProducts.length} products found across categories, brands, and seller stores.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <label htmlFor="category-filter" className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
            <select id="category-filter" value={category} onChange={(event) => updateParam('category', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
              {categories.map((item) => <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>)}
            </select>
          </div>
          <FilterSidebar
            brands={brands.filter((item) => item !== 'all')}
            attributes={[...new Set(sourceProducts.flatMap((product) => product.attributes || []))]}
            selectedBrand={brand}
            selectedAttribute={searchParams.get('attribute') ?? 'all'}
            selectedRating={String(minRating)}
            selectedAvailability={availability}
            priceMin={priceMin}
            priceMax={priceMax}
            maxPriceLimit={1000000}
            resultCount={filteredProducts.length}
            onBrandChange={(value) => updateParam('brand', value)}
            onAttributeChange={(value) => updateParam('attribute', value)}
            onRatingChange={(value) => updateParam('rating', value)}
            onAvailabilityChange={(value) => updateParam('availability', value)}
            onPriceMinChange={(value) => updateParam('priceMin', String(value))}
            onPriceMaxChange={(value) => updateParam('priceMax', String(value))}
            onResetFilters={resetFilters}
          />
        </div>

        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">Sort by
                  <select value={sort} onChange={(event) => updateParam('sort', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500">
                    {searchSortOptions.map((item) => <option key={item} value={item}>{item.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {isLoading && <LoadingState className="col-span-2 md:col-span-3 lg:col-span-4 2xl:col-span-5" />}

            {!isLoading && loadError && (
              <ErrorState message="We could not load the marketplace catalog right now. Please try again." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} className="col-span-2 md:col-span-3 lg:col-span-4 2xl:col-span-5" />
            )}

            {!isLoading && !loadError && filteredProducts.length === 0 && (
              <div className="col-span-2 md:col-span-3 lg:col-span-4 2xl:col-span-5">
                <EmptyState title="No products found" message={keyword ? `We couldn't find products matching “${keyword}”. Try a different search or clear your filters.` : 'Try adjusting your filters to find products in the marketplace.'} />
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={resetFilters} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                    Clear filters
                  </button>
                  <Link to="/search" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                    Modify search
                  </Link>
                </div>

                {fallbackLoading && <p className="mt-8 text-center text-sm text-slate-500" role="status">Looking for popular categories and recommendations...</p>}

                {!fallbackLoading && popularCategories.length > 0 && (
                  <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="popular-categories-heading">
                    <h3 id="popular-categories-heading" className="text-lg font-bold text-slate-900">Popular categories</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {popularCategories.map((item) => <Link key={item.name} to={item.href} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{item.name}</Link>)}
                    </div>
                  </section>
                )}

                {!fallbackLoading && recommendedProducts.length > 0 && (
                  <section className="mt-8" aria-labelledby="recommended-products-heading">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">From the marketplace</p>
                        <h3 id="recommended-products-heading" className="mt-1 text-2xl font-black text-slate-900">Recommended products</h3>
                      </div>
                      <Link to="/search" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Browse all</Link>
                    </div>
                    <div className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
                      {recommendedProducts.map((product) => <ProductCard key={product.id} product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, shop: product.shop, badge: product.badge, rating: product.rating, inStock: product.inStock, category: product.category, imageUrl: product.images?.[0], hoverImageUrl: product.images?.[1] }} />)}
                    </div>
                  </section>
                )}
              </div>
            )}

            {!isLoading && !loadError && paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, shop: product.shop, badge: product.badge, rating: product.rating, inStock: product.inStock, category: product.category, imageUrl: product.images?.[0], hoverImageUrl: product.images?.[1] }} />
            ))}
          </div>
          {!isLoading && !loadError && filteredProducts.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => updateParam('page', String(page))} />}
        </section>
      </div>
    </div>
  )
}
