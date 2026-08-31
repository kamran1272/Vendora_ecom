export type AccountStatus = 'active' | 'pending' | 'suspended'

export type UserAccountProfile = {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  status: AccountStatus
  createdAt: string
}

export type AccountAddress = {
  id: string
  label: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export type AccountOrderItem = {
  id: string
  name: string
  quantity: number
  unitPrice: number
}

export type AccountOrder = {
  id: string
  number: string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  total: number
  createdAt: string
  items: AccountOrderItem[]
}

export type WishlistItem = {
  id: string
  name: string
  price: number
  shopName: string
  addedAt: string
}

export type AccountNotification = {
  id: string
  type: 'order' | 'promotion' | 'system' | 'review'
  title: string
  message: string
  read: boolean
  createdAt: string
}
