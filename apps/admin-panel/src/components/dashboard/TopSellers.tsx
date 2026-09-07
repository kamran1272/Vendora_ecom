import type { SellerSummary } from '../../types'
import { Link } from 'react-router-dom'

type TopSellersProps = {
  sellers: SellerSummary[]
}

export function TopSellers({ sellers }: TopSellersProps) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Top sellers</h3>
        <Link to="/admin/sellers" className="text-sm font-medium text-sky-600">View all</Link>
      </div>

      <div className="space-y-3">
        {sellers.map((seller) => (
          <div key={seller.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
            <div>
              <p className="font-semibold text-slate-800">{seller.name}</p>
              <p className="text-sm text-slate-500">{seller.orders} orders</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">{seller.sales}</p>
              <p className="text-sm text-amber-600">★ {seller.rating}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
