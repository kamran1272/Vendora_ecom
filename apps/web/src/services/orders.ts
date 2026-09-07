import { apiRequest } from '@/services/api'

export type CustomerOrder = {
  id: string
  status?: string | null
  subtotal?: number
  tax?: number
  shipping?: number
  discount?: number
  total?: number
  paymentMethod?: string | null
  shippingAddress?: string | null
  createdAt?: string
  items?: Array<{
    id: string
    name: string
    quantity: number
    price: number
    sellerId?: string | null
    warehouseProductId?: string | null
  }>
  payment?: { status?: string | null; method?: string | null; amount?: number | null } | null
  shipment?: { status?: string | null; trackingNumber?: string | null; carrier?: string | null } | null
  statusHistory?: Array<{ id: string; status: string; note?: string | null; createdAt: string }>
}

export function fetchCustomerOrders() {
  return apiRequest<CustomerOrder[]>('/orders/user/current')
}

export function fetchCustomerOrder(id: string) {
  return apiRequest<CustomerOrder>(`/orders/user/current/${id}`)
}
