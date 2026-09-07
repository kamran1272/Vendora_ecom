import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from '@/store/auth'
import { apiRequest } from '@/services/api'

export type CartLineItem = {
  id: string
  name: string
  price: number
  shop?: string
  imageUrl?: string
  variant?: string
  stock?: number
  quantity: number
}

export type CartSummary = {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  couponCode?: string | null
}

type CartApiItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  shop?: string | null
  imageUrl?: string | null
  image?: string | null
  variant?: string | null
  stock?: number | null
  sellerId?: string | null
  warehouseProductId?: string | null
  cartId?: string | null
}

type CartApiResponse = {
  id?: string
  items?: CartApiItem[]
  subtotal?: number
  tax?: number
  shipping?: number
  discount?: number
  total?: number
  couponCode?: string | null
  userId?: string | null
}

function normalizeCartItems(items: CartApiItem[] = []): CartLineItem[] {
  const uniqueItems = new Map<string, CartLineItem>()

  items.map((item) => ({
    id: String(item.productId || item.id),
    name: item.name,
    price: Number(item.price || 0),
    shop: item.shop || undefined,
    imageUrl: item.imageUrl || item.image || undefined,
    variant: item.variant || undefined,
    stock: item.stock || undefined,
    quantity: Number(item.quantity || 1),
  })).forEach((item) => {
    const key = `${item.id}::${item.variant || ''}`
    const existing = uniqueItems.get(key)
    uniqueItems.set(key, existing ? { ...item, quantity: existing.quantity + item.quantity } : item)
  })

  return [...uniqueItems.values()]
}

function cartLineKey(item: Pick<CartLineItem, 'id' | 'variant'>) {
  return `${item.id}::${item.variant || ''}`
}

function normalizeCartResponse(response: CartApiResponse) {
  const items = normalizeCartItems(response.items || [])
  const subtotal = Number(response.subtotal ?? getCartSubtotal(items))
  const tax = Number(response.tax ?? 0)
  const shipping = Number(response.shipping ?? (subtotal > 0 ? 12 : 0))
  const discount = Number(response.discount ?? 0)
  const total = Number(response.total ?? subtotal + tax + shipping - discount)

  return {
    items,
    summary: { subtotal, tax, shipping, discount, total, couponCode: response.couponCode },
  }
}

interface CartState {
  items: CartLineItem[]
  summary: CartSummary | null
  loadForUser: (userId?: string | number | null) => Promise<CartLineItem[]>
  addItem: (item: Omit<CartLineItem, 'quantity'> & { quantity?: number }) => Promise<CartLineItem[] | void>
  updateQuantity: (id: string, quantity: number) => Promise<CartLineItem[] | void>
  removeItem: (id: string) => Promise<CartLineItem[] | void>
  clear: () => Promise<CartLineItem[] | void>
  checkout: (userId: string | number, payload?: Record<string, unknown>) => Promise<{ message: string; order: { id: string } }>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      summary: null,
      loadForUser: async (userId) => {
        if (!userId) {
          return get().items
        }

        const response = await apiRequest<CartApiResponse>(`/cart/${userId}`)
        const normalized = normalizeCartResponse(response)
        set(normalized)
        return normalized.items
      },
      addItem: async (item) => {
        const user = useAuth.getState().user
        const userId = user?.id

        if (userId) {
          const payload = {
            productId: item.id,
            name: item.name,
            price: Number(item.price || 0),
            quantity: item.quantity ?? 1,
            shop: item.shop,
          }

          const response = await apiRequest<CartApiResponse>(`/cart/${userId}/items`, {
            method: 'POST',
            body: JSON.stringify(payload),
          })

          const normalized = normalizeCartResponse(response)
          set(normalized)
          return normalized.items
        }

        set((state) => {
          const existing = state.items.find((entry) => cartLineKey(entry) === cartLineKey(item))
          if (existing) {
            return {
              items: state.items.map((entry) =>
                cartLineKey(entry) === cartLineKey(item)
                  ? { ...entry, quantity: entry.quantity + (item.quantity ?? 1), price: item.price || entry.price }
                  : entry,
              ),
              summary: null,
            }
          }

          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
            summary: null,
          }
        })
      },
      updateQuantity: async (id, quantity) => {
        const user = useAuth.getState().user
        const userId = user?.id

        if (userId) {
          const response = await apiRequest<CartApiResponse>(`/cart/${userId}/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: Math.max(0, Number(quantity) || 0) }),
          })
          const normalized = normalizeCartResponse(response)
          set(normalized)
          return normalized.items
        }

        set((state) => ({
          items: state.items
            .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item))
            .filter((item) => item.quantity > 0),
          summary: null,
        }))
      },
      removeItem: async (id) => {
        const user = useAuth.getState().user
        const userId = user?.id

        if (userId) {
          const response = await apiRequest<CartApiResponse>(`/cart/${userId}/items/${id}`, {
            method: 'DELETE',
          })
          const normalized = normalizeCartResponse(response)
          set(normalized)
          return normalized.items
        }

        set((state) => ({ items: state.items.filter((item) => item.id !== id), summary: null }))
      },
      clear: async () => {
        const user = useAuth.getState().user
        const userId = user?.id

        if (userId) {
          const response = await apiRequest<CartApiResponse>(`/cart/${userId}`, {
            method: 'DELETE',
          })
          const normalized = normalizeCartResponse(response)
          set(normalized)
          return normalized.items
        }

        set({ items: [], summary: null })
      },
      checkout: async (userId, payload = {}) => {
        const response = await apiRequest<{ message: string; order: { id: string } }>(`/orders/checkout/${userId}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        set({ items: [], summary: null })
        return response
      },
    }),
    { name: 'vendora-cart' },
  ),
)

export function getCartSubtotal(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}
