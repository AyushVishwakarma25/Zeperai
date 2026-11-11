/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Phase 3:
 * Creative Production and Composition Engine.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeDocument,
  composeFinalCreative,
  resolveCanvasDimensions,
  updateLayerInDocument,
} from './compositor.js';
import {
  escapeXml,
  renderCreativeDocumentToSvg,
  svgToDataUri,
  wrapText,
} from './svgRenderer.js';
import { buildAssetGenerationPrompt } from '../agents/assetGenerator.js';
import { BRAND, STRATEGY } from '../agents/fixtures.js';
import { createDefaultBlueprintFromConcept } from '../blueprintSchema.js';
import type { CreativeBlueprint, CreativeDocument } from '../../types.js';

// ---------------------------------------------------------------------------
// 1. SVG Renderer Tests: Escaping, Typography Wrapping, and Filters
// ---------------------------------------------------------------------------

test('svgRenderer: escapeXml sanitizes hostile characters and quotes', () => {
  assert.equal(escapeXml('20g & 100% pure <instant> "oats" \'ready\''), '20g &amp; 100% pure &lt;instant&gt; &quot;oats&quot; &apos;ready&apos;');
  assert.equal(escapeXml('Clean & Simple'), 'Clean &amp; Simple');
});

test('svgRenderer: wrapText calculates word breaks without truncation', () => {
  const shortText = 'Breakfast Ready In 60 Seconds Flat';
  const lines = wrapText(shortText, 800, 48, 'Poppins');
  assert.ok(lines.length >= 2, `Expected at least 2 lines, got ${lines.length}`);
  assert.equal(lines.join(' '), shortText, 'Wrapped text must preserve all original words');

  const singleWord = 'Supercalifragilistic';
  const singleLine = wrapText(singleWord, 800, 48, 'Poppins');
  assert.equal(singleLine.length, 1);
  assert.equal(singleLine[0], singleWord);
});

