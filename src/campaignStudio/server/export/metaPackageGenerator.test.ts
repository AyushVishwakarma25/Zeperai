import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMetaCampaignPackage,
  clampToWordBoundary,
  generateMetaCopyPackage,
  resolveMetaCta,
} from './metaPackageGenerator.js';
import {
  CLAIM_PATTERNS,
  detectFactualClaimViolations,
  extractVerifiedClaimsFromBrandContext,
  validateMetaPackageClaims,
} from '../claims/claimsEngine.js';
import type { BrandContext, CampaignRun, VerifiedClaim } from '../../types.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MINIMAL_BRAND: BrandContext = {
  brandName: 'Zenith Living',
  category: 'Home & Kitchen',
  summary: 'Minimalist bamboo kitchen organizers and storage solutions.',
  positioning: 'Sustainable sustainable home organization.',
  usps: [], // Zero USPs provided
  products: [
    {
      name: 'Modular Bamboo Drawer Organizer',
      description: 'Expandable 6-slot bamboo divider.',
      priceHint: '₹899',
    },
  ],
  audience: {
    primary: 'Urban apartment dwellers',
    painPoints: ['Cluttered countertops', 'Disorganized cutlery drawers'],
    desires: ['Serene kitchen aesthetics', 'Effortless morning routines'],
  },
  voice: {
    tone: ['Calm', 'Functional'],
    doSay: ['Thoughtful design', 'Natural bamboo'],
    dontSay: ['Cheap plastic', 'Miracle fix'],
  },
  visualIdentity: {
    colors: [{ hex: '#2B3A42' }, { hex: '#EFEFEF' }],
    typography: 'Inter, sans-serif',
    styleKeywords: ['minimal', 'zen'],
  },
  markets: ['India'],
  sources: ['https://zenithliving.in'],
};

const BRAND_WITH_VERIFIED_CLAIMS: BrandContext = {
  ...MINIMAL_BRAND,
  brandName: 'Nectar Glow',
  category: 'Skincare',
  usps: ['100% Certified Organic Rosa Mosqueta', 'Zero Preservatives'],
  verifiedClaims: [
    {
      id: 'claim-1',
      claimText: '4.8/5 Verified Customer Rating',
      category: 'rating_and_review',
      source: 'confirmed_testimonial',
      verificationStatus: 'verified',
      approvalStatus: 'approved',
      tier: 'verified_fact',
      evidenceRef: 'reviews:trustpilot_export_2026',
    },
    {
      id: 'claim-2',
      claimText: 'Free Carbon-Neutral Delivery',
      category: 'shipping_and_delivery',
      source: 'user_provided',
      verificationStatus: 'verified',
      approvalStatus: 'approved',
      tier: 'verified_fact',
      evidenceRef: 'website:shipping_policy',
    },
    {
      id: 'claim-3',
      claimText: 'Limited Seasonal Harvest Batch',
      category: 'scarcity_and_urgency',
      source: 'user_provided',
      verificationStatus: 'verified',
      approvalStatus: 'approved',
      tier: 'verified_fact',
      evidenceRef: 'inventory:batch_nov_2026',
    },
  ],
};

const MOCK_RUN: CampaignRun = {
  id: 'run-claims-001',
  user_id: 'user-claims',
  title: 'Organic Launch Campaign',
  input_type: 'website',
  website_url: 'https://nectarglow.in',
  goal: 'sales',
  settings: {
    creativeCount: 1,
    quality: 'Standard',
    aspectRatio: '1:1',
    platforms: ['meta_ads'],
  },
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  brand_context: MINIMAL_BRAND,
};

// ---------------------------------------------------------------------------
// 1. Zero Fabricated Claims in Absence of Evidence
// ---------------------------------------------------------------------------

test('metaPackageGenerator: NEVER fabricates ratings, guarantees, shipping promises, or restock urgency when evidence is missing', () => {
  const copy = generateMetaCopyPackage({
    brand: MINIMAL_BRAND,
    conceptHeadline: 'Transform Your Kitchen Drawers with Modular Bamboo',
    conceptSubheadline: 'Expandable storage tailored to your space.',
    conceptCta: 'Shop Organizers',
    pillar: 'Problem-Solution',
    // No offer provided!
  });

  const fullText = [
    ...copy.primaryText,
    ...copy.headlines,
    ...copy.descriptions,
  ].join(' ');

  // 1. Assert specific prohibited fabricated claims DO NOT appear anywhere
  assert.ok(
    !fullText.includes('Premium Quality Guaranteed'),
    'Must NOT contain hardcoded "Premium Quality Guaranteed" fallback',
  );
  assert.ok(
    !fullText.includes('Free Express Delivery'),
    'Must NOT contain hardcoded "Free Express Delivery" fallback',
  );
  assert.ok(
    !fullText.includes('4.9/5'),
    'Must NOT contain fabricated "4.9/5" rating',
  );
  assert.ok(
    !fullText.includes('Limited Edition Restock'),
    'Must NOT contain fabricated "Limited Edition Restock" scarcity claim',
  );
  assert.ok(
    !fullText.includes('Delivered fast to your door'),
    'Must NOT make unverified fulfillment and delivery speed promises',
  );

  // 2. Assert safe context-aware alternatives are generated
  assert.equal(copy.descriptions.length, 3);
  for (const d of copy.descriptions) {
    assert.ok(d.length > 0 && d.length <= 30, `Description must fit Meta 30 char limit: "${d}"`);
  }

  // 3. Programmatic claim violations check must report zero violations
  const verifiedClaims = extractVerifiedClaimsFromBrandContext({ brand: MINIMAL_BRAND });
  const violations = detectFactualClaimViolations(fullText, verifiedClaims, 'Generated Minimal Copy');
  assert.equal(violations.length, 0, `Expected 0 claim violations in safe copy, got: ${JSON.stringify(violations)}`);
});

