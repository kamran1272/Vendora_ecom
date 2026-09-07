import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { SellerConversationsPage } from '../pages/Conversations/SellerConversations'
import { ProductStorehousePage } from '../pages/Storehouse/ProductStorehousePage'
import { Products } from '../pages/Products/Products'
import { SellerProductFormPage } from '../pages/Products/SellerProductFormPage'
import { SellerOrderDetailPage, SellerOrdersPage } from '../pages/Orders/SellerOrdersPages'
import { SellerAuthPage } from '../pages/Auth/SellerAuthPage'
import { isSellerSession } from '../services/api'
import { SellerNotificationsPage } from '../pages/Notifications/SellerNotificationsPage'
const SellerReviewsPage = lazy(() => import('../pages/Reviews/SellerReviewsPage').then((module) => ({ default: module.SellerReviewsPage })))
const SellerPackagePage = lazy(() => import('../pages/Packages/SellerPackagesPage').then((module) => ({ default: module.SellerPackagesPage })))
const SellerPackagePaymentListPage = lazy(() => import('../pages/Packages/SellerPackagePaymentHistoryPage').then((module) => ({ default: module.SellerPackagePaymentHistoryPage })))
const SellerSpreadPackagesPage = lazy(() => import('../pages/Packages/SellerTrafficPackagesPage').then((module) => ({ default: module.SellerTrafficPackagesPage })))
const SellerSpreadPackagePaymentListPage = lazy(() => import('../pages/Packages/SellerTrafficPackagePaymentHistoryPage').then((module) => ({ default: module.SellerTrafficPackagePaymentHistoryPage })))
const SellerAffiliatePage = lazy(() => import('../pages/Affiliate/SellerAffiliatePage').then((module) => ({ default: module.SellerAffiliatePage })))
const SellerMoneyWithdrawRequestsPage = lazy(() => import('../pages/Withdrawals/SellerWithdrawalsPage').then((module) => ({ default: module.SellerWithdrawalsPage })))
const SellerShopPage = lazy(() => import('../pages/Shop/SellerShopSettingsPage').then((module) => ({ default: module.SellerShopSettingsPage })))
const SellerRefundRequestPage = lazy(() => import('../pages/Refunds/SellerRefundRequestsPage').then((module) => ({ default: module.SellerRefundRequestsPage })))
const SellerCommissionHistoryPage = lazy(() => import('../pages/Commissions/SellerCommissionHistoryPage').then((module) => ({ default: module.SellerCommissionHistoryPage })))
const SellerProductQueriesPage = lazy(() => import('../pages/ProductQueries/SellerProductQueriesPage').then((module) => ({ default: module.SellerProductQueriesPage })))
const SellerSupportTicketPage = lazy(() => import('../pages/Support/SellerSupportTicketsPage').then((module) => ({ default: module.SellerSupportTicketsPage })))
const SellerUploadsPage = lazy(() => import('../pages/Uploads/SellerUploadsPage').then((module) => ({ default: module.SellerUploadsManagerPage })))
const SellerTransactionPage = lazy(() => import('../pages/Security/SellerTransactionPasswordPage').then((module) => ({ default: module.SellerTransactionPasswordPage })))

function SellerProtectedRoute({ children }: { children: ReactNode }) {
  return isSellerSession() ? children : <Navigate to="/users/login" replace />
}

