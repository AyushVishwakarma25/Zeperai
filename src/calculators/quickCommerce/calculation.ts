import { QuickCommerceInputs, QuickCommerceResults } from './types.js';

export function calculateQuickCommerce(inputs: QuickCommerceInputs): QuickCommerceResults {
  const {
    feeBasis,
    mrp,
    sellingPrice,
    commissionPercent,
    tradeMarginPercent,
    darkStoreHandlingFee,
    paymentGatewayPercent,
    damageExpiryAllowancePercent,
    cogs,
    packagingCost,
    brandFundedDiscount,
    monthlyPlatformAdSpend,
    monthlyUnitsSold,
  } = inputs;

  const basePrice = feeBasis === 'mrp' ? mrp : sellingPrice;
  const netRealizedPrice = Math.max(0, sellingPrice - brandFundedDiscount);

  // Platform deductions calculated on basePrice (MRP or Selling Price according to contract)
  const commissionAmount = Math.round(basePrice * (commissionPercent / 100));
  const tradeMarginAmount = Math.round(basePrice * (tradeMarginPercent / 100));
  const handlingFeeAmount = darkStoreHandlingFee;
  const paymentGatewayAmount = Math.round(sellingPrice * (paymentGatewayPercent / 100));
  const damageReserveAmount = Math.round(sellingPrice * (damageExpiryAllowancePercent / 100));

  const totalPlatformDeduction =
    commissionAmount + tradeMarginAmount + handlingFeeAmount + paymentGatewayAmount;

  // Product costs
  const totalProductCost = cogs + packagingCost + damageReserveAmount;

  // Contribution Margin 1 (CM1) - before platform ads & search bidding
  const cm1PerUnit = netRealizedPrice - totalPlatformDeduction - totalProductCost;
  const cm1Percent = sellingPrice > 0 ? Number(((cm1PerUnit / sellingPrice) * 100).toFixed(1)) : 0;

  // Advertising per unit
  const validUnits = Math.max(1, monthlyUnitsSold);
  const adCostPerUnit = Math.round(monthlyPlatformAdSpend / validUnits);

  // Contribution Margin 2 (CM2) - net in-pocket unit margin
  const cm2PerUnit = cm1PerUnit - adCostPerUnit;
  const cm2Percent = sellingPrice > 0 ? Number(((cm2PerUnit / sellingPrice) * 100).toFixed(1)) : 0;

  // Monthly totals
  const monthlyGrossRevenue = sellingPrice * monthlyUnitsSold;
  const monthlyNetProfit = Math.round(cm2PerUnit * monthlyUnitsSold);
  const isProfitable = cm2PerUnit > 0;

  // Break-even monthly units needed to cover platform ad spend (if CM1 > 0)
  const breakEvenMonthlyUnits = cm1PerUnit > 0 ? Math.ceil(monthlyPlatformAdSpend / cm1PerUnit) : 0;

  return {
    grossPrice: sellingPrice,
    netRealizedPrice,
    commissionAmount,
    tradeMarginAmount,
    handlingFeeAmount,
    paymentGatewayAmount,
    damageReserveAmount,
    totalPlatformDeduction,
    totalProductCost,
    cm1PerUnit,
    cm1Percent,
    adCostPerUnit,
    cm2PerUnit,
    cm2Percent,
    monthlyGrossRevenue,
    monthlyNetProfit,
    isProfitable,
    breakEvenMonthlyUnits,
  };
}
