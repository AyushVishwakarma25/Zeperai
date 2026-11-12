import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptCreativeDocument,
  adaptMasterCreativeToAllFormats,
  getSafeZoneBounds,
  META_PLACEMENT_SPECS,
} from './creativeAdapter.js';
import {
  buildMetaCampaignPackage,
  clampToWordBoundary,
  generateMetaCopyPackage,
  resolveMetaCta,
} from '../export/metaPackageGenerator.js';
import { buildMetaAdPackageZip, buildMetaCopySheetText } from '../export/exportArchive.js';
import { computeCrc32, SimpleZipBuilder } from '../export/zipWriter.js';
import type { BrandContext, CampaignAsset, CampaignRun, CreativeDocument, CreativeQualityScores } from '../../types.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_BRAND: BrandContext = {
  brandName: 'AuraGlow Organics',
  category: 'Skincare',
  summary: '100% cold-pressed organic rosehip facial serum.',
  positioning: 'Clean luxury organic skincare for radiant skin.',
  usps: ['100% Certified Organic', 'Visibly Plumper Skin In 7 Days', 'Zero Synthetic Fragrance'],
  products: [
    {
      name: 'Radiance Glow Serum',
      description: 'Pure cold-pressed rosehip oil enriched with Vitamin C & E.',
      priceHint: '₹1,299',
    },
  ],
  audience: {
    primary: 'Urban women 25-42 seeking clean anti-aging skincare',
    painPoints: ['Dull tired complexion', 'Dry patchiness under makeup', 'Harsh chemical irritation'],
    desires: ['Dewy youthful glow', 'Naturally clear even skin tone', 'Gentle nourishing hydration'],
  },
  voice: {
    tone: ['Elevated', 'Sensory', 'Empowering'],
    doSay: ['Radiance', 'Botanical potency', 'Pure cold-pressed'],
    dontSay: ['Miracle cure', 'Cheap', 'Chemical peel'],
  },
  visualIdentity: {
    colors: [
      { name: 'Rose Gold', hex: '#E0A996' },
      { name: 'Deep Botanical Charcoal', hex: '#1C1F1D' },
      { name: 'Cream Ivory', hex: '#FDFBF7' },
    ],
    typography: 'Playfair Display, sans-serif',
    styleKeywords: ['minimalist', 'clean', 'luxury', 'sunlit'],
  },
  markets: ['India'],
  sources: ['https://auraglow.in'],
};

const MOCK_RUN: CampaignRun = {
  id: 'run-adapt-001',
  user_id: 'user-001',
  title: 'Diwali Radiance Campaign',
  input_type: 'website',
  website_url: 'https://auraglow.in',
  goal: 'Sales & Conversions',
  platforms: ['Instagram', 'Facebook'],
  settings: {
    creativeCount: 3,
    quality: 'Standard',
    aspectRatio: '1:1',
    platforms: ['meta_ads'],
    model: 'imagen-3.0-generate-002',
    stylePreset: 'Commercial advertising',
    thinkingLevel: 'medium',
  },
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  brand_context: MOCK_BRAND,
} as unknown as CampaignRun;

