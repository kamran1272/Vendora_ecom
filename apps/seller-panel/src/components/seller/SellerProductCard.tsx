import type { ReactNode } from 'react'

type SellerProductCardProps = { name: string; image?: string | null; price?: ReactNode; children?: ReactNode; actions?: ReactNode }

export function SellerProductCard({ name, image, price, children, actions }: SellerProductCardProps) {
  return <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3"><div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-100">{image ? <img src={image} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">No image</span>}</div><h3 className="mt-3 truncate text-sm font-bold text-slate-900" title={name}>{name}</h3>{price ? <p className="mt-1 text-sm font-extrabold text-slate-900">{price}</p> : null}{children ? <div className="mt-3">{children}</div> : null}{actions ? <div className="mt-3 border-t border-slate-100 pt-3">{actions}</div> : null}</article>
}
