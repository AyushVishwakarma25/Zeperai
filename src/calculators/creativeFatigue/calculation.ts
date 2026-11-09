import {
  CreativeFatigueInputs,
  CreativeFatigueResults,
  ScenarioBreakdown,
} from './types.js';

export function calculateCreativeFatigue(inputs: CreativeFatigueInputs): CreativeFatigueResults {
  const {
    monthlyAdSpend,
    cpm,
    ctrPercent,
    conversionRatePercent,
    aov,
    activeCreativesCount,
    refreshCycleDays,
    variationsPerConcept,
  } = inputs;

  const validCpm = Math.max(1, cpm);
  const impressions = Math.round((monthlyAdSpend / validCpm) * 1000);
  const clicks = Math.round(impressions * (Math.max(0, ctrPercent) / 100));
  const conversions = Math.round(clicks * (Math.max(0, conversionRatePercent) / 100));
  const projectedRevenue = Math.round(conversions * aov);
  const currentRoas = monthlyAdSpend > 0 ? Number((projectedRevenue / monthlyAdSpend).toFixed(2)) : 0;
  const cac = conversions > 0 ? Math.round(monthlyAdSpend / conversions) : 0;

  // Fatigue mechanics:
  // Each creative can sustain approximately 60k - 100k impressions in a typical Indian D2C audience
  // before audience saturation causes CPM inflation and CTR collapse.
  const impressionsPerCreative = activeCreativesCount > 0 ? impressions / activeCreativesCount : impressions;
  
  // Refresh calculations
  const safeRefreshDays = Math.max(2, refreshCycleDays);
  const monthlyCreativeBatchesNeeded = Number((30 / safeRefreshDays).toFixed(1));
  const totalMonthlyCreativesRequired = Math.round(
    monthlyCreativeBatchesNeeded * Math.max(1, variationsPerConcept)
  );

  const currentDeficit = Math.max(0, totalMonthlyCreativesRequired - activeCreativesCount);

  // Fatigue risk estimation
  let fatigueRiskLevel: 'safe' | 'warning' | 'critical' = 'safe';
  if (impressionsPerCreative > 150000 || activeCreativesCount < totalMonthlyCreativesRequired * 0.4) {
    fatigueRiskLevel = 'critical';
  } else if (impressionsPerCreative > 75000 || activeCreativesCount < totalMonthlyCreativesRequired * 0.7) {
    fatigueRiskLevel = 'warning';
  }

  // Days until fatigue hits current batch
  // Higher monthly spend burns through creatives faster
  const dailyImpressions = impressions / 30;
  const saturationThreshold = activeCreativesCount * 80000;
  const estimatedDaysUntilCreativeFatigue =
    dailyImpressions > 0
      ? Math.max(3, Math.min(60, Math.round(saturationThreshold / dailyImpressions)))
      : 30;

  // Scenarios for benchmark comparison
  const scenarios: ScenarioBreakdown[] = [
    {
      label: 'Slow / Stagnant (18-Day Refresh)',
      refreshDays: 18,
      variationsNeeded: Math.round((30 / 18) * 3),
      estimatedRoas: Number(Math.max(0.8, currentRoas * 0.72).toFixed(2)),
      projectedRevenue: Math.round(projectedRevenue * 0.72),
      decayRisk: 'critical',
      recommendation: 'High ad frequency causes CTR to drop 30-40% and CPMs to surge. Margin erosion occurs within 10 days.',
    },
    {
      label: 'Standard D2C (10-Day Refresh)',
      refreshDays: 10,
      variationsNeeded: Math.round((30 / 10) * variationsPerConcept),
      estimatedRoas: currentRoas,
      projectedRevenue: projectedRevenue,
      decayRisk: fatigueRiskLevel === 'safe' ? 'low' : 'moderate',
      recommendation: 'Baseline performance. Requires regular angle tests to prevent sudden CPA spikes mid-month.',
    },
    {
      label: 'High-Velocity Scaling (4-Day Refresh with AI)',
      refreshDays: 4,
      variationsNeeded: Math.round((30 / 4) * Math.max(4, variationsPerConcept)),
      estimatedRoas: Number((currentRoas * 1.35).toFixed(2)),
      projectedRevenue: Math.round(projectedRevenue * 1.35),
      decayRisk: 'low',
      recommendation: 'Algorithmic auction favorite. Constantly fresh visual hooks unlock 25-40% lower CAC without ad exhaustion.',
    },
  ];

  return {
    impressions,
    clicks,
    conversions,
    projectedRevenue,
    currentRoas,
    cac,
    monthlyCreativeBatchesNeeded,
    totalMonthlyCreativesRequired,
    currentDeficit,
    fatigueRiskLevel,
    frequencyWarningThresholdImpressions: Math.round(saturationThreshold),
    estimatedDaysUntilCreativeFatigue,
    scenarios,
  };
}
