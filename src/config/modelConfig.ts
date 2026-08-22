/**
 * CENTRAL MODEL ARCHITECTURE CONFIGURATION (ZeperAI)
 * 
 * Rules:
 * 1. Imagen models are completely removed (discontinued by Google as of Aug 17, 2026).
 * 2. All generation runs on Google's Nano Banana family:
 *    - Nano Banana 2 Lite: Fastest & most cost-effective (Default for all Free accounts & simple edits)
 *    - Nano Banana 2: Balanced quality, speed & cost (Standard for Paid accounts)
 *    - Nano Banana Pro: Flagship photorealism & composition (Pro for Paid accounts)
 * 3. Free accounts automatically use Nano Banana 2 Lite without quality/model selector.
 * 4. Paid accounts have a clean Quality selector: [ Standard (1 Credit) | Pro (2 Credits) ].
 */

import { AppMode } from '../../types.js';

export enum GenerationQuality {
  Standard = 'Standard',
  Pro = 'Pro',
}

export enum InternalModelId {
  NanoBanana2Lite = 'nano-banana-2-lite',
  NanoBanana2 = 'nano-banana-2',
  NanoBananaPro = 'nano-banana-pro',
}

export interface ModelDefinition {
  id: InternalModelId;
  displayName: string;
  apiModel: string;
  credits: number;
  badge: string;
  tagline: string;
  description: string;
  recommendedFor: string[];
}

export const MODEL_REGISTRY: Record<InternalModelId, ModelDefinition> = {
  [InternalModelId.NanoBanana2Lite]: {
    id: InternalModelId.NanoBanana2Lite,
    displayName: 'Nano Banana 2 Lite',
    apiModel: 'gemini-2.5-flash-image',
    credits: 1,
    badge: 'Fast & Efficient',
    tagline: 'Cheapest and fastest generation',
    description: 'Ultra-fast, cost-effective generation optimized for rapid prototyping, background cleanup, and high-volume iterations.',
    recommendedFor: [
      'Simple product backgrounds',
      'Basic variations & colorways',
      'Quick draft generations',
      'Simple product edits',
      'High-volume catalog sweeps',
      'Free tier generations'
    ]
  },
  [InternalModelId.NanoBanana2]: {
    id: InternalModelId.NanoBanana2,
    displayName: 'Nano Banana 2',
    apiModel: 'gemini-3.1-flash-image',
    credits: 1,
    badge: 'Standard Quality',
    tagline: 'Balanced quality, speed and cost',
    description: 'General-purpose studio workhorse delivering rich textures, natural studio lighting, and high-CTR social media ad creatives.',
    recommendedFor: [
      'Product photography & studio backdrops',
      'Lifestyle & tabletop scenes',
      'Product-to-studio transformations',
      'Indian & Global influencer model shoots',
      'CGI-style 3D product creatives',
      'General D2C advertising banners'
    ]
  },
  [InternalModelId.NanoBananaPro]: {
    id: InternalModelId.NanoBananaPro,
    displayName: 'Nano Banana Pro',
    apiModel: 'gemini-3-pro-image',
    credits: 2,
    badge: 'Pro Flagship',
    tagline: 'Highest-quality professional asset generation',
    description: 'Flagship generative model engineered for intricate textures, precise brand consistency, complex multi-reference compositions, and text rendering.',
    recommendedFor: [
      'Complex multi-product compositions',
      'High-end print & billboard advertising',
      'Precise brand identity & logo adherence',
      'Multi-reference fashion catalog workflows',
      'Fine jewellery, glass, & cosmetic packaging',
      'Production campaign assets'
    ]
  }
};

/**
 * Resolves the appropriate model definition based on user tier and requested quality.
 * Enforces Free-tier isolation: Free users ALWAYS receive Nano Banana 2 Lite.
 */
export function resolveModelForGeneration(
  userTier: string = 'Free',
  quality?: GenerationQuality | string,
  appMode?: AppMode
): ModelDefinition {
  const isPaid = userTier === 'Pro' || userTier === 'PayAsYouGo' || userTier === 'Agency' || userTier === 'Standard';

  // 1. Free tier rule: ALWAYS use Nano Banana 2 Lite
  if (!isPaid) {
    return MODEL_REGISTRY[InternalModelId.NanoBanana2Lite];
  }

  // 2. Paid tier rule: Map quality selection
  if (quality === GenerationQuality.Pro || quality === 'Pro' || quality === 'pro') {
    return MODEL_REGISTRY[InternalModelId.NanoBananaPro];
  }

  // Default for paid tier is Standard -> Nano Banana 2
  return MODEL_REGISTRY[InternalModelId.NanoBanana2];
}

/**
 * Calculates the credit cost for a single generated image given the resolved model.
 */
export function getModelCreditCost(
  userTier: string = 'Free',
  quality?: GenerationQuality | string,
  appMode?: AppMode
): number {
  const model = resolveModelForGeneration(userTier, quality, appMode);
  return model.credits;
}
