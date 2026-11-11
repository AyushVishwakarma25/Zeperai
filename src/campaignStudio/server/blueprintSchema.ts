/**
 * CAMPAIGN STUDIO V2 - Creative Blueprint Schema & Runtime Validation.
 *
 * Implements strict runtime validation and coordinate normalization for
 * advertising design blueprints.
 */

import { z } from 'zod';
import type {
  BlueprintGraphicElement,
  BrandContext,
  CampaignStrategy,
  CreativeBlueprint,
  CreativeConcept,
  DesignIntensity,
  NormalizedBoundingBox,
} from '../types.js';
import type { ValidationResult } from './validation.js';

export const DESIGN_INTENSITIES: readonly DesignIntensity[] = [
  'minimal',
  'balanced',
  'bold',
  'experimental',
] as const;

export const clamp01 = (val: unknown, fallback: number = 0): number => {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
  if (isNaN(n)) return Math.max(0, Math.min(1, fallback));
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
};

export const normalizedBoundingBoxSchema = z.object({
  element: z.string().min(1).max(80),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.01).max(1),
  height: z.number().min(0.01).max(1),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  layer: z.number().int().min(0).max(100).optional(),
});

export const blueprintGraphicElementSchema = z.object({
  type: z.string().min(1).max(60),
  description: z.string().min(1).max(300),
  position: normalizedBoundingBoxSchema,
  style: z.object({
    backgroundColor: z.string().max(50).optional(),
    textColor: z.string().max(50).optional(),
    borderColor: z.string().max(50).optional(),
    borderRadius: z.number().min(0).max(999).optional(),
    opacity: z.number().min(0).max(1).optional(),
  }),
});

export const creativeBlueprintSchema = z.object({
  id: z.string().min(1).max(100),
  campaignId: z.string().optional(),
  conceptId: z.string().min(1).max(80),
  version: z.number().int().min(1).default(1),
  status: z.enum(['draft', 'approved', 'superseded']).default('draft'),

  marketingAngle: z.string().min(1).max(200),
  advertisingFormat: z.string().min(1).max(100),
  designIntensity: z.enum(['minimal', 'balanced', 'bold', 'experimental']).default('balanced'),

  designConcept: z.string().min(1).max(600),
  visualNarrative: z.string().min(1).max(800),

  canvas: z.object({
    width: z.number().int().positive().default(1080),
    height: z.number().int().positive().default(1350),
    aspectRatio: z.string().min(1).max(20).default('4:5'),
  }),

  artDirection: z.object({
    visualStyle: z.string().min(1).max(400),
    mood: z.string().min(1).max(300),
    background: z.string().min(1).max(500),
    colorPalette: z.array(z.string().max(50)).min(1).max(10),
    photographyStyle: z.string().min(1).max(400),
    lighting: z.string().min(1).max(300),
  }),

  layout: z.object({
    composition: z.string().min(1).max(600),
    readingOrder: z.array(z.string().max(100)).min(1).max(10),
    productPlacement: z.string().min(1).max(300),
    productScale: z.number().min(0.05).max(1.0).default(0.55),
    safeZones: z.array(normalizedBoundingBoxSchema).default([]),
    elements: z.array(normalizedBoundingBoxSchema).min(1),
  }),

  typography: z.object({
    headlineStyle: z.object({
      fontFamily: z.string().min(1).max(80).default('Poppins'),
      fontWeight: z.union([z.string(), z.number()]).default(800),
      fontSizeHint: z.string().min(1).max(50).default('hero'),
      color: z.string().min(1).max(50).default('#FFFFFF'),
      letterSpacing: z.string().max(30).optional(),
      lineHeight: z.string().max(30).optional(),
      textTransform: z.enum(['uppercase', 'none', 'capitalize']).optional(),
    }),
    subheadlineStyle: z
      .object({
        fontFamily: z.string().min(1).max(80).default('Inter'),
        fontWeight: z.union([z.string(), z.number()]).default(500),
        fontSizeHint: z.string().max(50).optional(),
        color: z.string().min(1).max(50).default('#E2E8F0'),
      })
      .optional(),
    bodyStyle: z
      .object({
        fontFamily: z.string().min(1).max(80).default('Inter'),
        fontWeight: z.union([z.string(), z.number()]).default(400),
        color: z.string().min(1).max(50).default('#CBD5E1'),
      })
      .optional(),
    hierarchy: z
      .array(
        z.object({
          level: z.string().min(1).max(50),
          priority: z.number().int().min(1).max(10),
          role: z.string().min(1).max(200),
        }),
      )
      .default([]),
  }),

  copy: z.object({
    headline: z.string().min(1).max(200),
    subheadline: z.string().max(300).optional(),
    body: z.string().max(800).optional(),
    offer: z.string().max(200).optional(),
    price: z.string().max(100).optional(),
    cta: z.string().min(1).max(100),
    disclaimer: z.string().max(400).optional(),
  }),

  graphicElements: z.array(blueprintGraphicElementSchema).default([]),

  assets: z.object({
    productAssetIds: z.array(z.string()).default([]),
    referenceIds: z.array(z.string()).default([]),
    logoAssetId: z.string().optional(),
  }),

  constraints: z.object({
    preserveProductPackaging: z.boolean().default(true),
    preserveLogo: z.boolean().default(true),
    exactCopyRequired: z.boolean().default(true),
    prohibitInventedClaims: z.boolean().default(true),
  }),
});

