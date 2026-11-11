/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Phase 4:
 * Creative Quality Evaluation & Targeted Regeneration.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeterministicQuality } from './qualityRules.js';
import { evaluateCreative } from './qualityEvaluator.js';
import { targetedRegenerateCreative } from './targetedRegenerator.js';
import { buildCreativeDocument } from '../composition/compositor.js';
import { createDefaultBlueprintFromConcept } from '../blueprintSchema.js';
import { BRAND, STRATEGY } from '../agents/fixtures.js';
import type { CreativeBlueprint, CreativeDocument } from '../../types.js';

function createSampleBlueprint(overrides: Partial<CreativeBlueprint> = {}): CreativeBlueprint {
  const base = createDefaultBlueprintFromConcept({
    concept: {
      id: 'qa-speed-1',
      pillar: 'Speed',
      headline: 'Breakfast In 60 Seconds Flat',
      subheadline: 'Instant clean fuel for busy mornings',
      visualIdea: 'Warm oats cup on dark slate with timer',
      storyline: 'Busy morning professional saves 20 minutes.',
      cta: 'ORDER STARTER PACK',
      composition: 'Hero packshot with bold top headline and grounded shadow',
    },
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    designIntensity: 'bold',
  });
  base.advertisingFormat = 'Promotional Retail Poster';
  base.copy.offer = '50% OFF TODAY';
  base.constraints = {
    preserveProductPackaging: true,
    preserveLogo: true,
    exactCopyRequired: true,
    prohibitInventedClaims: true,
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// 1. Deterministic Hard Validation Rules Tests
// ---------------------------------------------------------------------------

test('qualityRules: accepts a fully compliant creative document', () => {
  const blueprint = createSampleBlueprint();
  const doc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/clean-slate.jpg',
    productImageUrl: 'https://images.example.com/product-packshot.png',
    brandName: 'PRUSTLR',
    brandColors: ['#0A0A0A', '#E4572E'],
  });

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, true);
  assert.equal(res.failures.length, 0);
});

test('qualityRules: rejects document with missing product packshot', () => {
  const blueprint = createSampleBlueprint();
  const doc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/clean-slate.jpg',
    // productImageUrl omitted
    brandName: 'PRUSTLR',
  });

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, false);
  assert.ok(res.failures.some((f) => f.includes('product')));
  assert.ok(res.issues.some((i) => i.category === 'productAccuracy' && i.severity === 'critical'));
});

test('qualityRules: rejects document with missing mandatory brand logo when constrained', () => {
  const blueprint = createSampleBlueprint();
  const doc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/clean-slate.jpg',
    productImageUrl: 'https://images.example.com/product.png',
  });
  // Strip logo layer
  doc.layers = doc.layers.filter((l) => l.type !== 'logo');

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, false);
  assert.ok(res.failures.some((f) => f.includes('logo')));
  assert.ok(res.issues.some((i) => i.category === 'brandConsistency' && i.severity === 'critical'));
});

test('qualityRules: rejects document with canvas dimension mismatch', () => {
  const blueprint = createSampleBlueprint();
  const doc = buildCreativeDocument({
    blueprint,
    productImageUrl: 'https://images.example.com/product.png',
  });
  // Mismatch: 4:5 aspect ratio should be 1080x1350, set to 800x600
  doc.canvas.width = 800;
  doc.canvas.height = 600;

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, false);
  assert.ok(res.failures.some((f) => f.includes('Canvas dimension mismatch')));
});

test('qualityRules: rejects document with missing approved promotional offer', () => {
  const blueprint = createSampleBlueprint();
  blueprint.copy.offer = 'BUY 1 GET 1 FREE';
  const doc = buildCreativeDocument({
    blueprint,
    productImageUrl: 'https://images.example.com/product.png',
  });
  // Badge layer has different offer text
  const badgeLayer = doc.layers.find((l) => l.type === 'badge');
  if (badgeLayer) badgeLayer.content = '10% DISCOUNT';

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, false);
  assert.ok(res.failures.some((f) => f.includes('BUY 1 GET 1 FREE')));
});

