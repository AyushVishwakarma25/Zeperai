/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Phase 1: Creative Blueprint & AI Art Director.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRAND, RUN, STRATEGY, deadline, fakeGemini, okReply } from './fixtures.js';
import { creativeDirectionAgent, parseCreativeDirection } from './creativeDirection.js';
import {
  clamp01,
  createDefaultBlueprintFromConcept,
  normalizeBoundingBox,
  validateCreativeBlueprint,
} from '../blueprintSchema.js';
import type { CreativeBlueprint, DesignIntensity } from '../../types.js';

const upstream = { brand_analysis: BRAND, strategy: STRATEGY };
const ctx = (g: ReturnType<typeof fakeGemini>, extra: Record<string, unknown> = {}) => ({
  run: { ...RUN, current_step: 'creative_direction' as const },
  upstream,
  deadlineAt: deadline(),
  geminiClient: g.client,
  ...extra,
});

test('clamp01: clamps numbers to [0.0, 1.0] and handles edge cases', () => {
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(-0.2), 0);
  assert.equal(clamp01(1.5), 1);
  assert.equal(clamp01('0.85'), 0.85);
  assert.equal(clamp01('invalid', 0.1), 0.1);
});

test('normalizeBoundingBox: ensures safe coordinates, non-overflowing widths, and correct alignment', () => {
  const normal = normalizeBoundingBox({ element: 'headline', x: 0.1, y: 0.2, width: 0.8, height: 0.15, alignment: 'left' });
  assert.equal(normal.element, 'headline');
  assert.equal(normal.x, 0.1);
  assert.equal(normal.y, 0.2);
  assert.equal(normal.width, 0.8);
  assert.equal(normal.height, 0.15);
  assert.equal(normal.alignment, 'left');

  // Overflowing box: x = 0.8, width = 0.5 -> width should be clamped so x + width <= 1.0
  const clamped = normalizeBoundingBox({ element: 'badge', x: 0.8, y: 0.9, width: 0.5, height: 0.4 });
  assert.ok(clamped.x + clamped.width <= 1.0, 'x + width must be <= 1.0');
  assert.ok(clamped.y + clamped.height <= 1.0, 'y + height must be <= 1.0');
});

test('validateCreativeBlueprint: accepts a valid Creative Blueprint', () => {
  const sample = createDefaultBlueprintFromConcept({
    concept: {
      id: 'speed-1',
      pillar: 'Speed',
      headline: 'Breakfast in 60 Seconds',
      subheadline: 'Instant fuel for busy mornings',
      visualIdea: 'Steaming chocolate protein oats bowl with a timer',
      storyline: 'Busy morning professional grabs a hot nutritious breakfast in seconds.',
      cta: 'Order now',
      composition: 'Top-down flat lay with rustic spoon and timer',
    },
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    designIntensity: 'bold',
  });

  const res = validateCreativeBlueprint(sample);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.conceptId, 'speed-1');
    assert.equal(res.value.designIntensity, 'bold');
    assert.equal(res.value.constraints.preserveProductPackaging, true);
    assert.equal(res.value.constraints.prohibitInventedClaims, true);
  }
});

test('validateCreativeBlueprint: rejects invalid objects or missing required fields', () => {
  const emptyRes = validateCreativeBlueprint(null);
  assert.equal(emptyRes.ok, false);
  assert.match(emptyRes.error!, /valid JSON object/);

  const missingFields = {
    id: 'test-1',
    // missing canvas, artDirection, layout, copy
  };
  const invalidRes = validateCreativeBlueprint(missingFields);
  assert.equal(invalidRes.ok, false);
  assert.match(invalidRes.error!, /Invalid Creative Blueprint/);
});

test('parseCreativeDirection: builds complete Creative Blueprints for all concepts', () => {
  const rawModelOutput = {
    visualTheme: 'Vibrant morning kitchen aesthetic',
    moodKeywords: ['fresh', 'energetic', 'premium'],
    colorGuidance: 'Use brand amber accent with clean white negative space.',
    typographyGuidance: 'Bold sans-serif display typography.',
    photographyStyle: 'Warm natural morning sunlight with sharp product focus.',
    concepts: [
      {
        pillar: 'Speed',
        headline: 'Ready in 2 Minutes Flat',
        subheadline: 'Just add boiling water and enjoy.',
        visualIdea: 'Overhead shot of steaming bowl with kitchen timer at 02:00.',
        storyline: 'Show how easy and swift breakfast can be.',
        cta: 'Claim 40% Off',
        composition: 'Top-heavy layout with high negative space for headline.',
        advertisingFormat: 'Promotional Retail Poster',
        designIntensity: 'bold',
        layoutElements: [
          { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18, alignment: 'left', layer: 20 },
          { element: 'product', x: 0.15, y: 0.35, width: 0.7, height: 0.45, alignment: 'center', layer: 5 },
          { element: 'badge', x: 0.08, y: 0.05, width: 0.35, height: 0.06, alignment: 'left', layer: 25 },
          { element: 'cta', x: 0.08, y: 0.86, width: 0.84, height: 0.07, alignment: 'center', layer: 25 },
        ],
      },
    ],
    thingsToAvoid: ['Generic stock photos', 'Artificial lighting'],
  };

  const parsed = parseCreativeDirection(rawModelOutput, [{ pillar: 'Speed', count: 1 }], {
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    runId: 'test-run-123',
  });

  assert.equal(parsed.concepts.length, 1);
  const concept = parsed.concepts[0];
  assert.ok(concept.blueprint, 'concept must have a blueprint attached');
  assert.equal(concept.blueprint.advertisingFormat, 'Promotional Retail Poster');
  assert.equal(concept.blueprint.designIntensity, 'bold');
  assert.equal(concept.blueprint.canvas.aspectRatio, '4:5');
  assert.equal(concept.blueprint.copy.headline, 'Ready in 2 Minutes Flat');
  assert.equal(concept.blueprint.layout.elements.length, 4);
  assert.equal(parsed.blueprints?.length, 1);
});

