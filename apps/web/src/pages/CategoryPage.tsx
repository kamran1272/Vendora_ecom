import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { Pagination } from '@/components/catalog/Pagination'
import { ProductCard } from '@/components/ui/ProductCard'
import { categoryItems, marketplaceSearchCatalog } from '@/data/marketplace'
import { fetchMarketplaceProducts } from '@/services/marketplace'

const categoryMap = new Map(
  categoryItems.map((item) => [
    item.href.replace('/categories/', '').toLowerCase(),
    { name: item.name, description: item.description }
  ])
)

export function CategoryPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [apiProducts, setApiProducts] = useState<typeof marketplaceSearchCatalog>([])
  const normalizedSlug = (slug ?? 'electronics').toLowerCase()
  const categoryInfo = categoryMap.get(normalizedSlug) ?? {
    name: 'Electronics',
    description: 'Featured products from trusted seller stores across Vendora.'
  }

  useEffect(() => {
    let active = true

    fetchMarketplaceProducts({ limit: 200, category: categoryInfo.name })
      .then((response) => {
        if (active) {
          setApiProducts(response.items as typeof marketplaceSearchCatalog)
        }
      })
      .catch(() => {
        if (active) {
          setApiProducts([])
        }
      })

    return () => {
      active = false
    }
  }, [categoryInfo.name])

  const allProducts = useMemo(
    () => (apiProducts.length ? apiProducts : marketplaceSearchCatalog.filter((product) => product.category === categoryInfo.name)),
    [apiProducts, categoryInfo.name]
  )

  const getParamValue = (key: string, fallback: string) => searchParams.get(key) ?? fallback

  const [selectedBrand, setSelectedBrand] = useState(() => getParamValue('brand', 'all'))
  const [selectedAttribute, setSelectedAttribute] = useState(() => getParamValue('attribute', 'all'))
  const [selectedRating, setSelectedRating] = useState(() => getParamValue('rating', '0'))
  const [selectedAvailability, setSelectedAvailability] = useState(() => getParamValue('availability', 'all'))
  const [priceMin, setPriceMin] = useState(() => Number(getParamValue('minPrice', '0')) || 0)
  const [priceMax, setPriceMax] = useState(() => Number(getParamValue('maxPrice', '250')) || 250)
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

    if (priceMax !== 250) params.set('maxPrice', String(priceMax))
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
    setPriceMax(250)
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

          {paginatedProducts.length ? (
            <>
              <div className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      name: product.name,
                      price: product.price,
                      shop: product.seller,
                      badge: product.badge ?? 'Featured',
                      rating: product.rating,
                      inStock: product.inStock,
                      category: product.category
                    }}
                  />
                ))}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-2xl font-black text-slate-900">No products found</h3>
              <p className="mt-2 text-slate-600">Try resetting the filters or selecting another category.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
