import test from 'node:test';
import assert from 'node:assert/strict';
import { BRAND, STRATEGY } from './fixtures.js';
import { normalizeReferenceDesignDNA } from './referenceAnalyst.js';
import { parseCreativeDirection } from './creativeDirection.js';
import {
  criticizeCreativeDirection,
  evaluateSingleConcept,
  reviseWeakConcepts,
} from './compositionCritic.js';
import { buildAssetGenerationPrompt } from './assetGenerator.js';
import { buildCreativeDocument } from '../composition/compositor.js';
import type {
  BrandContext,
  CreativeBlueprint,
  CreativeConcept,
  CreativeDirection,
  ReferenceDesignDNA,
} from '../../types.js';

test('referenceAnalyst: extracts and normalizes all 11 core advertising design dimensions', () => {
  const rawDNA = {
    layoutType: 'Diagonal Dynamic Split',
    composition: 'Asymmetric 60/40 diagonal division with hero product anchored bottom right',
    productPlacement: 'Hero bottle anchored in lower quadrant at 45-degree angle with grounded soft shadow',
    cameraAngle: 'Low-angle heroic monument perspective',
    lighting: 'Dramatic high-contrast studio strobe with warm golden rim light',
    backgroundTreatment: 'Sleek architectural marble slab with subtle reflection wash',
    colorPalette: ['#1A1A1A', '#F59E0B', '#E5E7EB'],
    typographyHierarchy: ['Bold condensed headline', 'Medium sans subline', 'Floating badge pill'],
    negativeSpace: 'Generous 45% negative space in upper-left quadrant dedicated for headline copy',
    supportingElements: ['20% Off Round Pill', '5-Star Trust Cluster', 'Golden Rim Border'],
    advertisingMessage: 'Immediate energy surge without sugar crash',
    ctaPlacement: 'Bottom center floating rounded action pill',
    photographyStyle: 'Ultra-crisp commercial product photography with macro texture depth',
  };

  const dna = normalizeReferenceDesignDNA(rawDNA);

  // 1. Composition
  assert.equal(dna.composition, rawDNA.composition);
  // 2. Product Placement
  assert.equal(dna.productPlacement, rawDNA.productPlacement);
  // 3. Camera Angle
  assert.equal(dna.cameraAngle, rawDNA.cameraAngle);
  // 4. Lighting
  assert.equal(dna.lighting, rawDNA.lighting);
  // 5. Background
  assert.equal(dna.backgroundTreatment, rawDNA.backgroundTreatment);
  // 6. Colour Palette & Relationships
  assert.deepEqual(dna.colorPalette, rawDNA.colorPalette);
  assert.deepEqual(dna.colorRelationships, rawDNA.colorPalette);
  // 7. Typography Hierarchy
  assert.deepEqual(dna.typographyHierarchy, rawDNA.typographyHierarchy);
  assert.deepEqual(dna.visualHierarchy, rawDNA.typographyHierarchy);
  // 8. Negative Space
  assert.equal(dna.negativeSpace, rawDNA.negativeSpace);
  // 9. Supporting Elements
  assert.deepEqual(dna.supportingElements, rawDNA.supportingElements);
  assert.deepEqual(dna.graphicElements, rawDNA.supportingElements);
  // 10. Advertising Message
  assert.equal(dna.advertisingMessage, rawDNA.advertisingMessage);
  // 11. CTA Placement
  assert.equal(dna.ctaPlacement, rawDNA.ctaPlacement);
});

