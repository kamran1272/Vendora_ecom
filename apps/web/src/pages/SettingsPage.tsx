import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { apiRequest } from '@/services/api'

function TwoFactorSetup() {
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const start = async () => {
    const result = await apiRequest<{ qrCodeDataUrl: string; secret: string }>('/auth/2fa/setup', { method: 'POST' })
    setSetup(result)
    setMessage('Scan the QR code, then enter the six-digit code from your authenticator app.')
  }

  const enable = async () => {
    const result = await apiRequest<{ message: string; backupCodes: string[] }>('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) })
    setBackupCodes(result.backupCodes)
    setMessage(result.message)
    setSetup(null)
    setCode('')
  }

  return <Card className="p-6"><h2 className="text-xl font-black text-slate-900">Two-factor authentication</h2><p className="mt-2 text-sm text-slate-600">Use an authenticator app and backup codes to protect your account.</p>{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}{setup ? <div className="mt-4 space-y-3"><img src={setup.qrCodeDataUrl} alt="Authenticator setup QR code" className="h-40 w-40 rounded-lg border border-slate-200" /><p className="text-xs text-slate-500">Manual key: {setup.secret}</p><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Authenticator code" inputMode="numeric" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /><button type="button" onClick={enable} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Enable 2FA</button></div> : <button type="button" onClick={start} className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">Set up authenticator</button>}{backupCodes.length > 0 && <p className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700">Save backup codes: {backupCodes.join(' ')}</p>}</Card>
}

export function SettingsPage() {
  const [language, setLanguage] = useState('English')
  const [currency, setCurrency] = useState('USD')
  const [saved, setSaved] = useState(false)
  const saveSettings = () => { localStorage.setItem('vendora-customer-preferences', JSON.stringify({ language, currency })); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }
  return <div className="space-y-6"><PageShell title="Account settings" description="Manage marketplace preferences and quickly access your account security controls." /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-6"><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Marketplace preferences</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold text-slate-700">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option>English</option><option>Urdu</option></select></label><label><span className="mb-1 block text-sm font-semibold text-slate-700">Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option>USD</option><option>PKR</option></select></label></div><button type="button" onClick={saveSettings} className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white">{saved ? 'Saved' : 'Save preferences'}</button></Card><TwoFactorSetup /></div><Card className="p-6"><h2 className="text-xl font-black text-slate-900">Account controls</h2><div className="mt-4 space-y-2"><Link to="/account/profile" className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300">Profile information</Link><Link to="/account/payment-methods" className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300">Payment methods</Link><Link to="/account/notifications" className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300">Notifications</Link></div></Card></div></div>
}
