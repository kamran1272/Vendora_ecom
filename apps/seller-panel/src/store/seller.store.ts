import { create } from 'zustand'

type SellerStoreState = {
  shopName: string
  isAuthenticated: boolean
  setShopName: (shopName: string) => void
  setAuthenticated: (value: boolean) => void
}

export const useSellerStore = create<SellerStoreState>((set) => ({
  shopName: 'Nede store',
  isAuthenticated: true,
  setShopName: (shopName) => set({ shopName }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}))
