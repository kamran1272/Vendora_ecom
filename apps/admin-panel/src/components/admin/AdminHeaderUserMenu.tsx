import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings, Shield, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../auth/AdminAuthContext'

export function AdminHeaderUserMenu() {
  const navigate = useNavigate()
  const { adminUser, logout } = useAdminAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const closeOnOutsideClick = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('mousedown', closeOnOutsideClick) }
  }, [open])

  if (!adminUser) return null

  const initials = (adminUser.name || adminUser.email || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const roleLabel = adminUser.role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  const openSettings = () => {
    setOpen(false)
    navigate('/admin/settings')
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Open account menu"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-sm">{initials}<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" /></div>
        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-sm font-semibold text-slate-800">{adminUser.name}</div>
          <div className="truncate text-xs text-slate-500">{adminUser.email}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(288px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
          <div className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{adminUser.name}</p>
            <p className="text-xs text-slate-500">{adminUser.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              <Shield className="h-3 w-3" /> {roleLabel}
            </div>
          </div>

          <div className="mt-2 space-y-1 border-b border-slate-100 pb-2">
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={openSettings}>
              <UserCircle className="h-4 w-4 text-slate-400" /> Profile
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={openSettings}>
              <Settings className="h-4 w-4 text-slate-400" /> Settings
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={openSettings}>
              <Shield className="h-4 w-4 text-slate-400" /> Security
            </button>
          </div>
          <button type="button" className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
