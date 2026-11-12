/**
 * CAMPAIGN STUDIO V2 - Advertising Format Library.
 *
 * Structured configuration registry for 15 core commercial advertising formats.
 * Defines visual hierarchy, composition, typography, and graphic elements.
 */

import type { AdvertisingFormatDefinition, CampaignGoal } from '../types.js';

export const ADVERTISING_FORMATS: AdvertisingFormatDefinition[] = [
  {
    id: 'promotional-retail-poster',
    name: 'Promotional Retail Poster',
    description: 'High-impact commercial retail poster designed for bold promotions, discount urgency, and instant retail conversion.',
    suitableObjectives: ['sales', 'leads', 'launch'],
    suitableIndustries: ['food', 'beverage', 'retail', 'fmcg', 'electronics', 'fashion'],
    recommendedVisualHierarchy: [
      'Level 1: Urgent promotional offer / discount badge',
      'Level 2: Dominant punchy headline (under 6 words)',
      'Level 3: Grounded hero product with high-contrast studio lighting',
      'Level 4: High-contrast sticky CTA button with price anchor',
      'Level 5: Logo top-left or top-center with clean safe margin',
    ],
    compositionCharacteristics: 'Bold top-heavy or bottom-heavy layout with strong solid/gradient background and crisp rim lighting.',
    typographyRecommendations: 'Heavy bold display sans-serif (e.g. Poppins 900, Archivo Black) with tight letter spacing and high contrast.',
    productPlacementGuidance: 'Centered or slightly lower-third anchored product with grounded cast shadows and realistic reflections.',
    suitableGraphicElements: ['discount_pill', 'price_block', 'urgency_badge', 'countdown_ticker', 'border_frame'],
    commonMistakesToAvoid: ['Low text contrast against background', 'Floating product with no grounded shadow', 'Weak or hidden CTA button'],
    defaultLayoutElements: [
      { element: 'badge', x: 0.08, y: 0.06, width: 0.38, height: 0.06, alignment: 'left', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.18, alignment: 'left', layer: 20 },
      { element: 'subheadline', x: 0.08, y: 0.33, width: 0.84, height: 0.07, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.15, y: 0.42, width: 0.70, height: 0.42, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.84, height: 0.07, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'editorial-product-ad',
    name: 'Editorial Product Advertisement',
    description: 'Sophisticated, magazine-style advertisement prioritizing negative space, artisanal typography, and premium aesthetic poise.',
    suitableObjectives: ['awareness', 'engagement', 'launch'],
    suitableIndustries: ['beauty', 'skincare', 'luxury', 'fashion', 'jewelry', 'wellness'],
    recommendedVisualHierarchy: [
      'Level 1: Minimalist brand logo or subtle category label',
      'Level 2: Elegant editorial headline with generous breathing room',
      'Level 3: Flawlessly styled hero product on natural stone, linen, or architectural surface',
      'Level 4: Understated subline and refined text CTA with subtle arrow icon',
    ],
    compositionCharacteristics: 'Generous negative space (35%+), subtle natural side-lighting, organic textures, and muted tonal color palettes.',
    typographyRecommendations: 'High-contrast modern serif (Playfair Display) paired with clean geometric grotesque sans (Inter).',
    productPlacementGuidance: 'Geometric center or rule-of-thirds intersection on a textured architectural pedestal.',
    suitableGraphicElements: ['subtle_divider_line', 'monogram_badge', 'thin_border'],
    commonMistakesToAvoid: ['Cluttering with loud stickers or badges', 'Saturated garish colors', 'Heavy drop shadows on typography'],
    defaultLayoutElements: [
      { element: 'logo', x: 0.10, y: 0.08, width: 0.25, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'main_headline', x: 0.10, y: 0.16, width: 0.80, height: 0.14, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.15, y: 0.34, width: 0.70, height: 0.46, alignment: 'center', layer: 5 },
      { element: 'subheadline', x: 0.10, y: 0.82, width: 0.60, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'cta', x: 0.10, y: 0.88, width: 0.35, height: 0.05, alignment: 'left', layer: 20 },
    ],
  },
  {
    id: 'dynamic-product-ad',
    name: 'Dynamic Product Advertisement',
    description: 'High-energy kinetic visual featuring motion blur, ingredient splashes, flying particles, and diagonal sightlines.',
    suitableObjectives: ['engagement', 'awareness', 'sales'],
    suitableIndustries: ['sports', 'energy', 'beverage', 'footwear', 'gaming', 'tech'],
    recommendedVisualHierarchy: [
      'Level 1: Diagonal punchy display headline spanning across action sightline',
      'Level 2: Angled product hero bursting through liquid splashes or particle waves',
      'Level 3: Feature callout badge anchored at opposite corner',
      'Level 4: Dynamic high-contrast CTA pill',
    ],
    compositionCharacteristics: 'Dynamic 30 to 45-degree diagonal compositions with high-speed freeze-frame splash or burst effects.',
    typographyRecommendations: 'Italicized or condensed extra-bold display fonts (e.g. Anton, Archivo Black) with motion flair.',
    productPlacementGuidance: 'Dynamic tilted angle (15°–45°) floating or bursting with velocity lines and depth of field.',
    suitableGraphicElements: ['accent_shapes', 'velocity_streaks', 'energy_bursts', 'corner_flags'],
    commonMistakesToAvoid: ['Static centered product', 'Unreadable text overlapping chaotic particle clusters', 'Lack of focal contrast'],
    defaultLayoutElements: [
      { element: 'accent_shape', x: 0.0, y: 0.0, width: 0.50, height: 0.50, alignment: 'left', layer: 2 },
      { element: 'main_headline', x: 0.08, y: 0.10, width: 0.70, height: 0.20, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.25, y: 0.28, width: 0.70, height: 0.50, alignment: 'right', layer: 8 },
      { element: 'subheadline', x: 0.08, y: 0.70, width: 0.55, height: 0.08, alignment: 'left', layer: 20 },
      { element: 'cta', x: 0.08, y: 0.86, width: 0.42, height: 0.07, alignment: 'left', layer: 25 },
    ],
  },
  {
    id: 'ingredient-feature-spotlight',
    name: 'Ingredient / Feature Spotlight',
    description: 'Educational showcase focusing on macro ingredients, technical specs, formulation purity, or signature mechanisms.',
    suitableObjectives: ['consideration', 'sales', 'launch'],
    suitableIndustries: ['beauty', 'supplements', 'food', 'skincare', 'electronics'],
    recommendedVisualHierarchy: [
      'Level 1: Educational benefit headline highlighting the core formula or mechanism',
      'Level 2: Hero product surrounded by 3-4 natural raw ingredients or technical callouts',
      'Level 3: Connecting visual pointer lines or structured benefit badges',
      'Level 4: Clinical / laboratory verification badge and CTA',
    ],
    compositionCharacteristics: 'Isometric flat lay or 3D exploded layout with clean surrounding margins for structured annotations.',
    typographyRecommendations: 'Clean technical grotesque or geometric sans (e.g. Montserrat, Inter) with tabular number alignment.',
    productPlacementGuidance: 'Central focal anchor with supporting elements radiating symmetrically or in an orderly semicircle.',
    suitableGraphicElements: ['annotation_dots', 'connector_lines', 'spec_pills', 'verified_seal'],
    commonMistakesToAvoid: ['Messy unstructured pointers', 'Overcrowding the hero packaging label', 'Tiny unreadable spec text'],
    defaultLayoutElements: [
      { element: 'logo', x: 0.08, y: 0.06, width: 0.25, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'main_headline', x: 0.08, y: 0.13, width: 0.84, height: 0.16, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.20, y: 0.32, width: 0.60, height: 0.44, alignment: 'center', layer: 5 },
      { element: 'badge', x: 0.70, y: 0.30, width: 0.24, height: 0.06, alignment: 'right', layer: 25 },
      { element: 'feature_list', x: 0.08, y: 0.78, width: 0.84, height: 0.08, alignment: 'left', layer: 15 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 20 },
    ],
  },
  {
    id: 'comparison-ad',
    name: 'Comparison Advertisement',
    description: 'Direct side-by-side comparison establishing clear market superiority against generic alternatives or old routines.',
    suitableObjectives: ['sales', 'consideration', 'retention'],
    suitableIndustries: ['d2c', 'tech', 'cleaning', 'mattress', 'supplements', 'finance'],
    recommendedVisualHierarchy: [
      'Level 1: Provocative comparison headline ("Us vs Them", "The Old Way vs The Future")',
      'Level 2: Left column (Problem/Generic) vs Right column (Hero Brand/Superiority)',
      'Level 3: Checkmarks vs Red crosses checklist',
      'Level 4: Decisive CTA on the winner side',
    ],
    compositionCharacteristics: 'Clean vertical split-screen or 2-column comparative grid with distinct color coding (dull left vs vibrant right).',
    typographyRecommendations: 'Authoritative bold sans-serif with clear green/red status indicators.',
    productPlacementGuidance: 'Clear positioning on the positive right/winning column, elevated above the comparison item.',
    suitableGraphicElements: ['vs_badge', 'check_icons', 'cross_icons', 'vertical_divider_line'],
    commonMistakesToAvoid: ['Disparaging trademarks directly', 'Confusing which side is superior', 'Too much small comparison text'],
    defaultLayoutElements: [
      { element: 'main_headline', x: 0.08, y: 0.08, width: 0.84, height: 0.16, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.10, y: 0.28, width: 0.80, height: 0.48, alignment: 'center', layer: 5 },
      { element: 'badge', x: 0.45, y: 0.48, width: 0.10, height: 0.06, alignment: 'center', layer: 25 },
      { element: 'cta', x: 0.15, y: 0.86, width: 0.70, height: 0.07, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'offer-led-ad',
    name: 'Offer-led Advertisement',
    description: 'Promotional powerhouse where the financial incentive (BOGO, 50% Off, Bundle & Save) is the primary visual hook.',
    suitableObjectives: ['sales', 'leads', 'retention'],
    suitableIndustries: ['e-commerce', 'fashion', 'food', 'electronics', 'quick-commerce'],
    recommendedVisualHierarchy: [
      'Level 1: Massive discount / deal numeral callout ("50% OFF" or "BUY 1 GET 1")',
      'Level 2: Urgency subheadline ("Today Only", "Limited Festive Stock")',
      'Level 3: Bundled product hero assortment',
      'Level 4: Bold full-width CTA bar',
    ],
    compositionCharacteristics: 'Loud, high-contrast promotional billboard styling with graphic price tags and promo ribbons.',
    typographyRecommendations: 'Massive condensed display typeface (Anton, Bebas Neue) with saturated contrast colors.',
    productPlacementGuidance: 'Grouped product bundles or single hero surrounded by festive or promo confetti accents.',
    suitableGraphicElements: ['promo_ribbon', 'discount_callout', 'strikethrough_price', 'coupon_frame'],
    commonMistakesToAvoid: ['Burying the offer in small body text', 'Missing promo codes or expiry terms', 'Weak CTA button'],
    defaultLayoutElements: [
      { element: 'badge', x: 0.20, y: 0.06, width: 0.60, height: 0.08, alignment: 'center', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.16, width: 0.84, height: 0.20, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.15, y: 0.38, width: 0.70, height: 0.44, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.08, y: 0.87, width: 0.84, height: 0.07, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'lifestyle-ad',
    name: 'Lifestyle Advertisement',
    description: 'Contextual advertising placing the product naturally into the daily routine and aspirational moments of target customers.',
    suitableObjectives: ['awareness', 'engagement', 'consideration'],
    suitableIndustries: ['apparel', 'home', 'travel', 'outdoor', 'beverage', 'fitness'],
    recommendedVisualHierarchy: [
      'Level 1: Emotional relatable lifestyle scene with authentic human context',
      'Level 2: Product seamlessly integrated into hands, kitchen, gym or workspace',
      'Level 3: Short narrative hook reflecting consumer mindset',
      'Level 4: Floating glassmorphic CTA pill',
    ],
    compositionCharacteristics: 'Cinematic warm environmental photography with natural ambient light and soft depth of field.',
    typographyRecommendations: 'Warm humanistic sans-serif (e.g. Plus Jakarta Sans, Inter) with generous line height.',
    productPlacementGuidance: 'In-use or within arm reach of a model; naturally grounded in the environment.',
    suitableGraphicElements: ['glassmorphic_card', 'floating_tag', 'minimal_logo_watermark'],
    commonMistakesToAvoid: ['Staged fake stock-photo smiles', 'Product lost in busy environmental clutter', 'Overly commercial text taking away from authenticity'],
    defaultLayoutElements: [
      { element: 'logo', x: 0.08, y: 0.06, width: 0.25, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.05, y: 0.20, width: 0.90, height: 0.58, alignment: 'center', layer: 5 },
      { element: 'main_headline', x: 0.08, y: 0.78, width: 0.84, height: 0.10, alignment: 'left', layer: 20 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 25 },
    ],
  },
  {
    id: 'social-proof-ad',
    name: 'Social Proof Advertisement',
    description: 'Trust-first design featuring verified 5-star ratings, real customer quotes, celebrity endorsements, or press mentions.',
    suitableObjectives: ['sales', 'consideration', 'retention'],
    suitableIndustries: ['skincare', 'supplements', 'd2c', 'tech', 'b2b'],
    recommendedVisualHierarchy: [
      'Level 1: 5 gold stars and verified customer rating count ("Over 10,000+ 5-Star Reviews")',
      'Level 2: Punchy quoted customer testimonial headline in quotation marks',
      'Level 3: Studio product hero with packaging details sharp and visible',
      'Level 4: Reviewer name, verified buyer badge, and direct shop CTA',
    ],
    compositionCharacteristics: 'Clean authoritative editorial or social review card aesthetic with review badge at top.',
    typographyRecommendations: 'Display serif for customer quote, paired with modern sans-serif for rating metrics.',
    productPlacementGuidance: 'Positioned beside or just beneath the testimonial quote with pristine packaging focus.',
    suitableGraphicElements: ['star_rating', 'verified_buyer_badge', 'quote_bubble', 'press_logos'],
    commonMistakesToAvoid: ['Fake-sounding testimonials', 'Missing star symbols', 'Obscuring customer name or verification status'],
    defaultLayoutElements: [
      { element: 'badge', x: 0.08, y: 0.06, width: 0.45, height: 0.05, alignment: 'left', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.13, width: 0.84, height: 0.18, alignment: 'left', layer: 20 },
      { element: 'subheadline', x: 0.08, y: 0.33, width: 0.60, height: 0.06, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.20, y: 0.42, width: 0.65, height: 0.42, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 25 },
    ],
  },
  {
    id: 'benefit-infographic',
    name: 'Product Benefit Infographic',
    description: 'Data and benefit-driven layout utilizing numbered statistics, charts, or bulleted value propositions.',
    suitableObjectives: ['consideration', 'sales', 'awareness'],
    suitableIndustries: ['wellness', 'saas', 'electronics', 'home-appliances', 'baby-care'],
    recommendedVisualHierarchy: [
      'Level 1: Big numerical stat headline ("94% saw visible results in 14 days")',
      'Level 2: 3 structured benefit callout cards with icons',
      'Level 3: Product hero anchored centrally with glowing indicator badges',
      'Level 4: Clinical study footnote and conversion CTA',
    ],
    compositionCharacteristics: 'Structured grid with high visual density, clear section dividers, and clean background margins.',
    typographyRecommendations: 'Tabular numbers with bold headings and compact medium-weight body copy.',
    productPlacementGuidance: 'Centered within an infographic matrix with clear visual breathing room.',
    suitableGraphicElements: ['stat_counters', 'icon_circles', 'progress_bars', 'study_footnote'],
    commonMistakesToAvoid: ['Overloading with more than 3 stats', 'Unverified scientific claims', 'Cluttered alignment'],
    defaultLayoutElements: [
      { element: 'main_headline', x: 0.08, y: 0.08, width: 0.84, height: 0.18, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.15, y: 0.28, width: 0.70, height: 0.42, alignment: 'center', layer: 5 },
      { element: 'feature_list', x: 0.08, y: 0.72, width: 0.84, height: 0.12, alignment: 'center', layer: 15 },
      { element: 'cta', x: 0.20, y: 0.88, width: 0.60, height: 0.06, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'typography-first-ad',
    name: 'Typography-first Advertisement',
    description: 'Bold copy-led advertisement where massive, provocative typography dominates the canvas with product as supporting anchor.',
    suitableObjectives: ['awareness', 'engagement', 'launch'],
    suitableIndustries: ['media', 'fashion', 'streetwear', 'disruptive-d2c', 'beverage'],
    recommendedVisualHierarchy: [
      'Level 1: Giant, thumb-stopping provocative statement occupying 50%+ of canvas',
      'Level 2: Minimalist high-contrast color scheme',
      'Level 3: Compact product cutout anchored at the bottom corner',
      'Level 4: Snappy CTA button',
    ],
    compositionCharacteristics: 'Extreme typographical scale, tight line-height, stark two-tone color contrast, and minimal decorative noise.',
    typographyRecommendations: 'Ultra-bold Swiss/Grotesque style (e.g. Anton, Archivo Black, Impact) spanning edge-to-edge.',
    productPlacementGuidance: 'Bottom-right corner anchor or overlapping the typography with clean clipping mask.',
    suitableGraphicElements: ['highlight_strip', 'text_marquee', 'minimal_corner_label'],
    commonMistakesToAvoid: ['Weak, timid headline copy', 'Low color contrast', 'Hard-to-read script fonts'],
    defaultLayoutElements: [
      { element: 'main_headline', x: 0.06, y: 0.08, width: 0.88, height: 0.45, alignment: 'left', layer: 20 },
      { element: 'subheadline', x: 0.06, y: 0.55, width: 0.50, height: 0.10, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.55, y: 0.50, width: 0.40, height: 0.42, alignment: 'right', layer: 25 },
      { element: 'cta', x: 0.06, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 20 },
    ],
  },
  {
    id: 'product-hero-ad',
    name: 'Product Hero Advertisement',
    description: 'Ultra-clean focus on product craftsmanship, packaging textures, premium materials, and macro beauty lighting.',
    suitableObjectives: ['awareness', 'consideration', 'launch'],
    suitableIndustries: ['cosmetics', 'perfume', 'watches', 'smartphones', 'gourmet'],
    recommendedVisualHierarchy: [
      'Level 1: Majestic hero product filling 60%+ of the canvas with flawless lighting',
      'Level 2: Subtle luxury brand logo top-center',
      'Level 3: Minimalist product name and signature feature phrase',
      'Level 4: Refined purchase or exploration CTA',
    ],
    compositionCharacteristics: 'Studio macro hero perspective with dramatic rim light and pristine surface reflections.',
    typographyRecommendations: 'Understated elegant typography letting the visual product craftsmanship speak.',
    productPlacementGuidance: 'Monumental central anchor, high scale (60%–75% of canvas height).',
    suitableGraphicElements: ['lighting_lens_flare', 'clean_glow_halo', 'brand_crest'],
    commonMistakesToAvoid: ['Distorted or blurry product texture', 'Distracting background elements', 'Overpowering typography'],
    defaultLayoutElements: [
      { element: 'logo', x: 0.35, y: 0.06, width: 0.30, height: 0.05, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.15, y: 0.18, width: 0.70, height: 0.62, alignment: 'center', layer: 5 },
      { element: 'main_headline', x: 0.08, y: 0.82, width: 0.84, height: 0.07, alignment: 'center', layer: 20 },
      { element: 'cta', x: 0.30, y: 0.90, width: 0.40, height: 0.05, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'seasonal-festival-ad',
    name: 'Seasonal / Festival Advertisement',
    description: 'Festive thematic creative tailored for cultural celebrations (Diwali, Holi, New Year, Black Friday, Summer).',
    suitableObjectives: ['sales', 'awareness', 'engagement'],
    suitableIndustries: ['gifting', 'sweets', 'fashion', 'jewellery', 'electronics', 'food'],
    recommendedVisualHierarchy: [
      'Level 1: Festive seasonal greeting and campaign hook ("Celebrate with Joy", "Diwali Special")',
      'Level 2: Limited edition festive packaging or gift box hero',
      'Level 3: Festive bonus / gifting discount badge',
      'Level 4: Gifting CTA button with fast delivery promise',
    ],
    compositionCharacteristics: 'Festive ambient lighting (warm golden bokeh, diya glow, festive colors) with seasonal motifs.',
    typographyRecommendations: 'Festive display typography paired with warm celebration accent colors (gold, deep crimson, saffron).',
    productPlacementGuidance: 'Centered or displayed inside a luxury festive gift hampering context.',
    suitableGraphicElements: ['festive_sparkles', 'golden_ribbon', 'gift_tag_badge', 'bokeh_particles'],
    commonMistakesToAvoid: ['Generic festive clipart', 'Clashing cultural motifs', 'Neglecting clear delivery cutoff dates'],
    defaultLayoutElements: [
      { element: 'badge', x: 0.25, y: 0.06, width: 0.50, height: 0.06, alignment: 'center', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.18, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45, alignment: 'center', layer: 5 },
      { element: 'subheadline', x: 0.10, y: 0.82, width: 0.80, height: 0.05, alignment: 'center', layer: 20 },
      { element: 'cta', x: 0.20, y: 0.88, width: 0.60, height: 0.06, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'problem-solution-ad',
    name: 'Problem-solution Advertisement',
    description: 'Directly hooks a severe customer frustration and presents the product as the effortless, decisive antidote.',
    suitableObjectives: ['sales', 'consideration', 'leads'],
    suitableIndustries: ['health', 'cleaning', 'skincare', 'productivity', 'pet-care'],
    recommendedVisualHierarchy: [
      'Level 1: Frustration callout / empathetic question ("Tired of Dry Flaky Skin?")',
      'Level 2: Contrast visual showing the daily struggle vs the instant solution',
      'Level 3: Transformative hero product presentation with relief cue',
      'Level 4: Risk-free trial or Money-back guarantee badge with CTA',
    ],
    compositionCharacteristics: 'Before-and-after or struggle-to-triumph visual split with high emotional resonance.',
    typographyRecommendations: 'Bold high-contrast problem headline transitioning into clean solution subheadline.',
    productPlacementGuidance: 'Positioned prominently as the heroic solution on the lower or right side of the visual split.',
    suitableGraphicElements: ['problem_cross_icon', 'solution_check_icon', 'guarantee_seal', 'arrow_transition'],
    commonMistakesToAvoid: ['Making the problem visual gross or repulsive', 'Unclear connection between problem and product', 'Overpromising cure claims'],
    defaultLayoutElements: [
      { element: 'main_headline', x: 0.08, y: 0.10, width: 0.84, height: 0.18, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.12, y: 0.32, width: 0.76, height: 0.46, alignment: 'center', layer: 5 },
      { element: 'subheadline', x: 0.10, y: 0.80, width: 0.80, height: 0.06, alignment: 'center', layer: 20 },
      { element: 'cta', x: 0.15, y: 0.87, width: 0.70, height: 0.07, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'product-range-ad',
    name: 'Product Range Advertisement',
    description: 'Lineup composition showcasing multiple product flavors, shades, sizes, or variants in a unified brand family.',
    suitableObjectives: ['awareness', 'consideration', 'sales'],
    suitableIndustries: ['food', 'beverage', 'cosmetics', 'apparel', 'personal-care'],
    recommendedVisualHierarchy: [
      'Level 1: Family headline ("Find Your Favorite Flavor", "The Complete Collection")',
      'Level 2: Symmetrical or stepped lineup of 3 to 5 product variants',
      'Level 3: Variety pack / sampler bundle offer badge',
      'Level 4: "Shop the Collection" CTA',
    ],
    compositionCharacteristics: 'Horizontal or staggered lineup with equal spacing, consistent lighting, and clean cast shadows.',
    typographyRecommendations: 'Inclusive, welcoming typography inviting exploration.',
    productPlacementGuidance: 'Grouped multi-product lineup spanning the horizontal width with the flagship in the center.',
    suitableGraphicElements: ['variant_dots', 'bundle_savings_tag', 'sampler_badge'],
    commonMistakesToAvoid: ['Cramming too many products until labels are illegible', 'Mismatched scale across variants', 'Cropping edge bottles'],
    defaultLayoutElements: [
      { element: 'logo', x: 0.35, y: 0.06, width: 0.30, height: 0.05, alignment: 'center', layer: 20 },
      { element: 'main_headline', x: 0.08, y: 0.13, width: 0.84, height: 0.14, alignment: 'center', layer: 20 },
      { element: 'product', x: 0.05, y: 0.32, width: 0.90, height: 0.46, alignment: 'center', layer: 5 },
      { element: 'subheadline', x: 0.10, y: 0.80, width: 0.80, height: 0.05, alignment: 'center', layer: 20 },
      { element: 'cta', x: 0.20, y: 0.87, width: 0.60, height: 0.07, alignment: 'center', layer: 25 },
    ],
  },
  {
    id: 'founder-expert-led-ad',
    name: 'Founder / Expert-led Advertisement',
    description: 'Humanizing the brand with founder notes, dermatologist endorsements, or head-chef craftsmanship stories.',
    suitableObjectives: ['awareness', 'consideration', 'trust'],
    suitableIndustries: ['skincare', 'gourmet', 'specialty-coffee', 'artisanal', 'wellness'],
    recommendedVisualHierarchy: [
      'Level 1: Personal letter / quote heading from the founder or certified specialist',
      'Level 2: Founder / specialist portrait alongside product creation in workshop/lab',
      'Level 3: Handcrafted signature or expert credential badge',
      'Level 4: Warm community-focused CTA',
    ],
    compositionCharacteristics: 'Warm candid documentary feel with natural wood, studio laboratory, or kitchen background.',
    typographyRecommendations: 'Editorial serif paired with cursive script signature and clean modern sans captioning.',
    productPlacementGuidance: 'Product held by or placed on the table next to the founder/expert.',
    suitableGraphicElements: ['founder_signature', 'expert_credentials_seal', 'quotation_marks'],
    commonMistakesToAvoid: ['Corporate headshot look', 'Hiding the product behind the person', 'Overly formal legalese'],
    defaultLayoutElements: [
      { element: 'badge', x: 0.08, y: 0.06, width: 0.40, height: 0.05, alignment: 'left', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.13, width: 0.84, height: 0.18, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.44, alignment: 'center', layer: 5 },
      { element: 'subheadline', x: 0.08, y: 0.80, width: 0.60, height: 0.06, alignment: 'left', layer: 20 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.45, height: 0.06, alignment: 'left', layer: 20 },
    ],
  },
];

const FORMATS_BY_ID = new Map(ADVERTISING_FORMATS.map((f) => [f.id, f]));

export const FORMAT_VISUAL_STRUCTURES: Record<string, string> = {
  'promotional-retail-poster': 'hero_centered',
  'editorial-product-ad': 'hero_centered',
  'product-hero-ad': 'hero_centered',
  'seasonal-festival-ad': 'hero_centered',
  'dynamic-product-ad': 'dynamic_diagonal',
  'ingredient-feature-spotlight': 'annotated_grid',
  'benefit-infographic': 'annotated_grid',
  'comparison-ad': 'split_comparative',
  'problem-solution-ad': 'split_comparative',
  'offer-led-ad': 'multi_product_lineup',
  'product-range-ad': 'multi_product_lineup',
  'lifestyle-ad': 'lifestyle_in_situ',
  'founder-expert-led-ad': 'lifestyle_in_situ',
  'social-proof-ad': 'social_card',
  'typography-first-ad': 'copy_dominant',
};

export function getFormatVisualStructure(formatId: string): string {
  return FORMAT_VISUAL_STRUCTURES[formatId] || 'hero_centered';
}

export function getAdvertisingFormat(id: string): AdvertisingFormatDefinition | undefined {
  const fmt = FORMATS_BY_ID.get(id);
  if (fmt && !fmt.visualStructure) {
    fmt.visualStructure = getFormatVisualStructure(fmt.id);
  }
  return fmt;
}

export function listAdvertisingFormats(): AdvertisingFormatDefinition[] {
  return ADVERTISING_FORMATS.map((f) => ({
    ...f,
    visualStructure: f.visualStructure || getFormatVisualStructure(f.id),
  }));
}

/**
 * Matches suitable formats for a concept angle, goal and category.
 * Prevents repetitiveness by spreading different formats across the creative mix.
 */
export function matchFormatsForConcept(params: {
  pillar: string;
  goal?: string;
  category?: string;
  usedFormatIds?: string[];
}): AdvertisingFormatDefinition {
  const { pillar, goal = 'sales', usedFormatIds = [] } = params;
  const pLower = pillar.toLowerCase();
  const gLower = goal.toLowerCase() as CampaignGoal;

  // Keyword-based heuristic scoring
  const scores = ADVERTISING_FORMATS.map((fmt) => {
    let score = 0;
    if (usedFormatIds.includes(fmt.id)) score -= 10; // penalty for already used format to promote variety

    if (fmt.suitableObjectives.includes(gLower)) score += 3;

    if (pLower.includes('urgency') || pLower.includes('speed') || pLower.includes('fast') || pLower.includes('time')) {
      if (fmt.id === 'promotional-retail-poster' || fmt.id === 'dynamic-product-ad') score += 8;
    }
    if (pLower.includes('offer') || pLower.includes('discount') || pLower.includes('deal') || pLower.includes('price')) {
      if (fmt.id === 'offer-led-ad' || fmt.id === 'promotional-retail-poster') score += 10;
    }
    if (pLower.includes('ingredient') || pLower.includes('feature') || pLower.includes('formula') || pLower.includes('protein')) {
      if (fmt.id === 'ingredient-feature-spotlight' || fmt.id === 'benefit-infographic') score += 10;
    }
    if (pLower.includes('proof') || pLower.includes('review') || pLower.includes('rating') || pLower.includes('social')) {
      if (fmt.id === 'social-proof-ad') score += 10;
    }
    if (
      pLower.includes('compare') ||
      pLower.includes('vs') ||
      pLower.includes('versus') ||
      pLower.includes('beat') ||
      pLower.includes('better') ||
      pLower.includes('problem') ||
      pLower.includes('solve')
    ) {
      if (fmt.id === 'comparison-ad' || fmt.id === 'problem-solution-ad') score += 9;
    }
    if (pLower.includes('luxury') || pLower.includes('editorial') || pLower.includes('craft') || pLower.includes('pure')) {
      if (fmt.id === 'editorial-product-ad' || fmt.id === 'product-hero-ad') score += 8;
    }
    if (pLower.includes('lifestyle') || pLower.includes('routine') || pLower.includes('day')) {
      if (fmt.id === 'lifestyle-ad') score += 8;
    }

    return { fmt, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.fmt || ADVERTISING_FORMATS[0];
}
