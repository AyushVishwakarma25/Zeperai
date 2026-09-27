import test from 'node:test';
import assert from 'node:assert/strict';
import { isUuid, normalizeWebsiteUrl, validateAddProductImageInput, validateCreateRunInput, validateKnownFacts } from './validation.js';

const okWebsite = { inputType: 'website', websiteUrl: 'example.com', goal: 'sales' };

test('normalizeWebsiteUrl: adds https, lowercases host, drops hash', () => {
  const r = normalizeWebsiteUrl('WWW.Example.COM/shop?x=1#frag');
  assert.ok(r.ok);
  assert.equal(r.value, 'https://www.example.com/shop?x=1');
});

test('normalizeWebsiteUrl: allows explicit default ports', () => {
  assert.ok(normalizeWebsiteUrl('http://example.com:80/').ok);
  assert.ok(normalizeWebsiteUrl('https://example.com:443/').ok);
});

test('normalizeWebsiteUrl: rejects SSRF-shaped and unsafe URLs', () => {
  const bad = [
    'javascript:alert(1)',
    'file:///etc/passwd',
    'ftp://example.com',
    'http://localhost',
    'http://localhost:3000/admin',
    'http://127.0.0.1',
    'http://2130706433', // decimal form of 127.0.0.1
    'http://0x7f.0.0.1',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.5',
    'https://foo.internal',
    'https://printer.local',
    'https://user:pass@example.com',
    'https://example.com:8080',
    'https://intranet', // single-label host
    'not a url',
    '',
    '   ',
    `https://example.com/${'a'.repeat(2100)}`,
  ];
  for (const url of bad) {
    assert.equal(normalizeWebsiteUrl(url).ok, false, `should reject: ${url.slice(0, 60)}`);
  }
  assert.equal(normalizeWebsiteUrl(undefined).ok, false);
  assert.equal(normalizeWebsiteUrl({ url: 'x' }).ok, false);
});

test('validateCreateRunInput: website run gets defaults and a derived title', () => {
  const r = validateCreateRunInput(okWebsite);
  assert.ok(r.ok);
  assert.equal(r.value.inputType, 'website');
  assert.equal(r.value.websiteUrl, 'https://example.com/');
  assert.equal(r.value.title, 'example.com');
  assert.deepEqual(r.value.settings, { creativeCount: 5, quality: 'Standard', aspectRatio: '1:1', platforms: ['meta_ads'] });
});

test('validateCreateRunInput: details run needs a real description', () => {
  assert.equal(validateCreateRunInput({ inputType: 'details', goal: 'awareness' }).ok, false);
  assert.equal(validateCreateRunInput({ inputType: 'details', goal: 'awareness', brandDetails: 'too short' }).ok, false);
  const r = validateCreateRunInput({
    inputType: 'details',
    goal: 'awareness',
    brandDetails: 'Handmade protein oats for busy Indian professionals.',
  });
  assert.ok(r.ok);
  assert.equal(r.value.websiteUrl, null);
});

test('validateCreateRunInput: goal must be known; custom goal needs notes', () => {
  assert.equal(validateCreateRunInput({ ...okWebsite, goal: 'world domination' }).ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, goal: undefined }).ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, goal: 'custom' }).ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, goal: 'custom', goalNotes: 'hi' }).ok, false);
  assert.ok(validateCreateRunInput({ ...okWebsite, goal: 'custom', goalNotes: 'Promote our Diwali gift boxes' }).ok);
});

test('validateCreateRunInput: settings bounds and normalisation', () => {
  const withSettings = (settings: unknown) => validateCreateRunInput({ ...okWebsite, settings });
  assert.equal(withSettings({ creativeCount: 0 }).ok, false);
  assert.equal(withSettings({ creativeCount: 11 }).ok, false);
  assert.equal(withSettings({ creativeCount: 2.5 }).ok, false);
  assert.equal(withSettings({ creativeCount: 'abc' }).ok, false);
  assert.equal(withSettings({ aspectRatio: '2:3' }).ok, false);
  assert.equal(withSettings({ quality: 'ultra' }).ok, false);

  const r = withSettings({ creativeCount: '3', quality: 'pro', aspectRatio: '9:16' });
  assert.ok(r.ok);
  assert.deepEqual(r.value.settings, { creativeCount: 3, quality: 'Pro', aspectRatio: '9:16', platforms: ['meta_ads'] });
});

test('validateCreateRunInput: platforms validation and bounds', () => {
  const withSettings = (settings: unknown) => validateCreateRunInput({ ...okWebsite, settings });
  // empty list rejected
  assert.equal(withSettings({ platforms: [] }).ok, false);
  assert.equal(withSettings({ platforms: 'not-an-array' }).ok, false);
  // unknown platform rejected
  assert.equal(withSettings({ platforms: ['myspace'] }).ok, false);
  // over cap (max 4) rejected
  assert.equal(withSettings({ platforms: ['meta_ads', 'amazon', 'blinkit', 'zepto', 'flipkart'] }).ok, false);

  // valid platforms, deduped
  const r = withSettings({ platforms: ['meta_ads', 'blinkit', 'meta_ads', 'zepto'] });
  assert.ok(r.ok);
  assert.deepEqual(r.value.settings.platforms, ['meta_ads', 'blinkit', 'zepto']);
});

