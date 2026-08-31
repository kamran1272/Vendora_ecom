export * from './account'

export type UserRole = 'customer' | 'seller' | 'admin'

export type Product = {
  id: string
  name: string
  price: number
  sellerId: string
  category: string
  stock: number
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

export const appConfig = {
  name: 'Vendora',
  version: '0.1.0',
  env: process.env.NODE_ENV ?? 'development'
}