test('creativeDirection: produces complete structured creative direction across 11 dimensions', () => {
  const raw = {
    visualTheme: 'High-Performance Clean Energy',
    moodKeywords: ['Electrifying', 'Modern', 'Clean', 'Focused'],
    colorGuidance: 'Deep obsidian backdrop with vibrant amber neon accents',
    typographyGuidance: 'Poppins bold geometric headers with clean Inter body',
    photographyStyle: 'High-speed splash strobe commercial photography',
    concepts: [
      {
        pillar: 'Speed',
        conceptName: 'Instant Morning Surge',
        advertisingObjective: 'Cold traffic top-of-funnel thumb stopping hook',
        headline: 'Instant Energy. Zero Crash.',
        subheadline: 'Crafted with 100% organic cold-brew concentrate',
        visualIdea: 'Frosty amber beverage can erupting through clean splash dynamics with water droplets',
        storyline: 'Busy urban commuter needing instantaneous focus without the 2pm jitter.',
        composition: 'Dynamic diagonal angle with can hero anchored at right, bold headline floating on left negative space',
        compositionDescription: 'Dynamic diagonal angle with can hero anchored at right, bold headline floating on left negative space',
        productPlacement: 'Lower right quadrant at 35% canvas scale, tilted 15 degrees with grounded puddle reflection',
        backgroundDirection: 'Minimalist obsidian studio sweep with subtle warm amber ambient backlight',
        lightingDirection: 'High-contrast studio strobe with crisp backlit rim illumination on condensation',
        supportingElements: ['Sugar Free Stamp', 'Instant Delivery Pill'],
        cta: 'Order Now',
        ctaDirection: 'Pill button in high-contrast amber anchored at bottom margin',
        copyHierarchy: {
          headline: 'Instant Energy. Zero Crash.',
          subheadline: 'Crafted with 100% organic cold-brew concentrate',
          cta: 'Order Now',
        },
        colorTypographyDirection: {
          colorGuidance: 'Obsidian #0A0A0A and Amber #F59E0B',
          typographyGuidance: 'Poppins Black 900 for headline',
        },
        advertisingFormat: 'Feature Spotlight',
      },
    ],
    thingsToAvoid: ['Cluttered tables', 'Stock gym photos', 'Fake medical claims'],
  };

  const parsed = parseCreativeDirection(raw, [{ pillar: 'Speed', count: 1 }], {
    brand: BRAND,
    strategy: STRATEGY,
  });

  assert.equal(parsed.concepts.length, 1);
  const c = parsed.concepts[0];

  assert.equal(c.conceptName, 'Instant Morning Surge');
  assert.equal(c.advertisingObjective, 'Cold traffic top-of-funnel thumb stopping hook');
  assert.equal(c.visualIdea, 'Frosty amber beverage can erupting through clean splash dynamics with water droplets');
  assert.ok(c.compositionDescription?.includes('Dynamic diagonal angle'));
  assert.ok(c.productPlacement?.includes('Lower right quadrant'));
  assert.ok(c.backgroundDirection?.includes('Minimalist obsidian studio sweep'));
  assert.ok(c.lightingDirection?.includes('High-contrast studio strobe'));
  assert.deepEqual(c.supportingElements, ['Sugar Free Stamp', 'Instant Delivery Pill']);
  assert.equal(c.copyHierarchy?.headline, 'Instant Energy. Zero Crash.');
  assert.equal(c.ctaDirection, 'Pill button in high-contrast amber anchored at bottom margin');
  assert.ok(c.colorTypographyDirection?.colorGuidance?.includes('Obsidian'));

  // Blueprint art direction reflects the creative direction dimensions
  assert.ok(c.blueprint);
  assert.equal(c.blueprint.artDirection.background, c.backgroundDirection);
  assert.equal(c.blueprint.artDirection.lighting, c.lightingDirection);
});

test('compositionCritic: detects weak generic concepts and surfaces actionable feedback', () => {
  const genericConcept: CreativeConcept = {
    id: 'generic-1',
    pillar: 'Speed',
    headline: 'Buy Our Product Today',
    visualIdea: 'Product centered on plain white background',
    storyline: 'Generic ad for people.',
    cta: 'Buy',
    composition: 'Product in the middle with white background',
  };

  const review = evaluateSingleConcept({
    concept: genericConcept,
    brand: BRAND,
    strategy: STRATEGY,
  });

  assert.equal(review.isApproved, false);
  assert.ok(review.overallScore < 75);
  const weakIssue = review.issues.find((i) => i.type === 'weak_concept');
  assert.ok(weakIssue, 'Must flag weak generic concept cliché');
  assert.match(weakIssue.description, /generic visual cliché/i);
});

