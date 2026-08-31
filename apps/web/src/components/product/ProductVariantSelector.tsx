export type ProductVariantGroup = {
  name: string
  values: string[]
}

type ProductVariantSelectorProps = {
  groups: ProductVariantGroup[]
  selected: Record<string, string>
  onSelect: (groupName: string, value: string) => void
}

export function ProductVariantSelector({ groups, selected, onSelect }: ProductVariantSelectorProps) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{group.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isActive = selected[group.name] === value

              return (
                <button
                  key={`${group.name}-${value}`}
                  type="button"
                  onClick={() => onSelect(group.name, value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-[#1f2d4d] bg-[#1f2d4d] text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
