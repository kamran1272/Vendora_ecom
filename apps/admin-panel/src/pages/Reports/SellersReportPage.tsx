import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, Store, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getSellersReport, SellersReportData, exportToCSV } from '../../services/reports'

export function SellersReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<SellersReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getSellersReport({ from: fromDate, to: toDate, categoryId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report?.sellers) return
    const csvData = report.sellers.map((s) => ({
      'Seller Name': s.name,
      Shop: s.shop,
      Email: s.email,
      Status: s.status,
      Orders: s.orderCount,
      Revenue: `$${s.revenue.toFixed(2)}`,
    }))
    exportToCSV('sellers-report', csvData)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/admin/reports')}
            className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Store className="h-5 w-5 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Sellers Report</h1>
          </div>
          <p className="text-sm text-slate-600">Track seller performance, revenue, and activity</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <h3 className="font-medium text-slate-900">Filters</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {report && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Sellers</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalSellers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Active Sellers</p>
                <p className="mt-2 text-2xl font-bold text-green-600">{report.summary.activeSellers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Revenue</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.totalSellerRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 font-medium text-slate-900">Top 10 Sellers by Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="seller" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">All Sellers</h3>
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
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Seller</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Shop</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Email</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-700">Status</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Orders</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sellers.map((seller) => (
                      <tr key={seller.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-900">{seller.name}</td>
                        <td className="px-4 py-2 text-slate-700">{seller.shop}</td>
                        <td className="px-4 py-2 text-slate-600 text-xs">{seller.email}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">{seller.status}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-700">{seller.orderCount}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">${seller.revenue.toFixed(2)}</td>
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
            <p className="text-sm font-medium text-slate-600">Click "Generate" to create your sellers report</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
