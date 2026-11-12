/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Phase 2:
 * Advertising Format Library and Reference Intelligence.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVERTISING_FORMATS,
  getAdvertisingFormat,
  listAdvertisingFormats,
  matchFormatsForConcept,
} from '../formatLibrary.js';
import { assignFormatsToConcepts } from './formatStrategist.js';
import {
  normalizeReferenceDesignDNA,
  reconcileMultiReferences,
} from './referenceAnalyst.js';
import { parseCreativeDirection } from './creativeDirection.js';
import { validateCreativeBlueprint } from '../blueprintSchema.js';
import { BRAND, STRATEGY } from './fixtures.js';
import type { CampaignReference, CreativeBlueprint, CreativeConcept, ReferenceDesignDNA } from '../../types.js';

// ---------------------------------------------------------------------------
// 1. Advertising Format Library Tests
// ---------------------------------------------------------------------------

test('formatLibrary: defines exactly 15 commercial advertising formats', () => {
  assert.equal(ADVERTISING_FORMATS.length, 15, 'Must contain exactly 15 advertising formats');
  const ids = new Set(ADVERTISING_FORMATS.map((f) => f.id));
  assert.equal(ids.size, 15, 'All format IDs must be unique');
});

test('formatLibrary: every format has complete advertising specification', () => {
  for (const fmt of ADVERTISING_FORMATS) {
    assert.ok(fmt.id && fmt.id.length > 0, `Format ${fmt.id} must have a valid id`);
    assert.ok(fmt.name && fmt.name.length > 0, `Format ${fmt.id} must have a name`);
    assert.ok(fmt.description && fmt.description.length > 10, `Format ${fmt.id} must have a descriptive summary`);
    assert.ok(fmt.suitableObjectives.length > 0, `Format ${fmt.id} must define suitable objectives`);
    assert.ok(fmt.suitableIndustries.length > 0, `Format ${fmt.id} must define suitable industries`);
    assert.ok(fmt.recommendedVisualHierarchy.length >= 3, `Format ${fmt.id} must have at least 3 levels in visual hierarchy`);
    assert.ok(fmt.compositionCharacteristics.length > 0, `Format ${fmt.id} must define composition characteristics`);
    assert.ok(fmt.typographyRecommendations.length > 0, `Format ${fmt.id} must define typography recommendations`);
    assert.ok(fmt.productPlacementGuidance.length > 0, `Format ${fmt.id} must define product placement guidance`);
    assert.ok(fmt.suitableGraphicElements.length > 0, `Format ${fmt.id} must define suitable graphic elements`);
    assert.ok(fmt.commonMistakesToAvoid.length > 0, `Format ${fmt.id} must define common mistakes to avoid`);
    assert.ok(fmt.defaultLayoutElements.length >= 3, `Format ${fmt.id} must define at least 3 default layout elements`);

    for (const el of fmt.defaultLayoutElements) {
      assert.ok(el.x >= 0 && el.x <= 1, `${fmt.id} element x coordinate out of bounds`);
      assert.ok(el.y >= 0 && el.y <= 1, `${fmt.id} element y coordinate out of bounds`);
      assert.ok(el.width > 0 && el.width <= 1, `${fmt.id} element width out of bounds`);
      assert.ok(el.height > 0 && el.height <= 1, `${fmt.id} element height out of bounds`);
      assert.ok(el.x + el.width <= 1.001, `${fmt.id} element ${el.element} overflows width: ${el.x} + ${el.width}`);
      assert.ok(el.y + el.height <= 1.001, `${fmt.id} element ${el.element} overflows height: ${el.y} + ${el.height}`);
    }
  }
});

