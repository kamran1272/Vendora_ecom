import { api } from './api'
import type { SellerDashboardResponse } from '../types'

export const getSellerDashboard = async (): Promise<SellerDashboardResponse> => {
  const response = await api.get<SellerDashboardResponse>('/seller/dashboard')
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('Seller dashboard data is unavailable.')
  }
  return response.data
}
