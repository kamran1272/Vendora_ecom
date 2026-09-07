import type { RecentOrder } from '../../types'
import { Link } from 'react-router-dom'

type RecentOrdersProps = {
  orders: RecentOrder[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Recent orders</h3>
        <Link to="/admin/orders" className="text-sm font-medium text-sky-600">All</Link>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{order.id}</p>
                <p className="text-sm text-slate-500">{order.customer}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  order.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : order.status === 'Pending'
                      ? 'bg-amber-100 text-amber-700'
                      : order.status === 'Shipped'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-rose-100 text-rose-700'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Total</span>
              <strong className="font-semibold text-slate-900">{order.total}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
