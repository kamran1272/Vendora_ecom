import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartLineItem = {
  id: string
  name: string
  price: number
  shop?: string
  imageUrl?: string
  quantity: number
}

interface CartState {
  items: CartLineItem[]
  addItem: (item: Omit<CartLineItem, 'quantity'> & { quantity?: number }) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((entry) => entry.id === item.id)
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.id === item.id
                  ? { ...entry, quantity: entry.quantity + (item.quantity ?? 1), price: item.price || entry.price }
                  : entry,
              ),
            }
          }

          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
          }
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item))
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'vendora-cart' },
  ),
)

export function getCartSubtotal(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}
