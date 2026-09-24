type BrandLogoProps = {
  compact?: boolean
  showWordmark?: boolean
  className?: string
}

export function BrandLogo({ compact = false, showWordmark = true, className = '' }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label="Vendora">
      <img src="/Vendora_Logo_Icon.png" alt="" className={compact ? 'h-9 w-9 object-contain' : 'h-12 w-12 object-contain'} />
      {showWordmark && <img src="/Vendora_Logo_Wordmark.png" alt="Vendora" className={compact ? 'h-6 w-[116px] object-contain' : 'h-9 w-[170px] object-contain'} />}
    </div>
  )
}
