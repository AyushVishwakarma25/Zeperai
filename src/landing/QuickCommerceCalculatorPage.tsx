import React, { useState, useMemo } from 'react';
import { calculateQuickCommerce } from '../calculators/quickCommerce/calculation.js';
import {
  QuickCommerceInputs,
  QuickCommercePlatform,
  FeeCalculationBasis,
  DEFAULT_QUICK_COMMERCE_INPUTS,
  PLATFORM_PRESETS,
} from '../calculators/quickCommerce/types.js';
import {
  CalculatorLayout,
  FAQItem,
} from '../components/calculators/CalculatorLayout.js';
import { CurrencyInput } from '../components/calculators/CurrencyInput.js';
import { PercentageInput } from '../components/calculators/PercentageInput.js';
import { MetricCard } from '../components/calculators/MetricCard.js';
import {
  DonutBreakdown,
  WaterfallChart,
  WaterfallItem,
} from '../components/calculators/NativeCharts.js';
import {
  Store,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Percent,
  Layers,
  AlertCircle,
} from 'lucide-react';

const FAQS: FAQItem[] = [
  {
    question: 'How do quick-commerce platform commissions work on Blinkit and Zepto?',
    answer:
      'Quick-commerce contracts in India usually include two layers of deductions: a Base Commission (typically 18% to 26% depending on FMCG, beauty, or gourmet category) and a Trade Margin (3% to 6%) granted to the dark-store distribution arm. Crucially, depending on your vendor agreement, these fees may be levied on the maximum retail price (MRP) or the discounted selling price (ASP). Our calculator allows you to toggle both contract types to verify your real margins.',
  },
  {
    question: 'What is the difference between CM1 and CM2 in quick commerce?',
    answer:
      'Contribution Margin 1 (CM1) represents the unit profit after subtracting COGS, packaging, damage allowance, platform commission, trade margins, and dark-store pick-pack handling fees. Contribution Margin 2 (CM2) subtracts your internal platform advertising spend (Blinkit Brands ads, Zepto sponsored search slots) amortized across units sold. A product may boast a 30% CM1, but aggressive keyword bidding can easily drag CM2 into negative territory.',
  },
  {
    question: 'Why does product packshot CTR matter so much on quick-commerce apps?',
    answer:
      'Quick-commerce shoppers order within 90 seconds. With 6–8 competing brands visible in a single 2-column mobile scroll, the primary listing thumbnail determines over 70% of tap-through volume. Listings with crisp pure-white RGB (255,255,255) backgrounds, high-contrast packaging, and clear grammage callouts achieve 24% to 35% higher organic CTR, drastically reducing the sponsored ad spend needed to maintain category rank.',
  },
  {
    question: 'How should brands account for dark-store expiry and transit damages?',
    answer:
      'Unlike traditional retail distributors where damaged goods can be returned monthly, quick-commerce dark stores operate at extreme speeds. Most supplier agreements require brands to absorb a 2% to 4% damage and near-expiry allowance deduction directly from invoices. Always maintain a minimum 2.5% damage buffer in your unit economics.',
  },
];

