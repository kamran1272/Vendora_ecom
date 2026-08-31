export type HeaderNavItem = {
  id: string
  label: string
  href: string
  enabled: boolean
}

export const apiNavigationItems: HeaderNavItem[] = [
  { id: 'home', label: 'Home', href: '/', enabled: true },
  { id: 'categories', label: 'Categories', href: '/categories', enabled: true },
  { id: 'brands', label: 'Brands', href: '/brands', enabled: true },
  { id: 'products', label: 'Products', href: '/products', enabled: true },
  { id: 'seller', label: 'Seller', href: '/seller', enabled: true },
  { id: 'register-shop', label: 'Register Your Shop', href: '/shops/create', enabled: true },
  { id: 'admin', label: 'Admin', href: '/admin', enabled: true }
]

export const headerActions = [
  { key: 'account', label: 'Account', href: '/account', icon: '👤' },
  { key: 'wishlist', label: 'Wishlist', href: '/account/wishlist', icon: '♡' },
  { key: 'compare', label: 'Compare', href: '/account/compare', icon: '⇄' },
  { key: 'notifications', label: 'Notifications', href: '/account/notifications', icon: '🔔' },
  { key: 'cart', label: 'Cart', href: '/cart', icon: '🛒' }
]

export const categoryItems = [
  { name: 'Electronics', description: 'Smart devices and gaming setups', href: '/categories/electronics' },
  { name: 'Home', description: 'Living essentials and interior upgrades', href: '/categories/home' },
  { name: 'Fashion', description: 'Fresh looks for every season', href: '/categories/fashion' },
  { name: 'Beauty', description: 'Premium routines and wellness picks', href: '/categories/beauty' },
  { name: 'Sports', description: 'Outdoor gear and performance essentials', href: '/categories/sports' },
  { name: 'Books', description: 'Learning, stories, and inspiration', href: '/categories/books' }
]

export const brandItems = [
  { name: 'NorthPeak', tag: 'Smart living' },
  { name: 'Aural', tag: 'Audio + sound' },
  { name: 'Luma', tag: 'Home essentials' },
  { name: 'Volt', tag: 'Power & lifestyle' },
  { name: 'Summit', tag: 'Adventure gear' },
  { name: 'Nova', tag: 'Modern design' }
]

export const productItems = [
  { id: 'aero-bottle', name: 'Aero Bottle', price: 42, shop: 'Summit Goods', badge: 'Best seller', category: 'Sports', brand: 'Summit', seller: 'Summit Goods', rating: 4.9, inStock: true, attributes: ['travel', 'eco', 'insulated'], popularity: 98 },
  { id: 'nova-lamp', name: 'Nova Lamp', price: 89, shop: 'Luma Home', badge: 'New arrival', category: 'Home', brand: 'Nova', seller: 'Luma Home', rating: 4.8, inStock: true, attributes: ['lighting', 'modern', 'decor'], popularity: 84 },
  { id: 'pulse-watch', name: 'Pulse Watch', price: 199, shop: 'Volt Studio', badge: 'Trending', category: 'Electronics', brand: 'Volt', seller: 'Volt Studio', rating: 4.7, inStock: true, attributes: ['wearable', 'fitness', 'smart'], popularity: 92 },
  { id: 'terra-backpack', name: 'Terra Backpack', price: 74, shop: 'Trail Works', badge: 'Top rated', category: 'Sports', brand: 'Summit', seller: 'Trail Works', rating: 4.6, inStock: false, attributes: ['outdoor', 'travel', 'waterproof'], popularity: 76 },
  { id: 'smart-speaker', name: 'Smart Speaker', price: 129, shop: 'NorthPeak Studio', badge: 'Featured', category: 'Electronics', brand: 'NorthPeak', seller: 'NorthPeak Studio', rating: 4.9, inStock: true, attributes: ['voice', 'audio', 'smart-home'], popularity: 95 },
  { id: 'echo-headset', name: 'Echo Headset', price: 149, shop: 'Aural Labs', badge: 'Popular', category: 'Electronics', brand: 'Aural', seller: 'Aural Labs', rating: 4.8, inStock: true, attributes: ['audio', 'wireless', 'gaming'], popularity: 87 },
  { id: 'amber-hoodie', name: 'Amber Hoodie', price: 64, shop: 'Luma Style', badge: 'Popular', category: 'Fashion', brand: 'Luma', seller: 'Luma Style', rating: 4.5, inStock: true, attributes: ['cotton', 'casual', 'winter'], popularity: 72 },
  { id: 'glow-serum', name: 'Glow Serum', price: 38, shop: 'Glow Atelier', badge: 'New arrival', category: 'Beauty', brand: 'Nova', seller: 'Glow Atelier', rating: 4.7, inStock: true, attributes: ['skincare', 'hydrating', 'organic'], popularity: 80 }
]

