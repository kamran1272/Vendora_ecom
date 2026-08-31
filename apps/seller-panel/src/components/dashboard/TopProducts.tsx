type TopProduct = {
  id: number
  name: string
  price: number
  image: string
}

type TopProductsProps = {
  products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Top 12 Products</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 12).map((product) => (
          <div key={product.id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
            <div className="p-3">
              <div className="text-base font-semibold text-[#287ed6]">${product.price.toFixed(2)}</div>
              <div className="mt-1 line-clamp-2 text-xs text-slate-600">{product.name}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
