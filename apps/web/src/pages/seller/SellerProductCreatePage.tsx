import { PageShell } from '@/components/common/PageShell'

export function SellerProductCreatePage() {
  const formSections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Product name', type: 'text', placeholder: 'Smart Speaker Pro' },
        { label: 'Category', type: 'select', options: ['Electronics', 'Home', 'Fashion', 'Beauty', 'Sports'] },
        { label: 'Brand', type: 'select', options: ['NorthPeak', 'Volt', 'Luma', 'Nova', 'Summit', 'Aural'] },
        { label: 'Description', type: 'textarea', placeholder: 'Describe the product features, benefits, and value proposition.' },
        { label: 'Short description', type: 'text', placeholder: 'Premium wireless speaker with smart connectivity.' }
      ]
    },
    {
      title: 'Media',
      fields: [
        { label: 'Main image', type: 'file', placeholder: 'Upload main image' },
        { label: 'Gallery', type: 'file', placeholder: 'Upload product gallery images' },
        { label: 'Video', type: 'text', placeholder: 'https://example.com/video.mp4' },
        { label: 'Documents', type: 'file', placeholder: 'Add spec sheet or documents' }
      ]
    },
    {
      title: 'Pricing',
      fields: [
        { label: 'Regular price', type: 'number', placeholder: '129.00' },
        { label: 'Sale price', type: 'number', placeholder: '119.00' },
        { label: 'Tax', type: 'number', placeholder: '8.5' },
        { label: 'Cost', type: 'number', placeholder: '84.00' }
      ]
    },
    {
      title: 'Inventory',
      fields: [
        { label: 'SKU', type: 'text', placeholder: 'SPP-BLK-M' },
        { label: 'Stock', type: 'number', placeholder: '25' },
        { label: 'Minimum quantity', type: 'number', placeholder: '1' },
        { label: 'Maximum quantity', type: 'number', placeholder: '10' },
        { label: 'Stock management', type: 'select', options: ['Track inventory', 'Do not track', 'Use low stock alert'] }
      ]
    },
    {
      title: 'Variations',
      fields: [
        { label: 'Attributes', type: 'text', placeholder: 'Color, Size' },
        { label: 'Options', type: 'text', placeholder: 'Black / White / Red, S / M / L / XL' },
        { label: 'Variant combinations', type: 'textarea', placeholder: 'Set combinations, SKUs, and variant-specific stock and pricing.' }
      ]
    },
    {
      title: 'Shipping',
      fields: [
        { label: 'Weight', type: 'text', placeholder: '1.4 kg' },
        { label: 'Length', type: 'text', placeholder: '18 cm' },
        { label: 'Width', type: 'text', placeholder: '12 cm' },
        { label: 'Height', type: 'text', placeholder: '8 cm' },
        { label: 'Shipping class', type: 'select', options: ['Standard', 'Express', 'Fragile', 'Heavy item'] }
      ]
    },
    {
      title: 'SEO',
      fields: [
        { label: 'Meta title', type: 'text', placeholder: 'Smart Speaker Pro | Vendora' },
        { label: 'Meta description', type: 'textarea', placeholder: 'Premium wireless speaker with room-filling sound and smart voice assistant support.' },
        { label: 'Slug', type: 'text', placeholder: 'smart-speaker-pro' },
        { label: 'Keywords', type: 'text', placeholder: 'speaker, smart home, wireless audio' }
      ]
    },
    {
      title: 'Policies',
      fields: [
        { label: 'Warranty', type: 'text', placeholder: '12 months manufacturer warranty' },
        { label: 'Return', type: 'text', placeholder: '30-day return window' },
        { label: 'Refund', type: 'text', placeholder: 'Refund available for unused items' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageShell title="Create product" description="Add a new listing with product details, media, pricing, inventory, shipping, and marketplace-ready metadata." />
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Save draft</button>
          <button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">Submit for approval</button>
          <button className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white">Publish</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          {formSections.map((section) => (
            <section key={section.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900">{section.title}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
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
                    ) : field.type === 'select' ? (
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-brand-500 focus:bg-white">
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        <input type="file" className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                        <p className="mt-2">{field.placeholder}</p>
                      </div>
                    ) : (
                      <input
                        type={field.type}
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publishing status</p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-50 p-4">
              <span className="text-sm font-semibold text-brand-700">Draft</span>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">In progress</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li>• Required information is ready</li>
              <li>• Media upload is pending</li>
              <li>• SEO metadata recommended</li>
              <li>• Pricing and inventory check required</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <span className="h-8 w-16 rounded-full bg-brand-100" />
                  <span className="h-8 w-16 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex items-center gap-2"><input type="checkbox" /> Product name</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Category & brand</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Media assets</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Pricing & tax</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Inventory</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Variations</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Shipping details</label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
