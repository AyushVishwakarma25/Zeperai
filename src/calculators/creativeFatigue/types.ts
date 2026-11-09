export interface CreativeFatigueInputs {
  monthlyAdSpend: number;
  cpm: number;
  ctrPercent: number;
  conversionRatePercent: number;
  aov: number;
  activeCreativesCount: number;
  refreshCycleDays: number; // e.g. 7 or 14
  variationsPerConcept: number; // e.g. 4
}

export interface ScenarioBreakdown {
  label: string;
  refreshDays: number;
  variationsNeeded: number;
  estimatedRoas: number;
  projectedRevenue: number;
  decayRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
}

export interface CreativeFatigueResults {
  impressions: number;
  clicks: number;
  conversions: number;
  projectedRevenue: number;
  currentRoas: number;
  cac: number;
  
  // Fatigue & Creative Capacity Analysis
  monthlyCreativeBatchesNeeded: number;
  totalMonthlyCreativesRequired: number;
  currentDeficit: number;
  fatigueRiskLevel: 'safe' | 'warning' | 'critical';
  frequencyWarningThresholdImpressions: number;
  estimatedDaysUntilCreativeFatigue: number;

  // Comparison Scenarios
  scenarios: ScenarioBreakdown[];
}

export const DEFAULT_CREATIVE_FATIGUE_INPUTS: CreativeFatigueInputs = {
  monthlyAdSpend: 300000,
  cpm: 220,
  ctrPercent: 1.6,
  conversionRatePercent: 2.8,
  aov: 1650,
  activeCreativesCount: 6,
  refreshCycleDays: 10,
  variationsPerConcept: 4,
};
