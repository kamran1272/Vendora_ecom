import { Link, useParams } from 'react-router-dom'
import { productItems } from '@/data/marketplace'

export function ProductDetailPage() {
  const { id, slug } = useParams()
  const product = productItems.find((item) => item.id === id || item.id === slug) ?? productItems[0]
  const related = productItems.filter((item) => item.id !== product.id).slice(0, 4)

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-200 p-8">
          <div className="flex h-[420px] items-center justify-center text-[120px]">{product.badge === 'Trending' ? '⌚' : product.category === 'Home' ? '🛋️' : product.category === 'Beauty' ? '🧴' : product.category === 'Sports' ? '⚽' : '🎧'}</div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit rounded-full bg-[#f3f0ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4d2ec9]">{product.badge}</div>
          <h1 className="mt-4 text-4xl font-black text-slate-900">{product.name}</h1>
          <div className="mt-2 text-sm text-slate-500">Sold by {product.shop}</div>
          <div className="mt-4 flex items-center gap-2 text-amber-500">★★★★★ <span className="text-slate-500">{product.rating} / 5</span></div>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-black text-slate-900">${product.price}</span>
            <span className="text-xl text-slate-400 line-through">${(product.price * 1.18).toFixed(2)}</span>
          </div>

          <p className="mt-6 text-slate-600">{product.name} is a premium marketplace product built for modern buyers, designed to combine performance, value, and trusted seller quality.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-xl bg-[#4d2ec9] px-5 py-3 font-semibold text-white">Add to cart</button>
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Buy now</button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {product.attributes.map((attribute) => (
              <div key={attribute} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{attribute}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-black text-slate-900">Related products</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {related.map((item) => (
            <Link key={item.id} to={`/products/${item.id}`} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 hover:bg-white">
              <div className="flex h-32 items-center justify-center text-5xl">🎧</div>
              <div className="mt-3 text-lg font-bold text-slate-900">{item.name}</div>
              <div className="mt-2 text-sm text-slate-500">{item.shop}</div>
              <div className="mt-3 text-xl font-black text-slate-900">${item.price}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
