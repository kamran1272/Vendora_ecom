import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <MarketplaceLayout>
        <AppRoutes />
      </MarketplaceLayout>
    </HashRouter>
  </React.StrictMode>
)
