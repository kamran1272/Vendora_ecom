import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <h2 className="text-3xl font-bold">Page not found</h2>
      <p className="mt-3 text-slate-600">The route you requested does not exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">
        Back home
      </Link>
    </div>
  )
}
