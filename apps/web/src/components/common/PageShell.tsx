type PageShellProps = {
  title: string
  description: string
}

export function PageShell({ title, description }: PageShellProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(31,45,77,0.06)] sm:p-7 lg:p-8">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] bg-orange-50" aria-hidden="true" />
      <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Vendora marketplace</p>
      <h1 className="relative mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="relative mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  )
}
