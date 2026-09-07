import { useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_CURRENCY, formatCurrency, getCurrencySymbol } from '@/utils/format'

type FilterSidebarProps = {
  brands: string[]
  attributes: string[]
  selectedBrand: string
  selectedAttribute: string
  selectedRating: string
  selectedAvailability: string
  priceMin: number
  priceMax: number
  onBrandChange: (value: string) => void
  onAttributeChange: (value: string) => void
  onRatingChange: (value: string) => void
  onAvailabilityChange: (value: string) => void
  onPriceMinChange: (value: number) => void
  onPriceMaxChange: (value: number) => void
  onResetFilters?: () => void

  /**
   * Optional props.
   * Existing callers do not need to provide them.
   */
  disabled?: boolean
  currency?: string
  minPriceLimit?: number
  maxPriceLimit?: number
  resultCount?: number
  className?: string
}

const DEFAULT_MIN_PRICE = 0
const DEFAULT_MAX_PRICE = 1000000

const ratingOptions = [
  {
    value: "4.8",
    label: "4.8 & above",
  },
  {
    value: "4.5",
    label: "4.5 & above",
  },
  {
    value: "4",
    label: "4.0 & above",
  },
]

const availabilityOptions = [
  {
    value: "in-stock",
    label: "In stock",
    description: "Products currently available",
  },
  {
    value: "out-of-stock",
    label: "Out of stock",
    description: "Currently unavailable",
  },
]

