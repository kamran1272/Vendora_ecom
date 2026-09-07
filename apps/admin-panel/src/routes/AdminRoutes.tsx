import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestAdminRoute, ProtectedAdminRoute, AdminUnauthorizedPage } from '../auth/AdminAuthContext'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { AdminSupportCenterPage } from '../pages/Support/AdminSupportCenter'
import { ProductWarehouse } from '../pages/ProductWarehouse/ProductWarehouse'
import { SubscriptionPlansPage } from '../pages/SubscriptionPlans/SubscriptionPlansPage'
import { AdminCollectionPage, AdminDetailPage } from '../pages/admin/AdminCollectionPage'
import { SellerManagementPage, SellerDetailPage } from '../pages/Sellers/SellerManagementPage'
import { SellerApplicationsPage, SellerApplicationDetailPage } from '../pages/Sellers/SellerApplicationsPage'
import { UserManagementPage, UserDetailPage } from '../pages/Users/UserManagementPage'
import { ProductModerationDetailPage } from '../pages/Products/ProductModerationDetailPage'
import { OrderDetailPage, OrdersPage } from '../pages/Orders/OrdersPage'
import { PaymentsPage } from '../pages/Payments/PaymentsPage'
import { WithdrawalsPage } from '../pages/Withdrawals/WithdrawalsPage'
import { CategoriesPage } from '../pages/Categories/CategoriesPage'
import { BrandsPage } from '../pages/Brands/BrandsPage'
import { PackagesPage } from '../pages/Packages/PackagesPage'
import { ReviewsPage } from '../pages/Reviews/ReviewsPage'
import { RefundsPage } from '../pages/Refunds/RefundsPage'
import { CommissionsPage } from '../pages/Commissions/CommissionsPage'
import { AdminNotificationsPage } from '../pages/Notifications/AdminNotificationsPage'
import { SalesReportPage } from '../pages/Reports/SalesReportPage'
import { OrdersReportPage } from '../pages/Reports/OrdersReportPage'
import { ProductsReportPage } from '../pages/Reports/ProductsReportPage'
import { SellersReportPage } from '../pages/Reports/SellersReportPage'
import { CustomersReportPage } from '../pages/Reports/CustomersReportPage'
import { FinancialReportPage } from '../pages/Reports/FinancialReportPage'
import { RefundsReportPage } from '../pages/Reports/RefundsReportPage'
import { WithdrawalsReportPage } from '../pages/Reports/WithdrawalsReportPage'
import { CommissionReportPage } from '../pages/Reports/CommissionReportPage'
import { ReportsPage } from '../pages/Reports/ReportsPage'
import { AdminSettingsPage } from '../pages/Settings/AdminSettingsPage'
import { AdminRecordDetailPage } from '../pages/admin/AdminRecordDetailPage'
import {
  approveProduct,
  archiveProduct,
  deleteProduct,
  featureProduct,
  getAdminBrands,
  getAdminCategories,
  getAdminCommissions,
  getAdminDashboardOverview,
  getAdminPackages,
  getAdminOrders,
  getAdminPayments,
  getAdminProductById,
  getAdminProducts,
  getAdminRefunds,
  getAdminReports,
  getAdminReviews,
  getAdminSettings,
  getAdminSellers,
  getAdminSellerById,
  getAdminWithdrawals,
  getAdminWarehouseProducts,
  getSubscriptionPlans,
  rejectProduct,
  suspendProduct,
  updateProductStatus,
} from '../services/adminApi'

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<GuestAdminRoute />}>
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route path="/admin/unauthorized" element={<AdminUnauthorizedPage />} />

      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />

      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/users/:id" element={<UserDetailPage />} />

      <Route path="/admin/sellers" element={<SellerManagementPage />} />
      <Route path="/admin/sellers/:id" element={<SellerDetailPage />} />

      <Route path="/admin/seller-applications" element={<SellerApplicationsPage />} />
      <Route path="/admin/seller-applications/:id" element={<SellerApplicationDetailPage />} />

      <Route
        path="/admin/products"
        element={
          <AdminCollectionPage
            title="Marketplace product moderation"
            description="Review seller listings, inventory health, approval status, and storefront visibility across the marketplace."
            fetcher={getAdminProducts}
            columns={[
              { key: 'image', label: 'Image', render: (value) => {
                  const src = typeof value === 'string' ? value : Array.isArray((value as any)) ? (value as string[])[0] : ((value as any)?.[0] ?? '')
                  return src ? <img src={src} alt="Product" className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">IMG</div>
                } },
              { key: 'name', label: 'Product' },
              { key: 'sku', label: 'SKU' },
              { key: 'seller', label: 'Seller' },
              { key: 'shop', label: 'Shop' },
              { key: 'category', label: 'Category' },
              { key: 'brand', label: 'Brand' },
              { key: 'price', label: 'Price' },
              { key: 'stock', label: 'Stock' },
              { key: 'sales', label: 'Sales' },
              { key: 'rating', label: 'Rating' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created' },
            ]}
            detailPath={(row) => `/admin/products/${row.id}`}
            rowActions={[
              {
                label: 'View',
                onClick: async (row) => {
                  const detail = await getAdminProductById(String(row.id ?? ''))
                  if (detail && Object.keys(detail).length) {
                    window.location.href = `/admin/products/${row.id}`
                  }
                },
              },
              {
                label: 'Edit',
                onClick: async (row) => {
                  window.location.href = `/admin/products/${row.id}`
                },
              },
              {
                label: 'Approve',
                tone: 'primary',
                onClick: async (row) => {
                  await approveProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
              {
                label: 'Reject',
                tone: 'danger',
                onClick: async (row) => {
                  await rejectProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
              {
                label: 'Suspend',
                onClick: async (row) => {
                  await suspendProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
              {
                label: 'Feature',
                onClick: async (row) => {
                  await featureProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
              {
                label: 'Archive',
                onClick: async (row) => {
                  await archiveProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
              {
                label: 'Delete',
                tone: 'danger',
                onClick: async (row) => {
                  await deleteProduct(String(row.id ?? ''))
                  window.location.reload()
                },
              },
            ]}
            emptyMessage="No products are available in the marketplace yet."
          />
        }
      />

      <Route path="/admin/products/:id" element={<ProductModerationDetailPage />} />

      <Route path="/admin/product-warehouse" element={<ProductWarehouse />} />
      <Route path="/admin/product-warehouse/:id" element={<AdminRecordDetailPage title="Warehouse product detail" description="Review warehouse inventory, pricing, catalog metadata, and publication status." fetcher={getAdminWarehouseProducts} backPath="/admin/product-warehouse" backLabel="Product warehouse" />} />
      <Route path="/admin/subscription-plans" element={<SubscriptionPlansPage />} />
      <Route path="/admin/subscription-plans/:id" element={<AdminRecordDetailPage title="Subscription plan detail" description="Review seller plan pricing, limits, features, and availability." fetcher={getSubscriptionPlans} backPath="/admin/subscription-plans" backLabel="Subscription plans" />} />

      <Route path="/admin/orders" element={<OrdersPage />} />
      <Route path="/admin/orders/:id" element={<OrderDetailPage />} />

      <Route path="/admin/payments" element={<PaymentsPage />} />
      <Route path="/admin/payments/:id" element={<AdminRecordDetailPage title="Payment detail" description="Review gateway status, transaction data, fees, and commission values." fetcher={getAdminPayments} backPath="/admin/payments" backLabel="Payments" />} />

      <Route path="/admin/withdrawals" element={<WithdrawalsPage />} />
      <Route path="/admin/withdrawals/:id" element={<AdminRecordDetailPage title="Withdrawal detail" description="Review payout status, seller information, method, and processing history." fetcher={getAdminWithdrawals} backPath="/admin/withdrawals" backLabel="Withdrawals" />} />

      <Route path="/admin/categories" element={<CategoriesPage />} />
      <Route path="/admin/categories/:id" element={<AdminRecordDetailPage title="Category detail" description="Review category metadata, hierarchy, ordering, and storefront status." fetcher={getAdminCategories} backPath="/admin/categories" backLabel="Categories" />} />

      <Route path="/admin/brands" element={<BrandsPage />} />
      <Route path="/admin/brands/:id" element={<AdminRecordDetailPage title="Brand detail" description="Review brand identity, status, and catalog associations." fetcher={getAdminBrands} backPath="/admin/brands" backLabel="Brands" />} />

      <Route path="/admin/packages" element={<PackagesPage />} />
      <Route path="/admin/packages/:id" element={<AdminRecordDetailPage title="Package detail" description="Review package pricing, limits, features, and availability." fetcher={getAdminPackages} backPath="/admin/packages" backLabel="Packages" />} />

      <Route path="/admin/reviews" element={<ReviewsPage />} />
      <Route path="/admin/reviews/:id" element={<AdminRecordDetailPage title="Review detail" description="Review customer feedback, moderation state, and seller response context." fetcher={getAdminReviews} backPath="/admin/reviews" backLabel="Reviews" />} />

      <Route path="/admin/refunds" element={<RefundsPage />} />
      <Route path="/admin/refunds/:id" element={<AdminRecordDetailPage title="Refund detail" description="Review refund amount, order context, reason, and processing status." fetcher={getAdminRefunds} backPath="/admin/refunds" backLabel="Refunds" />} />

      <Route path="/admin/commissions" element={<CommissionsPage />} />
      <Route path="/admin/commissions/:id" element={<AdminRecordDetailPage title="Commission detail" description="Review seller commission, order attribution, and settlement information." fetcher={getAdminCommissions} backPath="/admin/commissions" backLabel="Commissions" />} />

      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />

      <Route path="/admin/support" element={<AdminSupportCenterPage />} />

      <Route path="/admin/reports/sales" element={<SalesReportPage />} />

      <Route path="/admin/reports/orders" element={<OrdersReportPage />} />

      <Route path="/admin/reports/products" element={<ProductsReportPage />} />

      <Route path="/admin/reports/sellers" element={<SellersReportPage />} />

      <Route path="/admin/reports/customers" element={<CustomersReportPage />} />

      <Route path="/admin/reports/financial" element={<FinancialReportPage />} />

      <Route path="/admin/reports/refunds" element={<RefundsReportPage />} />

      <Route path="/admin/reports/withdrawals" element={<WithdrawalsReportPage />} />

      <Route path="/admin/reports/commissions" element={<CommissionReportPage />} />

      <Route path="/admin/reports" element={<ReportsPage />} />

        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
