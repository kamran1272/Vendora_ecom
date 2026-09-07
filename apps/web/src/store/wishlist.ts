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
        const uniqueIds = [...new Set(get().ids)]
        const next = uniqueIds.includes(id)
          ? uniqueIds.filter((item) => item !== id)
          : [...uniqueIds, id]

        set({ ids: next })
      },
      isSaved: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: 'vendora-wishlist' },
  ),
)