// ---------------------------------------------------------------------------
// 2. Approved Claims Correctly Pass Through When Substantiated
// ---------------------------------------------------------------------------

test('metaPackageGenerator: incorporates verified claims when substantiated by brand evidence', () => {
  const copy = generateMetaCopyPackage({
    brand: BRAND_WITH_VERIFIED_CLAIMS,
    conceptHeadline: 'Wake Up to Naturally Dewy Radiance',
    conceptSubheadline: 'Cold-pressed organic botanical facial oil.',
    conceptCta: 'Shop Nectar Glow',
    pillar: 'Feature Spotlight',
    offer: 'Free Carbon-Neutral Delivery',
    verifiedClaims: BRAND_WITH_VERIFIED_CLAIMS.verifiedClaims,
  });

  const fullText = [
    ...copy.primaryText,
    ...copy.headlines,
    ...copy.descriptions,
  ].join(' ');

  // Verified rating claim appears in descriptions
  assert.ok(
    copy.descriptions.some((d) => d.includes('4.8/5')),
    'Verified rating claim should be present in descriptions',
  );

  // Verified shipping claim appears in descriptions or copy
  assert.ok(
    fullText.toLowerCase().includes('delivery') || fullText.toLowerCase().includes('carbon-neutral'),
    'Verified shipping claim should be included',
  );

  // Verified scarcity claim appears in descriptions
  assert.ok(
    copy.descriptions.some((d) => d.toLowerCase().includes('harvest') || d.toLowerCase().includes('seasonal')),
    'Verified scarcity claim should be included when evidence exists',
  );
});

// ---------------------------------------------------------------------------
// 3. Pre-Export Claim Safety Audit
// ---------------------------------------------------------------------------

test('validateMetaPackageClaims: detects and flags unverified claims injected into Meta package', () => {
  const verifiedClaims = extractVerifiedClaimsFromBrandContext({ brand: MINIMAL_BRAND });

  // Create package with clean copy
  const pkg = buildMetaCampaignPackage({
    run: MOCK_RUN,
    brand: MINIMAL_BRAND,
    prompts: [
      {
        conceptId: 'concept-1',
        headline: 'Transform Drawers With Bamboo',
        subheadline: 'Minimal clutter-free storage.',
        cta: 'Shop Now',
        aspectRatio: '1:1',
        imagePrompt: 'Studio shot of kitchen drawers',
        pillar: 'Problem-Solution',
      },
    ],
    assets: [],
  });

  // Safe package passes audit
  const cleanAudit = validateMetaPackageClaims(pkg, verifiedClaims);
  assert.equal(cleanAudit.passed, true);
  assert.equal(cleanAudit.violations.length, 0);

  // Now simulate adversarial injection of unverified claims
  const hostilePkg: typeof pkg = JSON.parse(JSON.stringify(pkg));
  hostilePkg.concepts[0].copy.headlines[1] = 'Rated 5.0 Stars by 50,000 Users';
  hostilePkg.concepts[0].copy.descriptions[0] = 'Free 24hr Express Delivery';
  hostilePkg.concepts[0].copy.descriptions[2] = 'Selling Fast Only 2 Left';

  const hostileAudit = validateMetaPackageClaims(hostilePkg, verifiedClaims);
  assert.equal(hostileAudit.passed, false);
  assert.ok(hostileAudit.violations.length >= 3);

  const categories = hostileAudit.violations.map((v) => v.category);
  assert.ok(categories.includes('rating_and_review'), 'Must flag unverified rating');
  assert.ok(categories.includes('shipping_and_delivery'), 'Must flag unverified shipping promise');
  assert.ok(categories.includes('scarcity_and_urgency'), 'Must flag unverified urgency claim');
});

// ---------------------------------------------------------------------------
// 4. Distinguishes Verified Facts vs Brand Marketing vs AI Suggestions
// ---------------------------------------------------------------------------

test('extractVerifiedClaimsFromBrandContext: properly categorizes claims and tiers', () => {
  const claims = extractVerifiedClaimsFromBrandContext({
    brand: BRAND_WITH_VERIFIED_CLAIMS,
    strategy: {
      offer: 'Flat ₹200 OFF on First Order',
    } as any,
    userFacts: 'Lab tested for 24-hour hydration retention',
  });

  assert.ok(claims.length >= 4);

  // Product catalog items are verified facts
  const productClaim = claims.find((c) => c.source === 'product_catalog');
  assert.ok(productClaim);
  assert.equal(productClaim.tier, 'verified_fact');

  // Brand USPs are brand-approved marketing
  const uspClaim = claims.find((c) => c.source === 'user_provided' && c.tier === 'brand_approved_marketing');
  assert.ok(uspClaim);

  // Approved strategy offer is verified fact
  const offerClaim = claims.find((c) => c.source === 'approved_offer');
  assert.ok(offerClaim);
  assert.equal(offerClaim.category, 'discount_and_pricing');

  // User facts are verified facts
  const userFactClaim = claims.find((c) => c.evidenceRef === 'run:known_facts');
  assert.ok(userFactClaim);
});
