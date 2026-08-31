import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/public/HomePage'
import { SearchPage } from '@/pages/public/SearchPage'
import { CategoryPage } from '@/pages/public/CategoryPage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage'
import { SellerSetupPage } from '@/pages/seller/SellerSetupPage'
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage'
import { SellerProductCreatePage } from '@/pages/seller/SellerProductCreatePage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminSellersPendingPage } from '@/pages/admin/AdminSellersPendingPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<SearchPage />} />
      <Route path="/products" element={<SearchPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/categories" element={<CategoryPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/shops/create" element={<SellerSetupPage />} />
      <Route path="/seller" element={<SellerDashboardPage />} />
      <Route path="/seller/products/create" element={<SellerProductCreatePage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/sellers/pending" element={<AdminSellersPendingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
