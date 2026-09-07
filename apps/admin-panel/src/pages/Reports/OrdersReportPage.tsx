import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, Package, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getOrdersReport, OrdersReportData, exportToCSV } from '../../services/reports'

export function OrdersReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<OrdersReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getOrdersReport({ from: fromDate, to: toDate, sellerId, categoryId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report?.orders) return
    const csvData = report.orders.map((o) => ({
      'Order ID': o.orderNumber,
      Customer: o.customer,
      Email: o.email,
      Total: `$${o.total.toFixed(2)}`,
      Status: o.status,
      Items: o.itemCount,
      Date: new Date(o.createdAt).toLocaleDateString(),
    }))
    exportToCSV('orders-report', csvData)
  }

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b']

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/admin/reports')}
            className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Orders Report</h1>
          </div>
          <p className="text-sm text-slate-600">Monitor order volume, status distribution, and trends</p>
        </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <h3 className="font-medium text-slate-900">Filters</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Seller</label>
            <input
              type="text"
              placeholder="Seller ID"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Category</label>
            <input
              type="text"
              placeholder="Category ID"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Completed</p>
              <p className="mt-2 text-2xl font-bold text-green-600">{report.summary.completedOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pending</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">{report.summary.pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Cancelled</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{report.summary.cancelledOrders}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Trend */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 font-medium text-slate-900">Order Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 font-medium text-slate-900">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={report.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                    {report.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Recent Orders</h3>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Order ID</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Customer</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Total</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-700">Status</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-700">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.slice(0, 20).map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-2 text-slate-700">{order.customer}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">${order.total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-slate-700">{order.itemCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-12">
          <Calendar className="h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Click "Generate" to create your orders report</p>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
