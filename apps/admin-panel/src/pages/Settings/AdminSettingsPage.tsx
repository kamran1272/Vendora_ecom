import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { getAdminSettings, updateAdminSettings } from '../../services/adminApi'

type SettingsSectionName =
  | 'general'
  | 'marketplace'
  | 'payments'
  | 'shipping'
  | 'taxes'
  | 'commission'
  | 'email'
  | 'notifications'
  | 'security'
  | 'seo'
  | 'maintenance'

type SettingsRecord = Record<string, any>

type SettingsTab = {
  id: SettingsSectionName
  label: string
  description: string
}

const tabs: SettingsTab[] = [
  { id: 'general', label: 'General', description: 'Branding and default storefront behavior' },
  { id: 'marketplace', label: 'Marketplace', description: 'Catalog, approval, and seller operations' },
  { id: 'payments', label: 'Payments', description: 'Gateways, wallets, and payouts' },
  { id: 'shipping', label: 'Shipping', description: 'Fulfillment and delivery defaults' },
  { id: 'taxes', label: 'Taxes', description: 'VAT and tax calculation rules' },
  { id: 'commission', label: 'Commission', description: 'Vendor revenue and fee settings' },
  { id: 'email', label: 'Email', description: 'Transactional messages and sender defaults' },
  { id: 'notifications', label: 'Notifications', description: 'Alerts and digital communication' },
  { id: 'security', label: 'Security', description: 'Access policies and account protection' },
  { id: 'seo', label: 'SEO', description: 'Search and metadata defaults' },
  { id: 'maintenance', label: 'Maintenance', description: 'Platform availability and downtime notices' },
]

const emptySettings: SettingsRecord = {
  general: {
    siteName: '',
    siteTagline: '',
    supportEmail: '',
    timezone: 'UTC',
    defaultLanguage: 'en',
    maintenanceMode: false,
  },
  marketplace: {
    storefrontName: '',
    sellerRegistration: true,
    autoApproveSellers: false,
    productApproval: 'manual',
    reviewModeration: true,
    defaultCurrency: 'USD',
    featuredProductsLimit: 12,
  },
  payments: {
    defaultGateway: 'stripe',
    allowWallet: true,
    enableCOD: true,
    enableStripe: true,
    stripeTestingMode: true,
    payoutSchedule: 'weekly',
    requireBillingAddress: true,
  },
  shipping: {
    defaultCarrier: 'standard',
    freeShippingThreshold: 80,
    handlingTime: 2,
    returnWindow: 14,
    localPickup: true,
    shippingZones: 'domestic',
  },
  taxes: {
    enableVAT: true,
    taxCalculation: 'automatic',
    taxRate: 8,
    invoicePrefix: 'INV',
    taxExemptThreshold: 0,
  },
  commission: {
    platformCommission: 12,
    sellerCommission: 88,
    affiliateCommission: 5,
    refundCommissionWaiver: true,
    minPayout: 25,
  },
  email: {
    senderName: '',
    senderEmail: '',
    mailProvider: 'smtp',
    transactionalEnabled: true,
    welcomeTemplate: 'enabled',
    orderAlertTemplate: 'enabled',
  },
  notifications: {
    browserPush: true,
    inAppAlerts: true,
    emailAlerts: true,
    smsAlerts: false,
    lowStockAlerts: true,
    payoutAlerts: true,
  },
  security: {
    require2FA: true,
    passwordMinLength: 8,
    sessionTimeout: 120,
    guestCheckout: true,
    captchaEnabled: true,
    loginAttemptLimit: 5,
  },
  seo: {
    siteTitle: '',
    metaDescription: '',
    canonicalDomain: 'vendora.com',
    robotsTxt: 'allow',
    openGraphEnabled: true,
  },
  maintenance: {
    maintenanceMode: false,
    allowCheckout: true,
    noticeMessage: 'We are performing scheduled maintenance. Please check back soon.',
    maintenanceWindow: '00:00 - 02:00 UTC',
    emergencyContact: 'support@vendora.com',
  },
}

function normalizeSettings(value: unknown): SettingsRecord {
  const source = value && typeof value === 'object' ? (value as SettingsRecord) : {}
  const merged = structuredClone(emptySettings)

  Object.entries(merged).forEach(([sectionKey, sectionValue]) => {
    if (source[sectionKey] && typeof source[sectionKey] === 'object') {
      Object.assign(sectionValue, source[sectionKey])
    }
  })

  return merged
}

