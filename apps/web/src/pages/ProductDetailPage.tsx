import { Link, useParams } from 'react-router-dom'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfoPanel } from '@/components/product/ProductInfoPanel'
import { ProductCard } from '@/components/ui/ProductCard'

const productCatalog = [
  {
    id: 'smart-speaker',
    name: 'Smart Speaker Pro',
    category: 'Electronics',
    brand: 'NorthPeak',
    seller: 'NorthPeak Studio',
    price: 129,
    oldPrice: 169,
    discountPercent: 24,
    rating: 4.9,
    reviewCount: 128,
    inStock: true,
    stockStatus: 'In stock',
    description: 'Premium wireless speaker with room-filling audio, AI voice command support, and a compact form designed for modern living spaces.',
    shortSummary: 'Room-filling sound, deep bass, and smart connectivity in a modern compact speaker.',
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    variantGroups: [
      { name: 'Color', values: ['Black', 'White', 'Red'] },
      { name: 'Size', values: ['S', 'M', 'L', 'XL'] }
    ],
    variants: [
      {
        sku: 'SPP-BLK-M',
        price: 129,
        salePrice: 119,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        weight: '1.4 kg',
        dimensions: '18 x 12 x 8 cm',
        attributes: { Color: 'Black', Size: 'M' }
      },
      {
        sku: 'SPP-WHT-L',
        price: 139,
        salePrice: 129,
        stock: 9,
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
        weight: '1.5 kg',
        dimensions: '19 x 13 x 8.5 cm',
        attributes: { Color: 'White', Size: 'L' }
      },
      {
        sku: 'SPP-RED-XL',
        price: 149,
        salePrice: 139,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        weight: '1.6 kg',
        dimensions: '20 x 13 x 9 cm',
        attributes: { Color: 'Red', Size: 'XL' }
      }
    ]
  },
  {
    id: 'pulse-watch',
    name: 'Pulse Smart Watch',
    category: 'Electronics',
    brand: 'Volt',
    seller: 'Volt Studio',
    price: 199,
    oldPrice: 249,
    discountPercent: 20,
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
    stockStatus: 'In stock',
    description: 'Track performance, wellness, and notifications in one premium smartwatch built for everyday life.',
    shortSummary: 'An all-day smartwatch with health tracking, strong battery life, and sleek design.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=800&q=80'
    ]
  }
]

const relatedProducts = [
  { id: 'nova-lamp', name: 'Nova Lamp', price: 89, oldPrice: 119, discountPercent: 25, shop: 'Luma Home', badge: 'New', rating: 4.8, reviewCount: 84, inStock: true, category: 'Home' },
  { id: 'echo-headset', name: 'Echo Headset', price: 149, oldPrice: 189, discountPercent: 21, shop: 'Aural Labs', badge: 'Featured', rating: 4.8, reviewCount: 97, inStock: true, category: 'Electronics' },
  { id: 'aero-bottle', name: 'Aero Bottle', price: 42, oldPrice: 54, discountPercent: 22, shop: 'Summit Goods', badge: 'Flash sale', rating: 4.9, reviewCount: 142, inStock: true, category: 'Sports' },
  { id: 'glow-serum', name: 'Glow Serum', price: 38, oldPrice: 46, discountPercent: 17, shop: 'Glow Atelier', badge: 'Popular', rating: 4.7, reviewCount: 66, inStock: true, category: 'Beauty' }
]

const recentlyViewed = [
  { id: 'terra-backpack', name: 'Terra Backpack', price: 74, oldPrice: 99, discountPercent: 25, shop: 'Trail Works', badge: 'Top rated', rating: 4.6, reviewCount: 60, inStock: false, category: 'Sports' },
  { id: 'amber-hoodie', name: 'Amber Hoodie', price: 64, oldPrice: 78, discountPercent: 18, shop: 'Luma Style', badge: 'New', rating: 4.5, reviewCount: 54, inStock: true, category: 'Fashion' },
  { id: 'nova-lamp', name: 'Nova Lamp', price: 89, oldPrice: 109, discountPercent: 18, shop: 'Luma Home', badge: 'Featured', rating: 4.8, reviewCount: 84, inStock: true, category: 'Home' }
]

