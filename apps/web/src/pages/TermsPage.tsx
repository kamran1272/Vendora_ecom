import { PageShell } from '@/components/common/PageShell'

export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageShell title="Terms of service" description="The terms that govern shopping, selling, accounts, and use of the Vendora marketplace." />
      <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm sm:p-8">
        <section>
          <h2 className="text-lg font-bold text-slate-900">Using Vendora</h2>
          <p className="mt-2">Use Vendora lawfully, provide accurate account information, and keep your account credentials secure. Marketplace availability and pricing can change as sellers update their catalogs.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">Orders and sellers</h2>
          <p className="mt-2">Orders are fulfilled by independent sellers through the marketplace. Product, shipping, return, and payment details shown during checkout form part of the applicable order record.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">Account conduct</h2>
          <p className="mt-2">Do not misuse the marketplace, submit fraudulent information, attempt unauthorized access, or interfere with another customer or seller. We may restrict accounts that violate these terms.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">Support</h2>
          <p className="mt-2">Questions about an order or these terms can be directed to the Vendora support team through the Help Center.</p>
        </section>
      </article>
    </div>
  )
}
