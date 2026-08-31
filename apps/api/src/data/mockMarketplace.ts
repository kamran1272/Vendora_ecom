export type Category = {
  id: string
  name: string
  slug: string
  description: string
}

export type Seller = {
  id: string
  name: string
  slug: string
  email: string
  category: string
  status: 'pending' | 'approved' | 'suspended'
  rating: number
  followers: number
  productsCount: number
}

export type Product = {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  category: string
  brand: string
  sellerId: string
  sellerName: string
  badge: string
  stock: number
  rating: number
  reviews: number
  description: string
  attributes: string[]
}

export type Order = {
  id: string
  number: string
  customerName: string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  total: number
  createdAt: string
}

export const categories: Category[] = [
  { id: 'cat_01', name: 'Electronics', slug: 'electronics', description: 'Audio, wearables, and smart devices' },
  { id: 'cat_02', name: 'Computers', slug: 'computers', description: 'Laptops, desktops, and accessories' },
  { id: 'cat_03', name: 'Smartphones', slug: 'smartphones', description: 'Mobile devices and accessories' },
  { id: 'cat_04', name: 'Fashion', slug: 'fashion', description: 'Modern styles and everyday essentials' },
  { id: 'cat_05', name: 'Home', slug: 'home', description: 'Interior design and home upgrades' },
  { id: 'cat_06', name: 'Beauty', slug: 'beauty', description: 'Skincare, wellness, and grooming' },
  { id: 'cat_07', name: 'Sports', slug: 'sports', description: 'Fitness, outdoor, and adventure gear' },
  { id: 'cat_08', name: 'Books', slug: 'books', description: 'Learning and lifestyle reading' }
]

export const sellers: Seller[] = [
  { id: 'seller_01', name: 'Tech World Store', slug: 'tech-world-store', email: 'support@techworldstore.com', category: 'Electronics', status: 'approved', rating: 4.8, followers: 1234, productsCount: 83 },
  { id: 'seller_02', name: 'Luma Home', slug: 'luma-home', email: 'hello@lumahome.com', category: 'Home', status: 'approved', rating: 4.7, followers: 980, productsCount: 64 },
  { id: 'seller_03', name: 'NorthPeak Studio', slug: 'northpeak-studio', email: 'team@northpeakstudio.com', category: 'Electronics', status: 'pending', rating: 4.9, followers: 1102, productsCount: 72 },
  { id: 'seller_04', name: 'Summit Goods', slug: 'summit-goods', email: 'shop@summitgoods.co', category: 'Sports', status: 'approved', rating: 4.6, followers: 760, productsCount: 54 }
]

