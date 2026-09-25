import type {
  ConversationRole,
  ConversationStatus,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  RefundStatus,
  ReviewStatus,
  SellerStatus,
  WithdrawalStatus,
} from './domain'

export type ApiError = {
  code: string
  message: string
  details?: unknown
}

export type ApiResult<T> = {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export type ProductVariantDto = {
  id: string
  productId: string
  sku: string
  name?: string | null
  attributes: Record<string, string>
  price: number
  stock: number
  image?: string | null
  status?: ProductStatus
}

export type ProductSummaryDto = {
  id: string
  name: string
  slug?: string
  sku?: string
  price: number
  stock: number
  status: ProductStatus | string
  sellerId?: string
  shopId?: string
  categoryId?: string | null
  brandId?: string | null
  variants?: ProductVariantDto[]
}

export type OrderSummaryDto = {
  id: string
  status: OrderStatus
  total: number
  currency: string
  customerId: string
  createdAt: string
}

export type SellerSummaryDto = {
  id: string
  status: SellerStatus
  userId: string
  shopId?: string | null
}

export type PaymentSummaryDto = {
  id: string
  status: PaymentStatus
  amount: number
  currency: string
  orderId?: string | null
}

export type ConversationSummaryDto = {
  id: string
  role: ConversationRole
  status: ConversationStatus
  subject?: string | null
  updatedAt: string
}

export type NotificationDto = {
  id: string
  type: NotificationType
  title: string
  message: string
  readAt?: string | null
  createdAt: string
}

export type ReviewSummaryDto = {
  id: string
  status: ReviewStatus
  rating: number
  productId?: string | null
}

export type RefundSummaryDto = {
  id: string
  status: RefundStatus
  amount: number
  orderId?: string | null
}

export type WithdrawalSummaryDto = {
  id: string
  status: WithdrawalStatus
  amount: number
  sellerId: string
}
