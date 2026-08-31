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
  onPriceMaxChange
}: FilterSidebarProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
        <h3 className="mt-2 text-2xl font-black text-slate-900">Refine results</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Brand</label>
          <select
            value={selectedBrand}
            onChange={(event) => onBrandChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
          >
            <option value="all">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Attribute</label>
          <select
            value={selectedAttribute}
            onChange={(event) => onAttributeChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
          >
            <option value="all">All attributes</option>
            {attributes.map((attribute) => (
              <option key={attribute} value={attribute}>{attribute}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Price</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              value={priceMin}
              onChange={(event) => onPriceMinChange(Number(event.target.value || 0))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
              placeholder="Min"
            />
            <input
              type="number"
              min={0}
              value={priceMax}
              onChange={(event) => onPriceMaxChange(Number(event.target.value || 0))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Rating</label>
          <select
            value={selectedRating}
            onChange={(event) => onRatingChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
          >
            <option value="0">Any rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Availability</label>
          <select
            value={selectedAvailability}
            onChange={(event) => onAvailabilityChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f2d4d]"
          >
            <option value="all">All availability</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </div>
      </div>
    </aside>
  )
}
