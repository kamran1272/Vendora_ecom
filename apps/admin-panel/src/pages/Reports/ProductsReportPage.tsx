import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, Package, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getProductsReport, ProductsReportData, exportToCSV } from '../../services/reports'

export function ProductsReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<ProductsReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getProductsReport({ from: fromDate, to: toDate, categoryId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report?.products) return
    const csvData = report.products.map((p) => ({
      SKU: p.sku,
      Product: p.name,
      Category: p.category,
      Stock: p.stock,
      Sold: p.sold,
      Revenue: `$${p.revenue.toFixed(2)}`,
    }))
    exportToCSV('products-report', csvData)
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444']

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Products Report</h1>
          </div>
          <p className="text-sm text-slate-600">Analyze product performance, inventory levels, and sales</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Products</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalProducts}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Low Stock</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{report.summary.lowStockProducts}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Out of Stock</p>
                <p className="mt-2 text-2xl font-bold text-red-600">{report.summary.outOfStockProducts}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">In Stock</p>
                <p className="mt-2 text-2xl font-bold text-green-600">{report.summary.totalProducts - report.summary.lowStockProducts - report.summary.outOfStockProducts}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 font-medium text-slate-900">Stock Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={report.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {report.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 font-medium text-slate-900">Top Selling Products</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.products.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="sold" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">All Products</h3>
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
                      <th className="px-4 py-2 text-left font-medium text-slate-700">SKU</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Product</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Category</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Stock</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Sold</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.products.map((product) => (
                      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-slate-600">{product.sku}</td>
                        <td className="px-4 py-2 text-slate-900">{product.name}</td>
                        <td className="px-4 py-2 text-slate-700">{product.category}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                              product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-700">{product.sold}</td>
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
            <p className="text-sm font-medium text-slate-600">Click "Generate" to create your products report</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
