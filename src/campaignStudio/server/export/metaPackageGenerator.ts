/**
 * CAMPAIGN STUDIO V2 - Meta Ad Package & Copy Generation Engine.
 *
 * Produces structured ad packages for Meta Ads Manager, Instagram, and Facebook ads:
 *  - Primary Text: 3 variations (Hook-driven, Benefit-driven, Question-driven) <= 250 chars
 *  - Headline: 3 punchy variations <= 40 chars
 *  - Descriptions: 3 high-intent variations <= 30 chars
 *  - CTA Button Mapping: SHOP_NOW, ORDER_NOW, LEARN_MORE, GET_OFFER, etc.
 *  - Campaign Objectives & Placement Strategy
 */

import type {
  BrandContext,
  CampaignAsset,
  CampaignRun,
  CreativeBlueprint,
  CreativeDocument,
  MasterPrompt,
  MetaCampaignPackage,
  MetaConceptAdPackage,
  MetaCopyPackage,
  MetaCtaType,
  StandardAspectRatio,
  Strategy,
} from '../../types.js';
import { adaptMasterCreativeToAllFormats, META_PLACEMENT_SPECS } from '../adaptation/creativeAdapter.js';

/**
 * Trims a string at the nearest word boundary without exceeding maxLength.
 */
export function clampToWordBoundary(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > maxLength * 0.7 ? cut.slice(0, lastSpace).trim() : cut.trim();
}

/**
 * Resolves appropriate Meta Call To Action button based on offer and marketing angle.
 */
export function resolveMetaCta(offer?: string, angle?: string, defaultCta?: string): MetaCtaType {
  const text = `${offer || ''} ${angle || ''} ${defaultCta || ''}`.toLowerCase();
  if (text.includes('free') || text.includes('trial') || text.includes('sample')) {
    return 'GET_OFFER';
  }
  if (text.includes('discount') || text.includes('off') || text.includes('deal') || text.includes('sale')) {
    return 'GET_OFFER';
  }
  if (text.includes('order') || text.includes('buy') || text.includes('purchase')) {
    return 'ORDER_NOW';
  }
  if (text.includes('how it works') || text.includes('discover') || text.includes('read')) {
    return 'LEARN_MORE';
  }
  return 'SHOP_NOW';
}

/**
 * Generates Meta-compliant copy variations for a campaign concept.
 */
export function generateMetaCopyPackage(params: {
  brand: BrandContext;
  conceptHeadline: string;
  conceptSubheadline?: string;
  conceptCta?: string;
  pillar: string;
  offer?: string;
}): MetaCopyPackage {
  const { brand, conceptHeadline, conceptSubheadline, conceptCta, pillar, offer } = params;

  const primaryUsp = brand.usps?.[0] || 'Premium Quality Guaranteed';
  const primaryPain = brand.audience?.painPoints?.[0] || 'compromised quality';
  const primaryDesire = brand.audience?.desires?.[0] || 'peak performance and confidence';

  // 1. Primary Text Variations (Meta recommended: <= 125 chars, hard limit: <= 250 chars)
  const var1Hook = offer
    ? `${offer}: ${conceptHeadline}. Engineered for ${primaryDesire} without ${primaryPain}. Tap to claim now.`
    : `${conceptHeadline}. Built specifically for ${primaryDesire}. Upgrade your routine today.`;

  const var2Benefit = `${conceptHeadline}. ${primaryUsp}. Experience the difference with ${brand.brandName}. Delivered fast to your door.`;

  const var3Question = `Tired of ${primaryPain}? ${conceptHeadline}. Designed for real results. ${offer ? `Get ${offer} today.` : 'Shop now.'}`;

  const primaryText = [
    clampToWordBoundary(var1Hook, 240),
    clampToWordBoundary(var2Benefit, 240),
    clampToWordBoundary(var3Question, 240),
  ];

  // 2. Headlines (Meta recommended: <= 40 chars)
  const h1 = clampToWordBoundary(conceptHeadline, 40);
  const h2 = offer
    ? clampToWordBoundary(`${offer} — ${conceptHeadline}`, 40)
    : clampToWordBoundary(`${primaryUsp} | ${brand.brandName}`, 40);
  const h3 = clampToWordBoundary(`${brand.brandName}: ${conceptHeadline}`, 40);

  const headlines = [h1, h2, h3];

  // 3. Descriptions (Meta recommended: <= 30 chars)
  const d1 = offer ? clampToWordBoundary(offer, 30) : 'Free Express Delivery';
  const d2 = clampToWordBoundary('★ 4.9/5 Rated By Buyers', 30);
  const d3 = clampToWordBoundary('Limited Edition Restock', 30);

  const descriptions = [d1, d2, d3];

  const callToAction = resolveMetaCta(offer, pillar, conceptCta);

  return {
    primaryText,
    headlines,
    descriptions,
    callToAction,
  };
}

