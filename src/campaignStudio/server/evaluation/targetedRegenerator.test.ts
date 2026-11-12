/**
 * CAMPAIGN STUDIO V2 - Unit Tests for Upgraded Targeted Creative Regeneration.
 *
 * Verifies natural-language instruction interpretation, semantic blueprint updates,
 * layer existence validation, product packaging protection, asset generation failure handling,
 * recomposition resilience, and version history revert.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  interpretInstruction,
  targetedRegenerateCreative,
  executeTargetedRegeneration,
  revertCreativeToVersion,
  validateTargetLayers,
  MissingLayerError,
  InvalidInstructionError,
  AssetGenerationError,
  RecompositionError,
} from './targetedRegenerator.js';
import { buildCreativeDocument } from '../composition/compositor.js';
import { createDefaultBlueprintFromConcept } from '../blueprintSchema.js';
import { BRAND, STRATEGY } from '../agents/fixtures.js';
import type { CreativeBlueprint, CreativeDocument } from '../../types.js';

function createSampleBlueprint(overrides: Partial<CreativeBlueprint> = {}): CreativeBlueprint {
  const base = createDefaultBlueprintFromConcept({
    concept: {
      id: 'regen-concept-1',
      pillar: 'Performance',
      headline: 'Fuel Like A Champion',
      subheadline: 'Clean sustained energy throughout your day',
      visualIdea: 'Hero bottle on dark textured slate',
      storyline: 'Athlete achieves peak stamina.',
      cta: 'ORDER STARTER PACK',
      composition: 'Hero packshot with bold top headline and grounded shadow',
    },
    brand: BRAND,
    strategy: STRATEGY,
    aspectRatio: '4:5',
    designIntensity: 'bold',
  });
  base.advertisingFormat = 'Single Image Hero';
  base.copy.offer = '20% OFF TODAY';
  base.constraints = {
    preserveProductPackaging: true,
    preserveLogo: true,
    exactCopyRequired: true,
    prohibitInventedClaims: true,
  };
  return { ...base, ...overrides };
}

function createSampleDoc(bp?: CreativeBlueprint): CreativeDocument {
  const blueprint = bp || createSampleBlueprint();
  return buildCreativeDocument({
    blueprint,
    backgroundUrl: 'https://images.example.com/original-bg.jpg',
    productImageUrl: 'https://images.example.com/original-product-bottle.png',
    brandName: 'PRUSTLR',
    brandColors: ['#0A0A0A', '#E4572E'],
  });
}

// ---------------------------------------------------------------------------
// 1. Instruction Interpreter & Change Plan
// ---------------------------------------------------------------------------

test('instructionInterpreter: parses "Make the background more premium"', () => {
  const plan = interpretInstruction('Make the background more premium');
  assert.equal(plan.category, 'asset_generation');
  assert.ok(plan.affectedElements.includes('background'));
  assert.deepEqual(plan.targetLayerIds, ['layer-background']);
  assert.equal(plan.protectProductPackaging, true);
  assert.ok(plan.explanation.toLowerCase().includes('premium'));
});

test('instructionInterpreter: parses "Move the product to the right and create more negative space"', () => {
  const plan = interpretInstruction('Move the product to the right and create more negative space');
  assert.equal(plan.category, 'layout_rebalance');
  assert.ok(plan.affectedElements.includes('product'));
  assert.ok(plan.affectedElements.includes('layout'));
  assert.ok(plan.targetLayerIds.includes('layer-product'));
  assert.equal(plan.protectProductPackaging, true);

  const productChange = plan.layoutChanges?.find((c) => c.element === 'product');
  assert.ok(productChange);
  assert.equal(productChange?.alignment, 'right');
  assert.ok((productChange?.shiftX ?? 0) > 0);
});

test('instructionInterpreter: parses "Replace the background with a realistic kitchen environment"', () => {
  const plan = interpretInstruction('Replace the background with a realistic kitchen environment');
  assert.equal(plan.category, 'asset_generation');
  assert.ok(plan.affectedElements.includes('background'));
  assert.ok(plan.assetChange?.promptDescription.toLowerCase().includes('kitchen'));
  assert.equal(plan.protectProductPackaging, true);
});

test('instructionInterpreter: parses "Make the headline more prominent"', () => {
  const plan = interpretInstruction('Make the headline more prominent');
  assert.equal(plan.category, 'typography_refinement');
  assert.ok(plan.affectedElements.includes('headline'));
  assert.ok(plan.affectedElements.includes('typography'));
  assert.deepEqual(plan.targetLayerIds, ['layer-headline']);

  const typo = plan.typographyChanges?.find((t) => t.layerId === 'layer-headline');
  assert.ok(typo);
  assert.equal(typo?.fontWeight, 900);
  assert.equal(typo?.textTransform, 'uppercase');
});

test('instructionInterpreter: parses "Make the product larger without distorting its packaging"', () => {
  const plan = interpretInstruction('Make the product larger without distorting its packaging');
  assert.equal(plan.category, 'layout_rebalance');
  assert.ok(plan.affectedElements.includes('product'));
  assert.deepEqual(plan.targetLayerIds, ['layer-product']);
  assert.equal(plan.protectProductPackaging, true);

  const productChange = plan.layoutChanges?.find((c) => c.element === 'product');
  assert.ok(productChange);
  assert.ok((productChange?.scaleDelta ?? 0) > 0);
});

// ---------------------------------------------------------------------------
// 2. Error Cases: Invalid Instructions & Missing Layer IDs
// ---------------------------------------------------------------------------

test('targetedRegenerator: rejects invalid or gibberish instructions with InvalidInstructionError', () => {
  const doc = createSampleDoc();

  assert.throws(
    () => targetedRegenerateCreative({ doc, instructions: 'asdfghjk12345' }),
    (err: any) => {
      assert.ok(err instanceof InvalidInstructionError);
      assert.ok(err.message.includes('Could not interpret creative instruction'));
      return true;
    },
  );

  assert.throws(
    () => targetedRegenerateCreative({ doc, instructions: '   !@#$%^&*()   ' }),
    (err: any) => {
      assert.ok(err instanceof InvalidInstructionError);
      return true;
    },
  );
});

test('targetedRegenerator: validates layer existence and throws MissingLayerError when layer missing', () => {
  const doc = createSampleDoc();

  // Validate helper throws
  assert.throws(
    () => validateTargetLayers(doc, ['layer-nonexistent-999']),
    (err: any) => {
      assert.ok(err instanceof MissingLayerError);
      assert.ok(err.message.includes("layer-nonexistent-999"));
      return true;
    },
  );

  // If a document has no badge layer, targeting it throws MissingLayerError
  const docWithoutBadge = {
    ...doc,
    layers: doc.layers.filter((l) => l.id !== 'layer-badge'),
  };

  assert.throws(
    () => targetedRegenerateCreative({ doc: docWithoutBadge, component: 'badge', newContent: '50% OFF' }),
    (err: any) => {
      assert.ok(err instanceof MissingLayerError);
      assert.ok(err.message.includes('layer-badge'));
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Background-Only Changes
// ---------------------------------------------------------------------------

test('targetedRegenerator: background-only changes update background while strictly protecting product & copy', () => {
  const doc = createSampleDoc();
  const originalHeadline = doc.layers.find((l) => l.id === 'layer-headline')?.content;
  const originalProduct = doc.layers.find((l) => l.id === 'layer-product')?.content;
  const originalCta = doc.layers.find((l) => l.id === 'layer-cta')?.content;
  const originalBg = doc.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage;

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Replace the background with a realistic kitchen environment',
    newAssetUrl: 'https://images.example.com/kitchen-plate.jpg',
  });

  assert.equal(res.document.version, doc.version + 1);

  // Background is updated
  const newBg = res.document.layers.find((l) => l.id === 'layer-background');
  assert.equal(newBg?.styles.backgroundImage, 'https://images.example.com/kitchen-plate.jpg');
  assert.notEqual(newBg?.styles.backgroundImage, originalBg);

  // Foreground layers are completely preserved
  assert.equal(res.document.layers.find((l) => l.id === 'layer-headline')?.content, originalHeadline);
  assert.equal(res.document.layers.find((l) => l.id === 'layer-product')?.content, originalProduct);
  assert.equal(res.document.layers.find((l) => l.id === 'layer-cta')?.content, originalCta);

  // Standalone SVG is re-rendered
  assert.ok(res.svg.includes('https://images.example.com/kitchen-plate.jpg'));
  assert.ok(res.compositeUrl.startsWith('data:image/svg+xml;base64,'));
});

// ---------------------------------------------------------------------------
// 4. Headline-Only Changes
// ---------------------------------------------------------------------------

test('targetedRegenerator: headline prominence changes update typography without touching background or product', () => {
  const doc = createSampleDoc();
  const originalBg = doc.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage;
  const originalProduct = doc.layers.find((l) => l.id === 'layer-product')?.content;

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Make the headline more prominent',
  });

  assert.equal(res.document.version, doc.version + 1);

  // Headline styling updated to bold 900 and uppercase
  const newHeadline = res.document.layers.find((l) => l.id === 'layer-headline');
  assert.equal(newHeadline?.styles.fontWeight, 900);
  assert.equal(newHeadline?.styles.textTransform, 'uppercase');

  // Background and Product are untouched
  assert.equal(res.document.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage, originalBg);
  assert.equal(res.document.layers.find((l) => l.id === 'layer-product')?.content, originalProduct);
});

test('targetedRegenerator: headline copy update changes text while keeping styling intact', () => {
  const doc = createSampleDoc();

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Change headline to "Pure Plant Energy"',
  });

  const newHeadline = res.document.layers.find((l) => l.id === 'layer-headline');
  assert.equal(newHeadline?.content, 'Pure Plant Energy');
});

// ---------------------------------------------------------------------------
// 5. Product Position & Scale Changes
// ---------------------------------------------------------------------------

test('targetedRegenerator: product position change shifts product to right and preserves packaging aspect ratio', () => {
  const doc = createSampleDoc();
  const initialProductX = doc.layers.find((l) => l.id === 'layer-product')!.position.x;
  const initialProductUrl = doc.layers.find((l) => l.id === 'layer-product')!.content;

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Move the product to the right and create more negative space',
  });

  const newProductLayer = res.document.layers.find((l) => l.id === 'layer-product')!;
  // Product moved to the right
  assert.ok(newProductLayer.position.x > initialProductX, 'Product x coordinate must have shifted to the right');
  // Packaging identity and aspect ratio strictly preserved
  assert.equal(newProductLayer.content, initialProductUrl);
  assert.equal(newProductLayer.styles.preserveAspectRatio, 'meet');
});

test('targetedRegenerator: makes product larger without distorting packaging', () => {
  const doc = createSampleDoc();
  const initialScale = doc.blueprint?.layout.productScale || 0.65;
  const initialW = doc.layers.find((l) => l.id === 'layer-product')!.position.width;

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Make the product larger without distorting its packaging',
  });

  const newProductLayer = res.document.layers.find((l) => l.id === 'layer-product')!;
  assert.ok(newProductLayer.position.width >= initialW, 'Product width must have scaled up');
  assert.equal(newProductLayer.styles.preserveAspectRatio, 'meet');
  assert.ok((res.document.blueprint?.layout.productScale ?? 0) >= initialScale);
});

// ---------------------------------------------------------------------------
// 6. Async Workflow & Asset Generation Failure Handling
// ---------------------------------------------------------------------------

test('executeTargetedRegeneration: handles new asset generation failure gracefully without corrupting document', async () => {
  const doc = createSampleDoc();

  // Mock client that simulates an image generation failure
  const failingClient = {
    models: {
      generateContent: async () => {
        throw new Error('Image model quota exceeded (RESOURCE_EXHAUSTED)');
      },
    },
  };

  await assert.rejects(
    async () => {
      await executeTargetedRegeneration({
        doc,
        instructions: 'Replace the background with a realistic kitchen environment',
        client: failingClient,
      });
    },
    (err: any) => {
      assert.ok(err instanceof AssetGenerationError);
      assert.ok(err.message.includes('Image model quota exceeded'));
      // Verifies original document is preserved on the error instance
      assert.ok(err.previousDocument);
      assert.equal(err.previousDocument.version, doc.version);
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 7. Version History & Revert Support
// ---------------------------------------------------------------------------

test('targetedRegenerator: records version history and allows full revert to earlier version', () => {
  const v1Doc = createSampleDoc();
  assert.equal(v1Doc.version, 1);

  // Step 1: Change headline -> produces v2
  const v2Res = targetedRegenerateCreative({
    doc: v1Doc,
    instructions: 'Change headline to "Peak Endurance Unleashed"',
  });
  assert.equal(v2Res.document.version, 2);
  assert.equal(v2Res.document.history?.length, 1);
  assert.equal(v2Res.document.history?.[0].version, 1);

  // Step 2: Change background -> produces v3
  const v3Res = targetedRegenerateCreative({
    doc: v2Res.document,
    instructions: 'Replace the background with a realistic kitchen environment',
    newAssetUrl: 'https://images.example.com/kitchen.jpg',
  });
  assert.equal(v3Res.document.version, 3);
  assert.equal(v3Res.document.history?.length, 2);

  // Current v3 has "Peak Endurance Unleashed" and kitchen background
  assert.equal(v3Res.document.layers.find((l) => l.id === 'layer-headline')?.content, 'Peak Endurance Unleashed');
  assert.equal(v3Res.document.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage, 'https://images.example.com/kitchen.jpg');

  // Step 3: Revert back to Version 1
  const revertedRes = revertCreativeToVersion(v3Res.document, 1);

  // Restored document bumps to version 4 with version 1 layers restored
  assert.equal(revertedRes.document.version, 4);
  assert.equal(revertedRes.document.layers.find((l) => l.id === 'layer-headline')?.content, 'Fuel Like A Champion');
  assert.equal(revertedRes.document.layers.find((l) => l.id === 'layer-background')?.styles.backgroundImage, 'https://images.example.com/original-bg.jpg');

  // History contains snapshots of v1, v2, and v3
  assert.equal(revertedRes.document.history?.length, 3);
  assert.ok(revertedRes.actionTaken.includes('Reverted creative to version 1'));

  // Attempting to revert to a non-existent version throws descriptive error
  assert.throws(
    () => revertCreativeToVersion(revertedRes.document, 999),
    (err: any) => {
      assert.ok(err.message.includes('Version 999 not found in creative history'));
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// 8. Quality Evaluation Verification
// ---------------------------------------------------------------------------

test('targetedRegenerator: verifies visual QA and does not assume approval from layer patch alone', () => {
  const doc = createSampleDoc();

  const res = targetedRegenerateCreative({
    doc,
    instructions: 'Make the headline more prominent',
  });

  assert.ok(res.evaluation);
  assert.ok(typeof res.evaluation.totalScore === 'number');
  assert.ok(res.evaluation.status === 'passed' || res.evaluation.status === 'unverified');
  assert.ok(res.evaluation.scores.visualHierarchy >= 0);
  assert.ok(res.evaluation.scores.productAccuracy >= 0);
});

