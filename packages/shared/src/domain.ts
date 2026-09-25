export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'PACKED',
  'PICKED_UP',
  'SHIPPED',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SELLER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CONVERSATION_ROLES = ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT_AGENT', 'SYSTEM'] as const;
export type ConversationRole = (typeof CONVERSATION_ROLES)[number];

export const NOTIFICATION_TYPES = ['ORDER', 'PAYMENT', 'REVIEW', 'SYSTEM', 'PROMOTION', 'CHAT'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'UNAVAILABLE'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REFUND_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const WITHDRAWAL_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export type DomainStatus =
  | OrderStatus
  | SellerStatus
  | PaymentStatus
  | ReviewStatus
  | RefundStatus
  | WithdrawalStatus
  | ConversationStatus
  | ProductStatus;

export const isKnownStatus = <T extends readonly string[]>(value: string, allowed: T): value is T[number] =>
  allowed.includes(value as T[number]);

export const normalizeStatus = (value: string | null | undefined, fallback?: string): string => {
  const next = String(value ?? '').trim().toUpperCase();
  return next || fallback || 'UNKNOWN';
};

export const parseKnownStatus = <T extends readonly string[]>(value: string | null | undefined, allowed: T, fallback?: T[number]): T[number] => {
  const normalized = normalizeStatus(value);
  if (isKnownStatus(normalized, allowed)) return normalized;
  if (fallback !== undefined) return fallback;
  throw new Error(`Unsupported status: ${normalized}`);
};

export type DomainRecord = {
  id: string;
  status?: DomainStatus | string | null;
};