function readFieldMap(settings: SettingsRecord): Record<string, any> {
  return settings
}

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsSectionName>('general')
  const [settings, setSettings] = useState<SettingsRecord>(emptySettings)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getAdminSettings()
        setSettings(normalizeSettings(data))
        setError('')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load settings.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const currentSettings = settings[activeTab] || {}

  const updateField = (field: string, value: string | number | boolean) => {
    setSettings((current) => ({
      ...current,
      [activeTab]: {
        ...(current[activeTab] || {}),
        [field]: value,
      },
    }))
  }

  const sectionConfig = useMemo(() => {
    const config: Record<SettingsSectionName, Array<{ key: string; label: string; type: 'text' | 'number' | 'toggle' | 'select'; options?: string[]; placeholder?: string; min?: number; max?: number }>> = {
      general: [
        { key: 'siteName', label: 'Site name', type: 'text', placeholder: 'Vendora' },
        { key: 'siteTagline', label: 'Tagline', type: 'text', placeholder: 'Multi-vendor marketplace' },
        { key: 'supportEmail', label: 'Support email', type: 'text', placeholder: 'support@vendora.com' },
        { key: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore'] },
        { key: 'defaultLanguage', label: 'Default language', type: 'select', options: ['en', 'fr', 'de', 'es', 'ar'] },
        { key: 'maintenanceMode', label: 'Maintenance mode', type: 'toggle' },
      ],
      marketplace: [
        { key: 'storefrontName', label: 'Storefront name', type: 'text' },
        { key: 'defaultCurrency', label: 'Default currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'AED', 'SAR'] },
        { key: 'featuredProductsLimit', label: 'Featured products', type: 'number', min: 1, max: 50 },
        { key: 'sellerRegistration', label: 'Seller registration', type: 'toggle' },
        { key: 'autoApproveSellers', label: 'Auto-approve sellers', type: 'toggle' },
        { key: 'productApproval', label: 'Product approval', type: 'select', options: ['manual', 'auto', 'hybrid'] },
        { key: 'reviewModeration', label: 'Review moderation', type: 'toggle' },
      ],
      payments: [
        { key: 'defaultGateway', label: 'Default gateway', type: 'select', options: ['stripe', 'paypal', 'razorpay', 'bank'] },
        { key: 'allowWallet', label: 'Wallet enabled', type: 'toggle' },
        { key: 'enableCOD', label: 'Cash on delivery', type: 'toggle' },
        { key: 'enableStripe', label: 'Stripe enabled', type: 'toggle' },
        { key: 'stripeTestingMode', label: 'Stripe test mode', type: 'toggle' },
        { key: 'payoutSchedule', label: 'Payout schedule', type: 'select', options: ['daily', 'weekly', 'biweekly', 'monthly'] },
        { key: 'requireBillingAddress', label: 'Require billing address', type: 'toggle' },
      ],
      shipping: [
        { key: 'defaultCarrier', label: 'Default carrier', type: 'select', options: ['standard', 'express', 'priority', 'pickup'] },
        { key: 'freeShippingThreshold', label: 'Free shipping threshold', type: 'number', min: 0 },
        { key: 'handlingTime', label: 'Handling time (days)', type: 'number', min: 1, max: 30 },
        { key: 'returnWindow', label: 'Return window (days)', type: 'number', min: 1, max: 90 },
        { key: 'localPickup', label: 'Local pickup', type: 'toggle' },
        { key: 'shippingZones', label: 'Shipping zones', type: 'select', options: ['domestic', 'regional', 'international'] },
      ],
      taxes: [
        { key: 'enableVAT', label: 'Enable VAT', type: 'toggle' },
        { key: 'taxCalculation', label: 'Tax calculation', type: 'select', options: ['automatic', 'manual', 'seller-managed'] },
        { key: 'taxRate', label: 'Tax rate (%)', type: 'number', min: 0, max: 100 },
        { key: 'invoicePrefix', label: 'Invoice prefix', type: 'text' },
        { key: 'taxExemptThreshold', label: 'Tax exemption threshold', type: 'number', min: 0 },
      ],
      commission: [
        { key: 'platformCommission', label: 'Platform commission (%)', type: 'number', min: 0, max: 100 },
        { key: 'sellerCommission', label: 'Seller share (%)', type: 'number', min: 0, max: 100 },
        { key: 'affiliateCommission', label: 'Affiliate commission (%)', type: 'number', min: 0, max: 100 },
        { key: 'refundCommissionWaiver', label: 'Refund commission waiver', type: 'toggle' },
        { key: 'minPayout', label: 'Minimum payout', type: 'number', min: 0 },
      ],
      email: [
        { key: 'senderName', label: 'Sender name', type: 'text' },
        { key: 'senderEmail', label: 'Sender email', type: 'text' },
        { key: 'mailProvider', label: 'Mail provider', type: 'select', options: ['smtp', 'sendgrid', 'mailgun', 'ses'] },
        { key: 'transactionalEnabled', label: 'Transactional email enabled', type: 'toggle' },
        { key: 'welcomeTemplate', label: 'Welcome email template', type: 'select', options: ['enabled', 'disabled', 'draft'] },
        { key: 'orderAlertTemplate', label: 'Order alert template', type: 'select', options: ['enabled', 'disabled', 'draft'] },
      ],
      notifications: [
        { key: 'browserPush', label: 'Browser push notifications', type: 'toggle' },
        { key: 'inAppAlerts', label: 'In-app alerts', type: 'toggle' },
        { key: 'emailAlerts', label: 'Email alerts', type: 'toggle' },
        { key: 'smsAlerts', label: 'SMS alerts', type: 'toggle' },
        { key: 'lowStockAlerts', label: 'Low stock alerts', type: 'toggle' },
        { key: 'payoutAlerts', label: 'Payout alerts', type: 'toggle' },
      ],
      security: [
        { key: 'require2FA', label: 'Require 2FA', type: 'toggle' },
        { key: 'passwordMinLength', label: 'Password minimum length', type: 'number', min: 6, max: 32 },
        { key: 'sessionTimeout', label: 'Session timeout (minutes)', type: 'number', min: 15, max: 360 },
        { key: 'guestCheckout', label: 'Guest checkout', type: 'toggle' },
        { key: 'captchaEnabled', label: 'Captcha enabled', type: 'toggle' },
        { key: 'loginAttemptLimit', label: 'Login attempt limit', type: 'number', min: 1, max: 20 },
      ],
      seo: [
        { key: 'siteTitle', label: 'Site title', type: 'text' },
        { key: 'metaDescription', label: 'Meta description', type: 'text' },
        { key: 'canonicalDomain', label: 'Canonical domain', type: 'text' },
        { key: 'robotsTxt', label: 'Robots mode', type: 'select', options: ['allow', 'disallow', 'custom'] },
        { key: 'openGraphEnabled', label: 'OpenGraph enabled', type: 'toggle' },
      ],
      maintenance: [
        { key: 'maintenanceMode', label: 'Maintenance mode', type: 'toggle' },
        { key: 'allowCheckout', label: 'Allow checkout during maintenance', type: 'toggle' },
        { key: 'noticeMessage', label: 'Maintenance notice', type: 'text' },
        { key: 'maintenanceWindow', label: 'Maintenance window', type: 'text' },
        { key: 'emergencyContact', label: 'Emergency contact', type: 'text' },
      ],
    }

    return config
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = { [activeTab]: settings[activeTab] }
      await updateAdminSettings(payload)
      setNotice('Settings saved successfully.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="rounded-[26px] bg-white p-10 text-slate-600 shadow-sm ring-1 ring-slate-200">
          Loading settings…
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Platform configuration</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Settings</h1>
              <p className="mt-2 text-sm text-slate-600">Manage the entire marketplace operating model from one centralized control center.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Secure configuration
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {notice ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Sections
            </div>
            <nav className="max-h-[calc(100vh-18rem)] space-y-2 overflow-y-auto pr-1">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-medium">{tab.label}</div>
                    <div className={`mt-1 text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{tab.description}</div>
                  </button>
                )
              })}
            </nav>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{activeTab}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save settings'}
              </button>
            </div>

            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                {sectionConfig[activeTab].map((field) => {
                  const value = currentSettings[field.key]

                  if (field.type === 'toggle') {
                    return (
                      <label
                        key={field.key}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2"
                      >
                      <div>
                        <div className="text-sm font-medium text-slate-800">{field.label}</div>
                        <div className="text-xs text-slate-500">Toggle this marketplace behavior on or off.</div>
                      </div>
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(event) => updateField(field.key, event.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </label>
                    )
                  }

                  return (
                    <label key={field.key} className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{field.label}</span>
                      {field.type === 'select' ? (
                        <select
                          value={String(value ?? '')}
                          onChange={(event) => updateField(field.key, event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={value ?? ''}
                          min={field.min}
                          max={field.max}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            updateField(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                        />
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4" />
              Save changes after editing each section to persist the configuration to the platform backend.
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
