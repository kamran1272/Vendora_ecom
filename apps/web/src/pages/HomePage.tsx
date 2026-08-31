import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { ProductCard } from '@/components/ui/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatCard } from '@/components/ui/StatCard'
import { brandItems, categoryItems, homepageConfig, productItems } from '@/data/marketplace'

export function HomePage() {
  const visibleSections = [...homepageConfig]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        {visibleSections.map((section) => renderSection(section))}
      </main>
    </div>
  )
}

function renderSection(section: (typeof homepageConfig)[number]) {
  switch (section.type) {
    case 'hero':
      return (
        <section key={section.id} className="grid gap-8 rounded-[2rem] p-8 text-white shadow-[0_20px_45px_rgba(31,45,77,0.18)] md:grid-cols-[1.5fr_1fr] md:p-12" style={{ background: section.background || 'linear-gradient(135deg,#1f2d4d_0%,#263a5b_55%,#1d2b48_100%)' }}>
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-orange-100">{section.eyebrow}</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">{section.title}</h1>
            <p className="mt-5 max-w-xl text-base text-slate-200 md:text-lg">{section.description}</p>
            <div className="mt-8 flex gap-4">
              {section.cta && (
                <Link to={section.cta.href} className="rounded-full bg-[#f59a36] px-5 py-3 font-semibold text-white shadow-md hover:bg-[#ee7c22]">{section.cta.label}</Link>
              )}
              {section.secondaryCta && (
                <Link to={section.secondaryCta.href} className="rounded-full border border-white/40 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm hover:bg-white/10">{section.secondaryCta.label}</Link>
              )}
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-white/10 p-5 backdrop-blur-sm ring-1 ring-white/10">
            <div className="grid gap-4">
              <div className="rounded-[1.2rem] bg-white p-4 text-slate-900 shadow-lg">
                <p className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-500">Featured shop</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">Smart Speaker</p>
                    <p className="text-sm text-slate-500">by NorthPeak Studio</p>
                  </div>
                  <span className="text-xl font-black text-[#1f2d4d]">$129</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Customers" value="12.4k" />
                <StatCard label="Seller shops" value="1.1k" />
                <StatCard label="Monthly sales" value="$48k" />
                <StatCard label="Ratings" value="4.9/5" />
              </div>
            </div>
          </div>
        </section>
      )

    case 'categories':
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeader eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} actionLabel="View all" actionTo="/categories" />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {categoryItems.map((category) => (
              <Link key={category.name} to={category.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <div className="mb-4 h-14 w-14 rounded-xl bg-gradient-to-br from-[#f59a36] to-[#f3c66c]" />
                <p className="text-lg font-bold text-slate-900">{category.name}</p>
                <p className="mt-2 text-sm text-slate-500">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )

    case 'brands':
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeader eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} actionLabel="View all brands" actionTo="/brands" />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {brandItems.map((brand) => (
              <div key={brand.name} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-[#1f2d4d]">{brand.name.slice(0, 2)}</div>
                <p className="text-lg font-bold text-slate-900">{brand.name}</p>
                <p className="mt-2 text-sm text-slate-500">{brand.tag}</p>
              </div>
            ))}
          </div>
        </section>
      )

    case 'products': {
      const selected = (section.productIds || []).length > 0
        ? productItems.filter((product) => section.productIds?.includes(product.id))
        : productItems

      return (
        <section key={section.id} className="space-y-6">
          <SectionHeader eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} actionLabel="View all" actionTo="/products" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {selected.map((product) => (
              <ProductCard key={product.id} product={{ name: product.name, price: product.price, shop: product.shop, badge: product.badge, rating: product.rating, inStock: product.inStock, category: product.category }} />
            ))}
          </div>
        </section>
      )
    }

    case 'promo':
      return (
        <section key={section.id} className="rounded-[2rem] bg-gradient-to-r from-slate-100 to-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            {(section.items || []).map((promo) => {
              const item = typeof promo === 'string' ? { label: promo, value: '' } : promo
              return (
                <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{item.label}</p>
                  {item.value && <p className="mt-3 text-2xl font-black text-slate-900">{item.value}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )

    case 'seller':
      return (
        <section key={section.id} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{section.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">{section.title}</h2>
              <p className="mt-4 max-w-xl text-slate-600">{section.subtitle}</p>
              <div className="mt-6 flex gap-3">
                {section.cta && (
                  <Link to={section.cta.href} className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">{section.cta.label}</Link>
                )}
                {section.secondaryCta && (
                  <Link to={section.secondaryCta.href} className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700">{section.secondaryCta.label}</Link>
                )}
              </div>
            </div>
            <div className="grid gap-3">
              {(section.items || []).map((item, index) => (
                <div key={`${section.id}-${String(item)}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f59a36] text-sm font-bold text-white">{index + 1}</span>
                  <span>{typeof item === 'string' ? item : item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    case 'cta':
      return (
        <section key={section.id} className="rounded-[2rem] bg-[#1f2d4d] p-8 text-white shadow-[0_20px_48px_rgba(31,45,77,0.18)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">{section.eyebrow}</p>
              <h3 className="mt-2 text-3xl font-black">{section.title}</h3>
            </div>
            {section.cta && (
              <Link to={section.cta.href} className="rounded-full bg-[#f59a36] px-5 py-3 font-semibold text-white">{section.cta.label}</Link>
            )}
          </div>
        </section>
      )

    default:
      return null
  }
}
