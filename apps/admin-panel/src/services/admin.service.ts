import type { AdminOverview } from '../types'

const adminOverview: AdminOverview = {
  kpis: [
    { label: 'Gross Revenue', value: '$128.4K', delta: '+12.8%', tone: 'emerald' },
    { label: 'Total Orders', value: '2,134', delta: '+8.4%', tone: 'sky' },
    { label: 'New Customers', value: '864', delta: '+15.2%', tone: 'violet' },
    { label: 'Refund Rate', value: '0.8%', delta: '-1.1%', tone: 'rose' },
  ],
  salesBars: [42, 58, 64, 81, 71, 92, 86],
  topSellers: [
    { name: 'Luna Labs', sales: '$42.2K', rating: '4.8', orders: 210 },
    { name: 'North Peak', sales: '$38.1K', rating: '4.7', orders: 196 },
    { name: 'Urban Nest', sales: '$31.5K', rating: '4.9', orders: 188 },
    { name: 'Aster Studio', sales: '$27.6K', rating: '4.6', orders: 154 },
  ],
  recentOrders: [
    { id: '#10481', customer: 'Ava M.', total: '$289.00', status: 'Paid' },
    { id: '#10492', customer: 'Lucas P.', total: '$120.00', status: 'Pending' },
    { id: '#10502', customer: 'Sofia K.', total: '$410.00', status: 'Shipped' },
    { id: '#10513', customer: 'Ethan R.', total: '$179.00', status: 'Returned' },
  ],
  supportQueue: [
    { title: 'Seller verification', count: 12, color: 'bg-amber-500' },
    { title: 'Refund reviews', count: 8, color: 'bg-rose-500' },
    { title: 'Shipping disputes', count: 5, color: 'bg-sky-500' },
  ],
}

export const getAdminOverview = async (): Promise<AdminOverview> => {
  return adminOverview
}