export const products: Product[] = [
  {
    id: 'prod_01',
    name: 'Sony WH-1000XM5 Wireless',
    slug: 'sony-wh-1000xm5-wireless',
    price: 349.99,
    salePrice: 299.99,
    category: 'Electronics',
    brand: 'Sony',
    sellerId: 'seller_01',
    sellerName: 'Tech World Store',
    badge: 'Featured',
    stock: 42,
    rating: 4.8,
    reviews: 128,
    description: 'Premium wireless noise-canceling headphones with immersive audio and all-day comfort.',
    attributes: ['Noise cancelling', 'Bluetooth 5.3', '30h battery']
  },
  {
    id: 'prod_02',
    name: 'Apple MacBook Air M2',
    slug: 'apple-macbook-air-m2',
    price: 1099.99,
    salePrice: 999.99,
    category: 'Computers',
    brand: 'Apple',
    sellerId: 'seller_02',
    sellerName: 'Luma Home',
    badge: 'New arrival',
    stock: 15,
    rating: 4.9,
    reviews: 96,
    description: 'Thin, powerful laptop with excellent battery life and a bright Liquid Retina display.',
    attributes: ['13-inch display', 'M2 chip', '8GB unified memory']
  },
  {
    id: 'prod_03',
    name: 'iPhone 14 Pro Max',
    slug: 'iphone-14-pro-max',
    price: 1299.99,
    salePrice: 1199.99,
    category: 'Smartphones',
    brand: 'Apple',
    sellerId: 'seller_01',
    sellerName: 'Tech World Store',
    badge: 'Best seller',
    stock: 66,
    rating: 4.9,
    reviews: 178,
    description: 'A flagship device with the A16 Bionic chip, pro camera system, and all-day battery.',
    attributes: ['6.7-inch ProMotion', '48MP camera', 'Face ID']
  },
  {
    id: 'prod_04',
    name: 'Samsung Galaxy Watch 6',
    slug: 'samsung-galaxy-watch-6',
    price: 329.99,
    salePrice: 299.99,
    category: 'Electronics',
    brand: 'Samsung',
    sellerId: 'seller_01',
    sellerName: 'Tech World Store',
    badge: 'Trending',
    stock: 83,
    rating: 4.7,
    reviews: 64,
    description: 'A premium smartwatch for health tracking, fitness, and productivity.',
    attributes: ['Health insights', 'GPS', 'AMOLED display']
  },
  {
    id: 'prod_05',
    name: 'Apple AirPods Pro',
    slug: 'apple-airpods-pro',
    price: 249.99,
    salePrice: 199.99,
    category: 'Electronics',
    brand: 'Apple',
    sellerId: 'seller_01',
    sellerName: 'Tech World Store',
    badge: 'Popular',
    stock: 110,
    rating: 4.8,
    reviews: 92,
    description: 'Wireless earbuds with active noise cancellation and spatial audio.',
    attributes: ['ANC', 'USB-C', 'Spatial audio']
  },
  {
    id: 'prod_06',
    name: 'Canon EOS R10',
    slug: 'canon-eos-r10',
    price: 599.99,
    salePrice: 549.99,
    category: 'Electronics',
    brand: 'Canon',
    sellerId: 'seller_03',
    sellerName: 'NorthPeak Studio',
    badge: 'Top rated',
    stock: 34,
    rating: 4.9,
    reviews: 45,
    description: 'A compact mirrorless camera designed for creators and everyday photography.',
    attributes: ['24.2MP APS-C', '4K video', 'Hybrid autofocus']
  },
  {
    id: 'prod_07',
    name: 'Aero Bottle',
    slug: 'aero-bottle',
    price: 42,
    category: 'Sports',
    brand: 'Summit',
    sellerId: 'seller_04',
    sellerName: 'Summit Goods',
    badge: 'Best seller',
    stock: 189,
    rating: 4.9,
    reviews: 100,
    description: 'Reusable insulated bottle built for travel, workouts, and outdoor adventures.',
    attributes: ['Travel friendly', 'Double wall', 'Eco design']
  },
  {
    id: 'prod_08',
    name: 'Glow Serum',
    slug: 'glow-serum',
    price: 38,
    category: 'Beauty',
    brand: 'Nova',
    sellerId: 'seller_02',
    sellerName: 'Luma Home',
    badge: 'New arrival',
    stock: 71,
    rating: 4.7,
    reviews: 80,
    description: 'Hydrating facial serum made for brighter, smoother-looking skin.',
    attributes: ['Hydrating', 'Vitamin C', 'Daily use']
  }
]

export const orders: Order[] = [
  { id: 'ord_01', number: '#ORD-7456', customerName: 'John Doe', status: 'Delivered', total: 299.99, createdAt: '2026-06-15T08:00:00.000Z' },
  { id: 'ord_02', number: '#ORD-7455', customerName: 'Jane Smith', status: 'Processing', total: 159.5, createdAt: '2026-06-16T08:30:00.000Z' },
  { id: 'ord_03', number: '#ORD-7454', customerName: 'Robert Brown', status: 'Shipped', total: 89.99, createdAt: '2026-06-10T12:00:00.000Z' },
  { id: 'ord_04', number: '#ORD-7453', customerName: 'Emily Davis', status: 'Cancelled', total: 449.99, createdAt: '2026-06-07T14:00:00.000Z' }
]

export const adminDashboard = {
  totalSales: 125430.5,
  totalOrders: 1246,
  totalCustomers: 8549,
  totalSellers: 532,
  totalProducts: 12489
}
