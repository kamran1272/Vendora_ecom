import { Link } from 'react-router-dom'
import { SELLER_REGISTRATION_URL } from '@/config/customer'

const customerLinks = [
  { label: 'About Vendora', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Help Center', href: '/support' },
]

const policyLinks = [
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
]

export function CustomerFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-[#1f2d4d] text-slate-200">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="text-2xl font-black text-white">Vendo<span className="text-orange-300">ra</span></Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">A connected marketplace for trusted stores, thoughtful shopping, and growing sellers.</p>
          <Link to="/categories" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-orange-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Browse categories</Link>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-orange-200">Customer service</h2>
          <ul className="mt-4 space-y-3 text-sm">{customerLinks.map((item) => <li key={item.href}><Link to={item.href} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">{item.label}</Link></li>)}</ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-orange-200">Policies</h2>
          <ul className="mt-4 space-y-3 text-sm">{policyLinks.map((item) => <li key={item.href}><Link to={item.href} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">{item.label}</Link></li>)}</ul>
          <a href={SELLER_REGISTRATION_URL} className="mt-5 inline-block text-sm font-bold text-orange-300 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">Become a seller</a>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-orange-200">Social links</h2>
          <ul className="mt-4 space-y-3 text-sm">{socialLinks.map((item) => <li key={item.label}><a href={item.href} target="_blank" rel="noreferrer" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">{item.label}</a></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Vendora. All rights reserved.</p>
          <p>Real products. Independent sellers. One marketplace.</p>
        </div>
      </div>
    </footer>
  )
}