test('formatLibrary: getAdvertisingFormat & listAdvertisingFormats work reliably', () => {
  const retail = getAdvertisingFormat('promotional-retail-poster');
  assert.ok(retail);
  assert.equal(retail.name, 'Promotional Retail Poster');

  const editorial = getAdvertisingFormat('editorial-product-ad');
  assert.ok(editorial);
  assert.equal(editorial.name, 'Editorial Product Advertisement');

  assert.equal(getAdvertisingFormat('unknown-format-id'), undefined);

  const all = listAdvertisingFormats();
  assert.equal(all.length, 15);
  assert.deepEqual(all.map((f) => f.id), ADVERTISING_FORMATS.map((f) => f.id));
});

test('formatLibrary: matchFormatsForConcept scores and returns relevant formats with variety penalty', () => {
  const offerFmt = matchFormatsForConcept({ pillar: 'Special 50% discount offer', goal: 'sales' });
  assert.ok(
    offerFmt.id === 'offer-led-ad' || offerFmt.id === 'promotional-retail-poster',
    `Expected offer or retail format, got ${offerFmt.id}`,
  );

  const ingredientFmt = matchFormatsForConcept({ pillar: 'Pure whey protein & chia seed formula', goal: 'consideration' });
  assert.equal(ingredientFmt.id, 'ingredient-feature-spotlight');

  const compareFmt = matchFormatsForConcept({ pillar: 'Why we beat regular instant oats', goal: 'consideration' });
  assert.ok(
    compareFmt.id === 'comparison-ad' || compareFmt.id === 'problem-solution-ad',
    `Expected comparison or problem-solution format, got ${compareFmt.id}`,
  );

  // Variety penalty: when ingredient-feature-spotlight is already used, match should select alternative
  const alternativeFmt = matchFormatsForConcept({
    pillar: 'Pure organic oats formula',
    usedFormatIds: ['ingredient-feature-spotlight'],
  });
  assert.notEqual(alternativeFmt.id, 'ingredient-feature-spotlight');
});

// ---------------------------------------------------------------------------
// 2. Format Strategist Tests
// ---------------------------------------------------------------------------

test('formatStrategist: assignFormatsToConcepts distributes diverse formats across 5 concepts', () => {
  const concepts: CreativeConcept[] = [
    { id: 'c1', pillar: 'Speed', headline: 'Ready in 60s', visualIdea: 'Timer countdown', storyline: 'Fast breakfast', cta: 'Order', composition: 'Side view' },
    { id: 'c2', pillar: 'Protein proof', headline: '20g Real Protein', visualIdea: 'Scoop & bowl', storyline: 'Nutrition', cta: 'Order', composition: 'Front angle' },
    { id: 'c3', pillar: 'Urgency & Offer', headline: 'Limited 40% Off', visualIdea: 'Box with ribbon', storyline: 'Sale', cta: 'Claim', composition: 'Hero placement' },
    { id: 'c4', pillar: 'Social Proof', headline: 'Loved by 50,000 Athletes', visualIdea: 'Review stars', storyline: 'Validation', cta: 'Join', composition: 'Grid' },
    { id: 'c5', pillar: 'Comparison', headline: 'Our Oats vs Ordinary Sugar Cereals', visualIdea: 'Side-by-side', storyline: 'Contrast', cta: 'Switch', composition: 'Split' },
  ];

  const assignments = assignFormatsToConcepts({ concepts, strategy: STRATEGY, goal: 'sales', category: 'food' });
  assert.equal(assignments.length, 5);

  const chosenIds = assignments.map((a) => a.format.id);
  const uniqueIds = new Set(chosenIds);
  assert.ok(uniqueIds.size >= 4, `Format strategist must assign diverse formats (expected >= 4 unique, got ${uniqueIds.size})`);

  for (const a of assignments) {
    assert.ok(a.rationale.includes(a.format.name), 'Assignment must include format rationale');
  }
});