/** Normalizes and clamps a raw bounding box into safe resolution-independent [0.0 - 1.0] space. */
export function normalizeBoundingBox(raw: any, fallbackElement: string = 'element'): NormalizedBoundingBox {
  const element = typeof raw?.element === 'string' && raw.element.trim().length > 0 ? raw.element.trim().slice(0, 80) : fallbackElement;
  const x = clamp01(raw?.x, 0.05);
  const y = clamp01(raw?.y, 0.05);
  // Ensure width and height don't exceed remaining bounds
  const rawW = clamp01(raw?.width, 0.5);
  const rawH = clamp01(raw?.height, 0.2);
  const width = Math.min(rawW, Math.max(0.02, 1.0 - x));
  const height = Math.min(rawH, Math.max(0.02, 1.0 - y));

  let alignment: 'left' | 'center' | 'right' | undefined;
  if (raw?.alignment === 'left' || raw?.alignment === 'center' || raw?.alignment === 'right') {
    alignment = raw.alignment;
  } else if (x > 0.35 && x < 0.65 && width < 0.8) {
    alignment = 'center';
  } else {
    alignment = 'left';
  }

  const layer = typeof raw?.layer === 'number' && Number.isFinite(raw.layer) ? Math.max(0, Math.min(100, Math.round(raw.layer))) : 10;

  return {
    element,
    x,
    y,
    width,
    height,
    alignment,
    layer,
  };
}

/** Pure runtime validation for a Creative Blueprint. */
export function validateCreativeBlueprint(input: unknown): ValidationResult<CreativeBlueprint> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Creative Blueprint must be a valid JSON object.' };
  }

  const result = creativeBlueprintSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error?.issues || (result.error as any)?.errors || [];
    const errorDetails = issues.map((e: any) => `${(e.path || []).join('.')}: ${e.message}`).join(', ');
    return { ok: false, error: `Invalid Creative Blueprint: ${(errorDetails || result.error?.message || 'schema mismatch').slice(0, 400)}` };
  }

  return { ok: true, value: result.data as CreativeBlueprint };
}

/**
 * Creates a complete, strongly-typed Creative Blueprint from a concept and its context.
 * Used when upgrading a legacy concept or initializing default layout intelligence.
 */