test('qualityRules: rejects document with clipped / overflowing bounding boxes', () => {
  const blueprint = createSampleBlueprint();
  const doc = buildCreativeDocument({
    blueprint,
    productImageUrl: 'https://images.example.com/product.png',
  });
  // Force headline to overflow canvas width
  const headline = doc.layers.find((l) => l.id === 'layer-headline');
  if (headline) {
    headline.position.x = 0.8;
    headline.position.width = 0.5; // x + width = 1.3 > 1.0!
  }

  const res = validateDeterministicQuality(doc, blueprint);
  assert.equal(res.passed, false);
  assert.ok(res.failures.some((f) => f.includes('overflows canvas boundaries')));
});

// ---------------------------------------------------------------------------
// 2. Targeted Component Regeneration Tests
// ---------------------------------------------------------------------------

test('targetedRegenerator: replaces background without altering approved headline or product', () => {
  const blueprint = createSampleBlueprint();
  const initialDoc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/old-bg.jpg',
    productImageUrl: 'https://images.example.com/product.png',
  });

  const originalHeadline = initialDoc.layers.find((l) => l.id === 'layer-headline')?.content;
  const originalProduct = initialDoc.layers.find((l) => l.id === 'layer-product')?.content;
  const originalVersion = initialDoc.version;

  const res = targetedRegenerateCreative({
    doc: initialDoc,
    component: 'background',
    newAssetUrl: 'https://images.example.com/new-cinematic-bg.jpg',
  });

  assert.equal(res.document.version, originalVersion + 1);
  assert.ok(res.actionTaken.includes('Replaced background environment'));

  // Background is updated
  const newBg = res.document.layers.find((l) => l.id === 'layer-background');
  assert.equal(newBg?.styles.backgroundImage, 'https://images.example.com/new-cinematic-bg.jpg');

  // Headline and product are completely untouched
  const preservedHeadline = res.document.layers.find((l) => l.id === 'layer-headline')?.content;
  const preservedProduct = res.document.layers.find((l) => l.id === 'layer-product')?.content;
  assert.equal(preservedHeadline, originalHeadline);
  assert.equal(preservedProduct, originalProduct);

  // Standalone composite is re-rendered
  assert.ok(res.compositeUrl.startsWith('data:image/svg+xml;base64,'));
  assert.ok(res.svg.includes('https://images.example.com/new-cinematic-bg.jpg'));
});

test('targetedRegenerator: updates headline copy and styling without touching background or product', () => {
  const blueprint = createSampleBlueprint();
  const initialDoc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/bg.jpg',
    productImageUrl: 'https://images.example.com/product.png',
  });

  const originalBg = initialDoc.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage;

  const res = targetedRegenerateCreative({
    doc: initialDoc,
    component: 'headline',
    newContent: 'Fuel Like A Champion',
    patchStyles: { color: '#F59E0B', fontWeight: 900 },
  });

  const newHeadline = res.document.layers.find((l) => l.id === 'layer-headline');
  assert.equal(newHeadline?.content, 'Fuel Like A Champion');
  assert.equal(newHeadline?.styles.color, '#F59E0B');
  assert.equal(newHeadline?.styles.fontWeight, 900);

  // Background is untouched
  const preservedBg = res.document.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage;
  assert.equal(preservedBg, originalBg);
});

// ---------------------------------------------------------------------------
// 3. Acceptance Criteria: Comprehensive Quality Evaluation Test Cases
// ---------------------------------------------------------------------------

