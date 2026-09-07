import { FormEvent, useEffect, useState } from 'react'
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { SellerLayout } from '../../components/layout/SellerLayout'
import { getSellerWallet, setSellerTransactionPassword } from '../../services/withdrawals.service'

type WalletResponse = { hasTransactionPassword?: boolean }

export function SellerTransactionPasswordPage() {
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void getSellerWallet()
      .then((data) => setHasPassword(Boolean(data.hasTransactionPassword)))
      .catch((loadError: any) => setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load password status.'))
      .finally(() => setLoading(false))
  }, [])

  const clearFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (hasPassword && !currentPassword) { setError('Current transaction password is required.'); return }
    if (newPassword.length < 6) { setError('New transaction password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setError('New transaction passwords do not match.'); return }
    setSaving(true)
    try {
      const data = await setSellerTransactionPassword<{ message?: string }>({ currentPassword: hasPassword ? currentPassword : undefined, newPassword })
      setHasPassword(true)
      setNotice(data.message || 'Transaction password saved successfully.')
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || saveError?.message || 'Unable to save transaction password.')
    } finally {
      clearFields()
      setSaving(false)
    }
  }

  return <SellerLayout title="Transaction password" subtitle="Protect withdrawals and sensitive seller actions with a separate password.">
    {loading ? <div className="h-96 animate-pulse rounded-2xl bg-slate-200" /> : <div className="mx-auto max-w-2xl"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-7 text-white"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={24} /></div><div><h2 className="text-xl font-black">{hasPassword ? 'Change Transaction Password' : 'Create Transaction Password'}</h2><p className="mt-1 text-sm text-slate-300">Your password is securely hashed and never displayed or returned.</p></div></div></div><form onSubmit={submit} className="space-y-5 p-6">{error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}{notice ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={16} />{notice}</div> : null}{hasPassword ? <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">Current Password</span><div className="relative"><KeyRound size={16} className="absolute left-3 top-3 text-slate-400" /><input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-[#2d80d8]" /></div></label> : null}<label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">New Transaction Password</span><div className="relative"><LockKeyhole size={16} className="absolute left-3 top-3 text-slate-400" /><input required minLength={6} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-[#2d80d8]" /></div></label><label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">Confirm Transaction Password</span><div className="relative"><LockKeyhole size={16} className="absolute left-3 top-3 text-slate-400" /><input required minLength={6} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-[#2d80d8]" /></div></label><div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800"><div className="font-semibold">Security checklist</div><ul className="mt-2 list-disc space-y-1 pl-5 text-xs"><li>Use at least 6 characters.</li><li>Never reuse your main login password.</li><li>All fields are cleared after submission.</li></ul></div><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d80d8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f6dc5] disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}{saving ? 'Saving securely...' : hasPassword ? 'Change transaction password' : 'Create transaction password'}</button></form></section></div>}
  </SellerLayout>
}
