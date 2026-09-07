import { api } from './api'

export type SellerWallet = { availableBalance: string; pendingBalance: string; totalWithdrawn: string; minimumWithdrawal: number; hasTransactionPassword: boolean; currency: string }
export async function getSellerWallet() { const { data } = await api.get<SellerWallet>('/seller/wallet'); return data }
export async function getSellerWithdrawals<T = unknown[]>() { const { data } = await api.get<T>('/seller/withdrawals'); return data }
export async function requestSellerWithdrawal<T = unknown>(payload: Record<string, unknown>) { const { data } = await api.post<T>('/seller/withdrawals', payload); return data }
export async function setSellerTransactionPassword<T = unknown>(payload: Record<string, unknown>) { const { data } = await api.post<T>('/seller/transaction-password', payload); return data }