test('svgRenderer: renders valid SVG with defs, filters, and Google Fonts', () => {
  const sampleDoc: CreativeDocument = {
    id: 'doc-sample-1',
    conceptId: 'concept-1',
    version: 1,
    advertisingFormat: 'Promotional Retail Poster',
    designIntensity: 'bold',
    canvas: { width: 1080, height: 1350, aspectRatio: '4:5' },
    layers: [
      {
        id: 'layer-bg',
        name: 'Background',
        type: 'background',
        zIndex: 0,
        position: { x: 0, y: 0, width: 1, height: 1 },
        styles: { backgroundColor: '#0A0A0A' },
      },
      {
        id: 'layer-title',
        name: 'Headline',
        type: 'text',
        zIndex: 25,
        position: { x: 0.1, y: 0.15, width: 0.8, height: 0.2 },
        content: 'Fuel Your Morning Workout',
        styles: { fontFamily: 'Poppins', fontWeight: 900, color: '#FFFFFF', fontSize: 52 },
      },
      {
        id: 'layer-badge',
        name: 'Discount Badge',
        type: 'badge',
        zIndex: 20,
        position: { x: 0.1, y: 0.08, width: 0.35, height: 0.05 },
        content: '40% OFF FIRST BOX',
        styles: { backgroundColor: '#F59E0B', textColor: '#FFFFFF', borderRadius: 999 },
      },
      {
        id: 'layer-cta',
        name: 'CTA Button',
        type: 'cta',
        zIndex: 30,
        position: { x: 0.1, y: 0.85, width: 0.45, height: 0.07 },
        content: 'CLAIM YOUR OFFER',
        styles: { backgroundColor: '#F59E0B', textColor: '#FFFFFF', borderRadius: 999 },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const svg = renderCreativeDocumentToSvg(sampleDoc);
  assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must start with XML declaration');
  assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must define SVG namespace');
  assert.ok(svg.includes('viewBox="0 0 1080 1350"'), 'Must have correct 4:5 viewBox');
  assert.ok(svg.includes('family=Poppins'), 'Must import Poppins Google Font');
  assert.ok(svg.includes('id="product-ground-shadow"'), 'Must include ground shadow filter');
  assert.ok(svg.includes('id="text-glow-shadow"'), 'Must include text contrast shadow filter');
  assert.ok(svg.includes('Fuel Your Morning Workout'), 'Must render headline text');
  assert.ok(svg.includes('40% OFF FIRST BOX'), 'Must render badge text');
  assert.ok(svg.includes('CLAIM YOUR OFFER'), 'Must render CTA text');

  const dataUri = svgToDataUri(svg);
  assert.ok(dataUri.startsWith('data:image/svg+xml;base64,'), 'Must output valid base64 data URI');
});

// ---------------------------------------------------------------------------
// 2. Canvas Resolution & Compositor Tests
// ---------------------------------------------------------------------------

test('compositor: resolveCanvasDimensions handles standard social and advertising aspect ratios', () => {
  assert.deepEqual(resolveCanvasDimensions('4:5'), { width: 1080, height: 1350, aspectRatio: '4:5' });
  assert.deepEqual(resolveCanvasDimensions('1:1'), { width: 1080, height: 1080, aspectRatio: '1:1' });
  assert.deepEqual(resolveCanvasDimensions('9:16'), { width: 1080, height: 1920, aspectRatio: '9:16' });
  assert.deepEqual(resolveCanvasDimensions('16:9'), { width: 1920, height: 1080, aspectRatio: '16:9' });
});

test('compositor: buildCreativeDocument maps blueprint bounding boxes into complete layer stack', () => {
  const baseBlueprint = createDefaultBlueprintFromConcept({
    concept: {
      id: 'speed-1',
      pillar: 'Speed',
      headline: 'Breakfast in 60 Seconds Flat',
      subheadline: 'Instant protein for busy urban mornings',
      visualIdea: 'Warm oats bowl with retail timer badge',
      storyline: 'Never skip breakfast again.',
      cta: 'Order Starter Kit',
      composition: 'Hero packshot with bold top headline and grounded shadow',
    },
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    designIntensity: 'bold',
  });

  const doc = buildCreativeDocument({
    blueprint: baseBlueprint,
    backgroundUrl: 'https://images.example.com/clean-studio-bg.jpg',
    productImageUrl: 'https://images.example.com/prustlr-packshot.png',
    brandName: 'PRUSTLR',
    brandColors: ['#0A0A0A', '#E4572E'],
  });

  assert.equal(doc.conceptId, 'speed-1');
  assert.equal(doc.canvas.width, 1080);
  assert.equal(doc.canvas.height, 1350);
  assert.ok(doc.layers.length >= 6, 'Must generate at least 6 structured layers');

  const layerTypes = doc.layers.map((l) => l.type);
  assert.ok(layerTypes.includes('background'), 'Must have background layer');
  assert.ok(layerTypes.includes('product'), 'Must have product layer');
  assert.ok(layerTypes.includes('text'), 'Must have text layers');
  assert.ok(layerTypes.includes('cta'), 'Must have CTA layer');
  assert.ok(layerTypes.includes('logo'), 'Must have logo layer');

  const productLayer = doc.layers.find((l) => l.type === 'product');
  assert.ok(productLayer);
  assert.equal(productLayer.content, 'https://images.example.com/prustlr-packshot.png');
  assert.ok(productLayer.position.x >= 0 && productLayer.position.x <= 1);
  assert.ok(productLayer.position.width > 0 && productLayer.position.width <= 1);
});

test('compositor: updateLayerInDocument allows surgical layer edits and re-renders', () => {
  const baseBlueprint = createDefaultBlueprintFromConcept({
    concept: {
      id: 'c1',
      pillar: 'Speed',
      headline: 'Original Headline',
      cta: 'Shop Now',
      visualIdea: 'Product on table',
      storyline: 'Quick breakfast',
      composition: 'Center product',
    },
    brand: BRAND,
  });

  const initialDoc = buildCreativeDocument({
    blueprint: baseBlueprint,
    productImageUrl: 'https://images.example.com/product.png',
  });

  const headlineLayer = initialDoc.layers.find((l) => l.id === 'layer-headline');
  assert.ok(headlineLayer);
  assert.equal(headlineLayer.content, 'Original Headline');

  // Surgical edit: user updates the headline copy and font color
  const updatedDoc = updateLayerInDocument(initialDoc, 'layer-headline', {
    content: 'Edited High-Impact Headline',
    styles: { color: '#FBBF24' },
  });

  const updatedHeadline = updatedDoc.layers.find((l) => l.id === 'layer-headline');
  assert.ok(updatedHeadline);
  assert.equal(updatedHeadline.content, 'Edited High-Impact Headline');
  assert.equal(updatedHeadline.styles.color, '#FBBF24');
  assert.ok(updatedDoc.updatedAt);

  // SVG rendering reflects the edited text (wrapped across tspans)
  const svg = renderCreativeDocumentToSvg(updatedDoc);
  assert.ok(svg.includes('Edited High-Impact') && svg.includes('Headline'));
  assert.ok(!svg.includes('Original Headline'));
});

// ---------------------------------------------------------------------------
// 3. Visual Asset Generator Prompt Construction
// ---------------------------------------------------------------------------

test('assetGenerator: buildAssetGenerationPrompt creates text-free environment prompts', () => {
  const blueprint = createDefaultBlueprintFromConcept({
    concept: {
      id: 'luxury-1',
      pillar: 'Craft',
      headline: 'Pure Artisan Oats',
      visualIdea: 'Stone pedestal with warm sunlight',
      storyline: 'Artisanal breakfast',
      cta: 'Discover',
      composition: 'Travertine stone in morning side light',
    },
    brand: BRAND,
    designIntensity: 'minimal',
  });
  blueprint.advertisingFormat = 'Editorial Product Advertisement';

  const prompt = buildAssetGenerationPrompt(blueprint, 'environment');
  assert.ok(prompt.includes('Editorial Product Advertisement'));
  assert.ok(prompt.includes('Clean studio advertising environment plate'));
  assert.ok(prompt.includes('DO NOT render any text, typography, letters, words, prices, logos, or watermarks'));
});

// ---------------------------------------------------------------------------
// 4. Acceptance Criteria: Produce 5 Finished Advertisements Using One Brand
// ---------------------------------------------------------------------------

test('acceptance: produces 5 distinct, finished advertisements across required commercial formats', async () => {
  const productImageUrl = 'https://prustlr.com/packshot-clean-cutout.png';
  const logoUrl = 'https://prustlr.com/logo-white.svg';
  const brandColors = ['#0A0A0A', '#E4572E']; // Prustlr brand palette

  // 1. Promotional Retail Poster
  const bp1 = createDefaultBlueprintFromConcept({
    concept: {
      id: 'promo-poster-1',
      pillar: 'Urgency & Offer',
      headline: 'Fuel Your Morning For Under INR 20',
      subheadline: 'Limited 50% discount on your first subscription box',
      visualIdea: 'Hero oats cup with glowing promotional badge',
      storyline: 'High protein breakfast at unbelievable daily value.',
      cta: 'GRAB 50% OFF TODAY',
      composition: 'Bold top-heavy commercial poster with hero product anchored in bottom 45%',
    },
    brand: BRAND,
    aspectRatio: '4:5',
    designIntensity: 'bold',
  });
  bp1.advertisingFormat = 'Promotional Retail Poster';
  bp1.copy.offer = '50% OFF TODAY';

  // 2. Editorial Product Advertisement
  const bp2 = createDefaultBlueprintFromConcept({
    concept: {
      id: 'editorial-ad-2',
      pillar: 'Purity & Craft',
      headline: 'The Poetics of Morning Fuel',
      subheadline: 'Whole rolled grain oats infused with pure Criollo cacao',
      visualIdea: 'Travertine stone block with soft morning raking sunlight',
      storyline: 'A mindful moment before the urban day begins.',
      cta: 'EXPLORE THE COLLECTION',
      composition: 'Poetic minimalist composition with generous negative breathing space and organic side light',
    },
    brand: BRAND,
    aspectRatio: '4:5',
    designIntensity: 'minimal',
  });
  bp2.advertisingFormat = 'Editorial Product Advertisement';
  bp2.typography.headlineStyle = { fontFamily: 'Playfair Display', fontWeight: 700, fontSizeHint: 'hero', color: '#FFFFFF' };

  // 3. Product Hero Advertisement
  const bp3 = createDefaultBlueprintFromConcept({
    concept: {
      id: 'product-hero-3',
      pillar: 'Precision & Quality',
      headline: 'Engineered For Pure Performance',
      subheadline: '20 grams of whey isolate in every single bowl',
      visualIdea: 'Pristine central hero packshot with crisp rim lighting and architectural pedestal',
      storyline: 'Clean sports nutrition without compromise.',
      cta: 'DISCOVER PRUSTLR',
      composition: 'Pristine central hero anchor with architectural stone pedestal and razor-sharp rim illumination',
    },
    brand: BRAND,
    aspectRatio: '4:5',
    designIntensity: 'balanced',
  });
  bp3.advertisingFormat = 'Pure Product Hero';

  // 4. Feature & Ingredient Spotlight
  const bp4 = createDefaultBlueprintFromConcept({
    concept: {
      id: 'feature-spotlight-4',
      pillar: 'Ingredient Proof',
      headline: 'What Goes Into Every Single Spoonful',
      subheadline: 'Chia seeds, golden flax, raw cocoa, and micro-filtered whey',
      visualIdea: 'Macro freeze-motion explosion of wholesome ingredients around the hero jar',
      storyline: 'Real food provenance you can inspect with your own eyes.',
      cta: 'SEE NUTRITION FACTS',
      composition: 'Exploded macro view with floating raw ingredients and radial nutrition callout pointers',
    },
    brand: BRAND,
    aspectRatio: '4:5',
    designIntensity: 'balanced',
  });
  bp4.advertisingFormat = 'Ingredient & Feature Spotlight';
  bp4.copy.offer = '20G PROTEIN';

  // 5. Lifestyle Integration Advertisement
  const bp5 = createDefaultBlueprintFromConcept({
    concept: {
      id: 'lifestyle-ad-5',
      pillar: 'Urban Routine',
      headline: 'From Alarm Clock To Commute. Powered.',
      subheadline: 'The 2-minute morning ritual trusted by 50,000 busy professionals',
      visualIdea: 'Modern sunlit apartment kitchen with executive preparing breakfast in travel tumbler',
      storyline: 'Seamlessly fitting into the real morning flow of urban high-achievers.',
      cta: 'START YOUR ROUTINE',
      composition: 'Warm authentic candid lifestyle environment with in-hand product integration',
    },
    brand: BRAND,
    aspectRatio: '4:5',
    designIntensity: 'balanced',
  });
  bp5.advertisingFormat = 'Lifestyle Integration Advertisement';

  const blueprints = [bp1, bp2, bp3, bp4, bp5];
  const renderedAds: Array<{
    format: string;
    document: CreativeDocument;
    compositeUrl: string;
    svg: string;
  }> = [];

  for (const bp of blueprints) {
    const res = await composeFinalCreative({
      blueprint: bp,
      backgroundUrl: `https://images.example.com/bg-${bp.conceptId}.jpg`,
      productImageUrl,
      logoUrl,
      brandName: 'PRUSTLR',
      brandColors,
    });

    renderedAds.push({
      format: bp.advertisingFormat,
      document: res.document,
      compositeUrl: res.compositeUrl,
      svg: res.svg,
    });
  }

  // Verification 1: Produced exactly 5 advertisements covering all required formats
  assert.equal(renderedAds.length, 5);
  const formats = renderedAds.map((a) => a.format);
  assert.ok(formats.includes('Promotional Retail Poster'), 'Must include Promotional Retail Poster');
  assert.ok(formats.includes('Editorial Product Advertisement'), 'Must include Editorial Product Advertisement');
  assert.ok(formats.includes('Pure Product Hero'), 'Must include Pure Product Hero');
  assert.ok(formats.includes('Ingredient & Feature Spotlight'), 'Must include Ingredient Spotlight');
  assert.ok(formats.includes('Lifestyle Integration Advertisement'), 'Must include Lifestyle Advertisement');

  // Verification 2: Each advertisement is a standalone composite data URI with designed typography and graphics
  for (const ad of renderedAds) {
    assert.ok(ad.compositeUrl.startsWith('data:image/svg+xml;base64,'), `${ad.format} must produce a valid base64 data URI`);
    assert.ok(ad.document.layers.length >= 5, `${ad.format} must contain at least 5 structured layers`);

    // Verify product imagery is preserved and anchored with ground shadow
    assert.ok(ad.svg.includes(productImageUrl), `${ad.format} must include original product image cutout`);
    assert.ok(ad.svg.includes('id="product-ground-shadow"'), `${ad.format} must include realistic cast shadow`);

    // Verify headline is deterministically rendered into the image
    assert.ok(ad.svg.includes(ad.document.layers.find((l) => l.type === 'text')?.content?.slice(0, 15) || ''));

    // Verify CTA button is deterministically rendered
    const ctaLayer = ad.document.layers.find((l) => l.type === 'cta');
    assert.ok(ctaLayer, `${ad.format} must contain a CTA layer`);
    assert.ok(ad.svg.includes(ctaLayer.content || ''));
  }

  // Verification 3: Typography and layout distinction between Editorial (serif) and Retail (bold sans)
  const retailAd = renderedAds.find((a) => a.format === 'Promotional Retail Poster')!;
  const editorialAd = renderedAds.find((a) => a.format === 'Editorial Product Advertisement')!;

  assert.equal(retailAd.document.designIntensity, 'bold');
  assert.equal(editorialAd.document.designIntensity, 'minimal');
  assert.ok(editorialAd.svg.includes('Playfair Display'), 'Editorial ad must use Playfair Display serif');
  assert.ok(retailAd.svg.includes('50% OFF TODAY'), 'Retail ad must include promotional offer badge');
});
