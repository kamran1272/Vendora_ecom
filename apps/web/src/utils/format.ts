export const DEFAULT_LOCALE = 'en-US'
export const DEFAULT_CURRENCY = 'USD'

export function formatCurrency(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatNumber(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(Number.isFinite(amount) ? amount : 0)
}

export function getCurrencySymbol(currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0).find((part) => part.type === 'currency')?.value || currency
}