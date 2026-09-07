import { api } from './api'

export type SellerSummary = {
  id: string
  name: string
  companyName: string
  email: string
  status: string
  rating: number
  verified: boolean
  balance: number
  pendingPayouts: number
}

export async function getSellerSummary(): Promise<SellerSummary> {
  const { data } = await api.get<SellerSummary>('/seller/profile')
  return data
}

export async function updateSellerProfile(payload: Record<string, unknown>) {
  const { data } = await api.patch('/seller/profile', payload)
  return data
}
