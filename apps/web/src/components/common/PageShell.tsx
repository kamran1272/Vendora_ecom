type PageShellProps = {
  title: string
  description: string
}

export function PageShell({ title, description }: PageShellProps) {
  return (
    <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Vendora</p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      <p className="mt-3 text-slate-600">{description}</p>
    </div>
  )
}