test('validateCreateRunInput: rejects non-object bodies and bad input types', () => {
  assert.equal(validateCreateRunInput(null).ok, false);
  assert.equal(validateCreateRunInput('string').ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, inputType: 'pdf' }).ok, false);
});

test('validateCreateRunInput: strips control characters and enforces length limits', () => {
  const r = validateCreateRunInput({
    inputType: 'details',
    goal: 'sales',
    brandDetails: 'Premium tea\u0000 brand\u0007 for gifting in India.',
    title: 'My\u0000 Campaign',
  });
  assert.ok(r.ok);
  assert.equal(r.value.brandDetails, 'Premium tea brand for gifting in India.');
  assert.equal(r.value.title, 'My Campaign');

  assert.equal(validateCreateRunInput({ ...okWebsite, title: 'x'.repeat(121) }).ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, brandDetails: 'x'.repeat(8001) }).ok, false);
  assert.equal(validateCreateRunInput({ ...okWebsite, goalNotes: 'x'.repeat(2001) }).ok, false);
});

test('isUuid', () => {
  assert.ok(isUuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid(undefined), false);
  assert.equal(isUuid("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; drop table x;--"), false);
});

test('validateCreateRunInput: handles optional knownFacts with length limit and sanitization', () => {
  const r = validateCreateRunInput({
    ...okWebsite,
    knownFacts: 'Current blended CAC is \u0000₹450 on Meta; 27g protein in recipe.',
  });
  assert.ok(r.ok);
  assert.equal(r.value.knownFacts, 'Current blended CAC is ₹450 on Meta; 27g protein in recipe.');

  const empty = validateCreateRunInput({ ...okWebsite, knownFacts: '   ' });
  assert.ok(empty.ok);
  assert.equal(empty.value.knownFacts, undefined);

  assert.equal(validateCreateRunInput({ ...okWebsite, knownFacts: 'x'.repeat(4001) }).ok, false);
});

test('validateKnownFacts: validates string, null, empty and length limit', () => {
  assert.deepEqual(validateKnownFacts(null), { ok: false, error: 'Invalid request body.' });
  assert.deepEqual(validateKnownFacts('string'), { ok: false, error: 'Invalid request body.' });
  assert.deepEqual(validateKnownFacts({}), { ok: true, value: null });
  assert.deepEqual(validateKnownFacts({ knownFacts: '' }), { ok: true, value: null });
  assert.deepEqual(validateKnownFacts({ knownFacts: null }), { ok: true, value: null });
  assert.deepEqual(validateKnownFacts({ knownFacts: 123 }), { ok: false, error: 'Known facts must be text.' });

  const valid = validateKnownFacts({ knownFacts: 'Recipe changed to 27g protein in March \u00002026.' });
  assert.ok(valid.ok);
  assert.equal(valid.value, 'Recipe changed to 27g protein in March 2026.');

  const tooLong = validateKnownFacts({ knownFacts: 'a'.repeat(4001) });
  assert.equal(tooLong.ok, false);
});

test('validateAddProductImageInput: validates storagePath, imageUrl, label, and bounds', () => {
  const validWithStorage = validateAddProductImageInput({
    storagePath: 'campaign-products/r1/front.png',
    label: 'Choco Oats front',
  });
  assert.ok(validWithStorage.ok);
  assert.equal(validWithStorage.value.storagePath, 'campaign-products/r1/front.png');
  assert.equal(validWithStorage.value.imageUrl, 'campaign-products/r1/front.png');
  assert.equal(validWithStorage.value.label, 'Choco Oats front');

  const validWithHttpUrl = validateAddProductImageInput({
    storagePath: 'campaign-products/r1/front.jpg',
    imageUrl: 'https://example.com/storage/v1/object/public/designs/campaign-products/r1/front.jpg',
    label: 'Berry Oats angle',
  });
  assert.ok(validWithHttpUrl.ok);
  assert.equal(validWithHttpUrl.value.label, 'Berry Oats angle');

  // Rejects bad input / missing path & url
  assert.equal(validateAddProductImageInput(null).ok, false);
  assert.equal(validateAddProductImageInput({}).ok, false);
  assert.equal(validateAddProductImageInput({ storagePath: '   ' }).ok, false);

  // Rejects invalid file extension
  assert.equal(validateAddProductImageInput({ storagePath: 'evil.exe' }).ok, false);
  assert.equal(validateAddProductImageInput({ storagePath: 'image.svg' }).ok, false);

  // Rejects path traversal
  assert.equal(validateAddProductImageInput({ storagePath: '../etc/passwd.png' }).ok, false);

  // Rejects non-http(s) urls
  assert.equal(validateAddProductImageInput({ imageUrl: 'javascript:alert(1).png' }).ok, false);
  assert.equal(validateAddProductImageInput({ imageUrl: 'file:///secret.png' }).ok, false);

  // Cleans label
  const sanitized = validateAddProductImageInput({
    storagePath: 'test.webp',
    label: 'Front \u0000angle',
  });
  assert.ok(sanitized.ok);
  assert.equal(sanitized.value.label, 'Front angle');
});

