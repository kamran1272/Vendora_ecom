import { Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { ProductWarehouse } from '../pages/ProductWarehouse/ProductWarehouse'
import { Products } from '../pages/Products/Products'

export function SellerRoutes() {
  return (
    <Routes>
      <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      <Route path="/seller/dashboard" element={<Dashboard />} />
      <Route path="/seller/products" element={<Products />} />
      <Route path="/seller/products/create" element={<div className="p-8 text-slate-700">Create product page coming soon.</div>} />
      <Route path="/seller/products/:id/edit" element={<div className="p-8 text-slate-700">Edit product page coming soon.</div>} />
      <Route path="/seller/product-warehouse" element={<ProductWarehouse />} />
      <Route path="/seller/product-storehouse" element={<ProductWarehouse />} />
      <Route path="/seller/orders" element={<div className="p-8 text-slate-700">Seller orders page coming soon.</div>} />
      <Route path="/seller/orders/:id" element={<div className="p-8 text-slate-700">Seller order detail page coming soon.</div>} />
      <Route path="/seller/package" element={<div className="p-8 text-slate-700">Seller package page coming soon.</div>} />
      <Route path="/seller/traffic-packages" element={<div className="p-8 text-slate-700">Traffic packages page coming soon.</div>} />
      <Route path="/seller/affiliate" element={<div className="p-8 text-slate-700">Affiliate page coming soon.</div>} />
      <Route path="/seller/withdraw" element={<div className="p-8 text-slate-700">Withdraw page coming soon.</div>} />
      <Route path="/seller/conversations" element={<div className="p-8 text-slate-700">Conversations page coming soon.</div>} />
      <Route path="/seller/settings" element={<div className="p-8 text-slate-700">Shop settings page coming soon.</div>} />
      <Route path="/seller/refunds" element={<div className="p-8 text-slate-700">Refunds page coming soon.</div>} />
      <Route path="/seller/commission-history" element={<div className="p-8 text-slate-700">Commission history page coming soon.</div>} />
      <Route path="/seller/product-queries" element={<div className="p-8 text-slate-700">Product queries page coming soon.</div>} />
      <Route path="/seller/support" element={<div className="p-8 text-slate-700">Support page coming soon.</div>} />
      <Route path="/seller/uploaded-files" element={<div className="p-8 text-slate-700">Uploaded files page coming soon.</div>} />
      <Route path="/seller/transaction-password" element={<div className="p-8 text-slate-700">Transaction password page coming soon.</div>} />
      <Route path="/seller/payment-settings" element={<div className="p-8 text-slate-700">Payment settings page coming soon.</div>} />
      <Route path="*" element={<Navigate to="/seller/dashboard" replace />} />
    </Routes>
  )
}
