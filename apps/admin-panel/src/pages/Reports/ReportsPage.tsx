import { BarChart, TrendingUp, Package, Store, Users, DollarSign, RotateCcw, Send } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'

export function ReportsPage() {
  const reports = [
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Track revenue, orders, and top-performing products',
      icon: BarChart,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin/reports/sales',
    },
    {
      id: 'orders',
      title: 'Orders Report',
      description: 'Monitor order volume, status distribution, and trends',
      icon: Package,
      color: 'bg-purple-100 text-purple-600',
      href: '/admin/reports/orders',
    },
    {
      id: 'products',
      title: 'Products Report',
      description: 'Analyze product performance, inventory levels, and sales',
      icon: Package,
      color: 'bg-pink-100 text-pink-600',
      href: '/admin/reports/products',
    },
    {
      id: 'sellers',
      title: 'Sellers Report',
      description: 'Track seller performance, revenue, and activity',
      icon: Store,
      color: 'bg-green-100 text-green-600',
      href: '/admin/reports/sellers',
    },
    {
      id: 'customers',
      title: 'Customers Report',
      description: 'Analyze customer behavior, spending patterns, and retention',
      icon: Users,
      color: 'bg-cyan-100 text-cyan-600',
      href: '/admin/reports/customers',
    },
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'Track revenue, commissions, fees, and net earnings',
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      href: '/admin/reports/financial',
    },
    {
      id: 'refunds',
      title: 'Refunds Report',
      description: 'Track refund requests, amounts, and processing status',
      icon: RotateCcw,
      color: 'bg-red-100 text-red-600',
      href: '/admin/reports/refunds',
    },
    {
      id: 'withdrawals',
      title: 'Withdrawals Report',
      description: 'Track seller withdrawal requests and payment status',
      icon: Send,
      color: 'bg-indigo-100 text-indigo-600',
      href: '/admin/reports/withdrawals',
    },
    {
      id: 'commissions',
      title: 'Commission Report',
      description: 'Track GMV, commissions, and seller earnings by vendor',
      icon: TrendingUp,
      color: 'bg-yellow-100 text-yellow-600',
      href: '/admin/reports/commissions',
    },
  ]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <BarChart className="h-5 w-5 text-slate-600" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Reports & Analytics</h1>
        </div>
        <p className="text-sm text-slate-600">Access comprehensive reports on sales, orders, products, sellers, customers, and financial metrics</p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const IconComponent = report.icon
          return (
            <a
              key={report.id}
              href={report.href}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-600">{report.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{report.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                View Report
                <svg className="ml-2 h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          )
        })}
      </div>

      {/* Quick Info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-semibold text-slate-900">Available Reports</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3">
            <BarChart className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Sales Report</p>
              <p className="text-xs text-slate-500">Revenue trends and top products</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Package className="h-5 w-5 flex-shrink-0 text-purple-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Orders Report</p>
              <p className="text-xs text-slate-500">Order volume and status</p>
            </div>
          </div>
          <div className="flex gap-3">
            <DollarSign className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Financial Report</p>
              <p className="text-xs text-slate-500">Revenue and commissions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Users className="h-5 w-5 flex-shrink-0 text-cyan-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Customers Report</p>
              <p className="text-xs text-slate-500">Customer metrics and retention</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Store className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Sellers Report</p>
              <p className="text-xs text-slate-500">Vendor performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Commission Report</p>
              <p className="text-xs text-slate-500">GMV and seller earnings</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}
