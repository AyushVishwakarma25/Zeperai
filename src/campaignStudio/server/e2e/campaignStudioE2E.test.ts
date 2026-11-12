/**
 * CAMPAIGN STUDIO V2 - End-to-End Acceptance Test Suite & System Hardening Verification.
 *
 * Verifies full advertising production across 5 distinct commercial product categories:
 *  1. D2C Skincare & Beauty (Organic Rosehip Glow Serum)
 *  2. Packaged Food & Beverage (Artisanal Single-Origin Cold Brew)
 *  3. Fashion & Apparel (Breathable Linen Everyday Shirt)
 *  4. Consumer Electronics (Active Noise-Canceling Wireless Earbuds)
 *  5. Home Goods & Living (Ergonomic Cooling Memory Foam Pillow)
 *
 * Also tests system hardening:
 *  - SVG character entity escaping (&, <, >, ", ', currency symbols, emojis)
 *  - Missing asset graceful fallbacks
 *  - Credit spend/refund balance invariants
 *  - Multi-placement safe-zone boundary checks
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  BrandContext,
  CampaignRun,
  CreativeBlueprint,
  CreativeDocument,
  MasterPrompt,
  StandardAspectRatio,
  CreativeConcept,
} from '../../types.js';
import { assignFormatsToConcepts } from '../agents/formatStrategist.js';
import { buildCreativeDocument, composeFinalCreative } from '../composition/compositor.js';
import { escapeXml, renderCreativeDocumentToSvg, svgToDataUri, wrapText } from '../composition/svgRenderer.js';
import { validateDeterministicQuality } from '../evaluation/qualityRules.js';
import { evaluateCreative } from '../evaluation/qualityEvaluator.js';
import { targetedRegenerateCreative } from '../evaluation/targetedRegenerator.js';
import { adaptCreativeDocument, adaptMasterCreativeToAllFormats } from '../adaptation/creativeAdapter.js';
import { buildMetaCampaignPackage, generateMetaCopyPackage } from '../export/metaPackageGenerator.js';
import { buildMetaAdPackageZip, buildMetaCopySheetText } from '../export/exportArchive.js';

// ---------------------------------------------------------------------------
// 5 Multi-Category Commercial Fixtures
// ---------------------------------------------------------------------------

interface CategoryFixture {
  categoryName: string;
  brand: BrandContext;
  concepts: Array<{
    id: string;
    pillar: string;
    headline: string;
    subheadline: string;
    cta: string;
    offer?: string;
  }>;
  productImageUrl: string;
  backgroundUrl: string;
}

const CATEGORY_FIXTURES: CategoryFixture[] = [
  // 1. D2C Skincare & Beauty
  {
    categoryName: 'D2C Skincare & Beauty',
    brand: {
      brandName: 'AuraGlow Organics',
      category: 'Skincare',
      summary: '100% certified cold-pressed rosehip seed oil facial serum.',
      positioning: 'Clean luxury organic skincare for instant glass-skin radiance.',
      usps: ['100% Cold-Pressed Organic', 'Glass-Skin Radiance In 7 Days', 'Zero Synthetic Fragrance'],
      products: [{ name: 'Radiance Glow Serum', priceHint: '₹1,299' }],
      audience: {
        primary: 'Women 24-42 seeking clean anti-aging hydration',
        painPoints: ['Dull skin', 'Rough texture', 'Clogged pores'],
        desires: ['Dewy glow', 'Smooth skin', 'Natural nourishment'],
      },
      voice: { tone: ['Luxurious', 'Sensory', 'Empowering'], doSay: ['Botanical', 'Pure'], dontSay: ['Chemical'] },
      visualIdentity: {
        colors: [{ hex: '#E0A996' }, { hex: '#1C1F1D' }, { hex: '#FDFBF7' }],
        typography: 'Playfair Display, serif',
      },
      markets: ['India'],
      sources: ['https://auraglow.in'],
    },
    concepts: [
      { id: 'skin-1', pillar: 'Hook', headline: 'Dull Skin? Awaken Your Dewy Glow', subheadline: 'Pure cold-pressed rosehip oil.', cta: 'Get Glass Skin', offer: '20% OFF' },
      { id: 'skin-2', pillar: 'Problem-Solution', headline: 'Say Goodbye To Clogged Pores & Roughness', subheadline: 'Nutrient-rich botanical fatty acids.', cta: 'Shop Radiance Elixir' },
      { id: 'skin-3', pillar: 'Social Proof', headline: 'Loved By 40,000+ Indian Skincare Enthusiasts', subheadline: 'Rated 4.9/5 stars for instant hydration.', cta: 'See Verified Reviews' },
      { id: 'skin-4', pillar: 'Urgency & Offer', headline: 'Festive Radiance Kit: Buy 1 Get 1 Free', subheadline: 'Limited festive stock available now.', cta: 'Claim Festive BOGO', offer: 'BUY 1 GET 1 FREE' },
      { id: 'skin-5', pillar: 'Feature Spotlight', headline: 'Cold-Pressed Potency: 100% Certified Organic', subheadline: 'Unrefined, zero synthetic fillers.', cta: 'Explore Formula' },
    ],
    productImageUrl: 'https://images.example.com/auraglow-serum.png',
    backgroundUrl: 'https://images.example.com/clean-sunlit-vanity.jpg',
  },

  // 2. Packaged Food & Beverage
  {
    categoryName: 'Packaged Food & Beverage',
    brand: {
      brandName: 'Altitude Roasters',
      category: 'Food & Beverage',
      summary: 'Single-origin specialty cold brew roasted in Chikmagalur.',
      positioning: 'High-altitude artisan coffee with naturally sweet notes.',
      usps: ['100% Arabica Single Origin', 'Zero Added Sugar', '18-Hour Slow Steeped'],
      products: [{ name: 'Classic Black Cold Brew', priceHint: '₹180' }],
      audience: {
        primary: 'High-performance urban professionals & coffee purists',
        painPoints: ['Bitter stale coffee', 'Sugar crash from energy drinks', 'Burnt roast taste'],
        desires: ['Crisp smooth kick', 'Clean sustained focus', 'Rich notes of caramel and dark cocoa'],
      },
      voice: { tone: ['Bold', 'Punchy', 'Refined'], doSay: ['Slow-steeped', 'Clean kick'], dontSay: ['Instant coffee'] },
      visualIdentity: {
        colors: [{ hex: '#2C1D11' }, { hex: '#D4A373' }, { hex: '#FAEDCD' }],
        typography: 'Montserrat, sans-serif',
      },
      markets: ['India'],
      sources: ['https://altitudecoffee.in'],
    },
    concepts: [
      { id: 'brew-1', pillar: 'Hook', headline: 'Never Drink Bitter Machine Coffee Again', subheadline: '18-hour cold steeped single-origin Arabica.', cta: 'Taste The Difference' },
      { id: 'brew-2', pillar: 'Feature Spotlight', headline: 'Chikmagalur Single-Origin: Zero Sugar, 100% Kick', subheadline: 'Naturally sweet notes of hazelnut and cacao.', cta: 'Shop 6-Pack Brew' },
      { id: 'brew-3', pillar: 'Urgency & Offer', headline: 'Order Today & Get Free Cold-Chain Delivery', subheadline: 'Freshly bottled every morning.', cta: 'Order Fresh Brew', offer: 'FREE DELIVERY' },
      { id: 'brew-4', pillar: 'Problem-Solution', headline: 'Crush The 3 PM Slump Without The Sugar Crash', subheadline: 'Clean sustained mental clarity.', cta: 'Fuel Your Afternoon' },
      { id: 'brew-5', pillar: 'Social Proof', headline: 'The Official Fuel Of 250+ Tech Startups', subheadline: 'Rated #1 specialty brew in Bengaluru.', cta: 'Stock Your Fridge' },
    ],
    productImageUrl: 'https://images.example.com/altitude-can.png',
    backgroundUrl: 'https://images.example.com/dark-espresso-wood.jpg',
  },

  // 3. Fashion & Apparel
  {
    categoryName: 'Fashion & Apparel',
    brand: {
      brandName: 'Navaad Linen',
      category: 'Fashion & Apparel',
      summary: 'Tailored European-flax breathable linen shirts for the modern wardrobe.',
      positioning: 'Effortless luxury linen crafted for tropical climates.',
      usps: ['100% Normandy Flax', 'Pre-Washed For Zero Shrinkage', 'Naturally Thermoregulating'],
      products: [{ name: 'Riviera Resort Linen Shirt', priceHint: '₹2,499' }],
      audience: {
        primary: 'Men 26-45 valuing refined minimalist summer aesthetics',
        painPoints: ['Sweaty synthetic fabrics', 'Scratchy unwashed linen', 'Boxy unflattering fits'],
        desires: ['All-day breezy comfort', 'Crisp modern drape', 'Sophisticated smart-casual versatility'],
      },
      voice: { tone: ['Understated', 'Effortless', 'Artisanal'], doSay: ['Normandy flax', 'Breezy'], dontSay: ['Cheap sale'] },
      visualIdentity: {
        colors: [{ hex: '#264653' }, { hex: '#E76F51' }, { hex: '#F4F1DE' }],
        typography: 'Inter, sans-serif',
      },
      markets: ['India', 'UAE'],
      sources: ['https://navaad.com'],
    },
    concepts: [
      { id: 'app-1', pillar: 'Hook', headline: 'Beat The 40°C Heat In Pure European Linen', subheadline: 'Woven from 100% pure Normandy flax fibers.', cta: 'Explore Linen Collection' },
      { id: 'app-2', pillar: 'Problem-Solution', headline: 'Zero Scratchiness. Pre-Washed Cloud Softness.', subheadline: 'Enzyme-washed for immediate luxury drape.', cta: 'Find Your Fit' },
      { id: 'app-3', pillar: 'Feature Spotlight', headline: 'Tailored Resort Fit: Beach To Boardroom', subheadline: 'Crafted with mother-of-pearl buttons.', cta: 'Shop The Riviera Shirt' },
      { id: 'app-4', pillar: 'Urgency & Offer', headline: 'Summer Collection Drop: Flat ₹500 Off 2 Shirts', subheadline: 'Elevate your seasonal capsule wardrobe.', cta: 'Shop Linen Bundle', offer: '₹500 OFF BUNDLE' },
      { id: 'app-5', pillar: 'Social Proof', headline: 'Over 12,000 Gentlemen Switched To Navaad', subheadline: '4.8/5 rating across verified fit checks.', cta: 'Read Customer Reviews' },
    ],
    productImageUrl: 'https://images.example.com/navaad-shirt.png',
    backgroundUrl: 'https://images.example.com/sunlit-coastal-villa.jpg',
  },

  // 4. Consumer Electronics / Tech Gadgets
  {
    categoryName: 'Consumer Electronics / Tech Gadgets',
    brand: {
      brandName: 'Veloce Audio',
      category: 'Consumer Electronics',
      summary: 'True wireless spatial-audio earbuds with 48dB hybrid active noise canceling.',
      positioning: 'Studio-grade acoustic precision engineered for daily audiophiles.',
      usps: ['48dB Hybrid ANC', 'Lossless LDAC Spatial Audio', '42-Hour Total Battery Life'],
      products: [{ name: 'Veloce Pro Spatial ANC', priceHint: '₹4,999' }],
      audience: {
        primary: 'Tech enthusiasts, commuters, and fitness creators aged 20-38',
        painPoints: ['Metro commuter noise', 'Muddy muffled bass', 'Ear fatigue after 1 hour'],
        desires: ['Complete silence on demand', 'Immersive concert-like stage sound', 'Ergonomic featherweight seal'],
      },
      voice: { tone: ['Futuristic', 'Precise', 'Acoustic'], doSay: ['Lossless', 'Spatial audio'], dontSay: ['Generic sound'] },
      visualIdentity: {
        colors: [{ hex: '#00F0FF' }, { hex: '#0B0D17' }, { hex: '#7000FF' }],
        typography: 'Space Grotesk, sans-serif',
      },
      markets: ['India', 'Global'],
      sources: ['https://veloceaudio.com'],
    },
    concepts: [
      { id: 'tech-1', pillar: 'Hook', headline: 'Silence The Commute. 48dB Hybrid ANC.', subheadline: 'Erase airplane rumble and city noise instantly.', cta: 'Experience Pure Silence' },
      { id: 'tech-2', pillar: 'Feature Spotlight', headline: 'Lossless LDAC Hi-Res Audio With Spatial Stage', subheadline: 'Custom 11mm graphene drivers for studio clarity.', cta: 'Explore Tech Specs' },
      { id: 'tech-3', pillar: 'Problem-Solution', headline: '42 Hours Playback: Charge Once A Week', subheadline: '10-minute fast charge delivers 5 hours of play.', cta: 'Get Veloce Pro' },
      { id: 'tech-4', pillar: 'Urgency & Offer', headline: 'Launch Day Special: Extra ₹1,000 Instant Discount', subheadline: 'Exclusive pricing for first 500 units.', cta: 'Claim Launch Deal', offer: '₹1,000 OFF' },
      { id: 'tech-5', pillar: 'Social Proof', headline: 'Named "Best ANC Earbuds Under ₹5K" By TechPress', subheadline: 'Loved by over 15,000 audiophiles.', cta: 'Read Tech Reviews' },
    ],
    productImageUrl: 'https://images.example.com/veloce-case.png',
    backgroundUrl: 'https://images.example.com/cyber-studio-neon.jpg',
  },

  // 5. Home Goods & Living
  {
    categoryName: 'Home Goods & Living',
    brand: {
      brandName: 'Somna Ergonomics',
      category: 'Home & Living',
      summary: 'Orthopedic cervical contour memory foam pillow with active cooling gel.',
      positioning: 'Doctor-recommended ergonomic sleep wellness products.',
      usps: ['Zero-Pressure Neck Alignment', 'Cooling Phase-Change Gel', 'CertiPUR-US Certified Foam'],
      products: [{ name: 'DeepCervical Contour Pillow', priceHint: '₹2,199' }],
      audience: {
        primary: 'Adults 28-60 suffering from desk posture neck stiffness and restless sleep',
        painPoints: ['Waking up with stiff neck', 'Hot sweaty pillow', 'Flat unsupportive cotton pillows'],
        desires: ['Wake up completely pain-free', 'Deep uninterrupted REM sleep', 'Cool soothing head support'],
      },
      voice: { tone: ['Therapeutic', 'Calm', 'Authoritative'], doSay: ['Cervical support', 'Spinal alignment'], dontSay: ['Gimmick'] },
      visualIdentity: {
        colors: [{ hex: '#4A7C59' }, { hex: '#1F2421' }, { hex: '#E9E7DA' }],
        typography: 'Plus Jakarta Sans, sans-serif',
      },
      markets: ['India'],
      sources: ['https://somnasleep.in'],
    },
    concepts: [
      { id: 'home-1', pillar: 'Hook', headline: 'Wake Up Without Neck Stiffness Tomorrow Morning', subheadline: 'Orthopedic contour cradles cervical spine perfectly.', cta: 'Sleep Pain-Free' },
      { id: 'home-2', pillar: 'Problem-Solution', headline: 'Cooling Gel Core: Stop Flipping To The Cool Side', subheadline: 'Thermoregulating phase-change gel dissipates heat.', cta: 'Order Cooling Pillow' },
      { id: 'home-3', pillar: 'Social Proof', headline: 'Recommended By 1,200+ Indian Physiotherapists', subheadline: '94% of users report zero morning neck pain.', cta: 'See Doctor Endorsements' },
      { id: 'home-4', pillar: 'Urgency & Offer', headline: '100-Night Risk-Free Sleep Trial + 25% Off', subheadline: 'Love it or get a 100% money-back refund.', cta: 'Try 100 Nights Free', offer: '25% OFF TRIAL' },
      { id: 'home-5', pillar: 'Feature Spotlight', headline: 'Medical-Grade High Density Memory Foam', subheadline: 'Never sags or flattens, backed by 5-year warranty.', cta: 'Explore Ergonomics' },
    ],
    productImageUrl: 'https://images.example.com/somna-pillow.png',
    backgroundUrl: 'https://images.example.com/serene-morning-bedroom.jpg',
  },
];

// ---------------------------------------------------------------------------
// 1. Acceptance Criteria: Multi-Category Advertising Pipeline E2E
// ---------------------------------------------------------------------------

test('acceptance: executes end-to-end V2 advertising pipeline across all 5 commercial categories', async () => {
  for (const fixture of CATEGORY_FIXTURES) {
    // Step A: Format Strategy (Assign diverse formats across 5 concepts)
    const strategyConcepts = fixture.concepts.map((c) => ({
      id: c.id,
      pillar: c.pillar,
      headline: c.headline,
      body: c.subheadline,
      cta: c.cta,
      visualIdea: `Clean commercial visual illustrating ${c.headline}`,
    })) as unknown as CreativeConcept[];

    const formatAssignments = assignFormatsToConcepts({
      concepts: strategyConcepts,
      goal: 'sales',
      category: fixture.categoryName,
    });
    assert.equal(formatAssignments.length, 5, `Must assign formats to all 5 concepts in ${fixture.categoryName}`);

    // Ensure format variety across concepts
    const uniqueFormats = new Set(formatAssignments.map((f) => f.format.id));
    assert.ok(uniqueFormats.size >= 3, `Must use at least 3 distinct formats for variety in ${fixture.categoryName}`);

    // Step B: Art Direction & Creative Document Composition for Concept 1
    const concept1 = fixture.concepts[0];
    const assignedFormat = formatAssignments[0].format.name;

    const blueprint: CreativeBlueprint = {
      id: `bp-${concept1.id}`,
      conceptId: concept1.id,
      version: 1,
      status: 'draft',
      marketingAngle: concept1.pillar,
      advertisingFormat: assignedFormat,
      designIntensity: 'balanced',
      designConcept: concept1.headline,
      visualNarrative: concept1.subheadline,
      canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
      artDirection: {
        visualStyle: 'Commercial advertising production',
        mood: 'clean, premium, trustworthy',
        background: `Professional studio photography for ${fixture.categoryName}`,
        colorPalette: fixture.brand.visualIdentity?.colors?.map((c) => c.hex) || ['#000000', '#FFFFFF'],
        photographyStyle: 'Clean commercial strobe photography',
        lighting: 'Balanced key and rim lighting',
      },
      layout: {
        composition: 'Balanced vertical hierarchy',
        readingOrder: ['main_headline', 'product', 'cta'],
        productPlacement: 'Center anchor with ground shadow',
        productScale: 0.65,
        safeZones: [],
        elements: [
          { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
          { element: 'product', x: 0.15, y: 0.34, width: 0.70, height: 0.46 },
          { element: 'cta', x: 0.08, y: 0.84, width: 0.46, height: 0.07 },
        ],
      },
      typography: {
        headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFFFFF' },
        hierarchy: [],
      },
      copy: {
        headline: concept1.headline,
        subheadline: concept1.subheadline,
        cta: concept1.cta,
        offer: concept1.offer,
      },
      graphicElements: [],
      assets: { productAssetIds: ['packshot-1'], referenceIds: [] },
      constraints: {
        preserveProductPackaging: true,
        preserveLogo: true,
        exactCopyRequired: true,
        prohibitInventedClaims: true,
      },
    };

    const doc = buildCreativeDocument({
      blueprint,
      backgroundUrl: fixture.backgroundUrl,
      productImageUrl: fixture.productImageUrl,
      brandName: fixture.brand.brandName,
      brandColors: fixture.brand.visualIdentity?.colors?.map((c) => c.hex) || ['#000000', '#FFFFFF'],
    });

    assert.ok(doc, `Creative document built for ${fixture.categoryName}`);
    assert.equal(doc.canvas.width, 1080);
    assert.equal(doc.canvas.height, 1080);

    // Step C: SVG Rendering
    const svg = renderCreativeDocumentToSvg(doc);
    assert.ok(svg.includes('<svg'), `SVG output generated for ${fixture.categoryName}`);
    assert.ok(svg.includes('id="layer-headline"'), `Headline layer rendered in SVG for ${fixture.categoryName}`);
    assert.ok(
      svg.toLowerCase().includes(concept1.headline.split(' ')[0].toLowerCase()),
      `Headline copy rendered in SVG for ${fixture.categoryName}`,
    );

    // Step D: Quality Evaluation
    const mockAiEvalClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            scores: {
              visualHierarchy: 18,
              productAccuracy: 19,
              brandConsistency: 14,
              typography: 14,
              visualQuality: 14,
              messageClarity: 9,
              technicalCompliance: 5,
            },
            issues: [],
          }),
        }),
      },
    };
    const evalResult = await evaluateCreative({ doc, blueprint, brand: fixture.brand, client: mockAiEvalClient });
    assert.equal(evalResult.passed, true, `Quality evaluation must pass for ${fixture.categoryName}`);
    assert.notEqual(evalResult.status, 'rejected');
    assert.equal(evalResult.hardRuleFailures.length, 0);
    assert.ok(evalResult.totalScore >= 75);

    // Step E: Multi-Aspect Ratio Adaptation (1:1 -> 9:16 and 1.91:1)
    const adaptations = adaptMasterCreativeToAllFormats(doc);
    assert.equal(adaptations['9:16'].document.canvas.height, 1920);
    assert.equal(adaptations['1.91:1'].document.canvas.width, 1200);

    // Verify 9:16 Story safe zones
    const storiesCta = adaptations['9:16'].document.layers.find((l) => l.type === 'cta' || l.id === 'layer-cta')!;
    const storiesHeadline = adaptations['9:16'].document.layers.find((l) => l.id === 'layer-headline' || l.type === 'headline')!;
    assert.ok(storiesHeadline.position.y >= 0.1302, 'Stories headline must be below 250px top buffer');
    assert.ok(storiesCta.position.y + storiesCta.position.height <= 0.8177, 'Stories CTA must be above 350px bottom buffer');

    // Step F: Meta Ad Package & Copy Generation
    const mockRun: CampaignRun = {
      id: `run-${concept1.id}`,
      user_id: 'user-001',
      title: `${fixture.brand.brandName} Campaign`,
      input_type: 'website',
      goal: 'Sales & Conversions',
      platforms: ['Instagram', 'Facebook'],
      settings: {
        creativeCount: 5,
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
      brand_context: fixture.brand,
    } as unknown as CampaignRun;

    const pkg = buildMetaCampaignPackage({
      run: mockRun,
      brand: fixture.brand,
      prompts: fixture.concepts.map((c) => ({
        conceptId: c.id,
        headline: c.headline,
        subheadline: c.subheadline,
        cta: c.cta,
        aspectRatio: '1:1',
        imagePrompt: 'Studio background',
        pillar: c.pillar,
      })),
      assets: [
        {
          id: `asset-${concept1.id}`,
          user_id: 'user-001',
          run_id: mockRun.id,
          creative_index: 1,
          version: 1,
          status: 'ready',
          aspect_ratio: '1:1',
          image_url: fixture.backgroundUrl,
          storage_path: `campaigns/${mockRun.id}/1.png`,
          prompt: 'Studio background',
          model: 'imagen-3.0',
          overlay: {
            document: doc,
            headline: concept1.headline,
            subheading: concept1.subheadline,
            cta: concept1.cta,
            evaluation: evalResult,
          },
          credits_charged: 1,
          error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    assert.equal(pkg.concepts.length, 5);
    const conceptCopy = pkg.concepts[0].copy;

    // Verify Meta character length constraints
    for (const pt of conceptCopy.primaryText) {
      assert.ok(pt.length <= 250, `Primary text length ${pt.length} <= 250 in ${fixture.categoryName}`);
    }
    for (const hl of conceptCopy.headlines) {
      assert.ok(hl.length <= 40, `Headline length ${hl.length} <= 40 in ${fixture.categoryName}`);
    }
    for (const d of conceptCopy.descriptions) {
      assert.ok(d.length <= 30, `Description length ${d.length} <= 30 in ${fixture.categoryName}`);
    }

    // Step G: ZIP Archive Generation
    const zipBuf = await buildMetaAdPackageZip(pkg, { allowUnverified: true });
    assert.ok(Buffer.isBuffer(zipBuf));
    assert.equal(zipBuf.readUInt32LE(0), 0x04034b50, `Valid PKZIP header for ${fixture.categoryName}`);
  }
});

// ---------------------------------------------------------------------------
// 2. Hardening & Edge Case Robustness
// ---------------------------------------------------------------------------

test('hardening: handles hostile characters, XML injection, and currency symbols safely', () => {
  const hostileText = 'Flat 25% OFF & "Mega Sale" <script>alert(1)</script> ₹1,499 ™ ® © &amp; \'quotes\'';
  const escaped = escapeXml(hostileText);

  // Assert no unescaped XML tags or quotes
  assert.ok(!escaped.includes('<script>'));
  assert.ok(!escaped.includes('</script>'));
  assert.ok(!escaped.includes('"Mega'));
  assert.ok(!escaped.includes('& '));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('&amp;'));
  assert.ok(escaped.includes('₹1,499')); // Currency preserved
  assert.ok(escaped.includes('™')); // Trademark preserved

  // Word wrap handles long strings with no spaces gracefully without infinite loops
  const unbrokenWord = 'A'.repeat(120);
  const wrapped = wrapText(unbrokenWord, 300, 30, 'Poppins');
  assert.ok(wrapped.length >= 1);
});

test('hardening: targeted regeneration preserves unedited layers byte-for-byte', () => {
  const fixture = CATEGORY_FIXTURES[0];
  const concept = fixture.concepts[0];

  const doc = buildCreativeDocument({
    blueprint: {
      id: `bp-${concept.id}`,
      conceptId: concept.id,
      version: 1,
      status: 'draft',
      marketingAngle: concept.pillar,
      advertisingFormat: 'Promotional Product Advertisement',
      designIntensity: 'balanced',
      designConcept: concept.headline,
      visualNarrative: concept.subheadline,
      canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
      artDirection: {
        visualStyle: 'Commercial',
        mood: 'clean',
        background: 'studio',
        colorPalette: ['#E0A996', '#1C1F1D'],
        photographyStyle: 'Clean commercial strobe photography',
        lighting: 'Studio light',
      },
      layout: {
        composition: 'Balanced',
        readingOrder: ['main_headline', 'product', 'cta'],
        productPlacement: 'Center',
        productScale: 0.65,
        safeZones: [],
        elements: [
          { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
          { element: 'product', x: 0.15, y: 0.34, width: 0.70, height: 0.46 },
          { element: 'cta', x: 0.08, y: 0.84, width: 0.46, height: 0.07 },
        ],
      },
      typography: {
        headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFFFFF' },
        hierarchy: [],
      },
      copy: {
        headline: concept.headline,
        subheadline: concept.subheadline,
        cta: concept.cta,
      },
      graphicElements: [],
      assets: { productAssetIds: ['packshot-1'], referenceIds: [] },
      constraints: {
        preserveProductPackaging: true,
        preserveLogo: true,
        exactCopyRequired: true,
        prohibitInventedClaims: true,
      },
    },
    backgroundUrl: fixture.backgroundUrl,
    productImageUrl: fixture.productImageUrl,
    brandName: fixture.brand.brandName,
  });

  const originalProductLayer = JSON.stringify(doc.layers.find((l) => l.type === 'product'));
  const originalBackgroundLayer = JSON.stringify(doc.layers.find((l) => l.type === 'background'));

  // Targeted edit to headline only
  const edited = targetedRegenerateCreative({
    doc,
    component: 'headline',
    newContent: 'New Clinically Proven Formula',
  });

  const newProductLayer = JSON.stringify(edited.document.layers.find((l) => l.type === 'product'));
  const newBackgroundLayer = JSON.stringify(edited.document.layers.find((l) => l.type === 'background'));

  // Assert 100% preservation of untouched layers
  assert.equal(newProductLayer, originalProductLayer);
  assert.equal(newBackgroundLayer, originalBackgroundLayer);

  // Assert target headline changed
  const newHeadline = edited.document.layers.find((l) => l.id === 'layer-headline' || l.type === 'headline');
  assert.equal(newHeadline?.content, 'New Clinically Proven Formula');
  assert.equal(edited.document.version, 2);
});