function StarIcon({
  filled = true,
  className = "",
}: {
  filled?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 1.75l2.48 5.03 5.55.8-4.02 3.91.95 5.53L10 14.41l-4.96 2.61.95-5.53-4.02-3.91 5.55-.8L10 1.75z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 7h10M18 7h2M4 17h2M10 17h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="16"
        cy="7"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="8"
        cy="17"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 10.5L8 14.5L16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatPrice(value: number, currency: string) {
  return formatCurrency(Math.max(0, value), {
    currency: currency === '$' ? 'USD' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function FilterSidebar({
  brands,
  attributes,
  selectedBrand,
  selectedAttribute,
  selectedRating,
  selectedAvailability,
  priceMin,
  priceMax,
  onBrandChange,
  onAttributeChange,
  onRatingChange,
  onAvailabilityChange,
  onPriceMinChange,
  onPriceMaxChange,
  onResetFilters,
  disabled = false,
  currency = DEFAULT_CURRENCY,
  minPriceLimit = DEFAULT_MIN_PRICE,
  maxPriceLimit = DEFAULT_MAX_PRICE,
  resultCount,
  className = "",
}: FilterSidebarProps) {
  const currencySymbol = getCurrencySymbol(currency)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [openSections, setOpenSections] = useState({
    brand: true,
    attribute: true,
    price: true,
    rating: true,
    availability: true,
  })

  const [minInput, setMinInput] = useState(String(priceMin || 0))
  const [maxInput, setMaxInput] = useState(String(priceMax || maxPriceLimit))

  useEffect(() => {
    if (!mobileOpen) return

    const previousFocus = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setMobileOpen(false)
        return
      }

      if (event.key !== "Tab") return
      const dialog = closeButtonRef.current?.closest('[role="dialog"]')
      if (!dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute("disabled"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown)
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown)
      previousFocus?.focus()
    }
  }, [mobileOpen])

  useEffect(() => {
    setMinInput(String(priceMin || 0))
  }, [priceMin])

  useEffect(() => {
    setMaxInput(String(priceMax || maxPriceLimit))
  }, [priceMax, maxPriceLimit])

  const normalizedMin = Math.max(
    minPriceLimit,
    Number.isFinite(priceMin) ? priceMin : minPriceLimit,
  )

  const normalizedMax = Math.min(
    maxPriceLimit,
    Number.isFinite(priceMax) && priceMax > 0
      ? priceMax
      : maxPriceLimit,
  )

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (selectedBrand !== "all") count++
    if (selectedAttribute !== "all") count++
    if (selectedRating !== "0") count++
    if (selectedAvailability !== "all") count++

    if (normalizedMin > minPriceLimit) count++
    if (normalizedMax < maxPriceLimit) count++

    return count
  }, [
    selectedBrand,
    selectedAttribute,
    selectedRating,
    selectedAvailability,
    normalizedMin,
    normalizedMax,
    minPriceLimit,
    maxPriceLimit,
  ])

  const hasPriceError =
    Number(minInput) > Number(maxInput) &&
    minInput !== "" &&
    maxInput !== ""

  const toggleSection = (
    section: keyof typeof openSections,
  ) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  const clearAll = () => {
    if (disabled) return

    onBrandChange("all")
    onAttributeChange("all")
    onRatingChange("0")
    onAvailabilityChange("all")
    onPriceMinChange(minPriceLimit)
    onPriceMaxChange(maxPriceLimit)

    setMinInput(String(minPriceLimit))
    setMaxInput(String(maxPriceLimit))

    onResetFilters?.()
  }

  const clearBrand = () => {
    if (!disabled) onBrandChange("all")
  }

  const clearAttribute = () => {
    if (!disabled) onAttributeChange("all")
  }

  const clearRating = () => {
    if (!disabled) onRatingChange("0")
  }

  const clearAvailability = () => {
    if (!disabled) onAvailabilityChange("all")
  }

  const handleMinPriceChange = (value: string) => {
    setMinInput(value)

    if (value === "") {
      onPriceMinChange(minPriceLimit)
      return
    }

    const numericValue = Number(value)
    const currentMax = Number(maxInput || maxPriceLimit)

    if (!Number.isFinite(numericValue)) {
      return
    }

    const nextMin = Math.min(
      Math.max(numericValue, minPriceLimit),
      maxPriceLimit,
    )

    if (nextMin > currentMax) {
      onPriceMaxChange(nextMin)
      setMaxInput(String(nextMin))
    }

    onPriceMinChange(nextMin)
  }

  const handleMaxPriceChange = (value: string) => {
    setMaxInput(value)

    if (value === "") {
      onPriceMaxChange(maxPriceLimit)
      return
    }

    const numericValue = Number(value)
    const currentMin = Number(minInput || minPriceLimit)

    if (!Number.isFinite(numericValue)) {
      return
    }

    const nextMax = Math.min(
      Math.max(numericValue, minPriceLimit),
      maxPriceLimit,
    )

    if (nextMax < currentMin) {
      onPriceMinChange(nextMax)
      setMinInput(String(nextMax))
    }

    onPriceMaxChange(nextMax)
  }

  const filterContent = (
    <div className="space-y-1">
      {/* Brand */}
      <FilterSection
        title="Brand"
        sectionKey="brand"
        open={openSections.brand}
        onToggle={toggleSection}
        disabled={disabled}
        active={selectedBrand !== "all"}
        activeValue={
          selectedBrand !== "all" ? selectedBrand : undefined
        }
      >
        <select
          id="brand-filter"
          value={selectedBrand}
          disabled={disabled}
          onChange={(event) =>
            onBrandChange(event.target.value)
          }
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-[#1f2d4d] focus:bg-white focus:ring-4 focus:ring-[#1f2d4d]/10 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Filter products by brand"
        >
          <option value="all">All brands</option>

          {brands
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
        </select>

        {selectedBrand !== "all" && (
          <button
            type="button"
            onClick={clearBrand}
            disabled={disabled}
            className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-[#1f2d4d] disabled:opacity-50"
          >
            Clear brand
          </button>
        )}
      </FilterSection>

      {/* Attribute */}
      <FilterSection
        title="Attribute"
        sectionKey="attribute"
        open={openSections.attribute}
        onToggle={toggleSection}
        disabled={disabled}
        active={selectedAttribute !== "all"}
        activeValue={
          selectedAttribute !== "all"
            ? selectedAttribute
            : undefined
        }
      >
        <select
          id="attribute-filter"
          value={selectedAttribute}
          disabled={disabled}
          onChange={(event) =>
            onAttributeChange(event.target.value)
          }
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-[#1f2d4d] focus:bg-white focus:ring-4 focus:ring-[#1f2d4d]/10 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Filter products by attribute"
        >
          <option value="all">All attributes</option>

          {attributes
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((attribute) => (
              <option key={attribute} value={attribute}>
                {attribute}
              </option>
            ))}
        </select>

        {selectedAttribute !== "all" && (
          <button
            type="button"
            onClick={clearAttribute}
            disabled={disabled}
            className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-[#1f2d4d] disabled:opacity-50"
          >
            Clear attribute
          </button>
        )}
      </FilterSection>

      {/* Price */}
      <FilterSection
        title="Price"
        sectionKey="price"
        open={openSections.price}
        onToggle={toggleSection}
        disabled={disabled}
        active={
          normalizedMin > minPriceLimit ||
          normalizedMax < maxPriceLimit
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="price-min"
                className="mb-1.5 block text-xs font-semibold text-slate-500"
              >
                Minimum
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {currencySymbol}
                </span>

                <input
                  id="price-min"
                  type="number"
                  inputMode="numeric"
                  min={minPriceLimit}
                  max={maxPriceLimit}
                  value={minInput}
                  disabled={disabled}
                  onChange={(event) =>
                    handleMinPriceChange(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1f2d4d] focus:bg-white focus:ring-4 focus:ring-[#1f2d4d]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Min"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="price-max"
                className="mb-1.5 block text-xs font-semibold text-slate-500"
              >
                Maximum
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {currencySymbol}
                </span>

                <input
                  id="price-max"
                  type="number"
                  inputMode="numeric"
                  min={minPriceLimit}
                  max={maxPriceLimit}
                  value={maxInput}
                  disabled={disabled}
                  onChange={(event) =>
                    handleMaxPriceChange(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1f2d4d] focus:bg-white focus:ring-4 focus:ring-[#1f2d4d]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          {hasPriceError ? (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
              role="alert"
            >
              Minimum price cannot be greater than maximum price.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              {formatPrice(normalizedMin, currency)} —{" "}
              {formatPrice(normalizedMax, currency)}
            </p>
          )}

          <div className="relative h-1.5 rounded-full bg-slate-200">
            <div
              className="absolute h-1.5 rounded-full bg-[#1f2d4d]"
              style={{
                left: `${
                  ((normalizedMin - minPriceLimit) /
                    Math.max(
                      1,
                      maxPriceLimit - minPriceLimit,
                    )) *
                  100
                }%`,
                right: `${
                  100 -
                  ((normalizedMax - minPriceLimit) /
                    Math.max(
                      1,
                      maxPriceLimit - minPriceLimit,
                    )) *
                    100
                }%`,
              }}
            />
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection
        title="Customer rating"
        sectionKey="rating"
        open={openSections.rating}
        onToggle={toggleSection}
        disabled={disabled}
        active={selectedRating !== "0"}
        activeValue={
          selectedRating !== "0"
            ? `${selectedRating}+`
            : undefined
        }
      >
        <div className="space-y-1">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              selectedRating === "0"
                ? "bg-slate-100"
                : "hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="rating"
              value="0"
              checked={selectedRating === "0"}
              disabled={disabled}
              onChange={(event) =>
                onRatingChange(event.target.value)
              }
              className="sr-only"
            />

            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                selectedRating === "0"
                  ? "border-[#1f2d4d]"
                  : "border-slate-300"
              }`}
            >
              {selectedRating === "0" && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#1f2d4d]" />
              )}
            </span>

            <span className="text-sm font-medium text-slate-700">
              Any rating
            </span>
          </label>

          {ratingOptions.map((rating) => {
            const isSelected =
              selectedRating === rating.value

            return (
              <label
                key={rating.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  isSelected
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={rating.value}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={(event) =>
                    onRatingChange(event.target.value)
                  }
                  className="sr-only"
                />

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#1f2d4d]"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1f2d4d]" />
                  )}
                </span>

                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map(
                    (_, index) => (
                      <StarIcon
                        key={index}
                        filled={
                          index <
                          Math.floor(
                            Number(rating.value),
                          )
                        }
                        className="h-3.5 w-3.5 text-amber-400"
                      />
                    ),
                  )}
                </span>

                <span className="text-sm font-medium text-slate-700">
                  {rating.label}
                </span>
              </label>
            )
          })}
        </div>

        {selectedRating !== "0" && (
          <button
            type="button"
            onClick={clearRating}
            disabled={disabled}
            className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-[#1f2d4d] disabled:opacity-50"
          >
            Clear rating
          </button>
        )}
      </FilterSection>

      {/* Availability */}
      <FilterSection
        title="Availability"
        sectionKey="availability"
        open={openSections.availability}
        onToggle={toggleSection}
        disabled={disabled}
        active={selectedAvailability !== "all"}
        activeValue={
          selectedAvailability !== "all"
            ? availabilityOptions.find(
                (option) =>
                  option.value === selectedAvailability,
              )?.label
            : undefined
        }
      >
        <div className="space-y-1">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition ${
              selectedAvailability === "all"
                ? "bg-slate-100"
                : "hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="availability"
              value="all"
              checked={selectedAvailability === "all"}
              disabled={disabled}
              onChange={(event) =>
                onAvailabilityChange(event.target.value)
              }
              className="sr-only"
            />

            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selectedAvailability === "all"
                  ? "border-[#1f2d4d]"
                  : "border-slate-300"
              }`}
            >
              {selectedAvailability === "all" && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#1f2d4d]" />
              )}
            </span>

            <span>
              <span className="block text-sm font-semibold text-slate-700">
                All products
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Show every product
              </span>
            </span>
          </label>

          {availabilityOptions.map((option) => {
            const isSelected =
              selectedAvailability === option.value

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                  isSelected
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={(event) =>
                    onAvailabilityChange(event.target.value)
                  }
                  className="sr-only"
                />

                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#1f2d4d]"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1f2d4d]" />
                  )}
                </span>

                <span>
                  <span className="block text-sm font-semibold text-slate-700">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>

        {selectedAvailability !== "all" && (
          <button
            type="button"
            onClick={clearAvailability}
            disabled={disabled}
            className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-[#1f2d4d] disabled:opacity-50"
          >
            Clear availability
          </button>
        )}
      </FilterSection>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden w-full max-w-[300px] shrink-0 lg:block ${className}`}
        aria-label="Product filters"
      >
        <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f2d4d]/10 text-[#1f2d4d]">
                    <FilterIcon className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Filters
                    </p>

                    <h3 className="mt-0.5 text-lg font-black text-slate-900">
                      Refine results
                    </h3>
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1f2d4d] px-2 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {resultCount !== undefined && (
              <p className="mt-3 text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {new Intl.NumberFormat("en-US").format(
                    resultCount,
                  )}
                </span>{" "}
                products
              </p>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {activeFilterCount} active{" "}
                  {activeFilterCount === 1
                    ? "filter"
                    : "filters"}
                </span>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={disabled}
                  className="text-xs font-bold text-[#1f2d4d] transition hover:underline disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-5 py-2">
            {filterContent}
          </div>
        </div>
      </aside>

      {/* Mobile filter button */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Open product filters"
          aria-expanded={mobileOpen}
        >
          <FilterIcon className="h-5 w-5" />

          Filters

          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1f2d4d] px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {resultCount !== undefined && (
          <span className="text-sm font-medium text-slate-500">
            {new Intl.NumberFormat("en-US").format(resultCount)}{" "}
            results
          </span>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <button
            type="button"
            aria-label="Dismiss filter drawer"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f2d4d]/10 text-[#1f2d4d]">
                  <FilterIcon className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Filters
                  </h2>

                  <p className="text-xs text-slate-500">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active`
                      : "Refine your results"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                ref={closeButtonRef}
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close filters"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <span className="text-xs font-semibold text-slate-500">
                  {activeFilterCount} active{" "}
                  {activeFilterCount === 1
                    ? "filter"
                    : "filters"}
                </span>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={disabled}
                  className="text-xs font-bold text-[#1f2d4d] disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {filterContent}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-xl bg-[#1f2d4d] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#17233d] active:scale-[0.99]"
              >
                {resultCount !== undefined
                  ? `Show ${new Intl.NumberFormat("en-US").format(
                      resultCount,
                    )} results`
                  : "Show results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

type FilterSectionProps = {
  title: string
  sectionKey: keyof {
    brand: boolean
    attribute: boolean
    price: boolean
    rating: boolean
    availability: boolean
  }
  open: boolean
  onToggle: (
    section: keyof {
      brand: boolean
      attribute: boolean
      price: boolean
      rating: boolean
      availability: boolean
    },
  ) => void
  children: React.ReactNode
  disabled?: boolean
  active?: boolean
  activeValue?: string
}

function FilterSection({
  title,
  sectionKey,
  open,
  onToggle,
  children,
  disabled = false,
  active = false,
  activeValue,
}: FilterSectionProps) {
  return (
    <section className="border-b border-slate-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-bold text-slate-900">
            {title}
          </span>

          {active && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1f2d4d] px-1.5 text-[9px] font-bold text-white">
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {activeValue && (
            <span className="max-w-[110px] truncate text-xs font-medium text-slate-400">
              {activeValue}
            </span>
          )}

          <ChevronDownIcon
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="mt-3 animate-[fadeIn_150ms_ease-out]">
          {children}
        </div>
      )}
    </section>
  )
}