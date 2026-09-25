export const USER_ROLES = [
  'CUSTOMER',
  'SELLER',
  'ADMIN',
  'SUPER_ADMIN',
  'STAFF',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  STAFF: 'STAFF',
} as const satisfies Record<string, UserRole>;

export const AUTH_TOKEN_TTL = {
  ACCESS: '15m',
  REFRESH: '30d',
} as const;

export const AUTH_STORAGE_KEYS = {
  customer: {
    access: 'vendora.customer.access',
    refresh: 'vendora.customer.refresh',
    user: 'vendora.customer.user',
  },
  seller: {
    access: 'vendora.seller.access',
    refresh: 'vendora.seller.refresh',
    user: 'vendora.seller.user',
  },
  admin: {
    access: 'vendora.admin.access',
    refresh: 'vendora.admin.refresh',
    user: 'vendora.admin.user',
  },
} as const;

export const LEGACY_AUTH_STORAGE_KEYS = [
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'vendora_admin_access_token',
  'vendora_admin_refresh_token',
  'vendora_admin_user',
  'vendora_user',
  'vendora-auth',
  'vendora_seller.refresh',
] as const;

export const USER_ROLE_VALUES = Object.values(UserRole) as UserRole[];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLE_VALUES.includes(value as UserRole);