export function ProductDetailPage() {
  const { id, slug } = useParams()
  const productId = id ?? slug ?? 'smart-speaker'
  const product = productCatalog.find((item) => item.id === productId) ?? productCatalog[0]

  return (
    <div className="space-y-8 pb-10">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Home</Link>
        <span>/</span>
        <Link to="/categories" className="font-medium text-slate-600 hover:text-[#1f2d4d]">Categories</Link>
        <span>/</span>
        <Link to={`/category/${product.category.toLowerCase()}`} className="font-medium text-slate-600 hover:text-[#1f2d4d]">{product.category}</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ProductGallery title={product.name} images={product.images} />
        <ProductInfoPanel
          product={{
            name: product.name,
            rating: product.rating,
            reviewCount: product.reviewCount,
            price: product.price,
            oldPrice: product.oldPrice,
            discountPercent: product.discountPercent,
            stockStatus: product.stockStatus,
            inStock: product.inStock,
            seller: product.seller,
            description: product.description,
            shortSummary: product.shortSummary,
            variants: product.variants,
            variantGroups: product.variantGroups
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Product overview</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{product.description}</p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Specifications</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ['Connectivity', 'Bluetooth 5.3, Wi-Fi, USB-C'],
                ['Battery', '18 hours playback'],
                ['Audio', '360° immersive sound'],
                ['Weight', '1.4 kg'],
                ['Compatibility', 'iOS, Android, Alexa, Google Assistant'],
                ['Warranty', '12 months manufacturer warranty']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipping & Returns</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                ['Shipping', 'Free shipping over $80'],
                ['Delivery', '2-5 business days'],
                ['Refund policy', '30-day easy returns']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="mt-2 text-sm text-slate-600">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reviews</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-black text-slate-900">{product.rating.toFixed(1)}</span>
              <span className="text-[#f59a36] text-2xl">★★★★★</span>
              <span className="text-slate-600">Based on {product.reviewCount} reviews</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['5 stars', '86%'],
                ['4 stars', '10%'],
                ['3 stars', '3%'],
                ['2 stars', '1%']
              ].map(([label, percent]) => (
                <div key={label} className="grid grid-cols-[90px_1fr_60px] items-center gap-3 text-sm text-slate-600">
                  <span>{label}</span>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-[#f59a36]" style={{ width: percent }} />
                  </div>
                  <span>{percent}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Questions & Answers</p>
            <div className="mt-4 space-y-4">
              {[
                ['Does it support multi-room pairing?', 'Yes, it supports seamless pairing across multiple speakers.'],
                ['Can I connect it to my phone?', 'Yes, it connects by Bluetooth or Wi-Fi with both iOS and Android devices.']
              ].map(([question, answer]) => (
                <div key={question} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Q: {question}</p>
                  <p className="mt-2 text-slate-600">A: {answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Seller information</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{product.seller}</h3>
                <p className="text-sm text-slate-500">4.9 seller rating</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1f2d4d] to-[#f59a36]" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• 12k+ products sold</li>
              <li>• 98% on-time dispatch</li>
              <li>• Responsive customer service</li>
            </ul>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipping info</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Secure packaging</li>
              <li>• Delivery in 2–5 business days</li>
              <li>• Free returns within 30 days</li>
            </ul>
          </section>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Related products</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">You may also like</h2>
          </div>
          <Link to="/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View more</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                name: item.name,
                price: item.price,
                oldPrice: item.oldPrice,
                discountPercent: item.discountPercent,
                shop: item.shop,
                badge: item.badge,
                rating: item.rating,
                reviewCount: item.reviewCount,
                inStock: item.inStock,
                category: item.category,
                quickView: true,
                stockStatus: item.inStock ? 'In stock' : 'Sold out'
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recently viewed</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Continue exploring</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {recentlyViewed.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                name: item.name,
                price: item.price,
                oldPrice: item.oldPrice,
                discountPercent: item.discountPercent,
                shop: item.shop,
                badge: item.badge,
                rating: item.rating,
                reviewCount: item.reviewCount,
                inStock: item.inStock,
                category: item.category,
                stockStatus: item.inStock ? 'In stock' : 'Sold out'
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
