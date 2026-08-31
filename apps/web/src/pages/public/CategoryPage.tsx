import { Link, useParams } from 'react-router-dom'
import { categoryItems, productItems } from '@/data/marketplace'

export function CategoryPage() {
  const { slug } = useParams()
  const categoryName = categoryItems.find((item) => item.href.endsWith(slug ?? ''))?.name ?? 'All Categories'

  const filteredProducts = slug
    ? productItems.filter((product) => product.category.toLowerCase() === categoryName.toLowerCase())
    : productItems

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4d2ec9]">Category</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">{categoryName}</h1>
        <p className="mt-2 text-slate-600">Browse products from trusted shops and discover the best picks in this category.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {categoryItems.map((category) => (
          <Link key={category.name} to={category.href} className={`rounded-[22px] border p-4 text-left ${category.name === categoryName ? 'border-[#4d2ec9] bg-[#f3f0ff] text-[#3c2fc2]' : 'border-slate-200 bg-white text-slate-700'}`}>
            <div className="text-3xl">{category.name === 'Electronics' ? '🎧' : category.name === 'Home' ? '🛋️' : category.name === 'Fashion' ? '👕' : category.name === 'Beauty' ? '🧴' : '⚽'}</div>
            <div className="mt-3 font-bold">{category.name}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-6xl">🎧</div>
            <div className="space-y-3 p-4">
              <Link to={`/products/${product.id}`} className="text-lg font-bold text-slate-900 hover:text-[#4d2ec9]">{product.name}</Link>
              <div className="text-sm text-slate-500">{product.shop}</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">${product.price}</span>
                <span className="text-sm text-amber-500">★★★★★ {product.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
