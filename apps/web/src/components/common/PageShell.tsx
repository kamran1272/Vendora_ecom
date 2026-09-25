type PageShellProps = {
  title: string
  description: string
}

export function PageShell({ title, description }: PageShellProps) {
  return (
    <div className="marketplace-page-header relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50 to-orange-50 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
      <div className="absolute -bottom-16 -right-8 h-40 w-40 rounded-full bg-orange-200/30 blur-2xl" aria-hidden="true" />
      <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">Vendora marketplace</p>
      <h1 className="relative mt-2 text-2xl font-black tracking-tight text-[#102451] sm:text-3xl">{title}</h1>
      <p className="relative mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  )
}
