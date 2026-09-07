import { api } from './api'

export async function getTrafficPackages<T = unknown>() { const { data } = await api.get<T>('/seller/traffic-packages'); return data }
export async function purchaseTrafficPackage<T = unknown>(id: string) { const { data } = await api.post<T>(`/seller/traffic-packages/${id}/purchase`); return data }
export async function getTrafficPurchaseHistory<T = unknown>() { const { data } = await api.get<T>('/seller/spread-packages-payment-list'); return data }
