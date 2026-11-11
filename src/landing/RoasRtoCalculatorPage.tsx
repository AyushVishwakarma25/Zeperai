import React, { useState, useMemo } from 'react';
import { calculateRoasRto } from '../calculators/roasRto/calculation.js';
import {
  RoasRtoInputs,
  DEFAULT_ROAS_RTO_INPUTS,
} from '../calculators/roasRto/types.js';
import {
  CalculatorLayout,
  FAQItem,
} from '../components/calculators/CalculatorLayout.js';
import { CurrencyInput } from '../components/calculators/CurrencyInput.js';
import { PercentageInput } from '../components/calculators/PercentageInput.js';
import { MetricCard } from '../components/calculators/MetricCard.js';
import {
  RoasGauge,
  WaterfallChart,
  WaterfallItem,
} from '../components/calculators/NativeCharts.js';
import {
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Truck,
  CreditCard,
  DollarSign,
  Package,
} from 'lucide-react';

const FAQS: FAQItem[] = [
  {
    question: 'Why does basic Shopify ROAS mislead Indian D2C founders?',
    answer:
      'Standard Facebook Ads Manager and Shopify dashboards calculate ROAS as (Gross Revenue / Ad Spend). In India, where 60-70% of e-commerce orders are Cash on Delivery (COD), between 20% and 35% of placed orders are returned to origin (RTO). The brand still pays forward shipping (₹70–₹120), reverse shipping (₹60–₹100), packaging, and courier handling fees for every returned package. A 3.0x reported ROAS often masks an actual negative net operating cash flow once RTO charges are factored in.',
  },
  {
    question: 'What is a healthy Break-Even ROAS for an Indian D2C brand in 2026?',
    answer:
      'For brands with Average Order Value (AOV) under ₹999, the break-even ROAS is typically between 2.8x and 3.4x due to shipping taking a larger slice of revenue. For brands with AOV above ₹1,800, break-even ROAS can drop to 1.9x to 2.4x. Healthy scaling requires maintaining an operating ROAS at least 0.8x to 1.2x above your calculated break-even ROAS.',
  },
  {
    question: 'How do high-converting ad creatives reduce RTO rates?',
    answer:
      'Impulsive, low-clarity ads generate curiosity clicks from low-intent shoppers who easily refuse COD packages at delivery. High-fidelity 3D product visualizations, realistic UGC unpackaging videos, and clear transparent size/specification callouts establish buyer trust before checkout. When customers clearly understand the product packaging and quality, buyer remorse drops and delivery acceptance rates jump by 12–18%.',
  },
  {
    question: 'How should I handle RTO in my unit economics formula?',
    answer:
      'Every order placed has two potential outcomes: Delivered (contributing gross margin minus payment fee and forward freight) or RTO (incurring forward freight, reverse freight, and unrecoverable packaging). Our calculator applies the weighted blended probability: Expected Contribution = (Delivered Contribution × Delivery Rate) - (RTO Loss × RTO Rate). This gives you the exact maximum CAC you can afford to bid on Meta and Google.',
  },
];