export const QuickCommerceCalculatorPage: React.FC = () => {
  const [inputs, setInputs] = useState<QuickCommerceInputs>(
    DEFAULT_QUICK_COMMERCE_INPUTS
  );

  const results = useMemo(() => calculateQuickCommerce(inputs), [inputs]);

  const updateInput = <K extends keyof QuickCommerceInputs>(
    key: K,
    value: QuickCommerceInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlatformChange = (platform: QuickCommercePlatform) => {
    const preset = PLATFORM_PRESETS[platform];
    setInputs((prev) => ({
      ...prev,
      platform,
      commissionPercent: preset.commissionPercent,
      tradeMarginPercent: preset.tradeMarginPercent,
      darkStoreHandlingFee: preset.darkStoreHandlingFee,
      paymentGatewayPercent: preset.paymentGatewayPercent,
      damageExpiryAllowancePercent: preset.damageExpiryAllowancePercent,
    }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_QUICK_COMMERCE_INPUTS);
  };

  const donutSegments = useMemo(() => {
    return [
      { label: 'COGS & Packaging', amount: inputs.cogs + inputs.packagingCost, color: '#2563eb' },
      { label: 'Platform Fees', amount: results.totalPlatformDeduction, color: '#d97706' },
      { label: 'Sponsored Ads', amount: results.adCostPerUnit, color: '#db2777' },
      { label: 'Net Profit (CM2)', amount: Math.max(0, results.cm2PerUnit), color: '#059669' },
    ];
  }, [inputs, results]);

  const waterfallItems: WaterfallItem[] = useMemo(() => {
    return [
      { label: 'Selling Price (On App)', amount: inputs.sellingPrice, type: 'base' },
      { label: 'COGS (Manufacturing)', amount: -inputs.cogs, type: 'deduction' },
      { label: 'Primary Packaging', amount: -inputs.packagingCost, type: 'deduction' },
      {
        label: `Commission & Trade Margin (${inputs.feeBasis.toUpperCase()})`,
        amount: -(results.commissionAmount + results.tradeMarginAmount),
        type: 'deduction',
      },
      { label: 'Dark Store Handling & Tech', amount: -(results.handlingFeeAmount + results.paymentGatewayAmount), type: 'deduction' },
      { label: 'Damage / Expiry Reserve', amount: -results.damageReserveAmount, type: 'deduction' },
      { label: 'Platform Ad Burn / Unit', amount: -results.adCostPerUnit, type: 'deduction' },
      {
        label: 'Net In-Pocket Profit (CM2)',
        amount: results.cm2PerUnit,
        type: results.isProfitable ? 'profit' : 'loss',
      },
    ];
  }, [inputs, results]);

  return (
    <CalculatorLayout
      seoTitle="Quick-Commerce Margin & Dark-Store Calculator (Blinkit, Zepto, Instamart) | ZeperAI"
      seoDescription="Calculate true unit economics, CM1, CM2, trade margins, and dark-store commission deductions for Blinkit, Zepto, and Swiggy Instamart sellers."
      canonicalPath="/tools/quick-commerce-margin-calculator"
      toolName="Quick-Commerce Margin Calculator"
      badgeText="Dark Store Unit Economics Engine"
      headline="Quick-Commerce Margin Calculator (Blinkit, Zepto, Instamart)"
      subtitle="Master dark-store unit economics. Accurately model platform commissions, trade margins, pick-pack handling, sponsored ads, and net CM2 profit per unit."
      studioHandoff={{
        title: 'Boost quick-commerce CTR by 30% with instant compliance packshots.',
        description:
          'Blinkit and Zepto require pure white backgrounds (RGB 255) and 85% frame centering. Use ZeperAI Studio to clean backgrounds and generate crisp dark-store listings in 1 click.',
        ctaText: 'Generate 10 Free Packshots',
        studioMode: 'product',
      }}
      faqs={FAQS}
      guideContent={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                1. Dark Store Logistics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quick-commerce dark stores incur significant pick, pack, and sortation costs. Most master agreements include a ₹12–₹18 dark-store processing charge per unit sold.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                2. Base Commission vs Trade Margin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platforms often separate the marketplace platform commission (e.g. 22%) from the wholesale trade margin (e.g. 5%). Both eat into manufacturer gross margins.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                3. The Sponsored Ad Trap
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bidding aggressively on keywords like "cold pressed oil" or "protein bar" can cost ₹30–₹45 per unit sold. Always monitor your CM2 after platform ad amortizations.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-8">
            The Quick-Commerce Unit Margin Framework
          </h3>
          <p>
            Operating profitably on rapid delivery apps requires distinguishing between Contribution Margin 1 (CM1) and Contribution Margin 2 (CM2):
          </p>
          <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs sm:text-sm text-emerald-400 border border-slate-800 overflow-x-auto space-y-1">
            <div>CM1 = Net Price - (COGS + Packaging + Platform Commissions + Handling + Tech)</div>
            <div>CM2 = CM1 - (Monthly Platform Ad Spend / Units Sold)</div>
          </div>
          <p>
            If your CM2 is lower than 8% to 12%, unexpected price discounts or seasonal inventory damage can easily push your monthly account statements into the red.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Contract & Pricing Inputs
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>

          {/* Platform Preset Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Select Platform Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['blinkit', 'zepto', 'instamart', 'custom'] as QuickCommercePlatform[]).map((p) => {
                const isActive = inputs.platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlatformChange(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-200/60'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fee Calculation Basis */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Commission Calculated On
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateInput('feeBasis', 'sellingPrice')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  inputs.feeBasis === 'sellingPrice'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                Selling Price (ASP)
              </button>
              <button
                type="button"
                onClick={() => updateInput('feeBasis', 'mrp')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  inputs.feeBasis === 'mrp'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                Maximum Retail Price (MRP)
              </button>
            </div>
          </div>

          {/* Section 1: Price Economics */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Product MRP"
                value={inputs.mrp}
                onChange={(v) => updateInput('mrp', v)}
                step={20}
              />
              <CurrencyInput
                label="App Selling Price"
                value={inputs.sellingPrice}
                onChange={(v) => updateInput('sellingPrice', v)}
                helperText="Price customer pays"
                step={20}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CurrencyInput
                label="Product COGS"
                value={inputs.cogs}
                onChange={(v) => updateInput('cogs', v)}
                step={10}
              />
              <CurrencyInput
                label="Packaging"
                value={inputs.packagingCost}
                onChange={(v) => updateInput('packagingCost', v)}
                step={5}
              />
              <CurrencyInput
                label="Promo Subsidy"
                value={inputs.brandFundedDiscount}
                onChange={(v) => updateInput('brandFundedDiscount', v)}
                helperText="Brand funded"
                step={5}
              />
            </div>
          </div>

          {/* Section 2: Platform Deductions */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Platform Fee Deductions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PercentageInput
                label="Base Commission"
                value={inputs.commissionPercent}
                onChange={(v) => updateInput('commissionPercent', v)}
                step={0.5}
                max={40}
              />
              <PercentageInput
                label="Trade Margin"
                value={inputs.tradeMarginPercent}
                onChange={(v) => updateInput('tradeMarginPercent', v)}
                step={0.5}
                max={15}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CurrencyInput
                label="Dark Store Fee"
                value={inputs.darkStoreHandlingFee}
                onChange={(v) => updateInput('darkStoreHandlingFee', v)}
                step={1}
              />
              <PercentageInput
                label="Payment Gateway"
                value={inputs.paymentGatewayPercent}
                onChange={(v) => updateInput('paymentGatewayPercent', v)}
                step={0.1}
                max={5}
              />
              <PercentageInput
                label="Damage Reserve"
                value={inputs.damageExpiryAllowancePercent}
                onChange={(v) => updateInput('damageExpiryAllowancePercent', v)}
                step={0.5}
                max={10}
              />
            </div>
          </div>

          {/* Section 3: Platform Ads & Scale */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Dark Store Scale & Ads
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Monthly Platform Ads"
                value={inputs.monthlyPlatformAdSpend}
                onChange={(v) => updateInput('monthlyPlatformAdSpend', v)}
                helperText="Sponsored listings / banners"
                step={5000}
              />
              <CurrencyInput
                label="Monthly Units Sold"
                prefix="#"
                value={inputs.monthlyUnitsSold}
                onChange={(v) => updateInput('monthlyUnitsSold', v)}
                helperText="Across all dark stores"
                step={250}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Margin Breakdown & Analytics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Net Profit Margin (CM2)"
              value={`${results.cm2Percent}%`}
              variant={results.isProfitable ? 'success' : 'danger'}
              badge={results.isProfitable ? 'Profitable' : 'Losing Money'}
              subtext={`₹${results.cm2PerUnit} net in-pocket per unit`}
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            />

            <MetricCard
              label="Pre-Ad Margin (CM1)"
              value={`${results.cm1Percent}%`}
              variant="primary"
              badge={`₹${results.cm1PerUnit}/unit`}
              subtext="Margin before sponsored search ads"
              icon={<Layers className="w-4 h-4 text-indigo-600" />}
            />

            <MetricCard
              label="Platform Deductions"
              value={`₹${results.totalPlatformDeduction}`}
              variant="warning"
              badge={`${((results.totalPlatformDeduction / inputs.sellingPrice) * 100).toFixed(1)}%`}
              subtext="Commission, trade & handling total"
            />
          </div>

          {/* Cost Allocation Donut */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Unit Revenue Allocation Breakdown (₹{inputs.sellingPrice} Selling Price)
            </h3>
            <DonutBreakdown segments={donutSegments} />
          </div>

          {/* Waterfall Unit Deduction Breakdown */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Detailed Unit Economics Waterfall (₹)
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Ads: ₹{results.adCostPerUnit}/unit
              </span>
            </div>

            <WaterfallChart items={waterfallItems} />
          </div>

          {/* Scale Summary Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-600">Monthly Gross Revenue:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ₹{results.monthlyGrossRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-600">Break-Even Units to Cover Ads:</span>
              <span className="font-bold text-indigo-700">
                {results.breakEvenMonthlyUnits} units / month
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
              <span className="text-slate-900 font-bold">Estimated Monthly In-Pocket Profit:</span>
              <span
                className={`text-base font-extrabold ${
                  results.monthlyNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {results.monthlyNetProfit >= 0 ? '+' : ''}₹
                {results.monthlyNetProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {!results.isProfitable && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-rose-800 block font-bold mb-0.5">
                  Warning: Negative Unit Economics
                </strong>
                Platform deductions (₹{results.totalPlatformDeduction}) plus advertising (₹{results.adCostPerUnit}) exceed your product margin. Consider renegotiating your trade margin or increasing organic CTR to lower your cost-per-click ad dependency.
              </div>
            </div>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
};

export default QuickCommerceCalculatorPage;
