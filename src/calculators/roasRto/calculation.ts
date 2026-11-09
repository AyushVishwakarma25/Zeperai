import { RoasRtoInputs, RoasRtoResults } from './types.js';

export function calculateRoasRto(inputs: RoasRtoInputs): RoasRtoResults {
  const {
    sellingPrice,
    cogs,
    packagingCost,
    forwardShipping,
    returnShipping,
    codSharePercent,
    codRtoPercent,
    prepaidRtoPercent,
    codCollectionFee,
    pgFeePercent,
    pgFixedFee,
    monthlyAdSpend,
    totalOrdersPlaced,
  } = inputs;

  const codRatio = Math.max(0, Math.min(100, codSharePercent)) / 100;
  const prepaidRatio = 1 - codRatio;

  const codRtoRatio = Math.max(0, Math.min(100, codRtoPercent)) / 100;
  const prepaidRtoRatio = Math.max(0, Math.min(100, prepaidRtoPercent)) / 100;

  // Blended overall RTO rate
  const blendedRtoRatio = (codRatio * codRtoRatio) + (prepaidRatio * prepaidRtoRatio);
  const overallRtoPercent = blendedRtoRatio * 100;

  const deliveredOrdersCount = Math.round(totalOrdersPlaced * (1 - blendedRtoRatio));
  const rtoOrdersCount = Math.max(0, totalOrdersPlaced - deliveredOrdersCount);

  // Delivered unit economics
  // Prepaid PG fee on delivered units
  const pgFeePerPrepaidUnit = (sellingPrice * (pgFeePercent / 100)) + pgFixedFee;
  // Weighted payment fee per delivered unit
  const weightedPaymentFee = (codRatio * codCollectionFee) + (prepaidRatio * pgFeePerPrepaidUnit);

  const deliveredContributionPerUnit =
    sellingPrice - cogs - packagingCost - forwardShipping - weightedPaymentFee;

  // RTO unit economics: forward shipping spent, return shipping spent, packaging damaged/lost
  // (COGS is assumed restocked/returned safely unless damaged, but packaging is lost)
  const rtoLossPerUnit = forwardShipping + returnShipping + packagingCost;

  // Expected contribution per order placed:
  // (Delivered Contribution * (1 - RTO)) - (RTO Loss * RTO)
  const expectedContributionPerPlacedOrder =
    (deliveredContributionPerUnit * (1 - blendedRtoRatio)) - (rtoLossPerUnit * blendedRtoRatio);

  const isProfitableBeforeAds = expectedContributionPerPlacedOrder > 0;
  const breakEvenCac = Math.max(0, expectedContributionPerPlacedOrder);

  // Break-even ROAS = Selling Price / Break-even CAC
  const breakEvenRoas = breakEvenCac > 0 ? Number((sellingPrice / breakEvenCac).toFixed(2)) : 0;

  // Actual performance metrics
  const currentCac = totalOrdersPlaced > 0 ? monthlyAdSpend / totalOrdersPlaced : 0;
  const grossRevenue = totalOrdersPlaced * sellingPrice;
  const netDeliveredRevenue = deliveredOrdersCount * sellingPrice;
  const currentRoas = monthlyAdSpend > 0 ? Number((grossRevenue / monthlyAdSpend).toFixed(2)) : 0;

  const totalCogs = deliveredOrdersCount * cogs;
  const totalShippingLoss = (totalOrdersPlaced * forwardShipping) + (rtoOrdersCount * returnShipping);
  const totalPaymentFees = deliveredOrdersCount * weightedPaymentFee;

  const totalContribution = expectedContributionPerPlacedOrder * totalOrdersPlaced;
  const netProfit = totalContribution - monthlyAdSpend;
  const netMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    overallRtoPercent: Number(overallRtoPercent.toFixed(1)),
    deliveredOrdersCount,
    rtoOrdersCount,
    deliveredContributionPerUnit: Math.round(deliveredContributionPerUnit),
    rtoLossPerUnit: Math.round(rtoLossPerUnit),
    expectedContributionPerPlacedOrder: Math.round(expectedContributionPerPlacedOrder),
    breakEvenCac: Math.round(breakEvenCac),
    breakEvenRoas,
    isProfitableBeforeAds,
    currentCac: Math.round(currentCac),
    currentRoas,
    grossRevenue,
    netDeliveredRevenue,
    totalCogs,
    totalShippingLoss,
    totalPaymentFees,
    netProfit: Math.round(netProfit),
    netMarginPercent: Number(netMarginPercent.toFixed(1)),
  };
}