export type HomepageSectionType = 'hero' | 'categories' | 'brands' | 'products' | 'promo' | 'seller' | 'cta'

export type HomepageSectionConfig = {
  id: string
  type: HomepageSectionType
  enabled: boolean
  order: number
  title: string
  eyebrow?: string
  subtitle?: string
  description?: string
  background?: string
  categoryIds?: string[]
  productIds?: string[]
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  items?: Array<string | { label: string; value: string }>
}

export const homepageConfig: HomepageSectionConfig[] = [
  {
    id: 'hero',
    type: 'hero',
    enabled: true,
    order: 1,
    eyebrow: 'Multi-vendor marketplace',
    title: 'Shop trusted stores. Launch your own shop.',
    description: 'Vendora brings together shoppers, sellers, and admins in one commerce platform where every product belongs to a seller shop and every order flows through a connected marketplace ecosystem.',
    background: 'radial-gradient(circle_at_top_left,_rgba(245,154,54,0.18),_transparent_35%),linear-gradient(135deg,#1f2d4d_0%,#263a5b_55%,#1d2b48_100%)',
    cta: { label: 'Shop now', href: '/shop' },
    secondaryCta: { label: 'Open a shop', href: '/shops/create' }
  },
  {
    id: 'categories',
    type: 'categories',
    enabled: true,
    order: 2,
    eyebrow: 'Categories',
    title: 'Shop by category',
    subtitle: 'Curated collections from trusted sellers',
    categoryIds: ['electronics', 'home', 'fashion', 'beauty', 'sports', 'books']
  },
  {
    id: 'brands',
    type: 'brands',
    enabled: true,
    order: 3,
    eyebrow: 'Brands',
    title: 'Featured brands',
    subtitle: 'Popular names shoppers trust'
  },
  {
    id: 'new-products',
    type: 'products',
    enabled: true,
    order: 4,
    eyebrow: 'New products',
    title: 'Fresh arrivals',
    subtitle: 'Recently published by top sellers',
    productIds: ['aero-bottle', 'nova-lamp', 'pulse-watch', 'terra-backpack', 'smart-speaker', 'echo-headset']
  },
  {
    id: 'featured-products',
    type: 'products',
    enabled: true,
    order: 5,
    eyebrow: 'Featured products',
    title: 'Curated picks',
    subtitle: 'Handpicked opportunities and best deals',
    productIds: ['smart-speaker', 'nova-lamp', 'aero-bottle', 'pulse-watch', 'echo-headset', 'terra-backpack']
  },
  {
    id: 'top-selling-products',
    type: 'products',
    enabled: true,
    order: 6,
    eyebrow: 'Top selling',
    title: 'Best performers',
    subtitle: 'Products customers are buying the most',
    productIds: ['pulse-watch', 'smart-speaker', 'terra-backpack', 'echo-headset', 'aero-bottle', 'nova-lamp']
  },
  {
    id: 'promo-banners',
    type: 'promo',
    enabled: true,
    order: 7,
    eyebrow: 'Promotional offers',
    title: 'Explore exclusive deals and seller campaigns',
    subtitle: 'Seasonal drops, bundle discounts, and premium storefront offers',
    items: [
      { label: 'Weekend flash sale', value: 'Up to 50% off' },
      { label: 'Seller spotlight', value: 'New shops this week' },
      { label: 'Free shipping', value: 'On orders over $80' }
    ]
  },
  {
    id: 'seller-spotlight',
    type: 'seller',
    enabled: true,
    order: 8,
    eyebrow: 'Seller / shop section',
    title: 'Grow with your own storefront',
    subtitle: 'Create a custom shop, sell online, and manage your catalog with ease.',
    items: [
      'Multi-vendor marketplace ready',
      'Storefront management tools',
      'Insights for pricing and performance',
      'Payout and commission controls'
    ],
    cta: { label: 'Register your shop', href: '/shops/create' },
    secondaryCta: { label: 'Seller dashboard', href: '/seller' }
  },
  {
    id: 'footer-cta',
    type: 'cta',
    enabled: true,
    order: 9,
    title: 'Build a smarter marketplace.',
    eyebrow: 'Vendora',
    cta: { label: 'Create account', href: '/register' }
  }
]

export const marketplaceSearchCatalog = productItems

export const searchSortOptions = [
  'relevance',
  'newest',
  'price-low-to-high',
  'price-high-to-low',
  'best-rated',
  'most-popular',
  'top-selling'
]
