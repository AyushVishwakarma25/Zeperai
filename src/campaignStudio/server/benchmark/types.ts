/**
 * CAMPAIGN STUDIO V2 - Quality Benchmark Suite & Ground-Truth Dataset Types.
 *
 * Provides repeatable quality benchmarking across diverse commercial D2C brands,
 * measuring 10 critical creative dimensions across master creatives and adapted placements,
 * comparing automated QA with human creative-director ratings, and tracking release regressions.
 */

import type {
  BrandContext,
  CampaignGoal,
  CreativeBlueprint,
  CreativeConcept,
  CreativeDocument,
  EvaluationStatus,
  ReferenceDesignDNA,
  StandardAspectRatio,
} from '../../types.js';

export type BenchmarkCategory =
  | 'food_and_beverage'
  | 'beauty_and_skincare'
  | 'fashion'
  | 'health_and_wellness'
  | 'home_and_lifestyle';

export interface BenchmarkBrandFixture {
  id: string;
  brandName: string;
  category: BenchmarkCategory;
  categoryDisplayName: string;
  brandContext: BrandContext;
  packagingStyle: {
    description: string;
    containerType: string;
    finish: string;
    aspectRatio: string;
  };
  campaignObjective: CampaignGoal;
  referenceAd: {
    title: string;
    sourceMode: 'inspiration' | 'layout' | 'style_transfer';
    role: 'layout' | 'typography' | 'color' | 'photography' | 'general';
    dna: ReferenceDesignDNA;
  };
  concepts: Array<{
    id: string;
    pillar: string;
    headline: string;
    subheadline?: string;
    visualIdea: string;
    storyline?: string;
    cta: string;
    offer?: string;
    preferredFormat: string;
    productImageUrl: string;
    backgroundPrompt: string;
    humanDirectorBaseline: HumanEvaluationRecord;
  }>;
}

export interface BenchmarkEvaluationMetrics {
  productFidelity: number; // 0 - 100: packaging preservation, aspect ratio, no occlusion
  brandConsistency: number; // 0 - 100: color palette match, typography compliance, tone
  visualHierarchy: number; // 0 - 100: headline -> product -> badge -> CTA reading progression
  typographyReadability: number; // 0 - 100: font scale, line breaks, zero clipping, contrast
  composition: number; // 0 - 100: balance, negative space (>= 30%), grid alignment
  messageClarity: number; // 0 - 100: concise hook, value proposition, claim accuracy
  ctaVisibility: number; // 0 - 100: button presence, contrast, padding, thumb-stop placement
  referenceInterpretation: number; // 0 - 100: design DNA adherence without trademark infringement
  placementSuitability: number; // 0 - 100: safe-zone compliance, ratio-specific reflow
  overallQuality: number; // 0 - 100: weighted composite score
}

export interface HumanEvaluationRecord {
  reviewer: string;
  overallScore: number; // 0 - 100
  passed: boolean;
  scores: BenchmarkEvaluationMetrics;
  critiqueNotes: string;
  timestamp: string;
}

export type FailurePatternCode =
  | 'TEXT_CLIPPING'
  | 'PRODUCT_OCCLUSION'
  | 'SAFE_ZONE_VIOLATION'
  | 'CONTRAST_DEFICIT'
  | 'UNAPPROVED_CLAIM'
  | 'DIMENSION_MISMATCH'
  | 'FORMAT_MONOTONY'
  | 'MISSING_CTA'
  | 'OVERCROWDED_CANVAS'
  | 'INAPPROPRIATE_BACKGROUND';

export interface FailurePatternOccurrence {
  code: FailurePatternCode;
  severity: 'warning' | 'error';
  description: string;
  recommendation: string;
  affectedLayer?: string;
  placementRatio?: string;
}

export interface MasterCreativeBenchmarkRecord {
  creativeId: string;
  brandId: string;
  category: BenchmarkCategory;
  conceptId: string;
  prompt: string;
  brandName: string;
  model: string;
  blueprint: CreativeBlueprint;
  document: CreativeDocument;
  renderedSvgLength: number;
  svgHash: string;
  automatedMetrics: BenchmarkEvaluationMetrics;
  status: EvaluationStatus;
  passed: boolean;
  hardRuleFailures: string[];
  failurePatterns: FailurePatternOccurrence[];
  humanBaseline: HumanEvaluationRecord;
  humanAiDivergence: {
    scoreDelta: number; // |automated - human|
    passAgreement: boolean;
  };
  measuredAt: string;
}