test('compositionCritic: detects headline/product occlusion and insufficient negative space', () => {
  const occludedBlueprint: CreativeBlueprint = {
    id: 'bp-occluded',
    conceptId: 'occ-1',
    version: 1,
    status: 'draft',
    marketingAngle: 'Speed',
    advertisingFormat: 'Feature Spotlight',
    designIntensity: 'balanced',
    designConcept: 'Fast Focus',
    visualNarrative: 'Speed and agility',
    canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
    artDirection: {
      visualStyle: 'Modern commercial',
      mood: 'sharp',
      background: 'Studio clean',
      colorPalette: ['#000000', '#F59E0B'],
      photographyStyle: 'Studio strobe',
      lighting: 'Studio light',
    },
    layout: {
      composition: 'Overcrowded',
      readingOrder: ['main_headline', 'product', 'cta'],
      productPlacement: 'Center',
      productScale: 0.6,
      safeZones: [],
      // Severe overlap: headline and product occupy identical vertical box!
      elements: [
        { element: 'main_headline', x: 0.1, y: 0.3, width: 0.8, height: 0.4 },
        { element: 'product', x: 0.1, y: 0.3, width: 0.8, height: 0.5 },
        { element: 'cta', x: 0.1, y: 0.85, width: 0.5, height: 0.1 },
      ],
    },
    typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
    copy: { headline: 'Massive Overlap', cta: 'Shop' },
    graphicElements: [],
    assets: { productAssetIds: [], referenceIds: [] },
    constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: false, prohibitInventedClaims: true },
  };

  const occludedConcept: CreativeConcept = {
    id: 'occ-1',
    pillar: 'Speed',
    headline: 'Massive Overlap Headline',
    visualIdea: 'Product with large text right on top of it',
    storyline: 'Busy morning scenario.',
    cta: 'Shop',
    composition: 'Headline placed over the packshot center',
    blueprint: occludedBlueprint,
  };

  const review = evaluateSingleConcept({
    concept: occludedConcept,
    brand: BRAND,
    strategy: STRATEGY,
  });

  const overlapIssue = review.issues.find((i) => i.type === 'poor_visibility');
  assert.ok(overlapIssue, 'Must detect product occlusion');
  assert.match(overlapIssue.description, /collides with product hero/i);
});

test('compositionCritic: detects brand voice conflicts and forbidden claims', () => {
  const brandWithGuardrails: BrandContext = {
    ...BRAND,
    voice: {
      tone: ['premium', 'scientific'],
      doSay: ['verified', 'clean fuel'],
      dontSay: ['miracle', 'cure', 'cheapest'],
    },
  };

  const conflictingConcept: CreativeConcept = {
    id: 'conflict-1',
    pillar: 'Speed',
    headline: 'The Miracle Cure for Morning Sluggishness',
    visualIdea: 'Astonishing medical style transformation shot',
    storyline: 'Customer cures all fatigue with our cheapest formula.',
    cta: 'Try Now',
    composition: 'Split layout showing instant before and after',
  };

  const review = evaluateSingleConcept({
    concept: conflictingConcept,
    brand: brandWithGuardrails,
    strategy: STRATEGY,
  });

  assert.equal(review.isApproved, false);
  const brandIssue = review.issues.find((i) => i.type === 'brand_conflict');
  assert.ok(brandIssue, 'Must detect forbidden brand terms');
  assert.match(brandIssue.description, /contains forbidden brand term: "miracle"/i);
});