function createSample1x1MasterDocument(): CreativeDocument {
  return {
    id: 'doc-master-1x1',
    conceptId: 'concept-1',
    version: 1,
    advertisingFormat: 'Promotional Product Advertisement',
    designIntensity: 'balanced',
    canvas: {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
    },
    layers: [
      {
        id: 'layer-background',
        name: 'Background',
        type: 'background',
        zIndex: 0,
        position: { x: 0, y: 0, width: 1.0, height: 1.0 },
        styles: { backgroundImage: 'https://images.example.com/auraglow-bg.jpg' },
      },
      {
        id: 'layer-logo',
        name: 'Brand Logo',
        type: 'logo',
        zIndex: 5,
        position: { x: 0.08, y: 0.08, width: 0.22, height: 0.06 },
        content: 'AuraGlow',
        styles: { color: '#E0A996' },
      },
      {
        id: 'layer-badge',
        name: 'Offer Badge',
        type: 'badge',
        zIndex: 15,
        position: { x: 0.70, y: 0.08, width: 0.22, height: 0.07 },
        content: '20% OFF DIWALI',
        styles: { backgroundColor: '#E0A996', color: '#1C1F1D' },
      },
      {
        id: 'layer-headline',
        name: 'Main Headline',
        type: 'headline',
        zIndex: 10,
        position: { x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
        content: 'Awaken Your Inner Radiance In 7 Days',
        styles: { color: '#FFFFFF', fontWeight: 800, fontSize: '44px' },
      },
      {
        id: 'layer-subheadline',
        name: 'Subheadline',
        type: 'text',
        zIndex: 12,
        position: { x: 0.08, y: 0.28, width: 0.84, height: 0.06 },
        content: 'Pure cold-pressed botanical elixir for glass skin.',
        styles: { color: '#FDFBF7', fontSize: '20px' },
      },
      {
        id: 'layer-product',
        name: 'Product Packshot',
        type: 'product',
        zIndex: 8,
        position: { x: 0.15, y: 0.34, width: 0.70, height: 0.46 },
        styles: { backgroundImage: 'https://images.example.com/packshot.png' },
      },
      {
        id: 'layer-cta',
        name: 'Call To Action',
        type: 'cta',
        zIndex: 20,
        position: { x: 0.08, y: 0.84, width: 0.46, height: 0.07 },
        content: 'Shop Radiance Elixir',
        styles: { backgroundColor: '#E0A996', color: '#1C1F1D' },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 1. Creative Adaptation Engine Tests
// ---------------------------------------------------------------------------

test('creativeAdapter: adapts 1:1 master creative to 9:16 Stories/Reels respecting UI safe zones', () => {
  const masterDoc = createSample1x1MasterDocument();
  const res = adaptCreativeDocument(masterDoc, '9:16');

  const { document: adapted, compositeUrl } = res;

  // Canvas dimensions
  assert.equal(adapted.canvas.width, 1080);
  assert.equal(adapted.canvas.height, 1920);
  assert.equal(adapted.canvas.aspectRatio, '9:16');
  assert.ok(compositeUrl.startsWith('data:image/svg+xml;base64,'));

  // Stories UI safe zones:
  // Top 250px buffer: 250 / 1920 = 0.1302
  // Bottom 350px buffer: 350 / 1920 = 0.1823 -> maxY = 1.0 - 0.1823 = 0.8177
  const minSafeY = 250 / 1920;
  const maxSafeY = (1920 - 350) / 1920;

  const headline = adapted.layers.find((l) => l.type === 'headline');
  const subhead = adapted.layers.find((l) => l.id === 'layer-subheadline');
  const cta = adapted.layers.find((l) => l.type === 'cta');
  const logo = adapted.layers.find((l) => l.type === 'logo');
  const badge = adapted.layers.find((l) => l.type === 'badge');
  const product = adapted.layers.find((l) => l.type === 'product');

  // Assert all interactive and copy elements are strictly within safe vertical area
  assert.ok(headline, 'Headline layer must exist');
  assert.ok(headline.position.y >= minSafeY, `Headline y (${headline.position.y}) must be >= ${minSafeY}`);

  assert.ok(logo, 'Logo layer must exist');
  assert.ok(logo.position.y >= minSafeY, `Logo y (${logo.position.y}) must be >= ${minSafeY}`);

  assert.ok(badge, 'Badge layer must exist');
  assert.ok(badge.position.y >= minSafeY, `Badge y (${badge.position.y}) must be >= ${minSafeY}`);

  assert.ok(cta, 'CTA layer must exist');
  const ctaBottom = cta.position.y + cta.position.height;
  assert.ok(ctaBottom <= maxSafeY, `CTA bottom (${ctaBottom}) must be <= ${maxSafeY}`);

  if (subhead) {
    const subheadBottom = subhead.position.y + subhead.position.height;
    assert.ok(subhead.position.y >= minSafeY && subheadBottom <= maxSafeY);
  }

  // Product is centered in the mid-focal zone
  assert.ok(product, 'Product layer must exist');
  assert.ok(product.position.y >= 0.35 && product.position.y <= 0.45);
});

test('creativeAdapter: adapts 1:1 master creative to 1.91:1 Landscape using intelligent side-by-side reflow', () => {
  const masterDoc = createSample1x1MasterDocument();
  const res = adaptCreativeDocument(masterDoc, '1.91:1');

  const { document: adapted } = res;

  // Canvas dimensions
  assert.equal(adapted.canvas.width, 1200);
  assert.equal(adapted.canvas.height, 628);
  assert.equal(adapted.canvas.aspectRatio, '1.91:1');

  const headline = adapted.layers.find((l) => l.type === 'headline')!;
  const cta = adapted.layers.find((l) => l.type === 'cta')!;
  const product = adapted.layers.find((l) => l.type === 'product')!;

  // INVARIANT: Wide format must NOT be a naive centered stack.
  // Product is reflowed to the right half; Copy and CTA are stacked on the left half.
  assert.ok(headline.position.x < 0.20, 'Headline must be positioned in the left column');
  assert.ok(headline.position.width <= 0.50, 'Headline width must not cross into product column');

  assert.ok(cta.position.x < 0.20, 'CTA must be positioned in the left column');

  assert.ok(product.position.x >= 0.50, 'Product must be reflowed to the right column');
  assert.ok(product.position.width >= 0.35, 'Product must maintain prominent scale in the right column');
});

test('creativeAdapter: adaptMasterCreativeToAllFormats produces all 4 placement formats', () => {
  const masterDoc = createSample1x1MasterDocument();
  const allFormats = adaptMasterCreativeToAllFormats(masterDoc);

  assert.ok(allFormats['1:1']);
  assert.ok(allFormats['4:5']);
  assert.ok(allFormats['9:16']);
  assert.ok(allFormats['1.91:1']);

  assert.equal(allFormats['1:1'].document.canvas.width, 1080);
  assert.equal(allFormats['1:1'].document.canvas.height, 1080);

  assert.equal(allFormats['4:5'].document.canvas.width, 1080);
  assert.equal(allFormats['4:5'].document.canvas.height, 1350);

  assert.equal(allFormats['9:16'].document.canvas.width, 1080);
  assert.equal(allFormats['9:16'].document.canvas.height, 1920);

  assert.equal(allFormats['1.91:1'].document.canvas.width, 1200);
  assert.equal(allFormats['1.91:1'].document.canvas.height, 628);
});

// ---------------------------------------------------------------------------
// 2. Meta Copy & Ad Package Generation Tests
// ---------------------------------------------------------------------------

test('metaPackageGenerator: generates copy package meeting Meta character length constraints', () => {
  const copyPkg = generateMetaCopyPackage({
    brand: MOCK_BRAND,
    conceptHeadline: 'Transform Your Complexion With Pure Botanical Radiance Oil',
    conceptSubheadline: 'Enriched with cold-pressed rosehip seed oil and organic vitamin C.',
    conceptCta: 'Shop Radiance Elixir',
    pillar: 'Problem-Solution',
    offer: '20% OFF DIWALI',
  });

  // Primary Text: 3 variations, <= 250 characters
  assert.equal(copyPkg.primaryText.length, 3);
  for (const pt of copyPkg.primaryText) {
    assert.ok(pt.length > 20, 'Primary text must not be empty');
    assert.ok(pt.length <= 250, `Primary text length (${pt.length}) exceeds Meta 250 char limit`);
  }

  // Headlines: 3 variations, <= 40 characters
  assert.equal(copyPkg.headlines.length, 3);
  for (const h of copyPkg.headlines) {
    assert.ok(h.length > 5, 'Headline must not be empty');
    assert.ok(h.length <= 40, `Headline length (${h.length}) exceeds Meta 40 char limit: "${h}"`);
  }

  // Descriptions: 3 variations, <= 30 characters
  assert.equal(copyPkg.descriptions.length, 3);
  for (const d of copyPkg.descriptions) {
    assert.ok(d.length > 3, 'Description must not be empty');
    assert.ok(d.length <= 30, `Description length (${d.length}) exceeds Meta 30 char limit: "${d}"`);
  }

  // CTA resolution
  assert.equal(copyPkg.callToAction, 'GET_OFFER');
});

test('metaPackageGenerator: resolves appropriate Meta CTA based on offer and angle', () => {
  assert.equal(resolveMetaCta('50% OFF TODAY'), 'GET_OFFER');
  assert.equal(resolveMetaCta(undefined, 'Direct Response', 'Order Today'), 'ORDER_NOW');
  assert.equal(resolveMetaCta(undefined, 'Educational', 'Read How It Works'), 'LEARN_MORE');
  assert.equal(resolveMetaCta(undefined, 'Brand Hook', 'Explore Collection'), 'SHOP_NOW');
});

// ---------------------------------------------------------------------------
// 3. ZIP Archive Export Tests
// ---------------------------------------------------------------------------

test('zipWriter: creates valid compressed PKZIP buffer with CRC32 verification', () => {
  const zip = new SimpleZipBuilder();
  zip.addFile('hello.txt', 'Hello, ZeperAI Campaign Studio V2!');
  zip.addFile('subfolder/data.json', JSON.stringify({ status: 'ok', count: 42 }));

  const buf = zip.toBuffer();

  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 60);

  // Assert PKZIP local file header signature: 0x04034b50 (little endian 'PK\x03\x04')
  assert.equal(buf.readUInt32LE(0), 0x04034b50);

  // Assert CRC32 computation works deterministically
  const testData = Buffer.from('123456789', 'utf-8');
  assert.equal(computeCrc32(testData), 0xcbf43926); // Standard CRC32 check value
});

test('exportArchive: builds comprehensive Meta Ad Package ZIP containing all 4 formats, copy sheet, and summary', async () => {
  const masterDoc = createSample1x1MasterDocument();
  const pkg = buildMetaCampaignPackage({
    run: MOCK_RUN,
    brand: MOCK_BRAND,
    prompts: [
      {
        conceptId: 'concept-1',
        headline: 'Awaken Your Inner Radiance',
        subheadline: 'Pure organic botanicals.',
        cta: 'Shop Now',
        aspectRatio: '1:1',
        imagePrompt: 'Clean studio background',
        pillar: 'Feature Spotlight',
      },
    ],
    assets: [
      {
        id: 'asset-1',
        run_id: MOCK_RUN.id,
        creative_index: 1,
        version: 1,
        status: 'ready',
        aspect_ratio: '1:1',
        image_url: 'https://images.example.com/auraglow.jpg',
        overlay: {
          document: masterDoc,
          headline: 'Awaken Your Inner Radiance',
          subheading: 'Pure organic botanicals.',
          cta: 'Shop Now',
          evaluation: {
            creativeId: 'concept-1',
            totalScore: 94,
            status: 'ready_for_review',
            scores: {
              visualPolish: 95,
              brandConsistency: 92,
              typographyReadability: 96,
              messageHierarchy: 94,
              conversionPotential: 93,
            } as unknown as CreativeQualityScores,
            issues: [],
            hardRuleFailures: [],
            passed: true,
            evaluatedAt: new Date().toISOString(),
          },
        },
        credits_charged: 1,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as CampaignAsset,
    ],
  });

  assert.equal(pkg.concepts.length, 1);
  assert.ok(pkg.concepts[0].variations['1:1']);
  assert.ok(pkg.concepts[0].variations['4:5']);
  assert.ok(pkg.concepts[0].variations['9:16']);
  assert.ok(pkg.concepts[0].variations['1.91:1']);

  // Build copy sheet text
  const copySheetText = buildMetaCopySheetText(pkg);
  assert.match(copySheetText, /ZEPERAI CAMPAIGN STUDIO V2 — META ADS COPY SHEET/);
  assert.match(copySheetText, /AuraGlow Organics/);
  assert.match(copySheetText, /PRIMARY TEXT OPTIONS/);
  assert.match(copySheetText, /HEADLINES/);
  assert.match(copySheetText, /HOW TO DEPLOY IN META ADS MANAGER/);

  // Build ZIP buffer
  const zipBuffer = await buildMetaAdPackageZip(pkg);
  assert.ok(Buffer.isBuffer(zipBuffer));
  assert.ok(zipBuffer.length > 500);
  assert.equal(zipBuffer.readUInt32LE(0), 0x04034b50);
});
