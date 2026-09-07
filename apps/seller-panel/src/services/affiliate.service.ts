import { api } from './api'

export async function getAffiliateDashboard<T = unknown>() { const { data } = await api.get<T>('/seller/affiliate'); return data }
