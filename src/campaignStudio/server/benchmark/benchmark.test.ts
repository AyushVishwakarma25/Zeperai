/**
 * CAMPAIGN STUDIO V2 - Quality Benchmark Test Suite.
 *
 * Verifies:
 *  1. Ground-truth benchmark dataset (10 brands, 5 categories, 50 concepts, human CD baselines)
 *  2. Multi-dimensional evaluator across 10 creative dimensions
 *  3. Historical defect regression test suite (REG-001 through REG-008)
 *  4. Full benchmark runner execution producing 50 master creatives & 200 placement exports
 *  5. Release comparison & regression detection logic
 *  6. Executive Markdown benchmark report generation
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BENCHMARK_BRANDS, BENCHMARK_CATEGORIES } from './dataset.js';
import { evaluateBenchmarkCreative } from './evaluator.js';
import { runRegressionSuite } from './regressions.js';
import {
  runCampaignStudioBenchmark,
  runStructuralRegressionBenchmark,
  runRealImageBenchmark,
  compareBenchmarkReleases,
  generateBenchmarkReportMarkdown,
} from './benchmarkRunner.js';
import { buildCreativeDocument } from '../composition/compositor.js';
import type { CreativeBlueprint } from '../../types.js';

test('benchmark dataset: covers 10 brands, 5 categories, packaging styles, reference DNA, and 50 concepts with human CD baselines', () => {
  assert.equal(BENCHMARK_BRANDS.length, 10, 'Must have exactly 10 authentic D2C benchmark brands');

  const categories = new Set(BENCHMARK_BRANDS.map((b) => b.category));
  assert.equal(categories.size, 5, 'Must cover 5 diverse commercial categories');
  assert.ok(categories.has('food_and_beverage'));
  assert.ok(categories.has('beauty_and_skincare'));
  assert.ok(categories.has('fashion'));
  assert.ok(categories.has('health_and_wellness'));
  assert.ok(categories.has('home_and_lifestyle'));

  let totalConcepts = 0;
  for (const brand of BENCHMARK_BRANDS) {
    assert.ok(brand.id, 'Brand must have unique ID');
    assert.ok(brand.brandName, 'Brand must have display name');
    assert.ok(brand.brandContext, 'Brand must have full brandContext');
    assert.ok(brand.packagingStyle.containerType, 'Packaging style must specify containerType');
    assert.ok(brand.packagingStyle.finish, 'Packaging style must specify finish');
    assert.ok(brand.referenceAd.dna.layoutType, 'Reference ad must have extracted layoutType');
    assert.ok(brand.referenceAd.dna.colorPalette.length >= 2, 'Reference ad must have color palette');

    assert.equal(brand.concepts.length, 5, `Brand "${brand.brandName}" must have exactly 5 distinct creative concepts`);
    totalConcepts += brand.concepts.length;

    for (const concept of brand.concepts) {
      assert.ok(concept.id, 'Concept must have ID');
      assert.ok(concept.headline, 'Concept must have headline');
      assert.ok(concept.visualIdea, 'Concept must have visual idea');
      assert.ok(concept.cta, 'Concept must have CTA');
      assert.ok(concept.preferredFormat, 'Concept must specify preferred advertising format');
      assert.ok(concept.productImageUrl, 'Concept must provide product packshot URL');
      assert.ok(concept.humanDirectorBaseline, 'Concept must provide human CD baseline');
      assert.equal(typeof concept.humanDirectorBaseline.overallScore, 'number');
      assert.ok(concept.humanDirectorBaseline.reviewer.includes('Creative Director'));
    }
  }

  assert.equal(totalConcepts, 50, 'Dataset must total exactly 50 concepts across the 10 brands');
});

test('evaluator: calculates 10 dimensions, evaluates master creatives and placements independently', () => {
  const brandFixture = BENCHMARK_BRANDS[0];
  const concept = brandFixture.concepts[0];

  const blueprint: CreativeBlueprint = {
    id: 'bp-eval-test',
    conceptId: concept.id,
    version: 1,
    status: 'approved',
    marketingAngle: concept.pillar,
    advertisingFormat: concept.preferredFormat,
    designIntensity: 'balanced',
    designConcept: concept.visualIdea,
    visualNarrative: concept.visualIdea,
    canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
    artDirection: {
      visualStyle: 'Modern',
      mood: 'bold',
      background: 'Clean Studio',
      colorPalette: ['#0D0D0D', '#D97706'],
      photographyStyle: 'Clean',
      lighting: 'Studio',
    },
    layout: {
      composition: 'Hero',
      readingOrder: ['main_headline', 'product', 'cta'],
      productPlacement: 'Center',
      productScale: 0.55,
      safeZones: [],
      elements: [
        { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.16 },
        { element: 'product', x: 0.15, y: 0.36, width: 0.70, height: 0.45 },
        { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07 },
      ],
    },
    typography: {
      headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' },
      hierarchy: [],
    },
    copy: {
      headline: concept.headline,
      cta: concept.cta,
    },
    graphicElements: [],
    assets: { productAssetIds: ['p1'], referenceIds: [] },
    constraints: {
      preserveProductPackaging: true,
      preserveLogo: true,
      exactCopyRequired: true,
      prohibitInventedClaims: true,
    },
  };

  const doc = buildCreativeDocument({
    blueprint,
    productImageUrl: concept.productImageUrl,
    brandName: brandFixture.brandName,
  });

  const masterEval = evaluateBenchmarkCreative({
    doc,
    blueprint,
    brand: brandFixture.brandContext,
    referenceDNA: brandFixture.referenceAd.dna,
    ratio: '4:5',
    isPlacement: false,
  });

  // Verify all 10 dimensions are computed
  assert.equal(typeof masterEval.metrics.productFidelity, 'number');
  assert.equal(typeof masterEval.metrics.brandConsistency, 'number');
  assert.equal(typeof masterEval.metrics.visualHierarchy, 'number');
  assert.equal(typeof masterEval.metrics.typographyReadability, 'number');
  assert.equal(typeof masterEval.metrics.composition, 'number');
  assert.equal(typeof masterEval.metrics.messageClarity, 'number');
  assert.equal(typeof masterEval.metrics.ctaVisibility, 'number');
  assert.equal(typeof masterEval.metrics.referenceInterpretation, 'number');
  assert.equal(typeof masterEval.metrics.placementSuitability, 'number');
  assert.equal(typeof masterEval.metrics.overallQuality, 'number');

  assert.equal(masterEval.passed, true);
  assert.ok(masterEval.metrics.overallQuality >= 80);
});

test('regression suite: executes 8 historical defect test cases (REG-001 through REG-008) and asserts all pass', async () => {
  const regResults = await runRegressionSuite();
  assert.equal(regResults.totalTests, 8, 'Must execute exactly 8 visual defect regression tests');
  assert.equal(regResults.failedTests, 0, 'Zero visual defect regressions allowed');
  assert.equal(regResults.passedTests, 8, 'All 8 regression tests must pass');

  const testIds = regResults.results.map((r) => r.id);
  assert.deepEqual(testIds, ['REG-001', 'REG-002', 'REG-003', 'REG-004', 'REG-005', 'REG-006', 'REG-007', 'REG-008']);
});

test('benchmark runner: evaluates all 10 brands, 50 master creatives, and 200 placement exports with real measured stats', async () => {
  const result = await runCampaignStudioBenchmark({
    rasterizeSampleRate: 0.05, // sampled raster rendering for real PNG/JPEG buffers
  });

  const { summary, records, placements } = result;

  // Invariant 1: Exactly 50 master creatives and 200 placements
  assert.equal(records.length, 50, 'Must produce and evaluate exactly 50 master creatives');
  assert.equal(placements.length, 200, 'Must produce and evaluate exactly 200 placement exports (4 per concept)');

  assert.equal(summary.totalBrands, 10);
  assert.equal(summary.totalMasterCreatives, 50);
  assert.equal(summary.totalPlacementExports, 200);

  // Invariant 2: Measured master creative pass rate >= 85%
  assert.ok(summary.masterCreativeStats.passRate >= 0.85, `Master pass rate must be >= 85%, got ${summary.masterCreativeStats.passRate}`);
  assert.equal(summary.masterCreativeStats.passed, 50);
  assert.equal(summary.masterCreativeStats.failed, 0);

  // Invariant 3: Measured placement pass rate >= 85%
  assert.ok(summary.placementExportStats.passRate >= 0.85, `Placement pass rate must be >= 85%, got ${summary.placementExportStats.passRate}`);
  assert.ok(summary.placementExportStats.passed >= 190);

  // Invariant 4: Placements by aspect ratio
  assert.equal(summary.placementExportStats.byPlacement['1:1'].count, 50);
  assert.equal(summary.placementExportStats.byPlacement['4:5'].count, 50);
  assert.equal(summary.placementExportStats.byPlacement['9:16'].count, 50);
  assert.equal(summary.placementExportStats.byPlacement['1.91:1'].count, 50);

  // Invariant 5: Human correlation within commercial bounds
  assert.ok(summary.humanCorrelation.averageScoreDivergence <= 12.0, `Score delta must be <= 12.0 pts, got ${summary.humanCorrelation.averageScoreDivergence}`);
  assert.ok(summary.humanCorrelation.passFailAgreementRate >= 0.85, `Agreement must be >= 85%, got ${summary.humanCorrelation.passFailAgreementRate}`);

  // Invariant 6: Audit trail completeness
  for (const m of records.slice(0, 5)) {
    assert.ok(m.creativeId);
    assert.ok(m.prompt);
    assert.ok(m.svgHash.length === 64, 'SVG hash must be valid 64-char sha256 hex');
    assert.ok(m.renderedSvgLength > 500, 'Rendered SVG must be non-empty');
    assert.ok(m.humanBaseline.overallScore > 0);
  }

  for (const p of placements.slice(0, 5)) {
    assert.ok(p.placementId);
    assert.ok(p.masterCreativeId);
    assert.ok(p.width > 0 && p.height > 0);
    assert.ok(p.pngByteLength > 0, 'Must record measured PNG byte size');
    assert.ok(p.jpegByteLength > 0, 'Must record measured JPEG byte size');
  }
});

test('release comparison: calculates delta pass rates, dimension shifts, and detects regressions', () => {
  const previousSummary = {
    version: 'v1.9.0',
    runAt: '2026-11-01T00:00:00Z',
    totalBrands: 10,
    totalMasterCreatives: 50,
    totalPlacementExports: 200,
    masterCreativeStats: {
      passed: 40,
      failed: 10,
      unverified: 0,
      passRate: 0.80,
      averageScores: {
        productFidelity: 85,
        brandConsistency: 86,
        visualHierarchy: 80,
        typographyReadability: 75,
        composition: 82,
        messageClarity: 84,
        ctaVisibility: 80,
        referenceInterpretation: 80,
        placementSuitability: 82,
        overallQuality: 82,
      },
    },
    placementExportStats: {
      passed: 160,
      failed: 40,
      passRate: 0.80,
      byPlacement: {
        '1:1': { count: 50, passRate: 0.88, averageScore: 84 },
        '4:5': { count: 50, passRate: 0.86, averageScore: 83 },
        '9:16': { count: 50, passRate: 0.70, averageScore: 78 },
        '1.91:1': { count: 50, passRate: 0.76, averageScore: 80 },
      },
    },
    humanCorrelation: {
      averageScoreDivergence: 10.5,
      passFailAgreementRate: 0.82,
    },
    modelPerformance: {},
    categoryPerformance: {} as any,
    defectFrequency: {
      TEXT_CLIPPING: 14,
      PRODUCT_OCCLUSION: 4,
      SAFE_ZONE_VIOLATION: 8,
      CONTRAST_DEFICIT: 2,
      UNAPPROVED_CLAIM: 1,
      DIMENSION_MISMATCH: 0,
      FORMAT_MONOTONY: 0,
      MISSING_CTA: 2,
      OVERCROWDED_CANVAS: 5,
      INAPPROPRIATE_BACKGROUND: 1,
    },
  };

  const currentSummary = {
    version: 'v2.0.0',
    runAt: '2026-11-12T00:00:00Z',
    totalBrands: 10,
    totalMasterCreatives: 50,
    totalPlacementExports: 200,
    masterCreativeStats: {
      passed: 49,
      failed: 1,
      unverified: 0,
      passRate: 0.98,
      averageScores: {
        productFidelity: 98,
        brandConsistency: 96,
        visualHierarchy: 94,
        typographyReadability: 92,
        composition: 95,
        messageClarity: 94,
        ctaVisibility: 94,
        referenceInterpretation: 92,
        placementSuitability: 96,
        overallQuality: 95,
      },
    },
    placementExportStats: {
      passed: 198,
      failed: 2,
      passRate: 0.99,
      byPlacement: {
        '1:1': { count: 50, passRate: 1.0, averageScore: 96 },
        '4:5': { count: 50, passRate: 1.0, averageScore: 96 },
        '9:16': { count: 50, passRate: 0.96, averageScore: 94 },
        '1.91:1': { count: 50, passRate: 1.0, averageScore: 95 },
      },
    },
    humanCorrelation: {
      averageScoreDivergence: 6.8,
      passFailAgreementRate: 0.98,
    },
    modelPerformance: {},
    categoryPerformance: {} as any,
    defectFrequency: {
      TEXT_CLIPPING: 2,
      PRODUCT_OCCLUSION: 0,
      SAFE_ZONE_VIOLATION: 2,
      CONTRAST_DEFICIT: 0,
      UNAPPROVED_CLAIM: 0,
      DIMENSION_MISMATCH: 0,
      FORMAT_MONOTONY: 0,
      MISSING_CTA: 0,
      OVERCROWDED_CANVAS: 0,
      INAPPROPRIATE_BACKGROUND: 0,
    },
  };

  const comparison = compareBenchmarkReleases(previousSummary, currentSummary);

  assert.equal(comparison.previousVersion, 'v1.9.0');
  assert.equal(comparison.currentVersion, 'v2.0.0');
  assert.equal(comparison.overallVerdict, 'IMPROVED');
  assert.ok(comparison.deltaMasterPassRate > 0.10);
  assert.ok(comparison.deltaPlacementPassRate > 0.10);
  assert.ok(comparison.resolvedDefectCount > 20);
  assert.equal(comparison.regressionsDetected.length, 0);
});

test('report generator: outputs comprehensive Markdown quality benchmark report with KPI tables and defect breakdown', () => {
  const mockSummary = {
    version: 'v2.0.0-rc1',
    runAt: '2026-11-12T12:00:00Z',
    totalBrands: 10,
    totalMasterCreatives: 50,
    totalPlacementExports: 200,
    masterCreativeStats: {
      passed: 50,
      failed: 0,
      unverified: 0,
      passRate: 1.0,
      averageScores: {
        productFidelity: 100,
        brandConsistency: 100,
        visualHierarchy: 100,
        typographyReadability: 95,
        composition: 100,
        messageClarity: 100,
        ctaVisibility: 96,
        referenceInterpretation: 100,
        placementSuitability: 100,
        overallQuality: 99,
      },
    },
    placementExportStats: {
      passed: 198,
      failed: 2,
      passRate: 0.99,
      byPlacement: {
        '1:1': { count: 50, passRate: 1.0, averageScore: 99 },
        '4:5': { count: 50, passRate: 1.0, averageScore: 99 },
        '9:16': { count: 50, passRate: 0.96, averageScore: 97 },
        '1.91:1': { count: 50, passRate: 1.0, averageScore: 99 },
      },
    },
    humanCorrelation: {
      averageScoreDivergence: 7.1,
      passFailAgreementRate: 1.0,
    },
    modelPerformance: {
      'gemini-2.5-flash': { creativesCount: 50, passRate: 1.0, averageScore: 99 },
    },
    categoryPerformance: {
      food_and_beverage: { creativesCount: 10, passRate: 1.0, averageScore: 99 },
      beauty_and_skincare: { creativesCount: 10, passRate: 1.0, averageScore: 99 },
      fashion: { creativesCount: 10, passRate: 1.0, averageScore: 99 },
      health_and_wellness: { creativesCount: 10, passRate: 1.0, averageScore: 99 },
      home_and_lifestyle: { creativesCount: 10, passRate: 1.0, averageScore: 99 },
    },
    defectFrequency: {
      TEXT_CLIPPING: 6,
      PRODUCT_OCCLUSION: 0,
      SAFE_ZONE_VIOLATION: 2,
      CONTRAST_DEFICIT: 0,
      UNAPPROVED_CLAIM: 0,
      DIMENSION_MISMATCH: 0,
      FORMAT_MONOTONY: 0,
      MISSING_CTA: 0,
      OVERCROWDED_CANVAS: 0,
      INAPPROPRIATE_BACKGROUND: 0,
    },
  };

  const md = generateBenchmarkReportMarkdown(mockSummary);

  assert.ok(md.includes('# ZeperAI Campaign Studio V2 - Creative Quality Benchmark Report'));
  assert.ok(md.includes('10 Authentic D2C Brands'));
  assert.ok(md.includes('50 Master Creatives | 200 Placement Exports'));
  assert.ok(md.includes('1. Executive Summary & KPIs'));
  assert.ok(md.includes('2. 10 Critical Creative Dimensions Evaluation'));
  assert.ok(md.includes('3. Placement-by-Placement Performance Matrix'));
  assert.ok(md.includes('4. Category Performance Breakdown'));
  assert.ok(md.includes('5. Failure Pattern Distribution'));
  assert.ok(md.includes('7. Audit Trail Invariants & Isolation Guarantee'));
});

test('benchmark suites: separates structural regression suite from real image generation benchmark', async () => {
  // 1. Suite A: Structural regression benchmark
  assert.equal(typeof runStructuralRegressionBenchmark, 'function');
  assert.equal(runCampaignStudioBenchmark, runStructuralRegressionBenchmark, 'Legacy alias must point to structural suite');

  // 2. Suite B: Real image generation benchmark vs Structural dry run
  assert.equal(typeof runRealImageBenchmark, 'function');

  const fakeFetcher: any = async () => ({
    body: Buffer.from('mockpng'),
    contentType: 'image/png',
  });

  let mockModelCalledWithRefs = false;
  const mockGeminiClient = {
    models: {
      generateContent: async (opts: any) => {
        if (opts.config?.imageConfig) {
          if (opts.contents?.parts?.some((p: any) => p.inlineData)) {
            mockModelCalledWithRefs = true;
          }
          return {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/png',
                        data: Buffer.from('mockpng').toString('base64'),
                      },
                    },
                  ],
                },
              },
            ],
          };
        }
        return {
          text: JSON.stringify({
            scores: {
              visualHierarchy: 90,
              productAccuracy: 95,
              brandConsistency: 90,
              typography: 90,
              visualQuality: 90,
              messageClarity: 90,
              technicalCompliance: 90,
            },
            issues: [],
            hardRuleFailures: [],
            passed: true,
          }),
        };
      },
    },
  };

  const miniRun = await runRealImageBenchmark({
    brands: [BENCHMARK_BRANDS[0]], // Single brand test without model invocation
    fetcher: fakeFetcher,
    geminiClient: mockGeminiClient,
  });

  // When model is not invoked, benchmarkSuite must honestly report structural_dry_run
  assert.equal(miniRun.summary.benchmarkSuite, 'structural_dry_run');
  assert.equal(miniRun.summary.modelInvoked, false);
  assert.equal(miniRun.summary.measuredTotalCredits, 0);
  assert.equal(miniRun.summary.physicallyMeasured, true);
  assert.equal(miniRun.records.length, 5);
  assert.equal(miniRun.records[0].modelInvoked, false);

  const realModelRun = await runRealImageBenchmark({
    brands: [BENCHMARK_BRANDS[0]],
    callRealImageModel: true,
    geminiClient: mockGeminiClient,
    fetcher: fakeFetcher,
  });
  assert.equal(realModelRun.summary.benchmarkSuite, 'real_image_generation');
  assert.equal(realModelRun.summary.modelInvoked, true);
  assert.equal(realModelRun.summary.measuredTotalCredits, 5);
  assert.equal(realModelRun.records[0].modelInvoked, true);
  assert.equal(realModelRun.records[0].measuredUsageCost?.creditsCharged, 1);
  assert.equal(mockModelCalledWithRefs, true);

  // Without independent reviewers, human agreement must report pending rather than synthetic calculation
  assert.equal(miniRun.summary.humanAgreement.status, 'pending_independent_reviewers');
  assert.equal(miniRun.summary.humanAgreement.averageScoreDelta, null);
  assert.equal(miniRun.summary.humanAgreement.agreementRate, null);

  // When independent reviewers are provided:
  const reviewedRun = await runRealImageBenchmark({
    brands: [BENCHMARK_BRANDS[0]],
    fetcher: fakeFetcher,
    geminiClient: mockGeminiClient,
    reviewerRatings: [
      {
        reviewerId: 'rev-01',
        blindSampleId: `blind-${BENCHMARK_BRANDS[0].id}-${BENCHMARK_BRANDS[0].concepts[0].id}`,
        productFidelity: 92,
        visualQuality: 90,
        brandConsistency: 95,
        typography: 88,
        advertisingClarity: 90,
        overallUsability: 91,
        passed: true,
        timestamp: new Date().toISOString(),
      },
    ],
  });
  assert.equal(reviewedRun.summary.humanAgreement.status, 'measured');
  assert.equal(reviewedRun.summary.humanAgreement.measuredReviewersCount, 1);
});

