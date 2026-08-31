import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MarketplaceLayout>
        <AppRoutes />
      </MarketplaceLayout>
    </BrowserRouter>
  </React.StrictMode>
)
