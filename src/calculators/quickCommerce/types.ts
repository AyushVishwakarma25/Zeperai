export type QuickCommercePlatform = 'blinkit' | 'zepto' | 'instamart' | 'custom';
export type FeeCalculationBasis = 'sellingPrice' | 'mrp';

export interface QuickCommerceInputs {
  platform: QuickCommercePlatform;
  feeBasis: FeeCalculationBasis;
  mrp: number;
  sellingPrice: number;
  
  // Platform fees
  commissionPercent: number;
  tradeMarginPercent: number;
  darkStoreHandlingFee: number;
  paymentGatewayPercent: number;
  damageExpiryAllowancePercent: number;

  // Product costs
  cogs: number;
  packagingCost: number;
  brandFundedDiscount: number;

  // Advertising & Scale
  monthlyPlatformAdSpend: number;
  monthlyUnitsSold: number;
}

export interface QuickCommerceResults {
  grossPrice: number;
  netRealizedPrice: number;
  
  // Platform deductions
  commissionAmount: number;
  tradeMarginAmount: number;
  handlingFeeAmount: number;
  paymentGatewayAmount: number;
  damageReserveAmount: number;
  totalPlatformDeduction: number;

  // Cost deductions
  totalProductCost: number; // COGS + packaging + damage

  // Contributions
  cm1PerUnit: number; // Before ads
  cm1Percent: number;
  adCostPerUnit: number;
  cm2PerUnit: number; // Net profit in hand
  cm2Percent: number;

  // Monthly totals
  monthlyGrossRevenue: number;
  monthlyNetProfit: number;
  isProfitable: boolean;
  breakEvenMonthlyUnits: number;
}

export const PLATFORM_PRESETS: Record<
  QuickCommercePlatform,
  {
    name: string;
    commissionPercent: number;
    tradeMarginPercent: number;
    darkStoreHandlingFee: number;
    paymentGatewayPercent: number;
    damageExpiryAllowancePercent: number;
  }
> = {
  blinkit: {
    name: 'Blinkit (Zomato Commerce)',
    commissionPercent: 22.0,
    tradeMarginPercent: 5.0,
    darkStoreHandlingFee: 14.0,
    paymentGatewayPercent: 1.8,
    damageExpiryAllowancePercent: 2.5,
  },
  zepto: {
    name: 'Zepto',
    commissionPercent: 24.0,
    tradeMarginPercent: 4.5,
    darkStoreHandlingFee: 16.0,
    paymentGatewayPercent: 1.8,
    damageExpiryAllowancePercent: 3.0,
  },
  instamart: {
    name: 'Swiggy Instamart',
    commissionPercent: 23.0,
    tradeMarginPercent: 5.0,
    darkStoreHandlingFee: 15.0,
    paymentGatewayPercent: 1.8,
    damageExpiryAllowancePercent: 2.5,
  },
  custom: {
    name: 'Custom Quick-Commerce Contract',
    commissionPercent: 20.0,
    tradeMarginPercent: 4.0,
    darkStoreHandlingFee: 15.0,
    paymentGatewayPercent: 1.8,
    damageExpiryAllowancePercent: 2.5,
  },
};

export const DEFAULT_QUICK_COMMERCE_INPUTS: QuickCommerceInputs = {
  platform: 'blinkit',
  feeBasis: 'sellingPrice',
  mrp: 499,
  sellingPrice: 429,
  commissionPercent: 22.0,
  tradeMarginPercent: 5.0,
  darkStoreHandlingFee: 14.0,
  paymentGatewayPercent: 1.8,
  damageExpiryAllowancePercent: 2.5,
  cogs: 110,
  packagingCost: 22,
  brandFundedDiscount: 15,
  monthlyPlatformAdSpend: 40000,
  monthlyUnitsSold: 2500,
};
