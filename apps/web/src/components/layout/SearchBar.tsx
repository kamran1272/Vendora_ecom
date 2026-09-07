import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace'
import { formatCurrency } from '@/utils/format'

const RECENT_SEARCHES_KEY = 'vendora-recent-searches'

function readRecentSearches() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function SearchBar({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const requestSequence = useRef(0)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<MarketplaceProduct[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setRecentSearches(readRecentSearches())
  }, [])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setSuggestions([])
      setLoading(false)
      setHasSearched(false)
      return
    }

    const sequence = ++requestSequence.current
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setHasSearched(false)
      try {
        const response = await fetchMarketplaceProducts({ search: normalizedQuery, limit: 6 })
        if (sequence !== requestSequence.current) return
        setSuggestions(response.items)
        setHasSearched(true)
      } catch {
        if (sequence !== requestSequence.current) return
        setSuggestions([])
        setHasSearched(true)
      } finally {
        if (sequence === requestSequence.current) setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const rememberSearch = (value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return

    const next = [normalizedValue, ...recentSearches.filter((item) => item.toLowerCase() !== normalizedValue.toLowerCase())].slice(0, 5)
    setRecentSearches(next)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  }

  const submitSearch = (value = query) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      navigate('/search')
      return
    }

    rememberSearch(normalizedValue)
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(normalizedValue)}`)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const options = suggestions.length ? suggestions : recentSearches.map((value) => ({ id: value, name: value } as MarketplaceProduct))
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected = options[activeIndex]
      submitSearch(selected?.name || query)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const optionLabel = suggestions.length ? 'Product suggestions' : 'Recent searches'

  return (
    <div className={`relative ${mobile ? 'w-full' : 'w-full'}`}>
      <form onSubmit={(event) => { event.preventDefault(); submitSearch() }} role="search">
        <label className="relative block">
          <span className="sr-only">Search products, brands, categories, or shops</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands, categories, or shops"
            role="combobox"
            aria-expanded={open}
            aria-controls="vendora-search-suggestions"
            aria-autocomplete="list"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
          />
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            {query && <button type="button" onClick={clearSearch} aria-label="Clear search" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">×</button>}
            <button type="submit" aria-label="Submit search" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">⌕</button>
          </div>
        </label>
      </form>

      {open && (query.trim() || recentSearches.length > 0) && (
        <div id="vendora-search-suggestions" role="listbox" aria-label={optionLabel} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {loading && <p className="px-3 py-3 text-sm text-slate-500" role="status">Searching the marketplace...</p>}
          {!loading && query.trim() && suggestions.map((product, index) => (
            <button key={product.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={() => submitSearch(product.name)} className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left ${index === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
              <span><strong className="block text-sm text-slate-900">{product.name}</strong><span className="text-xs text-slate-500">{product.brand} · {product.category} · {product.shop || product.seller}</span></span>
              <span className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(product.price)}</span>
            </button>
          ))}
          {!loading && query.trim() && hasSearched && suggestions.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">No marketplace products found for “{query.trim()}”.</p>}
          {!loading && !query.trim() && recentSearches.map((item, index) => (
            <button key={item} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={() => { setQuery(item); submitSearch(item) }} className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 ${index === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>{item}</button>
          ))}
        </div>
      )}
    </div>
  )
}
