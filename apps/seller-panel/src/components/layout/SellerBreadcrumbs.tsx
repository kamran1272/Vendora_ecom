import { Link } from 'react-router-dom'

type BreadcrumbItem = {
  label: string
  to?: string
}

type SellerBreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function SellerBreadcrumbs({ items }: SellerBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.to ? <Link to={item.to} className="font-medium text-slate-600 hover:text-slate-900">{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </nav>
  )
}