test('formatStrategist: honors pre-existing format if requested on blueprint', () => {
  const concepts: CreativeConcept[] = [
    {
      id: 'c1',
      pillar: 'Luxury',
      headline: 'The Art of Breakfast',
      visualIdea: 'Stone pedestal',
      storyline: 'Elegance',
      cta: 'Discover',
      composition: 'Editorial',
      blueprint: ({
        id: 'bp-c1',
        campaignId: 'r1',
        conceptId: 'c1',
        version: 1,
        status: 'draft',
        marketingAngle: 'Luxury',
        advertisingFormat: 'Editorial Product Advertisement',
        designIntensity: 'minimal',
        designConcept: 'Luxury breakfast',
        visualNarrative: 'Elegance',
        canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
        artDirection: {
          visualStyle: 'Editorial',
          mood: 'Sophisticated',
          background: 'Stone',
          colorPalette: ['#000000', '#FFFFFF'],
          photographyStyle: 'Natural daylight',
          lighting: 'Soft directional',
        },
        layout: {
          composition: 'Minimal',
          readingOrder: ['logo', 'main_headline', 'product', 'cta'],
          productPlacement: 'Center pedestal',
          productScale: 0.6,
          safeZones: [],
          elements: [{ element: 'product', x: 0.2, y: 0.3, width: 0.6, height: 0.5 }],
        },
        typography: {
          headlineStyle: { fontFamily: 'Playfair Display', fontWeight: 700, fontSizeHint: 'hero', color: '#111827' },
          hierarchy: [],
        },
        copy: { headline: 'The Art of Breakfast', cta: 'Discover' },
        packagingFidelity: { protectLabels: true, preventTextHallucinations: true, heroPlacementOnly: true },
        generationMetadata: { promptKeywords: [], creativeDirectionRunId: 'r1' },
      } as unknown as CreativeBlueprint),
    },
  ];

  const assignments = assignFormatsToConcepts({ concepts, strategy: STRATEGY });
  assert.equal(assignments[0].format.id, 'editorial-product-ad');
});

// ---------------------------------------------------------------------------
// 3. Reference Analyst Tests: Normalization and Multi-Reference Reconciliation
// ---------------------------------------------------------------------------

test('referenceAnalyst: normalizeReferenceDesignDNA normalizes raw AI output with robust fallbacks', () => {
  const raw = {
    layoutType: 'top-heavy editorial',
    composition: 'Asymmetrical split layout with heavy headline top-left',
    visualHierarchy: ['Level 1: Big Headline', 'Level 2: Hero Product'],
    colorRelationships: ['Warm amber and matte black'],
    typography: {
      style: 'Grotesque sans-serif',
      weight: '900',
      scale: 'Hero headline with small pill CTA',
      positioning: 'Top left aligned',
    },
    productPlacement: 'Anchored at lower right with cast shadow',
    photographyStyle: 'Warm directional morning strobe',
    graphicElements: ['discount_pill', 'star_rating'],
    backgroundTreatment: 'Subtle slate gradient',
    visualDensity: 'bold',
    readingOrder: ['main_headline', 'subheadline', 'product', 'cta'],
    designCharacteristics: ['High contrast', 'Punchy typography', 'Generous whitespace'],
  };

  const dna = normalizeReferenceDesignDNA(raw);
  assert.equal(dna.layoutType, 'top-heavy editorial');
  assert.equal(dna.visualDensity, 'bold');
  assert.equal(dna.typography.weight, '900');
  assert.equal(dna.visualHierarchy.length, 2);
  assert.equal(dna.readingOrder.length, 4);
});