export function createDefaultBlueprintFromConcept(params: {
  concept: CreativeConcept;
  brand: BrandContext;
  strategy?: CampaignStrategy;
  aspectRatio?: string;
  designIntensity?: DesignIntensity;
  runId?: string;
}): CreativeBlueprint {
  const { concept, brand, strategy, aspectRatio = '4:5', designIntensity = 'balanced', runId } = params;

  const primaryColor = brand.visualIdentity?.colors?.[0]?.hex || '#0A0A0A';
  const secondaryColor = brand.visualIdentity?.colors?.[1]?.hex || '#F59E0B';
  const brandFont = brand.visualIdentity?.typography || 'Poppins';

  const isPortrait = aspectRatio === '4:5' || aspectRatio === '3:4';
  const isStory = aspectRatio === '9:16';
  const width = isStory ? 1080 : isPortrait ? 1080 : 1080;
  const height = isStory ? 1920 : isPortrait ? 1350 : 1080;

  // Layout element positions tailored by design intensity
  const elements: NormalizedBoundingBox[] = [];
  const graphicElements: BlueprintGraphicElement[] = [];

  if (designIntensity === 'minimal') {
    elements.push(
      { element: 'logo', x: 0.1, y: 0.08, width: 0.25, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'main_headline', x: 0.1, y: 0.16, width: 0.8, height: 0.14, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.15, y: 0.35, width: 0.7, height: 0.45, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.1, y: 0.86, width: 0.35, height: 0.06, alignment: 'left', layer: 20 },
    );
  } else if (designIntensity === 'bold') {
    elements.push(
      { element: 'badge', x: 0.08, y: 0.06, width: 0.38, height: 0.06, alignment: 'left', layer: 25 },
      { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.2, alignment: 'left', layer: 20 },
      { element: 'subheadline', x: 0.08, y: 0.35, width: 0.84, height: 0.08, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.2, y: 0.44, width: 0.65, height: 0.4, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.08, y: 0.88, width: 0.84, height: 0.07, alignment: 'center', layer: 25 },
    );
    graphicElements.push({
      type: 'discount_pill',
      description: 'High contrast badge highlighting the offer or primary benefit',
      position: { element: 'badge', x: 0.08, y: 0.06, width: 0.38, height: 0.06, alignment: 'left', layer: 25 },
      style: {
        backgroundColor: secondaryColor,
        textColor: '#FFFFFF',
        borderRadius: 999,
      },
    });
  } else if (designIntensity === 'experimental') {
    elements.push(
      { element: 'accent_shape', x: 0.0, y: 0.0, width: 0.45, height: 0.5, alignment: 'left', layer: 2 },
      { element: 'main_headline', x: 0.08, y: 0.1, width: 0.65, height: 0.22, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.3, y: 0.28, width: 0.65, height: 0.52, alignment: 'right', layer: 8 },
      { element: 'subheadline', x: 0.08, y: 0.65, width: 0.5, height: 0.1, alignment: 'left', layer: 20 },
      { element: 'cta', x: 0.08, y: 0.82, width: 0.4, height: 0.07, alignment: 'left', layer: 25 },
    );
  } else {
    // 'balanced' (default)
    elements.push(
      { element: 'logo', x: 0.08, y: 0.06, width: 0.28, height: 0.05, alignment: 'left', layer: 20 },
      { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.18, alignment: 'left', layer: 20 },
      { element: 'product', x: 0.15, y: 0.35, width: 0.7, height: 0.46, alignment: 'center', layer: 5 },
      { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07, alignment: 'left', layer: 20 },
    );
    if (concept.subheadline) {
      elements.splice(2, 0, {
        element: 'subheadline',
        x: 0.08,
        y: 0.31,
        width: 0.84,
        height: 0.07,
        alignment: 'left',
        layer: 18,
      });
    }
  }

  const safeZones: NormalizedBoundingBox[] = [
    { element: 'top_safe_zone', x: 0.0, y: 0.0, width: 1.0, height: 0.05 },
    { element: 'bottom_safe_zone', x: 0.0, y: 0.95, width: 1.0, height: 0.05 },
    { element: 'left_safe_zone', x: 0.0, y: 0.0, width: 0.05, height: 1.0 },
    { element: 'right_safe_zone', x: 0.95, y: 0.0, width: 0.05, height: 1.0 },
  ];

  return {
    id: `blueprint-${concept.id}-v1`,
    campaignId: runId,
    conceptId: concept.id,
    version: 1,
    status: 'draft',

    marketingAngle: concept.pillar,
    advertisingFormat: 'Promotional Product Advertisement',
    designIntensity,

    designConcept: concept.visualIdea,
    visualNarrative: concept.storyline,

    canvas: {
      width,
      height,
      aspectRatio,
    },

    artDirection: {
      visualStyle: `${brand.category} commercial advertising with high visual hierarchy`,
      mood: brand.voice?.tone?.join(', ') || 'professional, confident',
      background: concept.composition || 'Studio environment with soft directional lighting',
      colorPalette: brand.visualIdentity?.colors?.map((c) => c.hex) || [primaryColor, secondaryColor],
      photographyStyle: 'Premium editorial commercial photography with clean shadows',
      lighting: 'Balanced commercial studio illumination with crisp edge separation',
    },

    layout: {
      composition: concept.composition,
      readingOrder: ['logo', 'badge', 'main_headline', 'subheadline', 'product', 'cta'],
      productPlacement: 'Center-forward anchor with realistic cast shadows',
      productScale: 0.65,
      safeZones,
      elements,
    },

    typography: {
      headlineStyle: {
        fontFamily: brandFont,
        fontWeight: 800,
        fontSizeHint: 'hero',
        color: '#FFFFFF',
        textTransform: 'none',
      },
      subheadlineStyle: {
        fontFamily: 'Inter',
        fontWeight: 500,
        fontSizeHint: 'medium',
        color: '#E2E8F0',
      },
      hierarchy: [
        { level: 'H1', priority: 1, role: 'Main campaign headline' },
        { level: 'H2', priority: 2, role: 'Supporting subheadline or proof point' },
        { level: 'CTA', priority: 3, role: 'Action button' },
      ],
    },

    copy: {
      headline: concept.headline,
      subheadline: concept.subheadline,
      offer: strategy?.offer,
      cta: concept.cta,
    },

    graphicElements,

    assets: {
      productAssetIds: [],
      referenceIds: [],
      logoAssetId: brand.visualIdentity?.logoUrl,
    },

    constraints: {
      preserveProductPackaging: true,
      preserveLogo: true,
      exactCopyRequired: true,
      prohibitInventedClaims: true,
    },
  };
}
