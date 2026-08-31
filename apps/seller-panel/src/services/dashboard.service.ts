import { api } from './api'
import type { SellerDashboardResponse } from '../types'

export const fallbackDashboard: SellerDashboardResponse = {
  shop: {
    name: 'Nede store',
    role: 'Seller',
    rating: 5,
    verified: true,
  },
  statistics: {
    products: 0,
    totalOrders: 0,
    totalSales: 0,
    todayViews: 0,
  },
  sales: {
    today: 0,
    yesterday: 0,
    currentMonth: 0,
    lastMonth: 0,
  },
  orders: {
    newOrder: 0,
    cancelled: 0,
    onDelivery: 0,
    delivered: 0,
  },
  packageInfo: {
    name: 'Silver Shop',
    uploadLimit: 0,
    expiresAt: '',
  },
}

export const getSellerDashboard = async (): Promise<SellerDashboardResponse> => {
  try {
    const response = await api.get<SellerDashboardResponse>('/seller/dashboard')
    const payload = response?.data

    if (!payload || typeof payload !== 'object') {
      return fallbackDashboard
    }

    return {
      ...fallbackDashboard,
      ...payload,
      shop: {
        ...fallbackDashboard.shop,
        ...(payload.shop ?? {}),
      },
      statistics: {
        ...fallbackDashboard.statistics,
        ...(payload.statistics ?? {}),
      },
      sales: {
        ...fallbackDashboard.sales,
        ...(payload.sales ?? {}),
      },
      orders: {
        ...fallbackDashboard.orders,
        ...(payload.orders ?? {}),
      },
      packageInfo: payload.packageInfo
        ? {
            ...fallbackDashboard.packageInfo,
            ...payload.packageInfo,
          }
        : fallbackDashboard.packageInfo,
    }
  } catch (error) {
    console.warn('Falling back to seller dashboard mock data:', error)
    return fallbackDashboard
  }
}
