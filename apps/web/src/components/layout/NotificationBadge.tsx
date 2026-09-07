import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getAuthToken } from '@/services/api'

export function NotificationBadge() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    let active = true
    const load = () => apiRequest<{ count?: number }>('/notifications/unread-count').then((data) => { if (active) setCount(Number(data.count || 0)) }).catch(() => undefined)
    load()
    const interval = window.setInterval(load, 30000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])
  return <Link to="/account/notifications" aria-label={count ? `${count} unread notifications` : 'Notifications'} className="relative">🔔{count > 0 && <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-400 px-1 text-[10px] font-bold text-white">{count}</span>}</Link>
}
