/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Campaign-wide Advertising Format Allocation.
 *
 * Covers:
 * 1. Multiple concepts with identical preselected format IDs (de-duplication).
 * 2. Explicitly locked formats (unconditional preservation).
 * 3. Insufficient format availability / tight constraints (controlled fallback).
 * 4. Small campaigns (1-2 concepts).
 * 5. Oversized campaigns (N > 15 concepts, more concepts than available formats).
 * 6. Deterministic and reproducible allocation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateCampaignFormats,
  assignFormatsToConcepts,
  evaluateFormatSuitability,
} from './formatStrategist.js';
import { getAdvertisingFormat, ADVERTISING_FORMATS } from '../formatLibrary.js';
import type { CreativeConcept, CampaignStrategy } from '../../types.js';

function createMockConcept(id: string, pillar: string, angle: string, format?: string, isLocked?: boolean): CreativeConcept {
  return {
    id,
    pillar,
    angle,
    headline: `Headline for ${id}`,
    subheadline: `Subheadline for ${id}`,
    visualIdea: `Visual idea for ${id}`,
    storyline: `Storyline for ${id}`,
    cta: 'Shop Now',
    composition: 'Balanced composition',
    isLocked,
    formatLocked: isLocked,
    blueprint: format
      ? {
          canvas: { width: 1080, height: 1080, aspectRatio: '1:1', unit: 'px' },
          advertisingFormat: format,
          designIntensity: 'balanced',
          layout: { readingOrder: ['main_headline', 'product', 'cta'], elements: [] },
          visualNarrative: { mood: 'energetic', compositionStyle: 'clean', heroElement: 'product' },
          typography: {
            primaryFont: { family: 'Inter', category: 'sans-serif' },
            fontScaleRatio: 1.25,
            hierarchy: { mainHeadline: { fontSizeRem: 2.5, fontWeight: 700, casing: 'none', letterSpacing: 'normal' } },
          },
          graphicElements: { badges: [], pills: [], decorative: [] },
          brandFidelity: { requireExactLogo: true, allowedDistortions: [], colors: { dominant: '#ffffff', secondary: '#000000', accent: '#3b82f6', background: '#f8fafc' } },
        }
      : undefined,
  };
}

const mockStrategy: CampaignStrategy = {
  objective: 'Drive sales of premium coffee blends',
  bigIdea: 'Artisan roast made effortless for modern mornings',
  positioningStatement: 'The premier single-origin coffee for professionals',
  audience: {
    primary: 'Urban working professionals 25-45',
    insight: 'Want cafe-quality espresso at home without complex equipment',
    mindset: 'Value quality, speed, and clean aesthetic',
  },
  keyMessages: [
    { message: 'Barista quality in 60 seconds', proof: 'Precision nitrogen sealed roast pods' },
    { message: '100% fair trade Ethiopian beans', proof: 'Single-estate certified sourcing' },
  ],
  funnelStage: 'conversion',
  offer: 'Save 20% on first subscription box',
  cta: 'Claim Your Starter Pack',
  tone: ['confident', 'sophisticated', 'warm'],
  contentPillars: [
    { name: 'Speed & Convenience', description: 'Quick morning espresso', exampleAd: 'Stopwatch visual' },
    { name: 'Flavor & Quality', description: 'Single origin bean tasting notes', exampleAd: 'Tasting wheel' },
    { name: 'Value & Offer', description: 'Introductory discount', exampleAd: 'Offer callout' },
  ],
  creativeMix: [
    { pillar: 'Speed & Convenience', count: 2 },
    { pillar: 'Flavor & Quality', count: 2 },
    { pillar: 'Value & Offer', count: 1 },
  ],
  creativeFormats: [
    { format: 'Promotional Retail Poster', why: 'High-contrast conversion driver' },
    { format: 'Editorial Product Advertisement', why: 'Elevates premium brand perception' },
  ],
  successMetrics: ['CTR > 2.5%', 'ROAS > 3.0'],
  guardrails: ['No unsubstantiated health claims', 'Do not demean traditional brewing'],
  rationale: 'Direct response conversion focus balanced with premium brand equity',
};

// ---------------------------------------------------------------------------
// 1. De-duplication of Identical Preselected Formats
// ---------------------------------------------------------------------------

