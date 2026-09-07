import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getSalesReport, SalesReportData, exportToCSV } from '../../services/reports'

export function SalesReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<SalesReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getSalesReport({ from: fromDate, to: toDate, categoryId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report) return
    const csvData = report.topProducts.map((p) => ({
      Product: p.name,
      Quantity: p.quantity,
      Revenue: `$${p.revenue.toFixed(2)}`,
    }))
    exportToCSV('sales-report', csvData)
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <BarChart className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Sales Report</h1>
          </div>
          <p className="text-sm text-slate-600">Track revenue, orders, and top-performing products</p>
        </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <h3 className="font-medium text-slate-900">Filters</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Average Order Value</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Top Products</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{report.topProducts.length}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 font-medium text-slate-900">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 font-medium text-slate-900">Top Products by Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Top Products</h3>
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
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Product</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Quantity Sold</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-900">{product.name}</td>
                      <td className="px-4 py-2 text-right text-slate-700">{product.quantity}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">${product.revenue.toFixed(2)}</td>
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
          <p className="text-sm font-medium text-slate-600">Click "Generate" to create your sales report</p>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
