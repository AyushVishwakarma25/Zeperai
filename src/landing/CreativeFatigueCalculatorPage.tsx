import React, { useState, useMemo } from 'react';
import { calculateCreativeFatigue } from '../calculators/creativeFatigue/calculation.js';
import {
  CreativeFatigueInputs,
  DEFAULT_CREATIVE_FATIGUE_INPUTS,
} from '../calculators/creativeFatigue/types.js';
import {
  CalculatorLayout,
  FAQItem,
} from '../components/calculators/CalculatorLayout.js';
import { CurrencyInput } from '../components/calculators/CurrencyInput.js';
import { PercentageInput } from '../components/calculators/PercentageInput.js';
import { MetricCard } from '../components/calculators/MetricCard.js';
import {
  Activity,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  TrendingDown,
  Gauge,
} from 'lucide-react';

const FAQS: FAQItem[] = [
  {
    question: 'What is Meta Ad creative fatigue and why does it happen faster in 2026?',
    answer:
      'Meta Ad creative fatigue happens when your target audience has seen your ad creatives repeatedly. Once individual ad frequency crosses 2.2x to 3.0x within 7 days, click-through rates (CTR) collapse by 25–40% and CPMs spike because Facebook’s auction penalizes ads that users skip or report. In 2026, algorithmic broad targeting and short attention spans burn through ad concepts within 5 to 10 days at monthly budgets above ₹1 Lakh.',
  },
  {
    question: 'How many ad creatives does an Indian D2C brand need every month?',
    answer:
      'As a rule of thumb, for every ₹1,00,000 of monthly ad spend on Meta, you need at least 6 to 10 fresh creative variations monthly. Scaling brands spending ₹5,00,000+ monthly require 30 to 50 new video hooks, UGC variations, and studio angles per month to sustain sub-₹450 CACs and keep ROAS above 3.0x.',
  },
  {
    question: 'What is the fastest way to fight creative fatigue without hiring expensive video agencies?',
    answer:
      'High-velocity testing relies on modular creative production: take 1 winning hero product photo or core benefit and generate 8 to 12 AI variations with different backgrounds, lifestyle hooks, human hands/influencers holding the product, and headline callouts. ZeperAI Studio lets you generate batches of photo-realistic product creatives in under 60 seconds.',
  },
  {
    question: 'Should I pause fatigued ads or duplicate them into new ad sets?',
    answer:
      'Duplicating a fatigued creative into a new ad set provides only a temporary 48-hour boost before Meta matches the creative hash and returns to high CPMs. The sustainable fix is true visual iteration: change the first 2-second visual hook, alter the background environment, or switch from plain white studio to high-end luxury marble or outdoor lifestyle settings.',
  },
];

