import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_MARKETPLACE_COMMISSION_RATE,
  calculateMarketplaceSettlement,
  getMarketplaceCommissionConfig,
} from './marketplace-commission.config';

describe('marketplace commission config', () => {
  it('uses a single default commission rate', () => {
    assert.equal(DEFAULT_MARKETPLACE_COMMISSION_RATE, 10);
    assert.equal(getMarketplaceCommissionConfig().marketplaceCommissionRate, 10);
    assert.equal(getMarketplaceCommissionConfig().sellerEarningsRate, 90);
  });

  it('separates GMV, refunded GMV, net sales, and platform revenue', () => {
    const settlement = calculateMarketplaceSettlement({
      grossSales: 1000,
      refundedGmv: 100,
      paymentFees: 30,
      commissionRate: 10,
    });

    assert.equal(settlement.grossSales, 1000);
    assert.equal(settlement.refundedGmv, 100);
    assert.equal(settlement.netSales, 900);
    assert.equal(settlement.platformRevenue, 90);
    assert.equal(settlement.sellerEarnings, 810);
    assert.equal(settlement.paymentFees, 30);
    assert.equal(settlement.netMarketplaceRevenue, 60);
  });
});