test('compositionCritic: self-healing revision automatically repairs weak and conflicting concepts', () => {
  const brandWithGuardrails: BrandContext = {
    ...BRAND,
    voice: {
      tone: ['premium'],
      doSay: ['pure energy'],
      dontSay: ['cure', 'miracle'],
    },
  };

  const directionWithWeakConcept: CreativeDirection = {
    visualTheme: 'Clean Commercial Energy',
    moodKeywords: ['Bold', 'Modern'],
    colorGuidance: 'Dark theme with orange',
    typographyGuidance: 'Poppins bold',
    photographyStyle: 'Studio photography',
    thingsToAvoid: ['Clutter'],
    concepts: [
      {
        id: 'weak-1',
        pillar: 'Speed',
        headline: 'Instant miracle energy for all',
        visualIdea: 'Product centered on plain white background',
        storyline: 'A quick morning breakfast.',
        cta: 'Order',
        composition: 'Product in the middle with white background',
        blueprint: {
          id: 'bp-weak-1',
          conceptId: 'weak-1',
          version: 1,
          status: 'draft',
          marketingAngle: 'Speed',
          advertisingFormat: 'Generic Packshot',
          designIntensity: 'minimal',
          designConcept: 'Simple Shot',
          visualNarrative: 'Quick drink',
          canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
          artDirection: {
            visualStyle: 'Plain',
            mood: 'basic',
            background: 'White',
            colorPalette: ['#000', '#FFF'],
            photographyStyle: 'Basic',
            lighting: 'Basic',
          },
          layout: {
            composition: 'Basic',
            readingOrder: ['main_headline', 'product', 'cta'],
            productPlacement: 'Center',
            productScale: 0.5,
            safeZones: [],
            // Headline collides with product
            elements: [
              { element: 'main_headline', x: 0.1, y: 0.35, width: 0.8, height: 0.3 },
              { element: 'product', x: 0.1, y: 0.35, width: 0.8, height: 0.4 },
              { element: 'cta', x: 0.1, y: 0.85, width: 0.4, height: 0.08 },
            ],
          },
          typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
          copy: { headline: 'Instant miracle energy for all', cta: 'Order' },
          graphicElements: [],
          assets: { productAssetIds: [], referenceIds: [] },
          constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: false, prohibitInventedClaims: true },
        },
      },
    ],
  };

  const initialCritique = criticizeCreativeDirection({
    direction: directionWithWeakConcept,
    brand: brandWithGuardrails,
    strategy: STRATEGY,
  });

  assert.equal(initialCritique.isApproved, false, 'Initial weak concept must fail critique');
  assert.ok(initialCritique.conceptReviews[0].issues.length >= 2, 'Must have identified multiple issues');

  // Trigger automated revision
  const revision = reviseWeakConcepts({
    direction: directionWithWeakConcept,
    critique: initialCritique,
    brand: brandWithGuardrails,
    strategy: STRATEGY,
  });

  assert.ok(revision.revisionsApplied.length > 0, 'Revisions must be applied');

  // Re-evaluate the revised direction
  const postCritique = criticizeCreativeDirection({
    direction: revision.revisedDirection,
    brand: brandWithGuardrails,
    strategy: STRATEGY,
  });

  const revisedConcept = revision.revisedDirection.concepts[0];
  // 1. Forbidden term removed
  assert.ok(!revisedConcept.headline.toLowerCase().includes('miracle'), 'Forbidden word "miracle" must be removed');
  // 2. Composition upgraded with concrete art direction
  assert.ok(revisedConcept.compositionDescription?.includes('Product framed at a'));
  // 3. Occlusion eliminated: headline and product have separated Y coordinates
  const newHeadline = revisedConcept.blueprint?.layout.elements.find((el) => el.element === 'main_headline');
  const newProduct = revisedConcept.blueprint?.layout.elements.find((el) => el.element === 'product');
  assert.ok(newHeadline && newProduct);
  assert.ok(newHeadline.y + newHeadline.height <= newProduct.y + 0.02, 'Headline must no longer occlude product');
  // 4. Score improved and approved
  assert.ok(postCritique.overallScore >= 75, `Post-critique score must pass threshold (got ${postCritique.overallScore})`);
  assert.equal(postCritique.isApproved, true);
});

