/**
 * CAMPAIGN STUDIO V2 - Regression Test Suite from Previously Identified Visual Defects.
 *
 * Implements regression verification against historical failure patterns:
 *  - REG-001: Long headline typography overflow & clipping
 *  - REG-002: CTA button text clipping from missing container padding
 *  - REG-003: 9:16 Story safe-zone violations (Instagram UI header/footer intrusion)
 *  - REG-004: Product packshot occlusion by overlapping headline text
 *  - REG-005: False-positive quality approval when AI evaluation fails
 *  - REG-006: Unapproved marketing claims without brand evidence
 *  - REG-007: Missing mandatory product packshot layer
 *  - REG-008: Inappropriate background setting clashing with product category
 */

import type {
  BrandContext,
  CreativeBlueprint,
  CreativeDocument,
} from '../../types.js';
import { evaluateBenchmarkCreative } from './evaluator.js';
import { buildCreativeDocument } from '../composition/compositor.js';
import { validateDeterministicQuality } from '../evaluation/qualityRules.js';
import { evaluateCreative } from '../evaluation/qualityEvaluator.js';
import { adaptMasterCreativeToAllFormats } from '../adaptation/creativeAdapter.js';
import { criticizeCreativeDirection, reviseWeakConcepts } from '../agents/compositionCritic.js';
import { BENCHMARK_BRANDS } from './dataset.js';

export interface RegressionTestCase {
  id: string;
  name: string;
  defectCategory: string;
  description: string;
  expectedOutcome: 'MUST_REJECT' | 'MUST_PASS';
  expectedFailurePattern?: string;
  run: () => Promise<{ ok: boolean; message: string }>;
}

