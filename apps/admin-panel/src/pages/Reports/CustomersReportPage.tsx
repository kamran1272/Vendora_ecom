import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, Users, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getCustomersReport, CustomersReportData, exportToCSV } from '../../services/reports'

export function CustomersReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<CustomersReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getCustomersReport({ from: fromDate, to: toDate })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report?.customers) return
    const csvData = report.customers.map((c) => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Orders: c.orderCount,
      'Total Spent': `$${c.totalSpent.toFixed(2)}`,
      'Last Order': c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : 'Never',
    }))
    exportToCSV('customers-report', csvData)
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers Report</h1>
          </div>
          <p className="text-sm text-slate-600">Analyze customer behavior, spending patterns, and retention</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <h3 className="font-medium text-slate-900">Filters</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Customers</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalCustomers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Active Customers</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">{report.summary.activeCustomers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Revenue</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.totalCustomerRevenue.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Average Order Value</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 font-medium text-slate-900">Customer Purchase Frequency</h3>
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
                <h3 className="mb-4 font-medium text-slate-900">Top Customers by Spend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.customers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="totalSpent" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">All Customers</h3>
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
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Phone</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Orders</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Total Spent</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-700">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-900">{customer.name}</td>
                        <td className="px-4 py-2 text-slate-600 text-xs">{customer.email}</td>
                        <td className="px-4 py-2 text-slate-700">{customer.phone}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{customer.orderCount}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">${customer.totalSpent.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never'}</td>
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
            <p className="text-sm font-medium text-slate-600">Click "Generate" to create your customers report</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
