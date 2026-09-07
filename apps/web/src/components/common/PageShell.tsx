type PageShellProps = {
  title: string
  description: string
}

export function PageShell({ title, description }: PageShellProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Vendora marketplace</p>
      <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  )
}
