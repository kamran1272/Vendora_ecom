import type { SellerProduct } from '../types'

const fallbackProducts: SellerProduct[] = []
/*
  {
    id: 1,
    name: 'Nika Unisex Outdoor Performance Cushion Crew Socks - Black',
    category: 'Men Clothing & Fashion',
    qty: 5000,
    basePrice: 27.2,
    sellingPrice: 36.5,
    costPrice: 30.1,
    featured: true,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    name: 'JASMING Womens High Waist Denim Shorts With Pockets',
    category: 'Women Clothing & Fashion',
    qty: 5000,
    basePrice: 35.9,
    sellingPrice: 44.8,
    costPrice: 30.1,
    featured: true,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    name: 'TELEVO Men Sport Running T-Shirt Fancy Design',
    category: 'Men Clothing & Fashion',
    qty: 5000,
    basePrice: 54.2,
    sellingPrice: 69.0,
    costPrice: 57.7,
    featured: true,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 4,
    name: 'Acg adidas Women Comfortable Style Women Casual Dress',
    category: 'Women Clothing & Fashion',
    qty: 5000,
    basePrice: 109.8,
    sellingPrice: 119.3,
    costPrice: 72.0,
    featured: true,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 5,
    name: 'RAGBEE Comfort Bamboo Viscose Underwear Trunks',
    category: 'Men Clothing & Fashion',
    qty: 5000,
    basePrice: 45.9,
    sellingPrice: 59.1,
    costPrice: 35.8,
    featured: true,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 6,
    name: 'GAP Women Shorts Lightened',
    category: 'Women Clothing & Fashion',
    qty: 5000,
    basePrice: 42.0,
    sellingPrice: 59.2,
    costPrice: 35.0,
    featured: true,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 7,
    name: 'Bagsmart Travel Tote Bag for Women',
    category: 'Women Clothing & Fashion',
    qty: 5000,
    basePrice: 36.0,
    sellingPrice: 42.0,
    costPrice: 30.0,
    featured: false,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 8,
    name: 'Hugger Gym Bag for Women',
    category: 'Women Clothing & Fashion',
    qty: 4998,
    basePrice: 89.4,
    sellingPrice: 95.0,
    costPrice: 62.0,
    featured: false,
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 9,
    name: 'Nim 3-in-1 Cushion Cover Set',
    category: 'Men Clothing & Fashion',
    qty: 5000,
    basePrice: 35.6,
    sellingPrice: 40.1,
    costPrice: 30.0,
    featured: true,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 10,
    name: 'Under Armour Men Runs Short',
    category: 'Men Clothing & Fashion',
    qty: 4998,
    basePrice: 45.2,
    sellingPrice: 49.9,
    costPrice: 34.5,
    featured: false,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  },
]
*/

export const getSellerProducts = async (): Promise<SellerProduct[]> => {
  try {
    const response = await fetch('/api/seller/products')
    if (!response.ok) {
      return []
    }

    return (await response.json()) as SellerProduct[]
  } catch {
    return []
  }
}
