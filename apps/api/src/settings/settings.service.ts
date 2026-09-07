import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  private settings = {
    general: {
      siteName: 'Vendora',
      siteTagline: 'Multi-vendor marketplace',
      supportEmail: 'support@vendora.com',
      timezone: 'UTC',
      defaultLanguage: 'en',
      maintenanceMode: false,
    },
    marketplace: {
      storefrontName: 'Vendora Marketplace',
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
      senderName: 'Vendora Team',
      senderEmail: 'noreply@vendora.com',
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
      siteTitle: 'Vendora',
      metaDescription: 'Curated products and trusted sellers from around the world.',
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
    updatedAt: new Date().toISOString(),
  };

  private mergeSettings(current: any, incoming: any): any {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return incoming;
    }

    const result = { ...current };

    for (const [key, value] of Object.entries(incoming)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = this.mergeSettings(result[key], value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings: any) {
    this.settings = this.mergeSettings(this.settings, newSettings);
    this.settings.updatedAt = new Date().toISOString();
    return this.settings;
  }

  getSetting(key: string) {
    return { key, value: (this.settings as any)[key] };
  }
}