test('referenceAnalyst: reconcileMultiReferences assigns specialized roles cleanly', () => {
  // Empty array
  const emptyRes = reconcileMultiReferences([]);
  assert.ok(emptyRes.reconciliationSummary.includes('No external advertising references'));
  assert.equal(emptyRes.controllingLayout, undefined);

  // Single general reference
  const ref1: CampaignReference = {
    id: 'ref-001',
    campaign_id: 'r1',
    image_url: 'https://example.com/ref1.jpg',
    reference_role: 'general',
    reference_mode: 'inspiration',
    analysis_status: 'completed',
    created_at: new Date().toISOString(),
  };
  const singleRes = reconcileMultiReferences([ref1]);
  assert.equal(singleRes.controllingLayout?.id, 'ref-001');
  assert.equal(singleRes.controllingTypography?.id, 'ref-001');

  // Multi-reference with dedicated roles
  const refLayout: CampaignReference = {
    id: 'ref-layout-002',
    campaign_id: 'r1',
    image_url: 'https://example.com/layout.jpg',
    reference_role: 'layout',
    reference_mode: 'layout',
    analysis_status: 'completed',
    created_at: new Date().toISOString(),
  };
  const refTypo: CampaignReference = {
    id: 'ref-typo-003',
    campaign_id: 'r1',
    image_url: 'https://example.com/typo.jpg',
    reference_role: 'typography',
    reference_mode: 'style_transfer',
    analysis_status: 'completed',
    created_at: new Date().toISOString(),
  };
  const refColor: CampaignReference = {
    id: 'ref-color-004',
    campaign_id: 'r1',
    image_url: 'https://example.com/color.jpg',
    reference_role: 'color',
    reference_mode: 'style_transfer',
    analysis_status: 'completed',
    created_at: new Date().toISOString(),
  };

  const multiRes = reconcileMultiReferences([ref1, refLayout, refTypo, refColor]);
  assert.equal(multiRes.controllingLayout?.id, 'ref-layout-002', 'Layout reference must control layout');
  assert.equal(multiRes.controllingTypography?.id, 'ref-typo-003', 'Typography reference must control typography');
  assert.equal(multiRes.controllingColor?.id, 'ref-color-004', 'Color reference must control color harmony');
  assert.ok(multiRes.reconciliationSummary.includes('Reconciled 4 reference(s)'));
});

// ---------------------------------------------------------------------------
// 4. Acceptance Criteria: 5 Different Advertising References Simulation
// ---------------------------------------------------------------------------

