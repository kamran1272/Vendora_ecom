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

export const categoryItems: Array<{ name: string; description: string; href: string }> = []
export const brandItems: Array<{ name: string; tag: string }> = []

export type MarketplaceCatalogItem = {
  id: string
  name: string
  price: number
  slug?: string
  shop: string
  badge?: string
  category: string
  brand: string
  seller: string
  rating: number
  inStock: boolean
  attributes: string[]
  popularity: number
  images?: string[]
}

export const productItems: MarketplaceCatalogItem[] = []

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
    productIds: []
  },
  {
    id: 'featured-products',
    type: 'products',
    enabled: true,
    order: 5,
    eyebrow: 'Featured products',
    title: 'Curated picks',
    subtitle: 'Handpicked opportunities and best deals',
    productIds: []
  },
  {
    id: 'top-selling-products',
    type: 'products',
    enabled: true,
    order: 6,
    eyebrow: 'Top selling',
    title: 'Best performers',
    subtitle: 'Products customers are buying the most',
    productIds: []
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
