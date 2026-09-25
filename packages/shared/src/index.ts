export * from './account'
export * from './auth'
export * from './chat'
export * from './contracts'
export * from './domain'

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
  env: process.env.NODE_ENV ?? 'development',
};