export function SellerRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading seller page...</div>}>
    <Routes>
      <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      <Route path="/users/login" element={<SellerAuthPage />} />
      <Route path="/users/registration" element={<SellerAuthPage />} />
      <Route path="/seller/login" element={<Navigate to="/users/login" replace />} />
      <Route path="/seller/register" element={<Navigate to="/users/registration" replace />} />

      <Route path="/seller/dashboard" element={<SellerProtectedRoute><Dashboard /></SellerProtectedRoute>} />

      <Route path="/seller/products" element={<SellerProtectedRoute><Products /></SellerProtectedRoute>} />
      <Route path="/seller/reviews" element={<SellerProtectedRoute><SellerReviewsPage /></SellerProtectedRoute>} />
      <Route path="/seller/products/create" element={<SellerProtectedRoute><SellerProductFormPage /></SellerProtectedRoute>} />
      <Route path="/seller/products/:id/edit" element={<SellerProtectedRoute><SellerProductFormPage /></SellerProtectedRoute>} />

      <Route path="/seller/product/storehouse" element={<SellerProtectedRoute><ProductStorehousePage /></SellerProtectedRoute>} />
      <Route path="/seller/product-warehouse" element={<Navigate to="/seller/product/storehouse" replace />} />
      <Route path="/seller/product-storehouse" element={<Navigate to="/seller/product/storehouse" replace />} />
      <Route path="/seller/product" element={<Navigate to="/seller/product/storehouse" replace />} />

      <Route path="/seller/orders/:id" element={<SellerProtectedRoute><SellerOrderDetailPage /></SellerProtectedRoute>} />
      <Route path="/seller/orders" element={<SellerProtectedRoute><SellerOrdersPage /></SellerProtectedRoute>} />

      <Route path="/seller/seller-packages" element={<SellerProtectedRoute><SellerPackagePage /></SellerProtectedRoute>} />
      <Route path="/seller/packages-payment-list" element={<SellerProtectedRoute><SellerPackagePaymentListPage /></SellerProtectedRoute>} />
      <Route path="/seller/package" element={<Navigate to="/seller/seller-packages" replace />} />

      <Route path="/seller/seller-spread-packages" element={<SellerProtectedRoute><SellerSpreadPackagesPage /></SellerProtectedRoute>} />
      <Route path="/seller/spread-packages-payment-list" element={<SellerProtectedRoute><SellerSpreadPackagePaymentListPage /></SellerProtectedRoute>} />
      <Route path="/seller/traffic-packages" element={<Navigate to="/seller/seller-spread-packages" replace />} />

      <Route path="/seller/affiliate" element={<SellerProtectedRoute><SellerAffiliatePage /></SellerProtectedRoute>} />
      <Route path="/seller/money-withdraw-requests" element={<SellerProtectedRoute><SellerMoneyWithdrawRequestsPage /></SellerProtectedRoute>} />
      <Route path="/seller/payment-settings" element={<Navigate to="/seller/money-withdraw-requests" replace />} />
      <Route path="/seller/withdraw" element={<Navigate to="/seller/money-withdraw-requests" replace />} />

      <Route path="/seller/conversations" element={<SellerProtectedRoute><SellerConversationsPage /></SellerProtectedRoute>} />
      <Route path="/seller/notifications" element={<SellerProtectedRoute><SellerNotificationsPage /></SellerProtectedRoute>} />

      <Route path="/seller/shop" element={<SellerProtectedRoute><SellerShopPage /></SellerProtectedRoute>} />
      <Route path="/seller/settings" element={<Navigate to="/seller/shop" replace />} />

      <Route path="/refund-request" element={<SellerProtectedRoute><SellerRefundRequestPage /></SellerProtectedRoute>} />
      <Route path="/seller/refunds" element={<Navigate to="/refund-request" replace />} />

      <Route path="/seller/commission-history" element={<SellerProtectedRoute><SellerCommissionHistoryPage /></SellerProtectedRoute>} />
      <Route path="/seller/product-queries" element={<SellerProtectedRoute><SellerProductQueriesPage /></SellerProtectedRoute>} />
      <Route path="/seller/support_ticket" element={<SellerProtectedRoute><SellerSupportTicketPage /></SellerProtectedRoute>} />
      <Route path="/seller/support" element={<Navigate to="/seller/support_ticket" replace />} />

      <Route path="/seller/uploads" element={<SellerProtectedRoute><SellerUploadsPage /></SellerProtectedRoute>} />
      <Route path="/seller/uploaded-files" element={<Navigate to="/seller/uploads" replace />} />

      <Route path="/seller/transaction" element={<SellerProtectedRoute><SellerTransactionPage /></SellerProtectedRoute>} />
      <Route path="/seller/transaction-password" element={<Navigate to="/seller/transaction" replace />} />

      <Route path="*" element={<Navigate to="/seller/dashboard" replace />} />
    </Routes>
    </Suspense>
  )
}