export const RoasRtoCalculatorPage: React.FC = () => {
  const [inputs, setInputs] = useState<RoasRtoInputs>(DEFAULT_ROAS_RTO_INPUTS);

  const results = useMemo(() => calculateRoasRto(inputs), [inputs]);

  const updateInput = <K extends keyof RoasRtoInputs>(key: K, value: RoasRtoInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_ROAS_RTO_INPUTS);
  };

  const waterfallItems: WaterfallItem[] = useMemo(() => {
    return [
      { label: 'Selling Price (Gross)', amount: inputs.sellingPrice, type: 'base' },
      { label: 'COGS & Manufacturing', amount: -inputs.cogs, type: 'deduction' },
      { label: 'Packaging Materials', amount: -inputs.packagingCost, type: 'deduction' },
      { label: 'Forward Courier', amount: -inputs.forwardShipping, type: 'deduction' },
      {
        label: `Weighted RTO Drag (${results.overallRtoPercent}%)`,
        amount: -Math.round(results.rtoLossPerUnit * (results.overallRtoPercent / 100)),
        type: 'deduction',
      },
      {
        label: 'Payment / COD Charges',
        amount: -Math.round(
          (inputs.sellingPrice -
            inputs.cogs -
            inputs.packagingCost -
            inputs.forwardShipping -
            results.deliveredContributionPerUnit)
        ),
        type: 'deduction',
      },
      {
        label: 'Max Afforded CAC (Break-Even)',
        amount: results.breakEvenCac,
        type: results.isProfitableBeforeAds ? 'profit' : 'loss',
      },
    ];
  }, [inputs, results]);

  return (
    <CalculatorLayout
      seoTitle="Indian D2C Break-Even ROAS & RTO Calculator (2026) | ZeperAI"
      seoDescription="Calculate true break-even ROAS and maximum affordable CAC for Indian e-commerce. Factors in COD share, RTO return courier charges, payment gateway fees, and packaging loss."
      canonicalPath="/tools/roas-rto-calculator"
      toolName="D2C Break-Even ROAS & RTO Calculator"
      badgeText="Indian D2C Profitability Engine"
      headline="Indian D2C Break-Even ROAS & RTO Calculator"
      subtitle="Stop scaling on fake Shopify ROAS. Calculate your exact break-even advertising targets after COD cancellations, reverse shipping fees, and gateway charges."
      studioHandoff={{
        title: 'High RTO eroding your ad margins? Fix buyer intent at the click.',
        description:
          'Replace generic product images with hyper-realistic AI studio packshots and localized lifestyle visuals that set clear buyer expectations and lower COD refusal by up to 22%.',
        ctaText: 'Generate 10 Free Studio Packshots',
        studioMode: 'product',
      }}
      faqs={FAQS}
      guideContent={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                1. Freight Bleed
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Forward and reverse shipping fees are non-refundable. For a ₹999 product, ₹180 in total freight on an RTO order consumes 18% of the gross sale before any ad spend.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                2. COD vs Prepaid Split
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prepaid orders exhibit an average RTO of 5-8%, whereas COD orders average 22-35%. Every 10% shift from COD to prepaid can lower your break-even ROAS target by 0.35x.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                3. Packaging & Restocking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cardboard boxes, outer shrink wraps, and tamper-proof flyers are rarely salvageable after a 10-day round trip across India. Always count packaging as 100% sunk on RTO.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-8">
            The Mathematical Formula for True E-Commerce Contribution
          </h3>
          <p>
            Most media buyers bid targeting CAC = Selling Price - COGS. In Indian direct-to-consumer businesses, this guarantees severe capital burn. The true expected net contribution per placed order is modeled as:
          </p>
          <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs sm:text-sm text-emerald-400 border border-slate-800 overflow-x-auto">
            Break-Even CAC = (Delivered Margin × Delivery Rate) - (RTO Round-Trip Freight × RTO Rate)
          </div>
          <p>
            Where <code>Break-Even ROAS = Selling Price / Break-Even CAC</code>. If your current Meta ROAS falls below this calculated threshold, you are losing money on every incremental order shipped.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Product & Cost Inputs
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              title="Reset to typical Indian D2C defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>

          {/* Section 1: Product Economics */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              1. Product Unit Economics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Selling Price (AOV)"
                value={inputs.sellingPrice}
                onChange={(v) => updateInput('sellingPrice', v)}
                helperText="Gross customer cart total"
                step={50}
              />
              <CurrencyInput
                label="Product COGS"
                value={inputs.cogs}
                onChange={(v) => updateInput('cogs', v)}
                helperText="Procurement / manufacturing"
                step={25}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CurrencyInput
                label="Packaging"
                value={inputs.packagingCost}
                onChange={(v) => updateInput('packagingCost', v)}
                step={5}
              />
              <CurrencyInput
                label="Forward Freight"
                value={inputs.forwardShipping}
                onChange={(v) => updateInput('forwardShipping', v)}
                step={5}
              />
              <CurrencyInput
                label="Return Freight"
                value={inputs.returnShipping}
                onChange={(v) => updateInput('returnShipping', v)}
                step={5}
              />
            </div>
          </div>

          {/* Section 2: COD & Payment Distribution */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              2. COD Share & RTO Rates
            </h3>

            <PercentageInput
              label="COD Order Share"
              value={inputs.codSharePercent}
              onChange={(v) => updateInput('codSharePercent', v)}
              helperText="Typical Indian D2C: 55% - 75% COD"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PercentageInput
                label="COD RTO Rate"
                value={inputs.codRtoPercent}
                onChange={(v) => updateInput('codRtoPercent', v)}
                helperText="National average: 20-30%"
              />
              <PercentageInput
                label="Prepaid RTO Rate"
                value={inputs.prepaidRtoPercent}
                onChange={(v) => updateInput('prepaidRtoPercent', v)}
                helperText="National average: 5-9%"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="COD Collection Fee"
                value={inputs.codCollectionFee}
                onChange={(v) => updateInput('codCollectionFee', v)}
                helperText="Per delivered COD order"
                step={5}
              />
              <PercentageInput
                label="Payment Gateway Fee"
                value={inputs.pgFeePercent}
                onChange={(v) => updateInput('pgFeePercent', v)}
                helperText="Razorpay / Cashfree rate"
                step={0.1}
                max={5}
              />
            </div>
          </div>

          {/* Section 3: Ad Spend & Scale */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              3. Monthly Ad Spend & Orders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Monthly Ad Spend"
                value={inputs.monthlyAdSpend}
                onChange={(v) => updateInput('monthlyAdSpend', v)}
                step={10000}
              />
              <CurrencyInput
                label="Total Orders Placed"
                prefix="#"
                value={inputs.totalOrdersPlaced}
                onChange={(v) => updateInput('totalOrdersPlaced', v)}
                step={50}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Analytics & Charts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Break-Even ROAS"
              value={`${results.breakEvenRoas}x`}
              variant={
                results.currentRoas >= results.breakEvenRoas ? 'success' : 'danger'
              }
              badge={
                results.currentRoas >= results.breakEvenRoas
                  ? 'Healthy Scaling'
                  : 'Below Break-Even'
              }
              subtext="Minimum ROAS needed to avoid cash losses"
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            />

            <MetricCard
              label="Max Afforded CAC"
              value={`₹${results.breakEvenCac}`}
              variant="primary"
              subtext="Highest allowable cost per placed order"
              badge={`Current: ₹${results.currentCac}`}
            />

            <MetricCard
              label="Blended RTO Rate"
              value={`${results.overallRtoPercent}%`}
              variant={results.overallRtoPercent > 20 ? 'warning' : 'neutral'}
              subtext={`${results.rtoOrdersCount} returned of ${inputs.totalOrdersPlaced} placed`}
              badge="Weighted RTO"
            />
          </div>

          {/* ROAS Speedometer Gauge + Profit Summary */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                ROAS Scaling Health Gauge
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                Comparing current marketing performance against your Indian unit economics.
              </p>
              <RoasGauge
                currentRoas={results.currentRoas}
                breakEvenRoas={results.breakEvenRoas}
              />
            </div>

            <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Current Meta / Google ROAS:</span>
                <span className="font-extrabold text-slate-900 text-sm">{results.currentRoas}x</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Delivered Orders:</span>
                <span className="font-bold text-emerald-700">
                  {results.deliveredOrdersCount} units
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Sunk Shipping Loss:</span>
                <span className="font-bold text-rose-600">
                  ₹{results.totalShippingLoss.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-900 font-bold">Estimated Monthly Profit:</span>
                <span
                  className={`text-base font-extrabold ${
                    results.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {results.netProfit >= 0 ? '+' : ''}₹
                  {results.netProfit.toLocaleString('en-IN')} ({results.netMarginPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Waterfall Unit Economics Breakdown */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Per-Order Unit Margin Waterfall (₹)
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Net Contrib: ₹{results.expectedContributionPerPlacedOrder}
              </span>
            </div>

            <WaterfallChart items={waterfallItems} />
          </div>

          {/* Critical Warning if Below Break-even */}
          {results.currentRoas < results.breakEvenRoas && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-rose-800 block font-bold mb-0.5">
                  Action Required: Bleeding ₹{Math.abs(results.netProfit).toLocaleString('en-IN')} Monthly
                </strong>
                Your current ad ROAS of {results.currentRoas}x is below the {results.breakEvenRoas}x break-even threshold. To flip to profitability, you must either decrease RTO via clearer visual ad angles, increase AOV with bundle studio imagery, or negotiate lower courier rate cards.
              </div>
            </div>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
};

export default RoasRtoCalculatorPage;
