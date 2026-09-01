import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  toggle: (id: string) => void
  isSaved: (id: string) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const next = get().ids.includes(id)
          ? get().ids.filter((item) => item !== id)
          : [...get().ids, id]

        set({ ids: next })
      },
      isSaved: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: 'vendora-wishlist' },
  ),
)