test('formatAllocator: de-duplicates when multiple concepts have identical preselected format IDs', () => {
  // 5 concepts all suggesting "Promotional Retail Poster"
  const concepts = [
    createMockConcept('c-1', 'Value & Offer', 'Discount savings', 'Promotional Retail Poster'),
    createMockConcept('c-2', 'Speed & Convenience', 'Quick morning commute', 'Promotional Retail Poster'),
    createMockConcept('c-3', 'Speed & Convenience', 'Office desk routine', 'Promotional Retail Poster'),
    createMockConcept('c-4', 'Flavor & Quality', 'Ethiopian aroma notes', 'Promotional Retail Poster'),
    createMockConcept('c-5', 'Flavor & Quality', 'Single origin certification', 'Promotional Retail Poster'),
  ];

  const result = allocateCampaignFormats({
    concepts,
    strategy: mockStrategy,
    goal: 'sales',
    category: 'beverages',
  });

  assert.equal(result.assignments.length, 5);
  const assignedFormatNames = result.assignments.map((a) => a.formatName);
  const uniqueNames = new Set(assignedFormatNames);

  // Across 5 concepts with 15 available formats, at least 4 unique formats must be allocated
  assert.ok(
    uniqueNames.size >= 4,
    `Expected at least 4 unique formats across 5 concepts, got ${uniqueNames.size}: ${assignedFormatNames.join(', ')}`,
  );

  // Reassignments should be tracked and explained
  const reassigned = result.assignments.filter((a) => a.wasReassigned);
  assert.ok(reassigned.length >= 3, `Expected at least 3 concepts to be reassigned to avoid duplicates`);
  for (const r of reassigned) {
    assert.ok(r.reassignmentReason, `Reassigned concept ${r.conceptId} must have an explanation`);
  }

  // Diversity report must show low repetitions
  assert.equal(result.diversityReport.totalConcepts, 5);
  assert.ok(result.diversityReport.diversityScore >= 0.8, `Diversity score must be high (${result.diversityReport.diversityScore})`);
});

// ---------------------------------------------------------------------------
// 2. Locked Formats Preservation
// ---------------------------------------------------------------------------

test('formatAllocator: strictly preserves explicitly locked formats even when competing', () => {
  const concepts = [
    // Concept 1 explicitly locked to Promotional Retail Poster
    createMockConcept('c-1', 'Value & Offer', 'Discount', 'Promotional Retail Poster', true),
    // Concept 2 also wants Promotional Retail Poster but is NOT locked
    createMockConcept('c-2', 'Value & Offer', 'Flash sale', 'Promotional Retail Poster', false),
    // Concept 3 explicitly locked to Editorial Product Advertisement
    createMockConcept('c-3', 'Flavor & Quality', 'Tasting notes', 'Editorial Product Advertisement', true),
  ];

  const result = allocateCampaignFormats({
    concepts,
    strategy: mockStrategy,
    goal: 'sales',
    category: 'beverages',
  });

  const c1 = result.assignments.find((a) => a.conceptId === 'c-1');
  assert.ok(c1);
  assert.equal(c1.formatName, 'Promotional Retail Poster');
  assert.equal(c1.wasReassigned, false);

  const c3 = result.assignments.find((a) => a.conceptId === 'c-3');
  assert.ok(c3);
  assert.equal(c3.formatName, 'Editorial Product Advertisement');
  assert.equal(c3.wasReassigned, false);

  // Concept 2 should be reassigned to a diverse alternative since concept 1 locked the retail poster
  const c2 = result.assignments.find((a) => a.conceptId === 'c-2');
  assert.ok(c2);
  assert.notEqual(c2.formatName, 'Promotional Retail Poster');

  // Exceptions should note locked formats
  const lockedExceptions = result.diversityReport.exceptions.filter((e) => e.type === 'locked_format');
  assert.equal(lockedExceptions.length, 2);
});

// ---------------------------------------------------------------------------
// 3. Insufficient Format Availability / Restricted Options
// ---------------------------------------------------------------------------

test('formatAllocator: handles tightly constrained availability with controlled fallbacks', () => {
  // Campaign with 6 concepts where suitability threshold is deliberately high
  const concepts = Array.from({ length: 6 }, (_, i) =>
    createMockConcept(`c-${i + 1}`, 'Speed & Convenience', `Angle ${i + 1}`),
  );

  const result = allocateCampaignFormats({
    concepts,
    strategy: mockStrategy,
    options: {
      maxRepeatsPerFormat: 2,
      minSuitabilityThreshold: 5.0, // High bar
    },
  });

  assert.equal(result.assignments.length, 6);
  // Every concept must have an assigned format
  for (const a of result.assignments) {
    assert.ok(a.formatId && a.formatName);
    assert.ok(a.score > 0);
  }
});

// ---------------------------------------------------------------------------
// 4. Small Campaigns (1 to 2 Concepts)
// ---------------------------------------------------------------------------

test('formatAllocator: smoothly allocates single-concept and two-concept campaigns', () => {
  // Single concept
  const single = [createMockConcept('c-1', 'Flavor & Quality', 'Single origin')];
  const resSingle = allocateCampaignFormats(single);
  assert.equal(resSingle.assignments.length, 1);
  assert.equal(resSingle.diversityReport.diversityScore, 1.0);
  assert.equal(resSingle.diversityReport.uniqueFormatsCount, 1);

  // Two concepts
  const pair = [
    createMockConcept('c-1', 'Flavor & Quality', 'Origin story'),
    createMockConcept('c-2', 'Speed & Convenience', 'Fast brew'),
  ];
  const resPair = allocateCampaignFormats(pair);
  assert.equal(resPair.assignments.length, 2);
  assert.notEqual(resPair.assignments[0].formatId, resPair.assignments[1].formatId);
  assert.equal(resPair.diversityReport.uniqueFormatsCount, 2);
  assert.equal(resPair.diversityReport.diversityScore, 1.0);
});

// ---------------------------------------------------------------------------
// 5. Oversized Campaigns (N > 15 Concepts)
// ---------------------------------------------------------------------------

