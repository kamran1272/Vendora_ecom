import { useState } from 'react'
import { Bot, MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FloatingBotChat() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"><button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close AI support assistant' : 'Open AI support assistant'} title={open ? 'Close AI support assistant' : 'Open AI support assistant'} className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 focus-visible:outline-offset-4"><Bot className="h-5 w-5" /></button>{open ? <div className="w-[min(calc(100vw-2rem),340px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600"><MessageCircle className="h-3.5 w-3.5" /> AI support assistant</p><h2 className="mt-1 text-base font-semibold text-slate-950">Support command center</h2><p className="mt-2 text-sm leading-5 text-slate-600">Open the real seller and customer inbox, then manage every conversation from its three-dot menu.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close support shortcut" title="Close support shortcut" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div><button type="button" onClick={() => { setOpen(false); navigate('/admin/support') }} className="mt-4 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Open Support Center</button></div> : null}</div>
}
