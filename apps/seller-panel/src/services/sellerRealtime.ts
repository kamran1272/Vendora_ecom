export const SELLER_REFRESH_EVENT = 'vendora:seller-refresh'

let refreshTimer: number | null = null
let subscribers = 0

export function subscribeToSellerRefresh(listener: () => void) {
  window.addEventListener(SELLER_REFRESH_EVENT, listener)
  subscribers += 1
  return () => {
    window.removeEventListener(SELLER_REFRESH_EVENT, listener)
    subscribers = Math.max(0, subscribers - 1)
  }
}

export function startSellerRefreshCoordinator(intervalMs = 15000) {
  if (refreshTimer !== null) return () => undefined

  refreshTimer = window.setInterval(() => {
    window.dispatchEvent(new CustomEvent(SELLER_REFRESH_EVENT))
  }, intervalMs)

  return () => {
    if (subscribers === 0 && refreshTimer !== null) {
      window.clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}
