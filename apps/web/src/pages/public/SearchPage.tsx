import { Link, useSearchParams } from 'react-router-dom'
import { categoryItems, productItems, searchSortOptions } from '@/data/marketplace'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') ?? ''
  const activeCategory = searchParams.get('category') ?? 'all'
  const activeSort = searchParams.get('sort') ?? 'relevance'

  const filteredProducts = productItems.filter((product) => {
    const matchesQuery = !activeQuery || product.name.toLowerCase().includes(activeQuery.toLowerCase()) || product.shop.toLowerCase().includes(activeQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || product.category.toLowerCase() === activeCategory.toLowerCase()
    return matchesQuery && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (activeSort) {
      case 'price-low-to-high':
        return a.price - b.price
      case 'price-high-to-low':
        return b.price - a.price
      case 'best-rated':
        return b.rating - a.rating
      case 'most-popular':
        return b.popularity - a.popularity
      case 'top-selling':
        return b.popularity - a.popularity
      default:
        return b.popularity - a.popularity
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black text-slate-900">Search products</h1>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <input
              value={activeQuery}
              onChange={(event) => setSearchParams({ q: event.target.value, category: activeCategory, sort: activeSort })}
              placeholder="Search products, shops or brands"
              className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
            />
            <select
              value={activeCategory}
              onChange={(event) => setSearchParams({ q: activeQuery, category: event.target.value, sort: activeSort })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <option value="all">All categories</option>
              {categoryItems.map((category) => (
                <option key={category.name} value={category.name.toLowerCase()}>{category.name}</option>
              ))}
            </select>
            <select
              value={activeSort}
              onChange={(event) => setSearchParams({ q: activeQuery, category: activeCategory, sort: event.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              {searchSortOptions.map((option) => (
                <option key={option} value={option}>{option.replace('-', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-500">{sortedProducts.length} results</div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedProducts.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-6xl">{product.badge === 'Trending' ? '⌚' : product.category === 'Home' ? '🛋️' : product.category === 'Beauty' ? '🧴' : product.category === 'Sports' ? '⚽' : '🎧'}</div>
            <div className="space-y-3 p-4">
              <Link to={`/products/${product.id}`} className="text-lg font-bold text-slate-900 hover:text-[#4d2ec9]">{product.name}</Link>
              <div className="text-sm text-slate-500">{product.shop}</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">${product.price}</span>
                <span className="text-sm text-amber-600">★★★★★ {product.rating}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.inStock ? 'In stock' : 'Sold out'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
