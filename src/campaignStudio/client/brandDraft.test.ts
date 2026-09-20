import test from 'node:test';
import assert from 'node:assert/strict';
import type { BrandContext } from '../types.js';
import { parseBrandContext } from '../server/agents/brandAnalysis.js';
import { brandContextToDraft, draftToBrandContext, draftsDiffer, isValidHex, normalizeHex, splitList, validateDraft } from './brandDraft.js';

const BRAND: BrandContext = {
  brandName: 'Prustlr', website: 'https://prustlr.com/', category: 'Protein oats', summary: 'High-protein oats for busy people.', positioning: 'Breakfast without the fuss.',
  usps: ['20g protein per bowl', '2-minute prep'],
  products: [{ name: 'Choco Oats', description: 'Chocolate flavour', priceHint: 'INR 299', imageUrls: ['https://prustlr.com/choco.jpg'] }, { name: 'Berry Oats' }],
  audience: { primary: 'Busy urban professionals', secondary: 'Gym-goers', painPoints: ['skip breakfast'], desires: ['easy protein'] },
  voice: { tone: ['friendly', 'direct'], doSay: ['20g protein'], dontSay: ['miracle'] },
  visualIdentity: { colors: [{ name: 'Orange', hex: '#E4572E' }, { hex: '#2E86AB' }], typography: 'Bold sans', logoUrl: 'https://prustlr.com/logo.svg', styleKeywords: ['clean', 'energetic'] },
  markets: ['India'], sources: ['https://prustlr.com/'], gaps: ['Confirm pricing'],
};

test('splitList: trims, drops empties, de-dupes case-insensitively, optional comma splitting', () => {
  assert.deepEqual(splitList('  a \n\n b\nA\n  '), ['a', 'b']);
  assert.deepEqual(splitList('friendly, direct; Friendly\nwarm', { commas: true }), ['friendly', 'direct', 'warm']);
  assert.deepEqual(splitList('one, two', {}), ['one, two'], 'commas are kept inside sentences by default');
  assert.deepEqual(splitList(''), []);
});

test('round trip: context -> draft -> context is lossless (JSON view, so undefined and missing keys are equal)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(draftToBrandContext(brandContextToDraft(BRAND)))), JSON.parse(JSON.stringify(BRAND)));
});

test('CONTRACT: whatever the editor saves passes the server normaliser unchanged (no silent truncation/dropping)', () => {
  const draft = brandContextToDraft(BRAND);
  draft.brandName = 'Prustlr Oats';
  draft.usps += '\nNo added sugar';
  draft.colors.push({ name: 'Navy', hex: '#123abc' });
  const saved = draftToBrandContext(draft);
  const server = parseBrandContext(
    JSON.parse(JSON.stringify(saved)),
    { logo: new Set(['https://prustlr.com/logo.svg']), images: new Set(['https://prustlr.com/choco.jpg']) },
    { website: BRAND.website, sources: BRAND.sources },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(server)), JSON.parse(JSON.stringify(saved)));
});

test('validateDraft: required fields, hex colours, product names, list limits', () => {
  assert.ok(validateDraft(brandContextToDraft(BRAND)).ok);

  const d = brandContextToDraft(BRAND);
  d.brandName = '  ';
  d.summary = '';
  d.colors[0].hex = 'orange';
  d.products[1].name = '';
  d.usps = Array.from({ length: 9 }, (_, i) => `u${i}`).join('\n');
  d.tone = 'x'.repeat(61);
  const { ok, errors } = validateDraft(d);
  assert.equal(ok, false);
  assert.match(errors.brandName!, /required/);
  assert.match(errors.summary!, /required/);
  assert.match(errors['colors.0']!, /hex/);
  assert.match(errors['products.1']!, /name/);
  assert.match(errors.usps!, /up to 8/i);
  assert.match(errors.tone!, /at most 60/);
});

test('hex helpers', () => {
  assert.ok(isValidHex('#e4572e') && isValidHex('#FFF') && !isValidHex('e4572e') && !isValidHex('#12345'));
  assert.equal(normalizeHex('e4572e'), '#E4572E');
  assert.equal(normalizeHex('#fff'), '#FFFFFF');
  assert.equal(normalizeHex('nope'), 'nope');
});

test('draftToBrandContext: drops blank products, invalid/duplicate colours; keeps preserved fields', () => {
  const d = brandContextToDraft(BRAND);
  d.products.push({ name: '   ', description: 'x', priceHint: '', imageUrls: [] });
  d.colors = [{ name: '', hex: 'e4572e' }, { name: 'dup', hex: '#E4572E' }, { name: 'bad', hex: 'zzz' }];
  const out = draftToBrandContext(d);
  assert.equal(out.products.length, 2);
  assert.deepEqual(out.visualIdentity.colors, [{ name: undefined, hex: '#E4572E' }]);
  assert.equal(out.visualIdentity.logoUrl, 'https://prustlr.com/logo.svg');
  assert.deepEqual(out.sources, ['https://prustlr.com/']);
});

test('draftsDiffer ignores whitespace-only changes', () => {
  const a = brandContextToDraft(BRAND);
  const b = brandContextToDraft(BRAND);
  b.summary = `  ${b.summary}  `;
  assert.equal(draftsDiffer(a, b), false);
  b.summary = 'Different';
  assert.equal(draftsDiffer(a, b), true);
});
