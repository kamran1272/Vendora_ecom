import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import App from './App'
import { SellerToastHost } from './components/feedback/SellerToast'
import { SellerLanguageProvider } from './i18n/sellerLanguage'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <SellerLanguageProvider><App /></SellerLanguageProvider>
        <SellerToastHost />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
