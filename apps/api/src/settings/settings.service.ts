import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  private settings = {
    siteName: 'Vendora',
    siteDescription: 'Multi-vendor marketplace',
    currency: 'USD',
    taxRate: 0.08,
    shippingCost: 5,
    mailingList: true,
  };

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings: any) {
    Object.assign(this.settings, newSettings);
    return this.settings;
  }

  getSetting(key: string) {
    return { key, value: (this.settings as any)[key] };
  }
}
