import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter, TrendingUp, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getCommissionsReport, CommissionsReportData, exportToCSV } from '../../services/reports'

export function CommissionReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<CommissionsReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sellerId, setSellerId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getCommissionsReport({ from: fromDate, to: toDate, sellerId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report?.commissions) return
    const csvData = report.commissions.map((c) => ({
      Seller: c.seller,
      Shop: c.shop,
      GMV: `$${c.gmv.toFixed(2)}`,
      Commission: `$${c.commission.toFixed(2)}`,
      'Seller Earnings': `$${c.earnings.toFixed(2)}`,
    }))
    exportToCSV('commission-report', csvData)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Commission Report</h1>
          </div>
          <p className="text-sm text-slate-600">Track GMV, commissions, and seller earnings by vendor</p>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Seller (Optional)</label>
            <input
              type="text"
              placeholder="Seller ID"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total GMV</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.totalGMV.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Commission</p>
              <p className="mt-2 text-2xl font-bold text-yellow-600">${report.summary.totalCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Seller Earnings</p>
              <p className="mt-2 text-2xl font-bold text-green-600">${report.summary.totalSellerEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Commission Rate</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.averageCommissionRate.toFixed(2)}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-4 font-medium text-slate-900">Top 10 Sellers by GMV</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="seller" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="gmv" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Commission Breakdown by Seller</h3>
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
                    <th className="px-4 py-2 text-right font-medium text-slate-700">GMV</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Commission (15%)</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Seller Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {report.commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-900">{commission.seller}</td>
                      <td className="px-4 py-2 text-slate-700">{commission.shop}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">${commission.gmv.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-amber-600 font-medium">${commission.commission.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-600">${commission.earnings.toFixed(2)}</td>
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
          <p className="text-sm font-medium text-slate-600">Click "Generate" to create your commission report</p>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