export interface PlacementCreativeBenchmarkRecord {
  placementId: string;
  masterCreativeId: string;
  brandId: string;
  category: BenchmarkCategory;
  ratio: StandardAspectRatio;
  width: number;
  height: number;
  document: CreativeDocument;
  renderedSvgLength: number;
  pngByteLength: number;
  jpegByteLength: number;
  automatedMetrics: BenchmarkEvaluationMetrics;
  status: EvaluationStatus;
  passed: boolean;
  safeZoneCompliance: {
    passed: boolean;
    violations: string[];
  };
  failurePatterns: FailurePatternOccurrence[];
  measuredAt: string;
}

export interface BenchmarkRunSummary {
  version: string;
  runAt: string;
  totalBrands: number;
  totalMasterCreatives: number;
  totalPlacementExports: number;
  masterCreativeStats: {
    passed: number;
    failed: number;
    unverified: number;
    passRate: number; // 0.0 - 1.0
    averageScores: BenchmarkEvaluationMetrics;
  };
  placementExportStats: {
    passed: number;
    failed: number;
    passRate: number; // 0.0 - 1.0
    byPlacement: Record<StandardAspectRatio, { count: number; passRate: number; averageScore: number }>;
  };
  humanCorrelation: {
    averageScoreDivergence: number; // mean absolute error in points
    passFailAgreementRate: number; // 0.0 - 1.0
  };
  modelPerformance: Record<string, { creativesCount: number; passRate: number; averageScore: number }>;
  categoryPerformance: Record<BenchmarkCategory, { creativesCount: number; passRate: number; averageScore: number }>;
  defectFrequency: Record<FailurePatternCode, number>;
}

export interface ReleaseComparisonReport {
  previousVersion: string;
  currentVersion: string;
  comparisonDate: string;
  deltaMasterPassRate: number;
  deltaPlacementPassRate: number;
  deltaDimensionScores: Partial<Record<keyof BenchmarkEvaluationMetrics, number>>;
  resolvedDefectCount: number;
  newDefectCount: number;
  regressionsDetected: string[];
  overallVerdict: 'IMPROVED' | 'REGRESSED' | 'PARITY';
}

export interface RealHumanReviewerScore {
  reviewerId: string;
  blindSampleId: string;
  productFidelity: number; // 0-100
  visualQuality: number; // 0-100
  brandConsistency: number; // 0-100
  typography: number; // 0-100
  advertisingClarity: number; // 0-100
  overallUsability: number; // 0-100
  passed: boolean;
  notes?: string;
  timestamp: string;
}

export interface RealImageBenchmarkRecord {
  creativeId: string;
  brandId: string;
  conceptId: string;
  modelVersion: string;
  promptVersion: string;
  productReferenceUrls: string[];
  renderingVersion: string;
  evaluatorVersion: string;
  renderedPngBytes: number;
  renderedJpegBytes: number;
  modelInvoked: boolean;
  generationLatencyMs?: number;
  generationError?: string | null;
  estimatedCostCredits?: number;
  measuredUsageCost?: {
    creditsCharged?: number;
    providerCostUsd?: number;
    model?: string;
    success?: boolean;
    error?: string | null;
  } | null;
  dimensions?: { width: number; height: number };
  aiScores: BenchmarkEvaluationMetrics | null;
  humanReviewerScores?: RealHumanReviewerScore[];
  status: EvaluationStatus;
  passed: boolean;
  physicallyMeasured: true;
  measuredAt: string;
}

export interface RealImageBenchmarkSummary {
  benchmarkSuite: 'real_image_generation' | 'structural_dry_run';
  modelInvoked: boolean;
  version: string;
  modelVersion: string;
  evaluatorVersion: string;
  physicallyMeasured: true;
  runAt: string;
  totalEvaluated: number;
  passRate: number;
  averageScores: BenchmarkEvaluationMetrics | null;
  estimatedTotalCredits: number;
  measuredTotalCredits: number;
  humanAgreement: {
    measuredReviewersCount: number;
    averageScoreDelta: number | null;
    agreementRate: number | null;
    status: 'measured' | 'pending_independent_reviewers';
  };
}

