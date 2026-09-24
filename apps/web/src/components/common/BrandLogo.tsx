import { Link } from 'react-router-dom'

type BrandLogoProps = {
  compact?: boolean
  href?: string
  className?: string
  showWordmark?: boolean
}

export function BrandLogo({
  compact = false,
  href = '/',
  className = '',
  showWordmark = true,
}: BrandLogoProps) {
  const logoSize = compact ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-12 w-12 sm:h-14 sm:w-14'
  const wordmarkSize = compact ? 'h-6 w-[116px] sm:h-7 sm:w-[132px]' : 'h-9 w-[170px] sm:h-11 sm:w-[205px]'

  const content = (
    <div
      className={`inline-flex items-center gap-2 sm:gap-3 ${className}`}
      aria-label="Vendora"
    >
      <img src="/Vendora_Logo_Icon.png" alt="" className={`shrink-0 object-contain ${logoSize}`} />

      {/* Wordmark */}
      {showWordmark && (
        <img src="/Vendora_Logo_Wordmark.png" alt="Vendora" className={`select-none object-contain ${wordmarkSize}`} />
      )}
    </div>
  )

  /*
   * External URLs should not be forced through React Router.
   * Internal Vendora routes use Link for SPA navigation.
   */
  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://')

  if (isExternal) {
    return (
      <a
        href={href}
        aria-label="Vendora home"
        className="inline-flex rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/30 focus:ring-offset-2"
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      to={href}
      aria-label="Vendora home"
      className="inline-flex rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/30 focus:ring-offset-2"
    >
      {content}
    </Link>
  )
}