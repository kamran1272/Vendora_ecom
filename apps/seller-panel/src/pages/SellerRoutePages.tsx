import { SellerReviewsPage as SellerReviewsManagementPage } from './Reviews/SellerReviewsPage'
import { SellerProductQueriesPage as SellerProductQueriesManagementPage } from './ProductQueries/SellerProductQueriesPage'
import { SellerPackagesPage } from './Packages/SellerPackagesPage'
import { SellerPackagePaymentHistoryPage } from './Packages/SellerPackagePaymentHistoryPage'
import { SellerTrafficPackagesPage } from './Packages/SellerTrafficPackagesPage'
import { SellerTrafficPackagePaymentHistoryPage } from './Packages/SellerTrafficPackagePaymentHistoryPage'
import { SellerAffiliatePage as SellerAffiliateManagementPage } from './Affiliate/SellerAffiliatePage'
import { SellerWithdrawalsPage } from './Withdrawals/SellerWithdrawalsPage'
import { SellerShopSettingsPage } from './Shop/SellerShopSettingsPage'
import { SellerRefundRequestsPage } from './Refunds/SellerRefundRequestsPage'
import { SellerCommissionHistoryPage as SellerCommissionManagementPage } from './Commissions/SellerCommissionHistoryPage'
import { SellerSupportTicketsPage } from './Support/SellerSupportTicketsPage'
import { SellerUploadsManagerPage } from './Uploads/SellerUploadsPage'
import { SellerTransactionPasswordPage } from './Security/SellerTransactionPasswordPage'

export function SellerReviewsPage() {
  return <SellerReviewsManagementPage />
}

export function SellerPackagePage() {
  return <SellerPackagesPage />
}

export function SellerPackagePaymentListPage() {
  return <SellerPackagePaymentHistoryPage />
}

export function SellerSpreadPackagesPage() {
  return <SellerTrafficPackagesPage />
}

export function SellerSpreadPackagePaymentListPage() {
  return <SellerTrafficPackagePaymentHistoryPage />
}

export function SellerAffiliatePage() {
  return <SellerAffiliateManagementPage />
}

export function SellerMoneyWithdrawRequestsPage() {
  return <SellerWithdrawalsPage />
}

export function SellerShopPage() {
  return <SellerShopSettingsPage />
}

export function SellerRefundRequestPage() {
  return <SellerRefundRequestsPage />
}

export function SellerCommissionHistoryPage() {
  return <SellerCommissionManagementPage />
}

export function SellerProductQueriesPage() {
  return <SellerProductQueriesManagementPage />
}

export function SellerSupportTicketPage() {
  return <SellerSupportTicketsPage />
}

export function SellerUploadsPage() {
  return <SellerUploadsManagerPage />
}

export function SellerTransactionPage() {
  return <SellerTransactionPasswordPage />
}
