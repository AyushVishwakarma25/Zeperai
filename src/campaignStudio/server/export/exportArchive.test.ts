/**
 * CAMPAIGN STUDIO V2 - Export Archive & Raster Generation Unit Tests.
 *
 * Verifies raster image rendering (PNG, JPEG), vector SVG preservation,
 * exact aspect ratio dimensions (1:1, 4:5, 9:16, 1.91:1), opaque background guarantees,
 * canonical folder naming consistency, manifest generation, quality gate filtering,
 * and ZIP64 archive structure.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import type {
  BrandContext,
  CampaignAsset,
  CampaignRun,
  CreativeDocument,
  CreativeQualityScores,
  MetaCampaignPackage,
  StandardAspectRatio,
} from '../../types.js';
import { adaptMasterCreativeToAllFormats } from '../adaptation/creativeAdapter.js';
import { buildMetaCampaignPackage } from './metaPackageGenerator.js';
import {
  buildMetaAdPackageZip,
  buildMetaCopySheetText,
  getExportAssetFilename,
  getExportAssetPath,
  getPlacementFolder,
  isCreativeApproved,
} from './exportArchive.js';
import { renderSvgToRasterBuffers, validateRasterBuffer } from './rasterRenderer.js';
import { SimpleZipBuilder } from './zipWriter.js';

const MOCK_BRAND: BrandContext = {
  brandName: 'Nordic Ember',
  domain: 'nordicember.com',
  category: 'Clean Living & Home',
  audience: {
    primary: 'Design-conscious urban homeowners',
    painPoints: ['Cluttered aesthetics', 'Harsh artificial fragrances'],
    desires: ['Minimalist organic ambiance', 'Natural scenting'],
  },
  usps: ['100% soy wax with wooden wicks', 'Crafted in small batches'],
  voice: {
    tone: ['Artisanal', 'Warm', 'Refined'],
    doSay: ['glow', 'serene', 'craft'],
    dontSay: ['cheap', 'discount', 'flashy'],
  },
  visualIdentity: {
    colors: [
      { hex: '#1C1917', name: 'Charcoal' },
      { hex: '#D97706', name: 'Amber' },
      { hex: '#F5F5F4', name: 'Stone Warm' },
    ],
    typography: 'Inter',
  },
  products: [
    {
      name: 'Smoked Cedar Soy Candle',
      description: 'Hand-poured artisan candle with crackling wooden wick',
      priceHint: '$38',
    },
  ],
} as unknown as BrandContext;

const MOCK_RUN: CampaignRun = {
  id: 'run-nordic-test-8899',
  user_id: 'user-unit-test',
  website_url: 'https://nordicember.com',
  goal: 'Drive high-converting sales for Nordic Ember soy candles',
  goal_notes: null,
  status: 'active',
  current_step: 'creatives',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as unknown as CampaignRun;

function createSample1x1MasterDoc(): CreativeDocument {
  return {
    id: 'doc-nordic-master',
    conceptId: 'concept-1',
    version: 1,
    advertisingFormat: 'Feature Spotlight',
    designIntensity: 'editorial_minimal',
    canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
    layers: [
      {
        id: 'layer-bg',
        name: 'Background',
        type: 'background',
        zIndex: 0,
        position: { x: 0, y: 0, width: 1, height: 1 },
        styles: { backgroundColor: '#1C1917' },
      },
      {
        id: 'layer-headline',
        name: 'Headline',
        type: 'text',
        zIndex: 10,
        position: { x: 0.08, y: 0.12, width: 0.84, height: 0.16 },
        content: 'Crafted for Serene Evenings',
        styles: { color: '#F5F5F4', fontSize: '46px', fontWeight: 800, fontFamily: 'Inter' },
      },
      {
        id: 'layer-badge',
        name: 'Badge',
        type: 'badge',
        zIndex: 15,
        position: { x: 0.08, y: 0.72, width: 0.44, height: 0.06 },
        content: '100% Soy Wax • Wooden Wick',
        styles: { backgroundColor: '#D97706', color: '#1C1917', fontWeight: 700 },
      },
      {
        id: 'layer-cta',
        name: 'CTA',
        type: 'cta',
        zIndex: 20,
        position: { x: 0.08, y: 0.82, width: 0.4, height: 0.07 },
        content: 'Shop Now',
        styles: { backgroundColor: '#D97706', color: '#1C1917', fontWeight: 800 },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 1. Canonical Naming & Folder Consistency
// ---------------------------------------------------------------------------

test('exportArchive: getPlacementFolder produces consistent canonical folders for all ratios', () => {
  assert.equal(getPlacementFolder('1:1'), '1x1');
  assert.equal(getPlacementFolder('4:5'), '4x5');
  assert.equal(getPlacementFolder('9:16'), '9x16');
  assert.equal(getPlacementFolder('1.91:1'), '1_91x1');
});

test('exportArchive: getExportAssetFilename and getExportAssetPath build uniform filenames and paths', () => {
  const filename = getExportAssetFilename({
    conceptIndex: 1,
    conceptTitle: 'Smoked Cedar: Serene Evenings!',
    width: 1080,
    height: 1080,
    extension: 'png',
  });
  assert.equal(filename, 'concept_1_smoked_cedar_serene_evenings_1080x1080.png');

  const path = getExportAssetPath({
    aspectRatio: '1.91:1',
    conceptIndex: 2,
    conceptTitle: 'Artisan Glow',
    width: 1200,
    height: 628,
    extension: 'jpg',
  });
  assert.equal(path, '1_91x1/concept_2_artisan_glow_1200x628.jpg');
});

// ---------------------------------------------------------------------------
// 2. Raster Image Rendering & Multi-Factor QA Validation
// ---------------------------------------------------------------------------

test('rasterRenderer: renders SVG to exact dimensions and passes opaque background QA', async () => {
  const masterDoc = createSample1x1MasterDoc();
  const variations = adaptMasterCreativeToAllFormats(masterDoc);

  const testSpecs: Array<{ ratio: StandardAspectRatio; width: number; height: number }> = [
    { ratio: '1:1', width: 1080, height: 1080 },
    { ratio: '4:5', width: 1080, height: 1350 },
    { ratio: '9:16', width: 1080, height: 1920 },
    { ratio: '1.91:1', width: 1200, height: 628 },
  ];

  for (const spec of testSpecs) {
    const variation = variations[spec.ratio];
    assert.ok(variation, `Variation for ${spec.ratio} must exist`);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <rect width="100%" height="100%" fill="#1C1917" />
  <circle cx="${spec.width / 2}" cy="${spec.height / 2}" r="${Math.min(spec.width, spec.height) / 4}" fill="#D97706" />
  <text x="50" y="100" fill="#FFFFFF" font-size="36" font-family="sans-serif">Nordic Ember Test ${spec.ratio}</text>
</svg>`;

    const raster = await renderSvgToRasterBuffers(svg, {
      width: spec.width,
      height: spec.height,
      backgroundColor: '#1C1917',
      jpegQuality: 85,
      requireOpaque: true,
    });

    // Check PNG
    assert.ok(Buffer.isBuffer(raster.png));
    assert.equal(raster.png[0], 0x89);
    assert.equal(raster.png[1], 0x50);
    assert.equal(raster.png[2], 0x4e);
    assert.equal(raster.png[3], 0x47);
    assert.equal(raster.validation.png.valid, true);
    assert.equal(raster.validation.png.width, spec.width);
    assert.equal(raster.validation.png.height, spec.height);
    assert.equal(raster.validation.png.mimeType, 'image/png');
    assert.equal(raster.validation.png.checks.opaqueBackground, true);

    // Check JPEG
    assert.ok(Buffer.isBuffer(raster.jpeg));
    assert.equal(raster.jpeg[0], 0xff);
    assert.equal(raster.jpeg[1], 0xd8);
    assert.equal(raster.jpeg[2], 0xff);
    assert.equal(raster.validation.jpeg.valid, true);
    assert.equal(raster.validation.jpeg.width, spec.width);
    assert.equal(raster.validation.jpeg.height, spec.height);
    assert.equal(raster.validation.jpeg.mimeType, 'image/jpeg');
    assert.equal(raster.validation.jpeg.checks.opaqueBackground, true);
  }
});

test('rasterRenderer: catches dimension, format, and transparency violations correctly', async () => {
  // Create a transparent 100x100 PNG
  const transparentPng = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  const failCheck = await validateRasterBuffer(transparentPng, {
    width: 200, // expected 200, got 100
    height: 200,
    format: 'png',
    requireOpaque: true,
  });

  assert.equal(failCheck.valid, false);
  assert.equal(failCheck.checks.correctDimensions, false);
  assert.equal(failCheck.checks.opaqueBackground, false);
  assert.ok(failCheck.errors.some((e) => e.includes('Dimension mismatch')));
  assert.ok(failCheck.errors.some((e) => e.includes('transparent')));
});

// ---------------------------------------------------------------------------
// 3. Quality Gate Filtering (Exclude Unverified Creatives)
// ---------------------------------------------------------------------------

test('exportArchive: isCreativeApproved detects passed vs failed vs unverified creatives', () => {
  const verifiedConcept: any = {
    conceptId: 'c1',
    evaluation: {
      passed: true,
      totalScore: 92,
      status: 'ready_for_review',
      hardRuleFailures: [],
    },
  };
  assert.equal(isCreativeApproved(verifiedConcept).approved, true);

  const unverifiedConcept: any = {
    conceptId: 'c2',
    // evaluation missing
  };
  assert.equal(isCreativeApproved(unverifiedConcept).approved, false);
  assert.match(isCreativeApproved(unverifiedConcept).reason || '', /Unverified/);

  const failedConcept: any = {
    conceptId: 'c3',
    evaluation: {
      passed: false,
      totalScore: 45,
      status: 'needs_improvement',
      hardRuleFailures: ['Headline contrast ratio 2.1:1 fails WCAG AA minimum 4.5:1'],
    },
  };
  assert.equal(isCreativeApproved(failedConcept).approved, false);
  assert.match(isCreativeApproved(failedConcept).reason || '', /Quality evaluation failed/);
});

test('exportArchive: excludes failed/unverified creatives by default and allows override', async () => {
  const masterDoc = createSample1x1MasterDoc();
  const pkg = buildMetaCampaignPackage({
    run: MOCK_RUN,
    brand: MOCK_BRAND,
    prompts: [
      {
        conceptId: 'concept-1',
        headline: 'Nordic Glow Unverified',
        cta: 'Shop Now',
        aspectRatio: '1:1',
        imagePrompt: 'Studio shot',
        pillar: 'Feature Spotlight',
      },
    ],
    assets: [
      {
        id: 'asset-1',
        user_id: 'user-unit-test',
        run_id: MOCK_RUN.id,
        creative_index: 1,
        version: 1,
        status: 'ready',
        aspect_ratio: '1:1',
        image_url: 'https://images.example.com/candle.jpg',
        storage_path: 'campaigns/asset-1.png',
        prompt: 'Studio shot',
        model: 'imagen-3.0',
        overlay: {
          document: masterDoc,
          // No evaluation provided -> unverified
        },
        credits_charged: 1,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as CampaignAsset,
    ],
  });

  // Default call without allowUnverified should throw because concept is unverified
  await assert.rejects(
    async () => {
      await buildMetaAdPackageZip(pkg);
    },
    (err: Error) => {
      return err.message.includes('all 1 creatives are unverified or failed quality evaluation');
    },
  );

  // Calling with { allowUnverified: true } succeeds and records override warnings
  const zipWithOverride = await buildMetaAdPackageZip(pkg, { allowUnverified: true });
  assert.ok(Buffer.isBuffer(zipWithOverride));
  assert.ok(zipWithOverride.length > 1000);
  assert.equal(zipWithOverride.readUInt32LE(0), 0x04034b50);
});

// ---------------------------------------------------------------------------
// 4. Complete Package Archive: SVG + PNG + JPEG + Manifest + Copy Sheet
// ---------------------------------------------------------------------------

test('exportArchive: builds complete archive with 12 assets per approved concept and verified manifest', async () => {
  const masterDoc = createSample1x1MasterDoc();
  const pkg = buildMetaCampaignPackage({
    run: MOCK_RUN,
    brand: MOCK_BRAND,
    prompts: [
      {
        conceptId: 'concept-1',
        headline: 'Crafted for Serene Evenings',
        subheadline: 'Pure natural soy wax.',
        cta: 'Shop Now',
        aspectRatio: '1:1',
        imagePrompt: 'Minimalist living room with candle',
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
        image_url: 'https://images.example.com/candle.jpg',
        overlay: {
          document: masterDoc,
          headline: 'Crafted for Serene Evenings',
          subheading: 'Pure natural soy wax.',
          cta: 'Shop Now',
          evaluation: {
            creativeId: 'concept-1',
            totalScore: 95,
            status: 'ready_for_review',
            scores: {
              visualPolish: 96,
              brandConsistency: 95,
              typographyReadability: 94,
              messageHierarchy: 95,
              conversionPotential: 95,
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

  const zipBuffer = await buildMetaAdPackageZip(pkg);
  assert.ok(Buffer.isBuffer(zipBuffer));
  assert.equal(zipBuffer.readUInt32LE(0), 0x04034b50);

  // Read zip contents by parsing local headers
  let offset = 0;
  const fileNames: string[] = [];
  while (offset + 30 < zipBuffer.length) {
    const sig = zipBuffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break; // Reached central directory

    const nameLen = zipBuffer.readUInt16LE(offset + 26);
    const extraLen = zipBuffer.readUInt16LE(offset + 28);
    const compSize = zipBuffer.readUInt32LE(offset + 18);

    const name = zipBuffer.toString('utf-8', offset + 30, offset + 30 + nameLen);
    fileNames.push(name);

    offset += 30 + nameLen + extraLen + compSize;
  }

  // Check essential documentation and manifest files
  assert.ok(fileNames.includes('manifest.json'), 'ZIP must include manifest.json');
  assert.ok(fileNames.includes('campaign-summary.json'), 'ZIP must include campaign-summary.json');
  assert.ok(fileNames.includes('copy-sheet.txt'), 'ZIP must include copy-sheet.txt');
  assert.ok(fileNames.includes('README.txt'), 'ZIP must include README.txt');

  // Check that all 4 canonical folders contain SVG, PNG, and JPG files
  const expectedFolders = ['1x1/', '4x5/', '9x16/', '1_91x1/'];
  for (const folder of expectedFolders) {
    const folderFiles = fileNames.filter((f) => f.startsWith(folder));
    assert.ok(folderFiles.length >= 3, `Folder ${folder} should contain at least 3 files (.svg, .png, .jpg)`);
    assert.ok(folderFiles.some((f) => f.endsWith('.svg')), `Folder ${folder} must contain .svg`);
    assert.ok(folderFiles.some((f) => f.endsWith('.png')), `Folder ${folder} must contain .png`);
    assert.ok(folderFiles.some((f) => f.endsWith('.jpg')), `Folder ${folder} must contain .jpg`);
  }

  // Verify copy sheet text
  const copySheetText = buildMetaCopySheetText(pkg);
  assert.match(copySheetText, /Nordic Ember/);
  assert.match(copySheetText, /1x1\//);
  assert.match(copySheetText, /4x5\//);
  assert.match(copySheetText, /9x16\//);
  assert.match(copySheetText, /1_91x1\//);
  assert.match(copySheetText, /\.png \(also \.jpg, \.svg\)/);
});

// ---------------------------------------------------------------------------
// 5. ZIP64 Architecture Support
// ---------------------------------------------------------------------------

test('zipWriter: creates standard ZIP when within limits and ZIP64 structures when forceZip64 is true', () => {
  const builderStandard = new SimpleZipBuilder();
  builderStandard.addFile('test.txt', 'Hello Standard ZIP');
  const bufStandard = builderStandard.toBuffer();

  assert.equal(bufStandard.readUInt32LE(0), 0x04034b50); // Local header
  // Standard EOCD signature is at bufStandard.length - 22
  assert.equal(bufStandard.readUInt32LE(bufStandard.length - 22), 0x06054b50);

  // Now test ZIP64 output
  const builderZip64 = new SimpleZipBuilder();
  builderZip64.addFile('test-zip64.txt', 'Hello ZIP64 archive');
  const bufZip64 = builderZip64.toBuffer({ forceZip64: true });

  assert.equal(bufZip64.readUInt32LE(0), 0x04034b50); // Local header
  // Structure ending: ZIP64 EOCD (56 bytes) + ZIP64 Locator (20 bytes) + EOCD (22 bytes) = 98 bytes total tail
  const tailOffset = bufZip64.length - (56 + 20 + 22);
  const zip64EocdSig = bufZip64.readUInt32LE(tailOffset);
  const zip64LocatorSig = bufZip64.readUInt32LE(tailOffset + 56);
  const standardEocdSig = bufZip64.readUInt32LE(tailOffset + 56 + 20);

  assert.equal(zip64EocdSig, 0x06064b50, 'Must contain ZIP64 End of Central Directory signature');
  assert.equal(zip64LocatorSig, 0x07064b50, 'Must contain ZIP64 Locator signature');
  assert.equal(standardEocdSig, 0x06054b50, 'Must contain standard End of Central Directory signature');
});

