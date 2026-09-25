import { useMemo, useState } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { Card } from '@/components/ui/DesignSystem'
import { useAuth } from '@/store/auth'

export function AffiliatePage() {
  const user = useAuth((state) => state.user)
  const [copied, setCopied] = useState(false)
  const referralUrl = useMemo(() => `${window.location.origin}/register?ref=${user?.id || 'customer'}`, [user?.id])
  const copyReferral = async () => { await navigator.clipboard?.writeText(referralUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
  return <div className="space-y-6"><PageShell title="Affiliate referrals" description="Share Vendora with friends using your personal referral link." /><Card className="max-w-2xl p-6"><h2 className="text-xl font-black text-slate-900">Your referral link</h2><p className="mt-2 text-sm text-slate-600">Referral analytics and payouts are not enabled for customer accounts yet. The link is ready to share.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input readOnly value={referralUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" /><button type="button" onClick={() => void copyReferral()} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">{copied ? 'Copied' : 'Copy link'}</button></div></Card></div>
}