test('formatAllocator: handles oversized campaigns (20 concepts > 15 library formats)', () => {
  const diverseAngles = [
    'Discount offer save 50%',
    'Fast 2-minute morning routine',
    'Single-origin Ethiopian bean flavor notes',
    'Customer review 5-star rating proof',
    'Pure organic ingredients and formula',
    'Compare vs standard instant coffee',
    'Problem struggle tired of bitter brew solution',
    'Founder artisan story and craft passion',
    'Holiday seasonal summer edition',
    'Full product range flavor variety bundle',
    'Bold typographic statement words',
    'Clean minimalist luxury aesthetic',
    'Behind the scenes roaster expert process',
    'Flash sale limited time special',
    'Morning workout energy fuel',
    'Cafe-quality espresso at desk',
    'Gift box holiday special',
    'Zero sugar clean formula spotlight',
    'Subscription savings deal',
    'Blind taste test versus competitors',
  ];

  const count = 20;
  const concepts = diverseAngles.map((angle, i) =>
    createMockConcept(`c-${i + 1}`, `Pillar ${(i % 3) + 1}`, angle),
  );

  const result = allocateCampaignFormats({
    concepts,
    strategy: mockStrategy,
  });

  assert.equal(result.assignments.length, count);
  // With 20 diverse concepts covering angles across all 15 formats, must use at least 11 unique formats
  assert.ok(
    result.diversityReport.uniqueFormatsCount >= 11,
    `Expected at least 11 unique formats for 20 concepts, got ${result.diversityReport.uniqueFormatsCount}`,
  );

  // Repeated formats must be documented in the diversity report
  assert.ok(result.diversityReport.repeatedFormats.length > 0);
  for (const rep of result.diversityReport.repeatedFormats) {
    assert.ok(rep.formatId && rep.formatName);
    assert.ok(rep.count >= 2);
    assert.ok(rep.structuralArchetype);
  }

  // Diversity score must remain balanced
  assert.ok(result.diversityReport.diversityScore >= 0.6);
});

// ---------------------------------------------------------------------------
// 6. Reproducibility & Determinism
// ---------------------------------------------------------------------------

test('formatAllocator: is completely deterministic across multiple runs with identical input', () => {
  const concepts = [
    createMockConcept('c-1', 'Value & Offer', 'Discount savings'),
    createMockConcept('c-2', 'Speed & Convenience', 'Commute routine'),
    createMockConcept('c-3', 'Flavor & Quality', 'Aroma notes'),
    createMockConcept('c-4', 'Flavor & Quality', 'Roast profiles'),
  ];

  const run1 = allocateCampaignFormats({ concepts, strategy: mockStrategy });
  const run2 = allocateCampaignFormats({ concepts, strategy: mockStrategy });

  assert.deepEqual(
    run1.assignments.map((a) => ({ id: a.conceptId, formatId: a.formatId, score: a.score })),
    run2.assignments.map((a) => ({ id: a.conceptId, formatId: a.formatId, score: a.score })),
    'Allocations must be identical for identical inputs',
  );

  assert.equal(run1.diversityReport.diversityScore, run2.diversityReport.diversityScore);
});

// ---------------------------------------------------------------------------
// 7. Structural Diversity Archetype Enforcement
// ---------------------------------------------------------------------------

test('formatAllocator: enforces structural archetype diversity, not just format ID diversity', () => {
  // Provide concepts that all suggest hero_centered visual formats
  const concepts = [
    createMockConcept('c-1', 'Speed', 'Angle 1', 'Product Hero Advertisement'),
    createMockConcept('c-2', 'Speed', 'Angle 2', 'Promotional Retail Poster'),
    createMockConcept('c-3', 'Speed', 'Angle 3', 'Editorial Product Advertisement'),
    createMockConcept('c-4', 'Speed', 'Angle 4', 'Offer-led Advertisement'),
  ];

  const result = allocateCampaignFormats({
    concepts,
    strategy: mockStrategy,
    options: {
      enforceStructuralDiversity: true,
      structuralRepeatPenalty: 6,
    },
  });

  const structures = Object.keys(result.diversityReport.structuralDistribution);
  // With 4 concepts and structural penalty, must produce at least 3 distinct structural archetypes
  assert.ok(
    structures.length >= 3,
    `Expected at least 3 distinct visual structure archetypes, got ${structures.length}: ${structures.join(', ')}`,
  );
});

// ---------------------------------------------------------------------------
// 8. Backward Compatibility: assignFormatsToConcepts
// ---------------------------------------------------------------------------

test('formatAllocator: assignFormatsToConcepts returns array with attached diversityReport', () => {
  const concepts = [
    createMockConcept('c-1', 'Pillar 1', 'Angle 1'),
    createMockConcept('c-2', 'Pillar 2', 'Angle 2'),
  ];

  const assignments = assignFormatsToConcepts(concepts);
  assert.ok(Array.isArray(assignments));
  assert.equal(assignments.length, 2);
  assert.ok(assignments.diversityReport);
  assert.equal(assignments.diversityReport.totalConcepts, 2);
});