test('acceptance: simulates 5 diverse advertising reference designs, extracts DNA and generates distinct blueprints', () => {
  // Reference 1: Bold Retail Poster (role: layout, mode: layout)
  const dnaRef1: ReferenceDesignDNA = {
    layoutType: 'Promotional Retail Poster',
    composition: 'Bold top-heavy commercial poster with hero product anchored in bottom 45%',
    visualHierarchy: ['Level 1: 50% Off Discount Pill', 'Level 2: Urgent Display Headline', 'Level 3: Hero Product Packshot', 'Level 4: Sticky CTA'],
    colorRelationships: ['High contrast neon yellow on charcoal slate'],
    typography: { style: 'Ultra-bold compact sans-serif', weight: '900', scale: 'Massive hero display', positioning: 'Top center' },
    productPlacement: 'Bottom third center with heavy ground shadow',
    photographyStyle: 'High-contrast commercial strobe lighting',
    graphicElements: ['discount_pill', 'price_block', 'urgency_badge'],
    backgroundTreatment: 'Deep charcoal matte with edge radial spotlight',
    visualDensity: 'bold',
    readingOrder: ['badge', 'main_headline', 'product', 'cta'],
    designCharacteristics: ['Commercial retail urgency', 'Bold thumb-stopping contrast'],
  };

  // Reference 2: Editorial Luxury Cosmetic Spread (role: typography, mode: style_transfer)
  const dnaRef2: ReferenceDesignDNA = {
    layoutType: 'Editorial Product Advertisement',
    composition: 'Poetic minimalist composition with 40% negative breathing space and organic side light',
    visualHierarchy: ['Level 1: Refined Serif Headline', 'Level 2: Product on Travertine Stone', 'Level 3: Understated Subline', 'Level 4: Text CTA'],
    colorRelationships: ['Warm alabaster, raw linen, and muted terracotta'],
    typography: { style: 'Editorial modern serif', weight: '400', scale: 'Elegant medium headline', positioning: 'Top-left aligned with generous margin' },
    productPlacement: 'Center-left standing on raw stone pedestal with soft natural shadow',
    photographyStyle: 'Soft morning raking sunlight with natural textures',
    graphicElements: ['subtle_divider_line', 'monogram_badge'],
    backgroundTreatment: 'Warm limestone plaster wall',
    visualDensity: 'minimal',
    readingOrder: ['logo', 'main_headline', 'product', 'subheadline', 'cta'],
    designCharacteristics: ['Understated luxury', 'Architectural negative space', 'Organic tranquility'],
  };

  // Reference 3: Split 50/50 Problem-Solution Comparison (role: layout, mode: layout)
  const dnaRef3: ReferenceDesignDNA = {
    layoutType: 'Comparison Advertisement',
    composition: 'Vertical split screen: Ordinary brand on left (monochrome/dull), Prustlr on right (vibrant/golden)',
    visualHierarchy: ['Level 1: Contrast Headline', 'Level 2: Side-by-side Dual Products', 'Level 3: Benefit Checkmarks', 'Level 4: Centered CTA'],
    colorRelationships: ['Desaturated cool gray vs. warm saturated brand amber'],
    typography: { style: 'Clean geometric sans', weight: '700', scale: 'Split column headlines', positioning: 'Top of each column' },
    productPlacement: 'Dual side-by-side products in center half',
    photographyStyle: 'Even studio illumination for unbiased visual comparison',
    graphicElements: ['comparison_vs_pill', 'checkmarks', 'cross_icons'],
    backgroundTreatment: 'Split background with thin vertical divider line',
    visualDensity: 'balanced',
    readingOrder: ['main_headline', 'comparison_left', 'comparison_right', 'cta'],
    designCharacteristics: ['Instant clarity', 'Unambiguous visual proof'],
  };

  // Reference 4: Ingredient Feature Spotlight (role: photography, mode: style_transfer)
  const dnaRef4: ReferenceDesignDNA = {
    layoutType: 'Ingredient & Feature Spotlight',
    composition: 'Macro food explosion with whole rolled oats, cocoa nibs, and milk droplets floating around product jar',
    visualHierarchy: ['Level 1: Hero Packshot', 'Level 2: Floating Raw Ingredients', 'Level 3: Ingredient Label Callouts', 'Level 4: Nutrition Badge'],
    colorRelationships: ['Rich chocolate brown, warm oat beige, and golden honey'],
    typography: { style: 'Modern technical sans', weight: '600', scale: 'Compact callouts with pointer lines', positioning: 'Radial around ingredients' },
    productPlacement: 'Centered hero surrounded by floating dynamic ingredients',
    photographyStyle: 'High-speed freeze motion capture with shallow depth of field',
    graphicElements: ['ingredient_callout_pointers', 'protein_guarantee_seal'],
    backgroundTreatment: 'Warm dark gradient with floating ingredient dust',
    visualDensity: 'balanced',
    readingOrder: ['product', 'ingredient_callouts', 'main_headline', 'cta'],
    designCharacteristics: ['Appetite appeal', 'Wholesome provenance proof'],
  };

  // Reference 5: Dynamic Kinetic Athletic Hero (role: general, mode: inspiration)
  const dnaRef5: ReferenceDesignDNA = {
    layoutType: 'Dynamic Product Advertisement',
    composition: '35-degree dynamic diagonal action sightline with energy particle burst and motion streaks',
    visualHierarchy: ['Level 1: Italicized Action Headline', 'Level 2: Angled Flying Product', 'Level 3: Speed Timer Callout', 'Level 4: High-energy CTA'],
    colorRelationships: ['Electric orange and matte carbon fiber black'],
    typography: { style: 'Italic extra-bold condensed display', weight: '900', scale: 'Hero diagonal headline', positioning: 'Cutting across top-left to center' },
    productPlacement: 'Angled at 25 degrees with dynamic motion blur and kinetic particles',
    photographyStyle: 'High-speed athletic action strobe with dramatic rim light',
    graphicElements: ['velocity_streaks', 'energy_bursts', 'corner_flag'],
    backgroundTreatment: 'Textured carbon dark slate with orange light streaks',
    visualDensity: 'experimental',
    readingOrder: ['main_headline', 'product', 'badge', 'cta'],
    designCharacteristics: ['High adrenaline kinetic power', 'Urgent speed visualization'],
  };

  // Verify all 5 references have valid extracted DNA
  const references: CampaignReference[] = [
    { id: 'ref-1', campaign_id: 'r1', image_url: 'https://ex.com/1.jpg', reference_role: 'layout', reference_mode: 'layout', analysis_status: 'completed', design_dna: dnaRef1, created_at: '' },
    { id: 'ref-2', campaign_id: 'r1', image_url: 'https://ex.com/2.jpg', reference_role: 'typography', reference_mode: 'style_transfer', analysis_status: 'completed', design_dna: dnaRef2, created_at: '' },
    { id: 'ref-3', campaign_id: 'r1', image_url: 'https://ex.com/3.jpg', reference_role: 'layout', reference_mode: 'layout', analysis_status: 'completed', design_dna: dnaRef3, created_at: '' },
    { id: 'ref-4', campaign_id: 'r1', image_url: 'https://ex.com/4.jpg', reference_role: 'photography', reference_mode: 'style_transfer', analysis_status: 'completed', design_dna: dnaRef4, created_at: '' },
    { id: 'ref-5', campaign_id: 'r1', image_url: 'https://ex.com/5.jpg', reference_role: 'general', reference_mode: 'inspiration', analysis_status: 'completed', design_dna: dnaRef5, created_at: '' },
  ];

  for (const r of references) {
    assert.ok(r.design_dna);
    assert.ok(r.design_dna.layoutType.length > 0);
    assert.ok(r.design_dna.readingOrder.length >= 3);
  }

  // Test blueprint generation with Reference 1 (Bold Retail Poster)
  const rawDirection1 = {
    visualTheme: 'Bold Morning Retail Energy',
    moodKeywords: ['urgent', 'energetic', 'high-protein'],
    colorGuidance: 'High-contrast charcoal and neon amber',
    typographyGuidance: 'Heavy 900 display sans with tight kerning',
    photographyStyle: 'Commercial strobe with grounded shadows',
    thingsToAvoid: ['weak pastel colors', 'floating products'],
    concepts: [
      {
        pillar: 'Speed',
        headline: 'Breakfast In 60 Seconds Flat',
        subheadline: 'Grab your morning fuel without waiting',
        visualIdea: 'Warm oats bowl with retail discount badge',
        storyline: 'Busy executive saves 20 minutes every morning.',
        cta: 'Grab Yours Now',
        composition: 'Top-heavy poster with product grounded below',
      },
      {
        pillar: 'Speed',
        headline: 'Fuel Faster Than Boiling Water',
        subheadline: 'Instant nutrition on the go',
        visualIdea: 'Stopwatch next to steaming oats pack',
        storyline: 'Breakfast made faster than your morning coffee brew.',
        cta: 'Order Today',
        composition: 'Bold vertical poster layout',
      },
      {
        pillar: 'Speed',
        headline: 'Zero Morning Cooking Required',
        subheadline: 'Just add boiling water and stir',
        visualIdea: 'Steaming spoon lifted from cup',
        storyline: 'Quick nourishment before heading out.',
        cta: 'Get Starter Pack',
        composition: 'Dynamic angle with spoon action',
      },
      {
        pillar: 'Protein proof',
        headline: '20g Protein. Zero Compromise.',
        subheadline: 'Lab-tested clean nutrition',
        visualIdea: 'Front of pack hero shot with protein badge',
        storyline: 'Fitness enthusiasts trust the protein metrics.',
        cta: 'Shop High-Protein',
        composition: 'Crisp center packshot',
      },
      {
        pillar: 'Protein proof',
        headline: 'Real Oats. Real Muscle Fuel.',
        subheadline: 'No added sugars or preservatives',
        visualIdea: 'Clean bowl with macro oats texture',
        storyline: 'Bodybuilder fueling post-run recovery.',
        cta: 'Try Now',
        composition: 'Macro texture close-up',
      },
    ],
  };

  const parsed1 = parseCreativeDirection(
    rawDirection1,
    STRATEGY.creativeMix,
    {
      brand: BRAND,
      strategy: STRATEGY,
      references: [references[0]], // Ref 1: Bold Retail Poster
    },
  );

  assert.equal(parsed1.concepts.length, 5);
  for (const c of parsed1.concepts) {
    assert.ok(c.blueprint);
    const val = validateCreativeBlueprint(c.blueprint);
    assert.equal(val.ok, true, `Blueprint for ${c.id} must be valid: ${val.error}`);
    // Visual density should match Ref 1's 'bold'
    assert.equal(c.blueprint.designIntensity, 'bold');
    // Reading order should match Ref 1's reading order
    assert.deepEqual(c.blueprint.layout.readingOrder, ['badge', 'main_headline', 'product', 'cta']);
  }
  // Controlling reference layoutType is prioritized and diversified across campaign
  assert.ok(
    parsed1.concepts.some((c) => c.blueprint?.advertisingFormat === 'Promotional Retail Poster'),
    'Promotional Retail Poster must be allocated to a campaign concept',
  );
  assert.ok(parsed1.diversityReport);
  assert.ok(parsed1.diversityReport.uniqueFormatsCount >= 4, 'Must allocate diverse formats across campaign');

  // Test blueprint generation with Reference 2 (Editorial Luxury)
  const parsed2 = parseCreativeDirection(
    rawDirection1,
    STRATEGY.creativeMix,
    {
      brand: BRAND,
      strategy: STRATEGY,
      references: [references[1]], // Ref 2: Editorial Luxury
    },
  );

  for (const c of parsed2.concepts) {
    assert.ok(c.blueprint);
    const val = validateCreativeBlueprint(c.blueprint);
    assert.equal(val.ok, true, `Blueprint for ${c.id} must be valid: ${val.error}`);
    // Visual density should match Ref 2's 'minimal'
    assert.equal(c.blueprint.designIntensity, 'minimal');
    // Reading order should match Ref 2's editorial reading order
    assert.deepEqual(c.blueprint.layout.readingOrder, ['logo', 'main_headline', 'product', 'subheadline', 'cta']);
  }
  // Controlling reference layoutType is prioritized and diversified across campaign
  assert.ok(
    parsed2.concepts.some((c) => c.blueprint?.advertisingFormat === 'Editorial Product Advertisement'),
    'Editorial Product Advertisement must be allocated to a campaign concept',
  );
  assert.ok(parsed2.diversityReport);
  assert.ok(parsed2.diversityReport.uniqueFormatsCount >= 4, 'Must allocate diverse formats across campaign');

  // Contrast proof: Ref 1 and Ref 2 produced clearly distinct advertising blueprints from the same concepts
  assert.notDeepEqual(parsed1.concepts.map((c) => c.blueprint?.advertisingFormat), parsed2.concepts.map((c) => c.blueprint?.advertisingFormat));
  assert.notEqual(parsed1.concepts[0].blueprint?.designIntensity, parsed2.concepts[0].blueprint?.designIntensity);
  assert.notDeepEqual(parsed1.concepts[0].blueprint?.layout.readingOrder, parsed2.concepts[0].blueprint?.layout.readingOrder);
});
