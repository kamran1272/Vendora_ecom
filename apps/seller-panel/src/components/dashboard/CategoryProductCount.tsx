type CategoryProductCountProps = {
  categories: Array<{ name: string; count: number }>
}

export function CategoryProductCount({ categories }: CategoryProductCountProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Category wise product count</h3>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{category.name}</span>
            <span className="font-medium text-slate-800">{category.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
