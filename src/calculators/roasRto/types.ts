export interface RoasRtoInputs {
  // Product economics
  sellingPrice: number;
  cogs: number;
  packagingCost: number;
  forwardShipping: number;
  returnShipping: number;

  // Order distribution & Fees
  codSharePercent: number; // e.g. 60
  codRtoPercent: number; // e.g. 25
  prepaidRtoPercent: number; // e.g. 8
  codCollectionFee: number; // flat fee e.g. 35
  pgFeePercent: number; // e.g. 2
  pgFixedFee: number; // e.g. 0

  // Advertising & volume
  monthlyAdSpend: number;
  totalOrdersPlaced: number;
}

export interface RoasRtoResults {
  overallRtoPercent: number;
  deliveredOrdersCount: number;
  rtoOrdersCount: number;
  deliveredContributionPerUnit: number;
  rtoLossPerUnit: number;
  expectedContributionPerPlacedOrder: number;
  breakEvenCac: number;
  breakEvenRoas: number;
  isProfitableBeforeAds: boolean;
  
  // Actual performance metrics
  currentCac: number;
  currentRoas: number;
  grossRevenue: number;
  netDeliveredRevenue: number;
  totalCogs: number;
  totalShippingLoss: number;
  totalPaymentFees: number;
  netProfit: number;
  netMarginPercent: number;
}

export const DEFAULT_ROAS_RTO_INPUTS: RoasRtoInputs = {
  sellingPrice: 1499,
  cogs: 399,
  packagingCost: 45,
  forwardShipping: 90,
  returnShipping: 80,
  codSharePercent: 65,
  codRtoPercent: 24,
  prepaidRtoPercent: 7,
  codCollectionFee: 35,
  pgFeePercent: 2.0,
  pgFixedFee: 0,
  monthlyAdSpend: 150000,
  totalOrdersPlaced: 500,
};
