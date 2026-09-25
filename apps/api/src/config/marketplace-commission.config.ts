export const DEFAULT_MARKETPLACE_COMMISSION_RATE = 10;
export const DEFAULT_PAYMENT_FEE_RATE = 0.025;

export interface MarketplaceCommissionConfig {
  marketplaceCommissionRate: number;
  sellerEarningsRate: number;
  paymentFeeRate: number;
}

export function getMarketplaceCommissionConfig(rate = DEFAULT_MARKETPLACE_COMMISSION_RATE): MarketplaceCommissionConfig {
  const normalizedRate = Number(rate || DEFAULT_MARKETPLACE_COMMISSION_RATE);
  const safeRate = Number.isFinite(normalizedRate) ? Math.min(Math.max(normalizedRate, 0), 100) : DEFAULT_MARKETPLACE_COMMISSION_RATE;

  return {
    marketplaceCommissionRate: safeRate,
    sellerEarningsRate: 100 - safeRate,
    paymentFeeRate: DEFAULT_PAYMENT_FEE_RATE,
  };
}

export function calculateMarketplaceSettlement({
  grossSales,
  refundedGmv = 0,
  paymentFees = 0,
  commissionRate = DEFAULT_MARKETPLACE_COMMISSION_RATE,
}: {
  grossSales: number;
  refundedGmv?: number;
  paymentFees?: number;
  commissionRate?: number;
}) {
  const grossSalesValue = Number(grossSales) || 0;
  const refundedGmvValue = Number(refundedGmv) || 0;
  const paymentFeesValue = Number(paymentFees) || 0;
  const config = getMarketplaceCommissionConfig(commissionRate);
  const netSales = Math.max(0, grossSalesValue - refundedGmvValue);
  const platformRevenue = netSales * (config.marketplaceCommissionRate / 100);
  const sellerEarnings = netSales - platformRevenue;
  const netMarketplaceRevenue = platformRevenue - paymentFeesValue;

  return {
    grossSales: grossSalesValue,
    refundedGmv: refundedGmvValue,
    netSales,
    platformRevenue,
    sellerEarnings,
    paymentFees: paymentFeesValue,
    netMarketplaceRevenue,
    commissionRate: config.marketplaceCommissionRate,
    sellerEarningsRate: config.sellerEarningsRate,
  };
}
