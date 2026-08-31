import { PageShell } from '@/components/common/PageShell'

export function SellerSetupPage() {
  const shopSections = [
    {
      title: 'Shop Profile',
      fields: [
        { label: 'Shop name', type: 'text', placeholder: 'NorthPeak Studio' },
        { label: 'Shop slug', type: 'text', placeholder: 'northpeak-studio' },
        { label: 'Logo', type: 'file', placeholder: 'Upload shop logo' },
        { label: 'Banner', type: 'file', placeholder: 'Upload banner image' },
        { label: 'Description', type: 'textarea', placeholder: 'Tell shoppers what makes your store unique.' },
        { label: 'Contact information', type: 'text', placeholder: 'hello@northpeakstudio.com / +1 (555) 123-4567' }
      ]
    },
    {
      title: 'Address & Business',
      fields: [
        { label: 'Address', type: 'textarea', placeholder: 'Street, city, state, country, postal code' },
        { label: 'Business information', type: 'textarea', placeholder: 'Company registration, VAT, business details, and compliance information.' },
        { label: 'Shipping settings', type: 'textarea', placeholder: 'Domestic shipping, international shipping, fulfillment policy, carriers.' },
        { label: 'Return policy', type: 'textarea', placeholder: '30-day returns, exchange rules, conditions, and return shipping instructions.' }
      ]
    },
    {
      title: 'Social & SEO',
      fields: [
        { label: 'Social links', type: 'text', placeholder: 'Instagram, Facebook, X, LinkedIn, TikTok' },
        { label: 'SEO information', type: 'textarea', placeholder: 'Meta title, meta description, keywords, structured storefront content.' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageShell
          title="Create your shop"
          description="Set up your Vendora storefront, add your business details, and submit your shop for admin review before going live."
        />
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Save draft</button>
          <button className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Submit for approval</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          {shopSections.map((section) => (
            <section key={section.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900">{section.title}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Required
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {section.fields.map((field) => (
                  <label key={field.label} className={field.type === 'textarea' || field.type === 'file' ? 'md:col-span-2 block' : 'block'}>
                    <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                    ) : field.type === 'file' ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        <input type="file" className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                        <p className="mt-2">{field.placeholder}</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Application status</p>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">Pending admin review</p>
              <p className="mt-1 text-sm text-amber-700/80">Your shop is ready to be reviewed by Vendora admins.</p>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Seller registers</span>
                <span className="text-emerald-600">✓</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Creates shop</span>
                <span className="text-emerald-600">✓</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Submit application</span>
                <span className="text-brand-600">→</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Admin review</span>
                <span className="text-slate-400">Pending</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approval workflow</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Seller registers</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Creates shop</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Submits application</p>
              </div>
              <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-3">
                <p className="font-semibold text-brand-700">Admin review</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                <span>Approved</span>
                <span>Shop live</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-rose-700">
                <span>Rejected</span>
                <span>Needs changes</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
