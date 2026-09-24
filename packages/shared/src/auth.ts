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

export const USER_ROLE_VALUES = Object.values(UserRole) as UserRole[];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLE_VALUES.includes(value as UserRole);