export function createRegressionSuite(): RegressionTestCase[] {
  const brand = BENCHMARK_BRANDS[0].brandContext;

  return [
    // -----------------------------------------------------------------------
    // REG-001: Long headline typography overflow
    // -----------------------------------------------------------------------
    {
      id: 'REG-001',
      name: 'Long Headline Overflow Rejection',
      defectCategory: 'TEXT_CLIPPING',
      description: 'Verifies that overflowing multi-line headlines fail deterministic quality and are rejected.',
      expectedOutcome: 'MUST_REJECT',
      expectedFailurePattern: 'TEXT_CLIPPING',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-001',
          conceptId: 'reg-001',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'Overflow Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            // Tiny height allocated for a massive 4-line headline
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.05 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.45, height: 0.07 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: {
            headline: 'This Is An Extremely Long And Verbose Headline That Cannot Possibly Fit Into A Five Percent Height Container Without Severe Truncation',
            cta: 'Shop Now',
          },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        // Set realistic bold hero headline font size (48px) to verify overflow detection within 0.05 height box
        const hl = doc.layers.find((l) => l.id === 'layer-headline');
        if (hl && hl.styles) {
          hl.styles.fontSize = 48;
        }

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand });
        const hasClipping = res.failurePatterns.some((p) => p.code === 'TEXT_CLIPPING');

        return {
          ok: !res.passed && hasClipping,
          message: hasClipping
            ? 'Correctly caught headline overflow and rejected creative.'
            : 'FAILED: Overflowing headline was not rejected.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-002: CTA button text clipping
    // -----------------------------------------------------------------------
    {
      id: 'REG-002',
      name: 'CTA Button Text Width Padding Protection',
      defectCategory: 'TEXT_CLIPPING',
      description: 'Verifies that overly narrow CTA buttons with zero padding are flagged.',
      expectedOutcome: 'MUST_REJECT',
      expectedFailurePattern: 'TEXT_CLIPPING',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-002',
          conceptId: 'reg-002',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'CTA Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            // Tiny 10% width container for a long CTA phrase
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.15 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.08, height: 0.06 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Clean Focus', cta: 'CLAIM 30-DAY RISK-FREE TRIAL NOW' },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        // Set realistic bold hero headline font size (48px) to verify overflow detection within 0.05 height box
        const hl = doc.layers.find((l) => l.id === 'layer-headline');
        if (hl && hl.styles) {
          hl.styles.fontSize = 48;
        }

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand });
        const ctaFlagged = res.failurePatterns.some((p) => p.affectedLayer === 'layer-cta' || p.description.includes('CTA'));

        return {
          ok: ctaFlagged,
          message: ctaFlagged
            ? 'Correctly identified cramped CTA button width.'
            : 'FAILED: Cramped CTA button was not flagged.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-003: 9:16 Story Safe Zone Violations
    // -----------------------------------------------------------------------
    {
      id: 'REG-003',
      name: '9:16 Story Safe Zone Header/Footer Compliance',
      defectCategory: 'SAFE_ZONE_VIOLATION',
      description: 'Verifies that 9:16 Story placements keep elements out of top 250px and bottom 350px UI zones.',
      expectedOutcome: 'MUST_REJECT',
      expectedFailurePattern: 'SAFE_ZONE_VIOLATION',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-003',
          conceptId: 'reg-003',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'Safe Zone Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            // Dangerous: CTA placed at bottom margin (y=0.92, well into the 350px bottom dead zone)
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.15, width: 0.84, height: 0.15 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.92, width: 0.50, height: 0.06 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Clean Focus', cta: 'Shop Now' },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand, ratio: '9:16', isPlacement: true });
        const hasViolation = res.failurePatterns.some((p) => p.code === 'SAFE_ZONE_VIOLATION');

        return {
          ok: !res.passed && hasViolation,
          message: hasViolation
            ? 'Correctly flagged 9:16 bottom dead zone intrusion.'
            : 'FAILED: Story safe zone intrusion was missed.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-004: Product Packshot Occlusion
    // -----------------------------------------------------------------------
    {
      id: 'REG-004',
      name: 'Product Hero Occlusion by Text Layer',
      defectCategory: 'PRODUCT_OCCLUSION',
      description: 'Verifies that text boxes overlapping the hero product packshot fail evaluation.',
      expectedOutcome: 'MUST_REJECT',
      expectedFailurePattern: 'PRODUCT_OCCLUSION',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-004',
          conceptId: 'reg-004',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'Occlusion Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            // Headline directly occupies identical box as product
            elements: [
              { element: 'main_headline', x: 0.15, y: 0.35, width: 0.70, height: 0.30 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.45, height: 0.07 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Occlusion Overlap', cta: 'Shop Now' },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        // Set realistic bold hero headline font size (48px) to verify overflow detection within 0.05 height box
        const hl = doc.layers.find((l) => l.id === 'layer-headline');
        if (hl && hl.styles) {
          hl.styles.fontSize = 48;
        }

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand });
        const hasOcclusion = res.failurePatterns.some((p) => p.code === 'PRODUCT_OCCLUSION');

        return {
          ok: !res.passed && hasOcclusion,
          message: hasOcclusion
            ? 'Correctly rejected product occlusion.'
            : 'FAILED: Product occlusion was not rejected.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-005: False Positive Approval on AI Failure
    // -----------------------------------------------------------------------
    {
      id: 'REG-005',
      name: 'Fail-Closed Status on AI Evaluation Failure',
      defectCategory: 'EVALUATION_INTEGRITY',
      description: 'Verifies that AI evaluation failures return unverified and passed=false, never an optimistic pass.',
      expectedOutcome: 'MUST_REJECT',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-005',
          conceptId: 'reg-005',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'AI Failure Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.45, height: 0.07 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Clean Focus', cta: 'Shop Now' },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        // Simulate failing AI client (network 500 error)
        const failingClient = {
          models: {
            generateContent: async () => {
              throw new Error('500 Internal Server Error');
            },
          },
        };

        const res = await evaluateCreative({ doc, blueprint, brand, client: failingClient });

        const isSafe = res.status === 'unverified' && res.passed === false && res.approvalEligible === false;
        return {
          ok: isSafe,
          message: isSafe
            ? 'Correctly failed closed with status="unverified" and passed=false.'
            : 'FAILED: AI failure resulted in false positive approval.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-006: Unapproved Brand Claims
    // -----------------------------------------------------------------------
    {
      id: 'REG-006',
      name: 'Unapproved Claim and Forbidden Phrase Detection',
      defectCategory: 'UNAPPROVED_CLAIM',
      description: 'Verifies that forbidden words from brand voice are flagged and fail brand consistency.',
      expectedOutcome: 'MUST_REJECT',
      expectedFailurePattern: 'UNAPPROVED_CLAIM',
      run: async () => {
        const strictBrand: BrandContext = {
          ...brand,
          voice: {
            tone: ['premium'],
            doSay: ['pure'],
            dontSay: ['cure', 'miracle', 'cheapest'],
          },
        };

        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-006',
          conceptId: 'reg-006',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'Claim Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
              { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.45, height: 0.07 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'The Miracle Cure for Exhaustion', cta: 'Shop Now' },
          graphicElements: [],
          assets: { productAssetIds: ['p1'], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          productImageUrl: 'https://images.example.com/can.png',
        });

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand: strictBrand });
        const hasClaimDefect = res.failurePatterns.some((p) => p.code === 'UNAPPROVED_CLAIM');

        return {
          ok: !res.passed && hasClaimDefect,
          message: hasClaimDefect
            ? 'Correctly identified and rejected forbidden brand term.'
            : 'FAILED: Forbidden claim was allowed to pass.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-007: Missing Product Hero Packshot
    // -----------------------------------------------------------------------
    {
      id: 'REG-007',
      name: 'Missing Mandatory Product Hero Layer',
      defectCategory: 'PRODUCT_OCCLUSION',
      description: 'Verifies that creatives missing a visible product packshot layer fail hard deterministic QA.',
      expectedOutcome: 'MUST_REJECT',
      run: async () => {
        const blueprint: CreativeBlueprint = {
          id: 'bp-reg-007',
          conceptId: 'reg-007',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Product Hero',
          designIntensity: 'balanced',
          designConcept: 'Missing Product Test',
          visualNarrative: 'Test',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: { visualStyle: 'Clean', mood: 'bold', background: 'Studio', colorPalette: ['#000', '#FFF'], photographyStyle: 'Clean', lighting: 'Clean' },
          layout: {
            composition: 'Clean',
            readingOrder: ['main_headline', 'cta'],
            productPlacement: 'None',
            productScale: 0,
            safeZones: [],
            elements: [
              { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
              { element: 'cta', x: 0.08, y: 0.85, width: 0.45, height: 0.07 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Only Text Here', cta: 'Shop Now' },
          graphicElements: [],
          assets: { productAssetIds: [], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: true, prohibitInventedClaims: true },
        };

        const doc = buildCreativeDocument({
          blueprint,
          // Intentionally omitting productImageUrl
        });

        const res = evaluateBenchmarkCreative({ doc, blueprint, brand });
        const missingProductFail = res.hardRuleFailures.some((f) => f.includes('product'));

        return {
          ok: !res.passed && missingProductFail,
          message: missingProductFail
            ? 'Correctly failed hard deterministic rule for missing product.'
            : 'FAILED: Missing product packshot passed evaluation.',
        };
      },
    },

    // -----------------------------------------------------------------------
    // REG-008: Inappropriate Background Setting Clashing with Product Category
    // -----------------------------------------------------------------------
    {
      id: 'REG-008',
      name: 'Inappropriate Background Clashing with Category Rejection',
      defectCategory: 'INAPPROPRIATE_BACKGROUND',
      description: 'Verifies that visually unappetizing or conflicting backgrounds (e.g., smoky industrial warehouse for food/beverage) are flagged and automatically revised.',
      expectedOutcome: 'MUST_REJECT',
      run: async () => {
        const beverageBrand: BrandContext = {
          ...brand,
          category: 'Food and Beverage',
        };

        const clashingConcept = {
          id: 'concept-clash-001',
          pillar: 'Energy',
          headline: 'Pure Cold Brew Focus',
          visualIdea: 'Can sitting in dark smoky environment',
          backgroundDirection: 'abandoned industrial warehouse with concrete ruin and smoky bar debris',
          cta: 'Order Now',
        };

        const directionPayload: any = {
          concepts: [clashingConcept],
        };

        const critique = criticizeCreativeDirection({
          direction: directionPayload,
          brand: beverageBrand,
        });

        const hasBgIssue = critique.conceptReviews.some((r) =>
          r.issues.some((i) => i.type === 'inappropriate_background')
        );

        // Test self-healing revision
        const { revisedDirection } = reviseWeakConcepts({
          direction: directionPayload,
          critique,
          brand: beverageBrand,
        });

        const revisedBg = (revisedDirection.concepts[0].backgroundDirection || '').toLowerCase();
        const fixedClash = !revisedBg.includes('industrial warehouse') && (revisedBg.includes('clean') || revisedBg.includes('minimalist') || revisedBg.includes('stone') || revisedBg.includes('setting') || revisedBg.includes('commercial'));

        return {
          ok: hasBgIssue && fixedClash,
          message: hasBgIssue && fixedClash
            ? 'Correctly flagged inappropriate background and auto-revised to clean setting.'
            : 'FAILED: Inappropriate background was not properly detected or revised.',
        };
      },
    },
  ];
}

/**
 * Runs the entire visual regression suite and returns pass/fail metrics.
 */
export async function runRegressionSuite(): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{ id: string; name: string; ok: boolean; message: string }>;
}> {
  const tests = createRegressionSuite();
  const results: Array<{ id: string; name: string; ok: boolean; message: string }> = [];

  for (const t of tests) {
    const res = await t.run();
    results.push({
      id: t.id,
      name: t.name,
      ok: res.ok,
      message: res.message,
    });
  }

  const passedTests = results.filter((r) => r.ok).length;
  const failedTests = results.filter((r) => !r.ok).length;

  return {
    totalTests: tests.length,
    passedTests,
    failedTests,
    results,
  };
}