test('acceptance: evaluates 5 distinct test cases (high quality, distorted product, incorrect text, poor composition, wrong dimensions)', async () => {
  const blueprint = createSampleBlueprint();

  // Case 1: High-Quality Creative
  const highQualityDoc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/clean-studio.jpg',
    productImageUrl: 'https://images.example.com/packshot.png',
    brandName: 'PRUSTLR',
    brandColors: ['#0A0A0A', '#E4572E'],
  });

  const evalCase1 = await evaluateCreative({ doc: highQualityDoc, blueprint, brand: BRAND });
  assert.ok(evalCase1.totalScore >= 75, `High quality creative must score >= 75, got ${evalCase1.totalScore}`);
  assert.equal(evalCase1.passed, true);
  assert.notEqual(evalCase1.status, 'rejected');
  assert.equal(evalCase1.hardRuleFailures.length, 0);

  // Case 2: Creative with Missing / Distorted Product Packshot
  const distortedProductDoc = buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/clean-studio.jpg',
    brandName: 'PRUSTLR',
  });
  // Strip product layer
  distortedProductDoc.layers = distortedProductDoc.layers.filter((l) => l.type !== 'product');

  const evalCase2 = await evaluateCreative({ doc: distortedProductDoc, blueprint, brand: BRAND });
  assert.equal(evalCase2.passed, false, 'Distorted/missing product creative must fail evaluation');
  assert.equal(evalCase2.status, 'rejected');
  assert.ok(evalCase2.hardRuleFailures.some((f) => f.includes('product')));
  assert.ok(evalCase2.scores.productAccuracy <= 5, 'Product score must be heavily penalized');

  // Case 3: Creative with Missing / Incorrect Promotional Offer
  const incorrectOfferBlueprint = createSampleBlueprint();
  incorrectOfferBlueprint.copy.offer = '70% MEGA CLEARANCE';
  const incorrectOfferDoc = buildCreativeDocument({
    blueprint: incorrectOfferBlueprint,
    productImageUrl: 'https://images.example.com/packshot.png',
  });
  // Force badge to have wrong text
  const badge = incorrectOfferDoc.layers.find((l) => l.type === 'badge');
  if (badge) badge.content = 'FREE SHIPPING';

  const evalCase3 = await evaluateCreative({ doc: incorrectOfferDoc, blueprint: incorrectOfferBlueprint, brand: BRAND });
  assert.equal(evalCase3.passed, false, 'Creative with unapproved offer mismatch must be rejected');
  assert.equal(evalCase3.status, 'rejected');
  assert.ok(evalCase3.hardRuleFailures.some((f) => f.includes('70% MEGA CLEARANCE')));

  // Case 4: Creative with Poor Composition / Overflowing Boundary
  const poorCompositionDoc = buildCreativeDocument({
    blueprint,
    productImageUrl: 'https://images.example.com/packshot.png',
  });
  // Place headline outside canvas
  const hl = poorCompositionDoc.layers.find((l) => l.id === 'layer-headline');
  if (hl) {
    hl.position.x = 0.75;
    hl.position.width = 0.5; // overflows width
  }

  const evalCase4 = await evaluateCreative({ doc: poorCompositionDoc, blueprint, brand: BRAND });
  assert.equal(evalCase4.passed, false, 'Creative with clipped text must fail compliance');
  assert.equal(evalCase4.status, 'rejected');
  assert.equal(evalCase4.scores.technicalCompliance, 0, 'Technical compliance score must be 0 for overflow');

  // Case 5: Creative with Incorrect Dimensions
  const wrongDimensionsDoc = buildCreativeDocument({
    blueprint,
    productImageUrl: 'https://images.example.com/packshot.png',
  });
  wrongDimensionsDoc.canvas.width = 500;
  wrongDimensionsDoc.canvas.height = 500; // 500x500 instead of 1080x1350 for 4:5

  const evalCase5 = await evaluateCreative({ doc: wrongDimensionsDoc, blueprint, brand: BRAND });
  assert.equal(evalCase5.passed, false, 'Creative with invalid dimensions must be rejected');
  assert.equal(evalCase5.status, 'rejected');
  assert.ok(evalCase5.hardRuleFailures.some((f) => f.includes('dimension mismatch')));

  // Case 6: Targeted Improvement: Take Case 4 (Poor composition), apply targeted fix, re-evaluate
  const fixedDocResult = targetedRegenerateCreative({
    doc: poorCompositionDoc,
    component: 'headline',
    patchStyles: {}, // restores normal position
  });
  // Reset headline bounding box safely inside safe zones
  const fixedHeadline = fixedDocResult.document.layers.find((l) => l.id === 'layer-headline');
  if (fixedHeadline) {
    fixedHeadline.position.x = 0.08;
    fixedHeadline.position.width = 0.84;
  }

  const evalAfterFix = await evaluateCreative({ doc: fixedDocResult.document, blueprint, brand: BRAND });
  assert.equal(evalAfterFix.hardRuleFailures.length, 0);
  assert.equal(evalAfterFix.passed, true);
  assert.notEqual(evalAfterFix.status, 'rejected');
});

