import { api } from './api'

export async function getSellerSubscriptionPackages<T = unknown>() { const { data } = await api.get<T>('/seller/packages'); return data }
export async function purchaseSellerSubscription<T = unknown>(id: string, action: 'purchase' | 'upgrade' | 'renew') { const { data } = await api.post<T>(`/seller/packages/${id}/purchase`, { action }); return data }
export async function getSubscriptionPurchaseHistory<T = unknown>() { const { data } = await api.get<T>('/seller/packages-payment-list'); return data }
