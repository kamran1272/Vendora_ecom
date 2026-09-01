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
  const logoSize = compact
    ? 'h-11 w-11 sm:h-12 sm:w-12'
    : 'h-12 w-12 sm:h-14 sm:w-14'

  const wordmarkSize = compact
    ? 'text-3xl sm:text-4xl'
    : 'text-4xl sm:text-5xl'

  const content = (
    <div
      className={`inline-flex items-center gap-2 sm:gap-3 ${className}`}
      aria-label="Vendora"
    >
      {/* Logo mark */}
      <div
        className={`relative shrink-0 ${logoSize}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 160 160"
          className="h-full w-full"
          role="img"
          focusable="false"
        >
          <defs>
            <linearGradient
              id="vendoraBagGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#f9b24a"
              />
              <stop
                offset="100%"
                stopColor="#f38a2d"
              />
            </linearGradient>
          </defs>

          {/* Outer circle */}
          <circle
            cx="80"
            cy="80"
            r="63"
            fill="#1f2d4d"
          />

          {/* Main shopping bag */}
          <path
            d="M55 74c0-15 12-27 27-27h18c15 0 27 12 27 27v10c0 14-5 25-15 34L88 118l-23-20C55 90 50 79 50 68V74Z"
            fill="url(#vendoraBagGradient)"
          />

          {/* Bag top highlight */}
          <path
            d="M80 47c-13 0-24 9-27 21h54c-3-12-14-21-27-21Z"
            fill="#f7ab43"
            opacity="0.95"
          />

          {/* Left navy accent */}
          <path
            d="M48 76c0-19 14-35 32-39v38L48 76Z"
            fill="#1f2d4d"
            opacity="0.94"
          />

          {/* Right navy accent */}
          <path
            d="M112 76c0-19-14-35-32-39v38l32 1Z"
            fill="#1f2d4d"
            opacity="0.94"
          />

          {/* Handle */}
          <path
            d="M82 26c8 0 15 7 15 15v14H67V41c0-8 7-15 15-15Z"
            fill="#1f2d4d"
          />

          <path
            d="M64 50c0-16 13-29 29-29s29 13 29 29"
            fill="none"
            stroke="#1f2d4d"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Bag structure */}
          <path
            d="M52 78L67 130h28l-12-52H52Z"
            fill="#1f2d4d"
          />

          <path
            d="M106 78L94 130H66l13-52h27Z"
            fill="#1f2d4d"
          />

          {/* Orange center mark */}
          <path
            d="M84 48 55 127l29-31 29 31L84 48Z"
            fill="#f7ab43"
          />

          {/* Center detail */}
          <circle
            cx="83"
            cy="56"
            r="6"
            fill="#1f2d4d"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className={`
            select-none whitespace-nowrap
            font-black leading-none
            tracking-[-0.07em]
            ${wordmarkSize}
          `}
          aria-hidden="true"
          style={{
            fontFamily:
              'Arial, Helvetica, sans-serif',
          }}
        >
          <span className="text-[#1f2d4d]">
            Vendo
          </span>
          <span className="text-[#f39a3d]">
            ra
          </span>
        </span>
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