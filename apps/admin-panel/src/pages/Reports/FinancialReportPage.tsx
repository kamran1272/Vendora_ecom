import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar, Filter, DollarSign, ChevronLeft } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getFinancialReport, FinancialReportData } from '../../services/reports'

export function FinancialReportPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<FinancialReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sellerId, setSellerId] = useState('')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const data = await getFinancialReport({ from: fromDate, to: toDate, sellerId })
      setReport(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Financial Report</h1>
          </div>
          <p className="text-sm text-slate-600">Track revenue, commissions, fees, and net earnings</p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Gross Revenue</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">${report.summary.grossRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Commission</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">${report.summary.vendoraCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Payment Fees</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">${report.summary.paymentFees.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Seller Earnings</p>
              <p className="mt-2 text-2xl font-bold text-green-600">${report.summary.sellerEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Net Revenue</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">${report.summary.netRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-4 font-medium text-slate-900">Financial Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{report.summary.totalOrders}</p>
              <p className="mt-2 text-xs text-slate-600">Average per order: ${(report.summary.grossRevenue / Math.max(report.summary.totalOrders, 1)).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Commission Rate</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">15%</p>
              <p className="mt-2 text-xs text-slate-600">Fixed marketplace commission on all sales</p>
            </div>
          </div>
        </>
      )}

      {!report && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-12">
          <Calendar className="h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Click "Generate" to create your financial report</p>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
