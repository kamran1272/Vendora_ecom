import type { SellerDashboardResponse } from '../../types'

type DashboardCardsProps = {
  data: SellerDashboardResponse
}

export function DashboardCards({ data }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-sm bg-[#287ed6] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between text-xs text-blue-100">
          <span>Products</span>
          <span>◌</span>
        </div>
        <div className="mt-6 text-[2rem] font-semibold leading-none">{data.statistics.products}</div>
      </div>

      <div className="rounded-sm bg-[#287ed6] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between text-xs text-blue-100">
          <span>Total Order</span>
          <span>◌</span>
        </div>
        <div className="mt-6 text-[2rem] font-semibold leading-none">{data.statistics.totalOrders}</div>
      </div>

      <div className="rounded-sm bg-[#287ed6] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between text-xs text-blue-100">
          <span>Total Sales</span>
          <span>◌</span>
        </div>
        <div className="mt-6 text-[2rem] font-semibold leading-none">${data.statistics.totalSales.toFixed(2)}</div>
      </div>
    </div>
  )
}
