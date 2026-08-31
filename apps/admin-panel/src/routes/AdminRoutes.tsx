import { Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { ProductWarehouse } from '../pages/ProductWarehouse/ProductWarehouse'

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/users" element={<div className="p-8 text-slate-700">Admin users page coming soon.</div>} />
      <Route path="/admin/sellers" element={<div className="p-8 text-slate-700">Admin sellers page coming soon.</div>} />
      <Route path="/admin/sellers/:id" element={<div className="p-8 text-slate-700">Seller detail page coming soon.</div>} />
      <Route path="/admin/seller-applications" element={<div className="p-8 text-slate-700">Seller applications page coming soon.</div>} />
      <Route path="/admin/products" element={<div className="p-8 text-slate-700">Admin products page coming soon.</div>} />
      <Route path="/admin/product-warehouse" element={<ProductWarehouse />} />
      <Route path="/admin/subscription-plans" element={<ProductWarehouse />} />
      <Route path="/admin/orders" element={<div className="p-8 text-slate-700">Admin orders page coming soon.</div>} />
      <Route path="/admin/payments" element={<div className="p-8 text-slate-700">Payments page coming soon.</div>} />
      <Route path="/admin/withdrawals" element={<div className="p-8 text-slate-700">Withdrawals page coming soon.</div>} />
      <Route path="/admin/categories" element={<div className="p-8 text-slate-700">Categories page coming soon.</div>} />
      <Route path="/admin/brands" element={<div className="p-8 text-slate-700">Brands page coming soon.</div>} />
      <Route path="/admin/packages" element={<div className="p-8 text-slate-700">Packages page coming soon.</div>} />
      <Route path="/admin/reviews" element={<div className="p-8 text-slate-700">Reviews page coming soon.</div>} />
      <Route path="/admin/refunds" element={<div className="p-8 text-slate-700">Refunds page coming soon.</div>} />
      <Route path="/admin/commissions" element={<div className="p-8 text-slate-700">Commissions page coming soon.</div>} />
      <Route path="/admin/support" element={<div className="p-8 text-slate-700">Support page coming soon.</div>} />
      <Route path="/admin/reports" element={<div className="p-8 text-slate-700">Reports page coming soon.</div>} />
      <Route path="/admin/settings" element={<div className="p-8 text-slate-700">Admin settings page coming soon.</div>} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