/**
 * Builds a complete Meta Campaign Package for an approved campaign run.
 */
export function buildMetaCampaignPackage(params: {
  run: CampaignRun;
  brand: BrandContext;
  strategy?: Strategy;
  prompts?: MasterPrompt[];
  assets: CampaignAsset[];
  blueprints?: CreativeBlueprint[];
}): MetaCampaignPackage {
  const { run, brand, strategy, prompts = [], assets, blueprints = [] } = params;

  const conceptPackages: MetaConceptAdPackage[] = [];

  // Group ready assets by creative index (1 to N)
  const readyAssets = assets.filter((a) => a.status === 'ready');
  const assetMap = new Map<number, CampaignAsset>();
  for (const asset of readyAssets) {
    if (!assetMap.has(asset.creative_index)) {
      assetMap.set(asset.creative_index, asset);
    }
  }

  const promptList = prompts.length > 0 ? prompts : [];
  const count = Math.max(promptList.length, assetMap.size);

  for (let idx = 1; idx <= count; idx++) {
    const asset = assetMap.get(idx);
    const prompt = promptList[idx - 1];
    const blueprint = blueprints.find((b) => b.conceptId === (prompt?.conceptId || `concept-${idx}`));

    const headline = prompt?.headline || blueprint?.copy.headline || asset?.overlay?.headline || `${brand.brandName} Essential`;
    const subheadline = prompt?.subheadline || blueprint?.copy.subheadline || asset?.overlay?.subheading || '';
    const cta = prompt?.cta || blueprint?.copy.cta || asset?.overlay?.cta || 'Shop Now';
    const pillar = prompt?.pillar || blueprint?.marketingAngle || 'Direct Response';
    const offer = blueprint?.copy.offer;

    const copy = generateMetaCopyPackage({
      brand,
      conceptHeadline: headline,
      conceptSubheadline: subheadline,
      conceptCta: cta,
      pillar,
      offer,
    });

    // Derive creative documents across all 4 aspect ratios
    let baseDoc = asset?.overlay?.document;
    if (!baseDoc) {
      // Create minimal fallback doc
      baseDoc = {
        id: `creative-${run.id}-${idx}`,
        conceptId: prompt?.conceptId || `concept-${idx}`,
        version: 1,
        advertisingFormat: blueprint?.advertisingFormat || 'Promotional Product Advertisement',
        designIntensity: 'balanced',
        canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
        layers: [
          {
            id: 'layer-background',
            name: 'Background',
            type: 'background',
            zIndex: 0,
            position: { x: 0, y: 0, width: 1, height: 1 },
            styles: { backgroundImage: asset?.image_url || '' },
          },
          {
            id: 'layer-headline',
            name: 'Headline',
            type: 'headline',
            zIndex: 10,
            position: { x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
            content: headline,
            styles: { color: '#FFFFFF', fontWeight: 800, fontSize: '44px' },
          },
          {
            id: 'layer-cta',
            name: 'Call To Action',
            type: 'cta',
            zIndex: 20,
            position: { x: 0.08, y: 0.84, width: 0.46, height: 0.07 },
            content: cta,
            styles: { backgroundColor: brand.visualIdentity?.colors?.[0]?.hex || '#4F46E5', color: '#FFFFFF' },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const adaptedVariations = adaptMasterCreativeToAllFormats(baseDoc);

    conceptPackages.push({
      conceptId: prompt?.conceptId || `concept-${idx}`,
      creativeIndex: idx,
      title: `${pillar}: ${headline}`,
      marketingAngle: pillar,
      advertisingFormat: blueprint?.advertisingFormat || 'Standard Social Ad',
      copy,
      variations: adaptedVariations,
    });
  }

  // Derive suggested targeting hooks
  const hooks: string[] = [
    `Primary Interest: ${brand.category}`,
    ...((brand.audience?.painPoints || []).slice(0, 2).map((p) => `Pain Point Angle: ${p}`)),
    ...((brand.usps || []).slice(0, 2).map((u) => `Value Proposition: ${u}`)),
  ];

  return {
    runId: run.id,
    brandName: brand.brandName,
    campaignObjective: 'Sales',
    concepts: conceptPackages,
    placementMapping: Object.values(META_PLACEMENT_SPECS),
    suggestedTargetingHooks: hooks,
    generatedAt: new Date().toISOString(),
  };
}

