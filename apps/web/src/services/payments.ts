import { apiRequest } from '@/services/api'

export type PaymentMethodOption = {
  id: string
  label: string
  provider: string
  configured: boolean
}

export function fetchPaymentMethods() {
  return apiRequest<PaymentMethodOption[]>('/payments/methods')
}

export function createPaymentSession(orderId: string, method: string) {
  return apiRequest<{ provider: string; sessionId?: string; redirectUrl?: string; status: string }>('/payments/checkout-session', {
    method: 'POST',
    body: JSON.stringify({ orderId, method }),
  })
}
