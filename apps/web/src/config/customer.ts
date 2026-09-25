const defaultBaseUrl = (value: string, fallback: string) => {
  const candidate = (import.meta.env as Record<string, string | undefined>)[value]
  if (candidate && candidate.trim()) return candidate.replace(/\/+$/, '')
  return fallback
}

const currentOrigin = window.location.origin
const localPanelUrl = (port: string) => `${window.location.protocol}//${window.location.hostname}:${port}`

export const SELLER_REGISTRATION_URL = `${defaultBaseUrl('VITE_SELLER_REGISTRATION_URL', import.meta.env.DEV ? localPanelUrl('4178') : currentOrigin)}/users/registration`
export const SELLER_PANEL_URL = defaultBaseUrl('VITE_SELLER_PANEL_URL', import.meta.env.DEV ? localPanelUrl('4175') : currentOrigin)
export const ADMIN_PANEL_URL = defaultBaseUrl('VITE_ADMIN_PANEL_URL', import.meta.env.DEV ? localPanelUrl('4176') : currentOrigin)
