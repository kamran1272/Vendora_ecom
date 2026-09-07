export type SellerRouteStat = {
  label: string
  value: string | number
}

export type SellerProfile = {
  id: string
  name: string
  companyName: string
  email: string
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE'
  rating: number
  verified: boolean
  balance: number
  pendingPayouts: number
}