export const CreativeFatigueCalculatorPage: React.FC = () => {
  const [inputs, setInputs] = useState<CreativeFatigueInputs>(
    DEFAULT_CREATIVE_FATIGUE_INPUTS
  );

  const results = useMemo(() => calculateCreativeFatigue(inputs), [inputs]);

  const updateInput = <K extends keyof CreativeFatigueInputs>(
    key: K,
    value: CreativeFatigueInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_CREATIVE_FATIGUE_INPUTS);
  };

  const riskBadgeColor = {
    safe: 'success',
    warning: 'warning',
    critical: 'danger',
  }[results.fatigueRiskLevel] as 'success' | 'warning' | 'danger';

  return (
    <CalculatorLayout
      seoTitle="Meta Ad Creative Fatigue Simulator & Velocity Calculator | ZeperAI"
      seoDescription="Simulate Meta ad creative fatigue, CPM inflation, and impression saturation. Calculate exact creative refresh cadence and weekly variations needed to sustain high ROAS."
      canonicalPath="/tools/meta-creative-fatigue"
      toolName="Meta Ad Creative Fatigue Simulator"
      badgeText="Paid Social Performance Simulator"
      headline="Meta Ad Creative Fatigue & Velocity Simulator"
      subtitle="Model ad impression burn, CTR decay, and audience saturation. Calculate how many fresh creatives you need every month to sustain high ROAS and low CAC."
      studioHandoff={{
        title: 'Need 20+ fresh ad creatives every month? Stop paying ₹25,000 per shoot.',
        description:
          'Transform your single product photo into 50+ luxury studio scenes, UGC lifestyle angles, and seasonal ad creatives in minutes with ZeperAI Studio.',
        ctaText: 'Produce 10 Free Ad Creatives',
        studioMode: 'influencer',
      }}
      faqs={FAQS}
      guideContent={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                1. The 7-Day Cliff
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                At ₹10,000+ daily spend, ad frequency in Tier-1 metros (Delhi NCR, Mumbai, Bengaluru) climbs past 2.5x in under 8 days. Once reached, outbound click-through rates decline up to 35%.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                2. Algorithmic CPM Tax
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meta’s auction reward signals freshness. Running 2 static images for 30 days incurs an estimated 40% auction penalty compared to accounts launching 5 new variations weekly.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                3. The Iteration Playbook
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You do not need 20 completely new products. You need 20 visual angles: 5 podium studio renders, 5 human hands holding the pack, 5 split-screen comparisons, and 5 benefit hooks.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-8">
            How Ad Creative Velocity Dictates Blended CAC
          </h3>
          <p>
            In modern broad targeting (Advantage+ Shopping Campaigns), the creative is your targeting. When Meta exhausts the immediate buyers for visual angle A, it can only find cheaper incremental buyers if given visual angle B, C, and D.
          </p>
          <p>
            Brands testing at least 15 creative variants monthly report <strong>28% higher ROAS</strong> and <strong>42% longer campaign longevity</strong> without having to constantly restart learning phases.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Meta Campaign Parameters
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

          {/* Section 1: Budget & Auction Benchmarks */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              1. Spend & Performance Metrics
            </h3>

            <CurrencyInput
              label="Monthly Meta Ad Spend"
              value={inputs.monthlyAdSpend}
              onChange={(v) => updateInput('monthlyAdSpend', v)}
              step={25000}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Blended CPM"
                value={inputs.cpm}
                onChange={(v) => updateInput('cpm', v)}
                helperText="Cost per 1,000 views"
                step={20}
              />
              <CurrencyInput
                label="Average Order Value"
                value={inputs.aov}
                onChange={(v) => updateInput('aov', v)}
                step={50}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PercentageInput
                label="Average CTR"
                value={inputs.ctrPercent}
                onChange={(v) => updateInput('ctrPercent', v)}
                helperText="Link click rate"
                step={0.1}
                max={10}
              />
              <PercentageInput
                label="Website CVR"
                value={inputs.conversionRatePercent}
                onChange={(v) => updateInput('conversionRatePercent', v)}
                helperText="Landing conversion rate"
                step={0.1}
                max={15}
              />
            </div>
          </div>

          {/* Section 2: Creative Inventory & Refresh Pace */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              2. Creative Inventory & Pipeline
            </h3>

            <CurrencyInput
              label="Currently Active Creatives"
              prefix="#"
              value={inputs.activeCreativesCount}
              onChange={(v) => updateInput('activeCreativesCount', Math.max(1, v))}
              helperText="Live ads in active ad sets"
              step={1}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Refresh Cycle (Days)"
                prefix="⏱"
                value={inputs.refreshCycleDays}
                onChange={(v) => updateInput('refreshCycleDays', Math.max(2, v))}
                helperText="Target days before replacing"
                step={1}
              />
              <CurrencyInput
                label="Variants per Concept"
                prefix="✦"
                value={inputs.variationsPerConcept}
                onChange={(v) => updateInput('variationsPerConcept', Math.max(1, v))}
                helperText="Backgrounds & hook angles"
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Output (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Fatigue Risk Level"
              value={
                results.fatigueRiskLevel === 'safe'
                  ? 'Safe Pace'
                  : results.fatigueRiskLevel === 'warning'
                  ? 'High Risk'
                  : 'Critical Burn'
              }
              variant={riskBadgeColor}
              badge={`~${results.estimatedDaysUntilCreativeFatigue} Days Left`}
              subtext="Estimated days until current batch exhausts"
              icon={<Gauge className="w-4 h-4 text-emerald-600" />}
            />

            <MetricCard
              label="Monthly Creatives Needed"
              value={`${results.totalMonthlyCreativesRequired} Ads`}
              variant="primary"
              badge={`Deficit: ${results.currentDeficit} ads`}
              subtext="To sustain current budget without CTR decay"
              icon={<Layers className="w-4 h-4 text-indigo-600" />}
            />

            <MetricCard
              label="Projected ROAS"
              value={`${results.currentRoas}x`}
              variant="neutral"
              badge={`CAC: ₹${results.cac}`}
              subtext={`₹${results.projectedRevenue.toLocaleString('en-IN')} revenue`}
            />
          </div>

          {/* Scale Summary Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Impression Saturation & Funnel Math
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Total Impressions</span>
                <span className="text-base font-extrabold text-slate-900">
                  {(results.impressions / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Link Clicks</span>
                <span className="text-base font-extrabold text-slate-900">
                  {results.clicks.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Purchases</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {results.conversions} orders
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Ad Batches / Mo</span>
                <span className="text-base font-extrabold text-indigo-700">
                  {results.monthlyCreativeBatchesNeeded} cycles
                </span>
              </div>
            </div>
          </div>

          {/* Scenario Comparison Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Velocity Benchmark: Impact of Refresh Cadence
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {results.scenarios.map((sc, idx) => {
                const isWinner = sc.decayRisk === 'low';
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
                      isWinner
                        ? 'border-emerald-300 bg-emerald-50/60'
                        : sc.decayRisk === 'critical'
                        ? 'border-rose-200 bg-rose-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sc.label}</span>
                        {isWinner && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-slate-600">
                          Target ROAS: <strong className="text-slate-900 font-extrabold">{sc.estimatedRoas}x</strong>
                        </span>
                        <span className="text-slate-600">
                          Rev: <strong className="text-emerald-700 font-extrabold">₹{sc.projectedRevenue.toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sc.recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
};

export default CreativeFatigueCalculatorPage;
