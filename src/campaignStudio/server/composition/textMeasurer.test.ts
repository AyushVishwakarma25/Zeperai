/**
 * CAMPAIGN STUDIO V2 - Unit & Regression Tests for Phase 9:
 * Real Font Metrics, Resvg Native Measurement, Multilingual Support & Narrow Canvas Fit.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measureCharWidth,
  measureTextExactWithResvg,
  measureTextLayout,
  measureTextWidth,
  normalizeFontWeight,
  resolveFontCategory,
} from './textMeasurer.js';

test('textMeasurer: resolves font categories and normalizes numeric/string weights', () => {
  assert.equal(resolveFontCategory('Poppins'), 'geometric');
  assert.equal(resolveFontCategory('Inter'), 'neutral');
  assert.equal(resolveFontCategory('Playfair Display'), 'serif');
  assert.equal(resolveFontCategory('Bebas Neue'), 'condensed');

  assert.equal(normalizeFontWeight('bold'), 700);
  assert.equal(normalizeFontWeight('extra-bold'), 800);
  assert.equal(normalizeFontWeight('heavy'), 900);
  assert.equal(normalizeFontWeight('light'), 300);
  assert.equal(normalizeFontWeight(600), 600);
});

test('textMeasurer: Resvg native measurement captures weight differences and letter spacing', () => {
  const regular = measureTextExactWithResvg('Premium Organic Cold Brew', 'Poppins', 400, 36);
  const bold = measureTextExactWithResvg('Premium Organic Cold Brew', 'Poppins', 800, 36);

  assert.ok(regular.width > 0);
  assert.ok(bold.width > regular.width, `Bold weight (800) must measure wider than regular (400): ${bold.width} vs ${regular.width}`);

  const withSpacing = measureTextExactWithResvg('Premium Organic Cold Brew', 'Poppins', 800, 36, 4);
  assert.ok(withSpacing.width > bold.width, `Letter spacing (+4px) must increase total width: ${withSpacing.width} vs ${bold.width}`);
});

test('textMeasurer: accurately measures currency symbols across global locales', () => {
  const inr = measureTextWidth('₹1,499.00', { fontFamily: 'Poppins', fontWeight: 700, fontSize: 32 });
  const usd = measureTextWidth('$49.99', { fontFamily: 'Poppins', fontWeight: 700, fontSize: 32 });
  const eur = measureTextWidth('€39.50', { fontFamily: 'Poppins', fontWeight: 700, fontSize: 32 });
  const gbp = measureTextWidth('£29.00', { fontFamily: 'Poppins', fontWeight: 700, fontSize: 32 });

  assert.ok(inr > 0 && Number.isFinite(inr), 'INR currency must measure valid positive width');
  assert.ok(usd > 0 && Number.isFinite(usd), 'USD currency must measure valid positive width');
  assert.ok(eur > 0 && Number.isFinite(eur), 'EUR currency must measure valid positive width');
  assert.ok(gbp > 0 && Number.isFinite(gbp), 'GBP currency must measure valid positive width');
});

test('textMeasurer: multilingual copy (Devanagari, CJK, Cyrillic) measures non-zero dimensions', () => {
  const hindi = measureTextExactWithResvg('ताज़ा और 100% शुद्ध आयुर्वेदिक पोषण', 'Poppins', 700, 28);
  const japanese = measureTextExactWithResvg('最高品質のプレミアムオーガニック抹茶', 'Poppins', 700, 28);
  const cyrillic = measureTextExactWithResvg('100% натуральный органический продукт', 'Poppins', 700, 28);

  assert.ok(hindi.width > 100, `Hindi text width (${hindi.width}px) must be positive and non-trivial`);
  assert.ok(hindi.height > 0);
  assert.ok(japanese.width > 100, `Japanese text width (${japanese.width}px) must be positive and non-trivial`);
  assert.ok(cyrillic.width > 100, `Cyrillic text width (${cyrillic.width}px) must be positive and non-trivial`);
});

test('textMeasurer: handles long product names and unbreakable compound words gracefully', () => {
  const longName = 'UltraHydratingColdPressedVirginArganNutExtractFormulation';
  const layout = measureTextLayout(longName, {
    fontFamily: 'Poppins',
    fontWeight: 700,
    fontSize: 24,
    maxWidthPx: 300,
    maxLines: 4,
  });

  assert.ok(layout.lines.length >= 2, `Long compound word should be broken across lines when exceeding maxWidth: got ${layout.lines.length}`);
  for (const line of layout.lines) {
    const lineWidth = measureTextWidth(line, { fontFamily: 'Poppins', fontWeight: 700, fontSize: 24 });
    assert.ok(lineWidth <= 315, `Line "${line}" width (${lineWidth}px) must respect maxWidth boundary`);
  }
});

test('textMeasurer: narrow 9:16 Stories canvas wraps headlines within strict safe zones', () => {
  // In 9:16 (1080x1920), safe content width with 15% margins is ~750px
  const headline = 'Fuel Your Morning Workout With High Protein Plant Oats Delivered Today';
  const layout = measureTextLayout(headline, {
    fontFamily: 'Poppins',
    fontWeight: 800,
    fontSize: 44,
    maxWidthPx: 720,
    maxLines: 4,
  });

  assert.ok(layout.lines.length >= 2 && layout.lines.length <= 4, `Expected 2 to 4 lines for 9:16 layout, got ${layout.lines.length}`);
  assert.ok(layout.totalWidth <= 725, `Total width (${layout.totalWidth}px) must fit within safe zone (720px)`);
  assert.equal(layout.truncated, false, 'Headline must fit without truncation');
  assert.equal(layout.overflow, false, 'Layout must not overflow');
});

test('textMeasurer: CTA button fit and overflow detection', () => {
  const ctaLayout = measureTextLayout('Claim Your 50% Off Welcome Package Today', {
    fontFamily: 'Poppins',
    fontWeight: 800,
    fontSize: 20,
    maxWidthPx: 250,
    maxLines: 1,
  });

  assert.equal(ctaLayout.lines.length, 1);
  assert.equal(ctaLayout.truncated, true, 'Single-line CTA with long text should trigger truncation warning');
  assert.ok(ctaLayout.warnings.some((w) => w.includes('truncated')));
});
