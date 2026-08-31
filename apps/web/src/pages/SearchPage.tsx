import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/ui/ProductCard'
import { marketplaceSearchCatalog, searchSortOptions } from '@/data/marketplace'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = (searchParams.get('q') ?? searchParams.get('search') ?? '').trim().toLowerCase()
  const category = searchParams.get('category') ?? 'all'
  const brand = searchParams.get('brand') ?? 'all'
  const seller = searchParams.get('seller') ?? 'all'
  const priceMin = Number(searchParams.get('priceMin') ?? 0)
  const priceMax = Number(searchParams.get('priceMax') ?? 250)
  const minRating = Number(searchParams.get('rating') ?? 0)
  const availability = searchParams.get('availability') ?? 'all'
  const sort = searchParams.get('sort') ?? 'relevance'

  const filteredProducts = useMemo(() => {
    let results = [...marketplaceSearchCatalog]

    if (keyword) {
      results = results.filter((product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword) ||
        product.seller.toLowerCase().includes(keyword) ||
        product.attributes.some((attribute) => attribute.toLowerCase().includes(keyword))
      )
    }

    if (category !== 'all') results = results.filter((product) => product.category === category)
    if (brand !== 'all') results = results.filter((product) => product.brand === brand)
    if (seller !== 'all') results = results.filter((product) => product.seller === seller)
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
  }, [keyword, category, brand, seller, priceMin, priceMax, minRating, availability, sort])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || value === '0') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const categories = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.category))]
  const brands = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.brand))]
  const sellers = ['all', ...new Set(marketplaceSearchCatalog.map((product) => product.seller))]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Search</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{keyword ? `Results for "${keyword}"` : 'Search products'}</h2>
        <p className="mt-2 text-slate-600">{filteredProducts.length} products found across categories, brands, and trusted seller stores.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Keyword</label>
              <input value={keyword} onChange={(event) => updateParam('q', event.target.value)} placeholder="Search products..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select value={category} onChange={(event) => updateParam('category', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {categories.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Brand</label>
              <select value={brand} onChange={(event) => updateParam('brand', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {brands.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All brands' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Seller</label>
              <select value={seller} onChange={(event) => updateParam('seller', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                {sellers.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All sellers' : item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Price range</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={priceMin} onChange={(event) => updateParam('priceMin', event.target.value)} placeholder="Min" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500" />
                <input type="number" value={priceMax} onChange={(event) => updateParam('priceMax', event.target.value)} placeholder="Max" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Minimum rating</label>
              <select value={minRating} onChange={(event) => updateParam('rating', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                <option value="0">Any rating</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Availability</label>
              <select value={availability} onChange={(event) => updateParam('availability', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-brand-500">
                <option value="all">All availability</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Sort by</span>
                {searchSortOptions.map((item) => (
                  <button key={item} onClick={() => updateParam('sort', item)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${sort === item ? 'bg-[#1f2d4d] text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {item.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={{ name: product.name, price: product.price, shop: product.shop, badge: product.badge, rating: product.rating, inStock: product.inStock, category: product.category }} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
