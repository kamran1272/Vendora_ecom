export function resolveProductImageUrl(src?: string | null): string {
  if (!src) {
    return makeFallbackProductImage('Image unavailable')
  }

  const trimmed = src.trim()
  if (!trimmed || trimmed.startsWith('data:')) {
    return trimmed || makeFallbackProductImage('Image unavailable')
  }

  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('dummyjson.com')) {
      return makeFallbackProductImage('Image unavailable')
    }
    return trimmed
  } catch {
    return makeFallbackProductImage('Image unavailable')
  }
}

export function makeFallbackProductImage(label = 'Image unavailable') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)"/>
      <rect x="90" y="120" width="1020" height="660" rx="42" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="8"/>
      <path d="M350 540 L520 410 L640 515 L760 330 L960 540 L960 700 L350 700 Z" fill="#dbeafe"/>
      <circle cx="470" cy="345" r="56" fill="#dbeafe"/>
      <text x="600" y="505" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#475569" letter-spacing="6">${label.toUpperCase()}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
