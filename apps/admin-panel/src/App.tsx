import { AdminAuthProvider } from './auth/AdminAuthContext'
import { AdminRoutes } from './routes/AdminRoutes'

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  )
}