test('assetGenerator & compositor: feed approved creative direction into prompts and layers', () => {
  const concept: CreativeConcept = {
    id: 'speed-1',
    pillar: 'Speed',
    headline: '10-Minute Sustained Energy',
    visualIdea: 'Sleek dark obsidian kitchen counter with frosted energy beverage',
    storyline: 'Instant workout preparation.',
    cta: 'Get Yours',
    composition: 'Crisp 45-degree angle with natural light',
    compositionDescription: 'Crisp 45-degree angle with natural light',
    backgroundDirection: 'Minimalist Nordic stone kitchen countertop with morning sunlight',
    lightingDirection: 'Crisp side-lit morning sunrise beam with golden rim accents',
    supportingElements: ['Instant Delivery', '100% Arabica'],
    copyHierarchy: {
      headline: '10-Minute Sustained Energy',
      subheadline: 'Zero artificial sweeteners or jitter chemicals',
      cta: 'Get Yours',
    },
  };

  const blueprint: CreativeBlueprint = {
    id: 'bp-speed-1',
    conceptId: 'speed-1',
    version: 1,
    status: 'draft',
    marketingAngle: 'Speed',
    advertisingFormat: 'Editorial Product Advertisement',
    designIntensity: 'balanced',
    designConcept: 'Morning Speed',
    visualNarrative: 'Quick sustained boost',
    canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
    artDirection: {
      visualStyle: 'Nordic minimalist',
      mood: 'fresh',
      background: 'Stone countertop',
      colorPalette: ['#0A0A0A', '#F59E0B'],
      photographyStyle: 'Crisp editorial commercial',
      lighting: 'Morning sunrise',
    },
    layout: {
      composition: 'Editorial layout',
      readingOrder: ['badge', 'main_headline', 'product', 'cta'],
      productPlacement: 'Grounded bottom right',
      productScale: 0.6,
      safeZones: [],
      elements: [
        { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.18 },
        { element: 'product', x: 0.15, y: 0.40, width: 0.70, height: 0.42 },
        { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07 },
      ],
    },
    typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFF' }, hierarchy: [] },
    copy: { headline: '10-Minute Sustained Energy', cta: 'Get Yours' },
    graphicElements: [],
    assets: { productAssetIds: [], referenceIds: [] },
    constraints: { preserveProductPackaging: true, preserveLogo: true, exactCopyRequired: false, prohibitInventedClaims: true },
  };

  // 1. Asset Generator Prompt includes background & lighting direction from concept
  const prompt = buildAssetGenerationPrompt(blueprint, 'environment', concept);
  assert.ok(prompt.includes('Minimalist Nordic stone kitchen countertop with morning sunlight'));
  assert.ok(prompt.includes('Crisp side-lit morning sunrise beam'));
  assert.ok(prompt.includes('DO NOT render any text'));

  // 2. Compositor Document inherits copyHierarchy and supportingElements badge
  const doc = buildCreativeDocument({
    blueprint,
    concept,
    brandColors: ['#0A0A0A', '#F59E0B'],
    brandName: 'PruStlr',
  });

  const headlineLayer = doc.layers.find((l) => l.id === 'layer-headline');
  assert.equal(headlineLayer?.content, '10-Minute Sustained Energy');

  const badgeLayer = doc.layers.find((l) => l.id === 'layer-badge');
  assert.equal(badgeLayer?.content, 'Instant Delivery');

  const ctaLayer = doc.layers.find((l) => l.id === 'layer-cta');
  assert.equal(ctaLayer?.content, 'Get Yours');
});