test('ACCEPTANCE CRITERIA: Generates 5 distinct Creative Blueprints across formats and intensities for one product', () => {
  const formats: Array<{
    pillar: string;
    format: string;
    intensity: DesignIntensity;
    headline: string;
    subheadline: string;
    visualIdea: string;
    storyline: string;
    cta: string;
    composition: string;
    layoutElements: any[];
  }> = [
    {
      pillar: 'Speed',
      format: 'Promotional Retail Poster',
      intensity: 'bold',
      headline: 'BREAKFAST BEFORE YOUR KETTLE BOILS',
      subheadline: '20g protein. 2 minutes. Under ₹99.',
      visualIdea: 'Vibrant bold promotional poster with large 40% OFF discount callout badge and product hero.',
      storyline: 'Drive immediate impulse purchase with an irresistible convenience and price angle.',
      cta: 'Shop Now',
      composition: 'Bold display typography across top third, product hero angled dynamically, bottom CTA block.',
      layoutElements: [
        { element: 'badge', x: 0.08, y: 0.06, width: 0.38, height: 0.06, alignment: 'left', layer: 25 },
        { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.2, alignment: 'left', layer: 20 },
        { element: 'subheadline', x: 0.08, y: 0.35, width: 0.84, height: 0.08, alignment: 'left', layer: 20 },
        { element: 'product', x: 0.2, y: 0.44, width: 0.65, height: 0.4, alignment: 'center', layer: 5 },
        { element: 'cta', x: 0.08, y: 0.88, width: 0.84, height: 0.07, alignment: 'center', layer: 25 },
      ],
    },
    {
      pillar: 'Speed',
      format: 'Editorial Product Advertisement',
      intensity: 'minimal',
      headline: 'The Art of Slow Living at Fast Forward',
      subheadline: 'Whole rolled oats, raw cocoa, zero refined sugar.',
      visualIdea: 'Clean, understated luxury magazine editorial shot on natural travertine stone.',
      storyline: 'Appeals to design-conscious consumers who value aesthetic minimalism and nutritional purity.',
      cta: 'Discover More',
      composition: 'Generous negative space, delicate serif typography, single centered hero bowl.',
      layoutElements: [
        { element: 'logo', x: 0.1, y: 0.08, width: 0.25, height: 0.05, alignment: 'left', layer: 20 },
        { element: 'main_headline', x: 0.1, y: 0.16, width: 0.8, height: 0.14, alignment: 'left', layer: 20 },
        { element: 'product', x: 0.15, y: 0.35, width: 0.7, height: 0.45, alignment: 'center', layer: 5 },
        { element: 'cta', x: 0.1, y: 0.86, width: 0.35, height: 0.06, alignment: 'left', layer: 20 },
      ],
    },
    {
      pillar: 'Speed',
      format: 'Feature Spotlight',
      intensity: 'balanced',
      headline: 'What 20 Grams of Real Protein Looks Like',
      subheadline: 'No chalky powders. No artificial aftertaste.',
      visualIdea: 'Ingredient breakdown flat lay showcasing oats, chia seeds, and whey protein with callout pointers.',
      storyline: 'Educates fitness enthusiasts on macro transparency and clean nutrition.',
      cta: 'View Ingredients',
      composition: 'Product in center with 3 feature annotations radiating into clean side margins.',
      layoutElements: [
        { element: 'logo', x: 0.08, y: 0.06, width: 0.28, height: 0.05, alignment: 'left', layer: 20 },
        { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.16, alignment: 'left', layer: 20 },
        { element: 'product', x: 0.15, y: 0.32, width: 0.7, height: 0.45, alignment: 'center', layer: 5 },
        { element: 'feature_list', x: 0.08, y: 0.78, width: 0.84, height: 0.08, alignment: 'left', layer: 15 },
        { element: 'cta', x: 0.08, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 20 },
      ],
    },
    {
      pillar: 'Protein proof',
      format: 'Problem-Solution Split-Screen',
      intensity: 'balanced',
      headline: 'Skipping Breakfast vs Fueling Your Ambition',
      subheadline: 'Stop crashing at 11 AM.',
      visualIdea: 'Side-by-side comparison: lethargic coffee cup on left vs energizing vibrant oat bowl on right.',
      storyline: 'Directly addresses the mid-morning energy dip pain point.',
      cta: 'Make the Switch',
      composition: 'Split vertical frame with contrasting warm vs cool lighting and center divider.',
      layoutElements: [
        { element: 'main_headline', x: 0.08, y: 0.1, width: 0.84, height: 0.18, alignment: 'center', layer: 20 },
        { element: 'product', x: 0.1, y: 0.32, width: 0.8, height: 0.46, alignment: 'center', layer: 5 },
        { element: 'cta', x: 0.2, y: 0.85, width: 0.6, height: 0.07, alignment: 'center', layer: 25 },
      ],
    },
    {
      pillar: 'Protein proof',
      format: 'Experimental Dynamic Hero',
      intensity: 'experimental',
      headline: 'TASTE THAT HITS DIFFERENT',
      subheadline: 'The morning routine reimagined for high performers.',
      visualIdea: 'Dynamic zero-gravity explosion of toasted oats, Belgian cocoa nibs and creamy milk splashes.',
      storyline: 'Creates an intense sensory and appetizing punch for social feed thumb-stopping.',
      cta: 'Get Yours',
      composition: 'Diagonal sightlines with 45-degree angled product hero, overlapping bold display typography.',
      layoutElements: [
        { element: 'accent_shape', x: 0.0, y: 0.0, width: 0.45, height: 0.5, alignment: 'left', layer: 2 },
        { element: 'main_headline', x: 0.08, y: 0.1, width: 0.65, height: 0.22, alignment: 'left', layer: 20 },
        { element: 'product', x: 0.3, y: 0.28, width: 0.65, height: 0.52, alignment: 'right', layer: 8 },
        { element: 'subheadline', x: 0.08, y: 0.65, width: 0.5, height: 0.1, alignment: 'left', layer: 20 },
        { element: 'cta', x: 0.08, y: 0.82, width: 0.4, height: 0.07, alignment: 'left', layer: 25 },
      ],
    },
  ];

  const rawOutput = {
    visualTheme: 'Five distinct art-directed advertising campaign concepts',
    moodKeywords: ['dynamic', 'premium', 'clean', 'bold', 'punchy'],
    colorGuidance: 'Brand orange as accent with charcoal, ivory, and emerald notes.',
    typographyGuidance: 'Poppins for bold display headlines, Inter for subheadlines.',
    photographyStyle: 'Commercial studio product photography tailored per format.',
    concepts: formats,
    thingsToAvoid: ['Generic stock photos', 'Uncentered text', 'Missing brand colors'],
  };

  const parsed = parseCreativeDirection(rawOutput, [
    { pillar: 'Speed', count: 3 },
    { pillar: 'Protein proof', count: 2 },
  ], {
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    runId: 'acceptance-run-001',
  });

  assert.equal(parsed.concepts.length, 5, 'Must generate exactly 5 concepts');
  assert.equal(parsed.blueprints?.length, 5, 'Must generate exactly 5 blueprints');

  // Verify all 5 blueprints have distinct formats and intensities
  const usedFormats = new Set<string>();
  const usedIntensities = new Set<string>();

  for (let i = 0; i < 5; i++) {
    const bp = parsed.blueprints![i];
    const validation = validateCreativeBlueprint(bp);
    assert.equal(validation.ok, true, `Blueprint #${i + 1} must pass runtime validation: ${validation.error}`);

    usedFormats.add(bp.advertisingFormat);
    usedIntensities.add(bp.designIntensity);

    // Coordinate safety
    for (const el of bp.layout.elements) {
      assert.ok(el.x >= 0 && el.x <= 1, `Element ${el.element} x must be within [0, 1]`);
      assert.ok(el.y >= 0 && el.y <= 1, `Element ${el.element} y must be within [0, 1]`);
      assert.ok(el.x + el.width <= 1.001, `Element ${el.element} must not overflow width bounds`);
      assert.ok(el.y + el.height <= 1.001, `Element ${el.element} must not overflow height bounds`);
    }

    // Typographic hierarchy check
    assert.ok(bp.typography.headlineStyle.fontFamily.length > 0, 'Headline font required');
    assert.ok(bp.typography.hierarchy.length > 0, 'Typography hierarchy required');

    // Brand and packaging constraints
    assert.equal(bp.constraints.preserveProductPackaging, true);
    assert.equal(bp.constraints.preserveLogo, true);
    assert.equal(bp.constraints.prohibitInventedClaims, true);
  }

  assert.equal(usedFormats.size, 5, 'All 5 blueprints must have distinct advertising formats');
  assert.ok(usedIntensities.size >= 3, 'Must represent multiple design intensities (bold, minimal, balanced, experimental)');
});

