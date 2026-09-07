import type { ReactNode } from 'react'

type SellerProfileDropdownProps = { trigger: ReactNode; children: ReactNode }

export function SellerProfileDropdown({ trigger, children }: SellerProfileDropdownProps) {
  return <div className="relative"><details className="group"><summary className="list-none cursor-pointer">{trigger}</summary><div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">{children}</div></details></div>
}
