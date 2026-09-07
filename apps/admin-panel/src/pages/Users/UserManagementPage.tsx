import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../layouts/AdminLayout'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '../../components/feedback/AdminFeedback'
import {
  deleteAdminUser,
  getAdminUserActivity,
  getAdminUserById,
  getAdminUserOrders,
  getAdminUserPayments,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from '../../services/adminApi'

type UserRecord = Record<string, unknown>

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric) : '$0.00'
}

export function UserManagementPage() {
  const [items, setItems] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getAdminUsers({ page, limit: 10, search, role, status, from, to })
      if (result && typeof result === 'object' && 'items' in result) {
        setItems((result as { items: UserRecord[] }).items)
        setTotalPages(Number((result as { totalPages?: number }).totalPages ?? 1))
      } else {
        setItems(Array.isArray(result) ? result : [])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [page, search, role, status, from, to])

  const roleOptions = useMemo(() => ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'], [])
  const statusOptions = useMemo(() => ['ACTIVE', 'PENDING', 'BLOCKED', 'INACTIVE'], [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">User operations</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">User management</h2>
            </div>
            <button type="button" onClick={() => void loadUsers()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">Refresh</button>
          </div>
        </header>

        <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search name or email" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <select value={role} onChange={(event) => { setPage(1); setRole(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400">
              <option value="">All roles</option>
              {roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400">
              <option value="">All statuses</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400" />
            <button type="button" onClick={() => { setPage(1); setSearch(''); setRole(''); setStatus(''); setFrom(''); setTo('') }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">Clear filters</button>
          </div>
        </section>

        {loading ? <AdminTableSkeleton columns={6} /> : error ? <AdminErrorState onRetry={() => void loadUsers()} message={error} /> : items.length === 0 ? <AdminEmptyState title="No users found" message="No users match your current filters." action={{ label: 'Clear filters', onClick: () => { setPage(1); setSearch(''); setRole(''); setStatus(''); setFrom(''); setTo('') } }} /> : (
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => {
                    const statusValue = String((typeof user.status === 'string' ? user.status : user.isBlocked === true ? 'BLOCKED' : 'ACTIVE') || 'ACTIVE').toUpperCase()
                    return (
                      <tr key={String(user.id ?? '')} className="border-t border-slate-200">
                        <td className="px-4 py-3"><Link to={`/admin/users/${String(user.id ?? '')}`} className="font-semibold text-slate-900 hover:text-sky-600">{String(user.name ?? 'Unnamed user')}</Link></td>
                        <td className="px-4 py-3">{String(user.email ?? '—')}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{String(user.role ?? 'CUSTOMER')}</span></td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusValue === 'BLOCKED' ? 'bg-rose-100 text-rose-700' : statusValue === 'INACTIVE' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{statusValue}</span></td>
                        <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/admin/users/${String(user.id ?? '')}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">View</Link>
                            <button type="button" onClick={async () => { await updateAdminUserStatus(String(user.id ?? ''), { isBlocked: !(user.isBlocked === true) }); void loadUsers() }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">{user.isBlocked === true ? 'Unblock' : 'Block'}</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <nav aria-label="Users pagination" className="admin-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="admin-pagination-button" aria-label="Previous users page">Previous</button>
              <span className="admin-pagination-status" aria-live="polite">Page {page} <span aria-hidden="true">/</span> {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="admin-pagination-button" aria-label="Next users page">Next</button>
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export function UserDetailPage() {
  const { id } = useParams()
  const [user, setUser] = useState<UserRecord>({})
  const [orders, setOrders] = useState<UserRecord[]>([])
  const [payments, setPayments] = useState<UserRecord[]>([])
  const [activity, setActivity] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUser = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const [detail, orderList, paymentList, activityList] = await Promise.all([
        getAdminUserById(id),
        getAdminUserOrders(id),
        getAdminUserPayments(id),
        getAdminUserActivity(id),
      ])
      setUser(detail || {})
      setOrders(orderList || [])
      setPayments(paymentList || [])
      setActivity(activityList || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load user details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUser()
  }, [id])

  const handleStatusToggle = async () => {
    if (!id) return
    await updateAdminUserStatus(id, { isBlocked: !(user.isBlocked === true) })
    await loadUser()
  }

  const handleDelete = async () => {
    if (!id) return
    await deleteAdminUser(id)
    window.location.href = '/admin/users'
  }

  const handleResetPassword = async () => {
    if (!id) return
    await resetAdminUserPassword(id, 'Vendora@2026')
    alert('Password reset to Vendora@2026')
  }

  if (loading) return <AdminLayout><div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading user details…</div></AdminLayout>
  if (error) return <AdminLayout><div className="rounded-[28px] bg-white p-8 text-rose-600 shadow-sm ring-1 ring-slate-200">{error}</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">User profile</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{String(user.name ?? 'User')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleStatusToggle} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">{user.isBlocked === true ? 'Unblock' : 'Block'}</button>
              <button type="button" onClick={handleResetPassword} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Reset password</button>
              <button type="button" onClick={handleDelete} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">Delete</button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 2xl:grid-cols-[1.2fr_2fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">Profile</h3>
            <dl className="mt-5 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Name</dt><dd className="font-medium text-slate-900">{String(user.name ?? '—')}</dd></div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Email</dt><dd className="font-medium text-slate-900">{String(user.email ?? '—')}</dd></div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Role</dt><dd className="font-medium text-slate-900">{String(user.role ?? 'CUSTOMER')}</dd></div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Status</dt><dd className="font-medium text-slate-900">{String(user.status ?? (user.isBlocked === true ? 'BLOCKED' : 'ACTIVE')).toUpperCase()}</dd></div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Verified</dt><dd className="font-medium text-slate-900">{user.emailVerified === true ? 'Yes' : 'No'}</dd></div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt>Joined</dt><dd className="font-medium text-slate-900">{formatDate(user.createdAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Last login</dt><dd className="font-medium text-slate-900">{formatDate(user.lastLoginAt)}</dd></div>
            </dl>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Edit user</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input defaultValue={String(user.name ?? '')} onBlur={async (event) => { await updateAdminUser(String(id ?? ''), { name: event.target.value }) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" placeholder="Name" />
                <input defaultValue={String(user.email ?? '')} onBlur={async (event) => { await updateAdminUser(String(id ?? ''), { email: event.target.value }) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" placeholder="Email" />
                <select defaultValue={String(user.role ?? 'CUSTOMER')} onChange={async (event) => { await updateAdminUser(String(id ?? ''), { role: event.target.value }); await loadUser() }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
                <select defaultValue={String((typeof user.status === 'string' ? user.status : user.isBlocked === true ? 'BLOCKED' : 'ACTIVE') || 'ACTIVE').toUpperCase()} onChange={async (event) => { await updateAdminUserStatus(String(id ?? ''), { status: event.target.value }); await loadUser() }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Order history</h3>
              <div className="mt-4 space-y-3">
                {orders.length === 0 ? <p className="text-sm text-slate-500">No orders found.</p> : orders.slice(0, 5).map((order) => (
                  <div key={String(order.id ?? '')} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div>
                      <div className="font-semibold text-slate-800">{String(order.id ?? 'Order')}</div>
                      <div className="text-sm text-slate-500">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatMoney(order.total)}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">{String(order.status ?? 'PENDING')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Payment history</h3>
              <div className="mt-4 space-y-3">
                {payments.length === 0 ? <p className="text-sm text-slate-500">No payment records found.</p> : payments.slice(0, 5).map((payment) => (
                  <div key={String(payment.id ?? '')} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div>
                      <div className="font-semibold text-slate-800">{String(payment.id ?? 'Payment')}</div>
                      <div className="text-sm text-slate-500">{String(payment.method ?? 'Card')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatMoney(payment.amount)}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">{String(payment.status ?? 'PENDING')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Activity history</h3>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? <p className="text-sm text-slate-500">No activity recorded.</p> : activity.slice(0, 10).map((entry, index) => (
              <div key={`${String(entry.type ?? 'activity')}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <div className="font-semibold text-slate-800">{String(entry.label ?? entry.type ?? 'Activity')}</div>
                  <div className="text-sm text-slate-500">{String(entry.type ?? 'activity').replace(/_/g, ' ')}</div>
                </div>
                <div className="text-sm text-slate-500">{formatDate(entry.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
