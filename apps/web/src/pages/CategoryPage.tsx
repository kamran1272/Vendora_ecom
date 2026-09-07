import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { Pagination } from '@/components/catalog/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/FeedbackState'
import { ProductCard } from '@/components/ui/ProductCard'
import { fetchMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace'
import { fetchCatalogCategories, type CatalogCategory } from '@/services/catalog'

export function CategoryPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [apiProducts, setApiProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([])
  const normalizedSlug = decodeURIComponent(slug ?? '').trim().toLowerCase()
  const categoryInfo = catalogCategories.find((item) => item.id === normalizedSlug || item.slug?.toLowerCase() === normalizedSlug || item.name.toLowerCase() === normalizedSlug) ?? {
    name: normalizedSlug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) || 'Products',
    description: 'Products currently listed in this marketplace category.'
  }

  useEffect(() => {
    fetchCatalogCategories().then((items) => setCatalogCategories([...new Map(items.map((item) => [item.id, item])).values()])).catch(() => undefined)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)

    fetchMarketplaceProducts({ limit: 200, category: categoryInfo.name })
      .then((response) => {
        if (active) {
          setApiProducts(response.items)
        }
      })
      .catch(() => {
        if (active) {
          setApiProducts([])
          setLoadError(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [categoryInfo.name, reloadKey])

  const allProducts = useMemo(
    () => apiProducts,
    [apiProducts, categoryInfo.name]
  )

  const getParamValue = (key: string, fallback: string) => searchParams.get(key) ?? fallback

  const [selectedBrand, setSelectedBrand] = useState(() => getParamValue('brand', 'all'))
  const [selectedAttribute, setSelectedAttribute] = useState(() => getParamValue('attribute', 'all'))
  const [selectedRating, setSelectedRating] = useState(() => getParamValue('rating', '0'))
  const [selectedAvailability, setSelectedAvailability] = useState(() => getParamValue('availability', 'all'))
  const [priceMin, setPriceMin] = useState(() => Number(getParamValue('minPrice', '0')) || 0)
  const [priceMax, setPriceMax] = useState(() => Number(getParamValue('maxPrice', '1000000')) || 1000000)
  const [currentPage, setCurrentPage] = useState(() => Number(getParamValue('page', '1')) || 1)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (selectedBrand !== 'all') params.set('brand', selectedBrand)
    else params.delete('brand')

    if (selectedAttribute !== 'all') params.set('attribute', selectedAttribute)
    else params.delete('attribute')

    if (selectedRating !== '0') params.set('rating', selectedRating)
    else params.delete('rating')

    if (selectedAvailability !== 'all') params.set('availability', selectedAvailability)
    else params.delete('availability')

    if (priceMin > 0) params.set('minPrice', String(priceMin))
    else params.delete('minPrice')

    if (priceMax !== 1000000) params.set('maxPrice', String(priceMax))
    else params.delete('maxPrice')

    if (currentPage > 1) params.set('page', String(currentPage))
    else params.delete('page')

    setSearchParams(params, { replace: true })
  }, [selectedBrand, selectedAttribute, selectedRating, selectedAvailability, priceMin, priceMax, currentPage, searchParams, setSearchParams])

  const brands = ['all', ...new Set(allProducts.map((product) => product.brand))]
  const attributes = ['all', ...new Set(allProducts.flatMap((product) => product.attributes))]

  const filteredProducts = useMemo(() => {
    let results = [...allProducts]

    if (selectedBrand !== 'all') {
      results = results.filter((product) => product.brand === selectedBrand)
    }

    if (selectedAttribute !== 'all') {
      results = results.filter((product) => product.attributes.includes(selectedAttribute))
    }

    results = results.filter((product) => product.price >= priceMin && product.price <= priceMax)
    results = results.filter((product) => product.rating >= Number(selectedRating))

    if (selectedAvailability !== 'all') {
      const shouldBeInStock = selectedAvailability === 'in-stock'
      results = results.filter((product) => product.inStock === shouldBeInStock)
    }

    return results
  }, [allProducts, selectedBrand, selectedAttribute, selectedRating, priceMin, priceMax, selectedAvailability])

  const itemsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const resetFilters = () => {
    setSelectedBrand('all')
    setSelectedAttribute('all')
    setSelectedRating('0')
    setSelectedAvailability('all')
    setPriceMin(0)
    setPriceMax(1000000)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Home</Link>
        <span>/</span>
        <Link to="/categories" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Categories</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{categoryInfo.name}</span>
      </nav>

      <header className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-[#1f2d4d] to-[#20335c] p-8 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">Category</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">{categoryInfo.name}</h1>
        <p className="mt-4 max-w-3xl text-base text-slate-200 md:text-lg">{categoryInfo.description}</p>
      </header>

      <nav aria-label="Category navigation" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
        {catalogCategories.map((item) => (
          <Link key={item.id} to={`/search?category=${encodeURIComponent(item.name)}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${item.name.toLowerCase() === categoryInfo.name.toLowerCase() ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <FilterSidebar
          brands={brands.filter((brand) => brand !== 'all')}
          attributes={attributes.filter((attribute) => attribute !== 'all')}
          selectedBrand={selectedBrand}
          selectedAttribute={selectedAttribute}
          selectedRating={selectedRating}
          selectedAvailability={selectedAvailability}
          priceMin={priceMin}
          priceMax={priceMax}
          onBrandChange={(value) => {
            setSelectedBrand(value)
            setCurrentPage(1)
          }}
          onAttributeChange={(value) => {
            setSelectedAttribute(value)
            setCurrentPage(1)
          }}
          onRatingChange={(value) => {
            setSelectedRating(value)
            setCurrentPage(1)
          }}
          onAvailabilityChange={(value) => {
            setSelectedAvailability(value)
            setCurrentPage(1)
          }}
          onPriceMinChange={(value) => {
            setPriceMin(value)
            setCurrentPage(1)
          }}
          onPriceMaxChange={(value) => {
            setPriceMax(value)
            setCurrentPage(1)
          }}
          onResetFilters={resetFilters}
        />

        <section className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f59a36]">Results</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">{filteredProducts.length} products</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Reset filters
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState className="md:col-span-2 xl:col-span-3" />
          ) : loadError ? (
            <ErrorState title="Category unavailable" message="We could not load this category right now. Please try again." action={<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Try again</button>} className="md:col-span-2 xl:col-span-3" />
          ) : paginatedProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: product.price,
                      shop: product.seller,
                      badge: product.badge ?? 'Featured',
                      rating: product.rating,
                      inStock: product.inStock,
                      category: product.category,
                      imageUrl: product.images?.[0],
                      hoverImageUrl: product.images?.[1]
                    }}
                  />
                ))}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
            </>
          ) : (
            <EmptyState title="No products found" message="Try resetting the filters or selecting another category." className="md:col-span-2 xl:col-span-3" />
          )}
        </section>
      </div>
    </div>
  )
}
