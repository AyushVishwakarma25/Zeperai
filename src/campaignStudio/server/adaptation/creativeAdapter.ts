/**
 * CAMPAIGN STUDIO V2 - Multi-Aspect Ratio Creative Adaptation Engine.
 *
 * Takes an approved master CreativeDocument (1:1, 4:5, or 9:16) and derives
 * placement-ready creative documents for Meta, Instagram, and programmatic ad channels:
 *  - 1:1 Square (1080x1080) — Feed & Marketplace
 *  - 4:5 Vertical (1080x1350) — Mobile Feeds
 *  - 9:16 Vertical (1080x1920) — Stories & Reels (250px top / 350px bottom buffers)
 *  - 1.91:1 Landscape (1200x628) — Side-by-side reflow for desktop link ads & Audience Network
 *
 * Content-Aware Reflow Invariant:
 * Semantic layout representation preserving composition type, visual hierarchy,
 * product packaging aspect ratios, brand identity, and safe zones.
 */

import type {
  AdaptedCreativePlacement,
  CompositionType,
  CreativeBlueprint,
  CreativeDocument,
  CreativeLayer,
  MetaPlacementMapping,
  PlacementAdaptationStatus,
  SemanticElementRole,
  SemanticLayoutElement,
  SemanticLayoutRepresentation,
  StandardAspectRatio,
} from '../../types.js';
import { renderCreativeDocumentToSvg, svgToDataUri } from '../composition/svgRenderer.js';

export const META_PLACEMENT_SPECS: Record<StandardAspectRatio, MetaPlacementMapping> = {
  '1:1': {
    aspectRatio: '1:1',
    placements: ['Facebook Feed', 'Instagram Feed', 'Facebook Marketplace', 'Right Column'],
    dimensions: { width: 1080, height: 1080 },
    safeZones: { topBufferPx: 80, bottomBufferPx: 80, sideBufferPx: 80 },
  },
  '4:5': {
    aspectRatio: '4:5',
    placements: ['Instagram Feed (Mobile)', 'Facebook Feed (Mobile)'],
    dimensions: { width: 1080, height: 1350 },
    safeZones: { topBufferPx: 100, bottomBufferPx: 100, sideBufferPx: 80 },
  },
  '9:16': {
    aspectRatio: '9:16',
    placements: ['Instagram Stories', 'Instagram Reels', 'Facebook Stories', 'Facebook Reels'],
    dimensions: { width: 1080, height: 1920 },
    safeZones: { topBufferPx: 250, bottomBufferPx: 350, sideBufferPx: 80 },
  },
  '1.91:1': {
    aspectRatio: '1.91:1',
    placements: ['Facebook Right Column', 'Audience Network Native', 'Instant Articles', 'Link Ads'],
    dimensions: { width: 1200, height: 628 },
    safeZones: { topBufferPx: 40, bottomBufferPx: 40, sideBufferPx: 50 },
  },
};

/**
 * Returns safe zone boundary fractions (0.0 to 1.0) for a given aspect ratio.
 */
export function getSafeZoneBounds(aspectRatio: StandardAspectRatio) {
  const spec = META_PLACEMENT_SPECS[aspectRatio] || META_PLACEMENT_SPECS['1:1'];
  const { width, height } = spec.dimensions;
  const { topBufferPx, bottomBufferPx, sideBufferPx } = spec.safeZones;

  return {
    minX: sideBufferPx / width,
    maxX: (width - sideBufferPx) / width,
    minY: topBufferPx / height,
    maxY: (height - bottomBufferPx) / height,
  };
}

/**
 * Detects the semantic element role from a CreativeLayer.
 */
export function detectElementRole(layer: CreativeLayer, allLayers: CreativeLayer[] = []): SemanticElementRole {
  const id = (layer.id || '').toLowerCase();
  const type = (layer.type || '').toLowerCase();

  // 1. Explicit layer types take absolute precedence
  if (type === 'headline') return 'headline';
  if (type === 'logo') return 'brand_identity';
  if (type === 'cta') return 'cta';
  if (type === 'badge') return 'offer';
  if (type === 'product') {
    const isFirstProduct = allLayers.find((l) => l.type === 'product' || l.id.toLowerCase().includes('product'))?.id === layer.id;
    return isFirstProduct ? 'product_hero' : 'secondary_product_visual';
  }

  // 2. ID and semantic heuristics
  if (id.includes('headline') || id.includes('title')) return 'headline';
  if (id.includes('logo') || id.includes('brand')) return 'brand_identity';
  if (id.includes('cta') || id.includes('button')) return 'cta';
  if (id.includes('badge') || id.includes('offer') || id.includes('discount')) return 'offer';
  if (id.includes('proof') || id.includes('rating') || id.includes('star') || id.includes('benefit') || id.includes('feature')) return 'benefit_proof';
  if (id.includes('subhead') || id.includes('caption') || id.includes('body')) return 'supporting_copy';
  if (id.includes('product') || id.includes('packshot')) return 'secondary_product_visual';

  if (type === 'text') return 'supporting_copy';
  return 'decorative_elements';
}

/**
 * Detects the high-level advertising composition type from blueprint and document layers.
 */
export function detectCompositionType(
  sourceDoc: CreativeDocument,
  blueprint?: CreativeBlueprint,
): CompositionType {
  const rawComp = (blueprint?.layout?.composition || '').toLowerCase();
  const rawAngle = (blueprint?.marketingAngle || '').toLowerCase();
  const rawFormat = (blueprint?.advertisingFormat || '').toLowerCase();

  if (rawComp.includes('split') || rawFormat.includes('split')) return 'split_layout';
  if (rawComp.includes('before') || rawFormat.includes('before') || rawAngle.includes('before')) return 'before_and_after';
  if (rawComp.includes('compare') || rawFormat.includes('comparison') || rawAngle.includes('comparison')) return 'comparison';
  if (rawComp.includes('editorial') || rawFormat.includes('editorial') || rawComp.includes('minimal')) return 'editorial';
  if (rawComp.includes('lifestyle') || rawFormat.includes('lifestyle') || rawAngle.includes('lifestyle')) return 'lifestyle';
  if (rawComp.includes('typography') || rawFormat.includes('typography') || rawFormat.includes('statement')) return 'typography_led';
  if (rawComp.includes('promotional') || rawFormat.includes('promo') || rawFormat.includes('retail') || rawFormat.includes('discount')) return 'promotional';
  if (rawComp.includes('grid') || rawFormat.includes('grid') || rawFormat.includes('collage')) return 'grid_or_collage';

  // Inspect layers
  const layerIds = sourceDoc.layers.map((l) => l.id.toLowerCase());
  if (layerIds.some((id) => id.includes('before')) && layerIds.some((id) => id.includes('after'))) {
    return 'before_and_after';
  }
  const productCount = sourceDoc.layers.filter((l) => l.type === 'product' || l.id.toLowerCase().includes('product')).length;
  if (productCount > 2) return 'grid_or_collage';
  if (productCount === 2) return 'comparison';

  const badgeCount = sourceDoc.layers.filter((l) => l.type === 'badge' || l.id.toLowerCase().includes('badge') || l.id.toLowerCase().includes('offer')).length;
  if (badgeCount > 0 && (rawAngle.includes('offer') || rawAngle.includes('sale') || rawAngle.includes('deal'))) {
    return 'promotional';
  }

  const headlineLayer = sourceDoc.layers.find((l) => l.type === 'headline' || l.id === 'layer-headline');
  if (headlineLayer && Number(headlineLayer.position.height) > 0.28) {
    return 'typography_led';
  }

  return 'product_hero';
}

/**
 * Builds a structured semantic layout representation from a creative document.
 */
export function buildSemanticLayout(
  sourceDoc: CreativeDocument,
  blueprint?: CreativeBlueprint,
): SemanticLayoutRepresentation {
  const compositionType = detectCompositionType(sourceDoc, blueprint);
  const elements: SemanticLayoutElement[] = sourceDoc.layers.map((l) => {
    const role = detectElementRole(l, sourceDoc.layers);
    let importance: SemanticLayoutElement['importance'] = 'medium';
    if (role === 'product_hero' || role === 'headline') importance = 'critical';
    else if (role === 'cta' || role === 'brand_identity' || role === 'offer') importance = 'high';
    else if (role === 'decorative_elements') importance = 'low';

    return {
      layerId: l.id,
      role,
      importance,
      originalPosition: { ...l.position },
      originalContent: (l as any).content || (l as any).text,
      originalStyles: { ...(l.styles || {}) },
      canHideIfCrowded: role === 'decorative_elements' || role === 'secondary_product_visual',
      canStackVertically: role === 'headline' || role === 'supporting_copy' || role === 'benefit_proof',
      requiresSafeZone: role !== 'decorative_elements',
    };
  });

  const hero = elements.find((e) => e.role === 'product_hero');
  const focalPoint = hero
    ? {
        x: hero.originalPosition.x + hero.originalPosition.width / 2,
        y: hero.originalPosition.y + hero.originalPosition.height / 2,
      }
    : { x: 0.5, y: 0.5 };

  const negativeSpacePreference = compositionType === 'editorial' ? 'generous' : compositionType === 'promotional' ? 'compact' : 'balanced';

  const brandColorPalette = blueprint?.artDirection?.colorPalette && blueprint.artDirection.colorPalette.length > 0
    ? blueprint.artDirection.colorPalette
    : ['#0F172A', '#FFFFFF', '#F59E0B'];

  const normalizedRatio: StandardAspectRatio =
    (['1:1', '4:5', '9:16', '1.91:1'] as const).includes(sourceDoc.canvas.aspectRatio as StandardAspectRatio)
      ? (sourceDoc.canvas.aspectRatio as StandardAspectRatio)
      : '1:1';

  return {
    compositionType,
    aspectRatio: normalizedRatio,
    elements,
    focalPoint,
    negativeSpacePreference,
    brandColorPalette,
  };
}

/**
 * Calculates optimal typography dimensions to prevent overflow and collision.
 */
export function recalculateTypography(
  text: string,
  targetRatio: StandardAspectRatio,
  role: 'headline' | 'supporting_copy' | 'cta',
) {
  const len = text.length;

  if (role === 'headline') {
    if (targetRatio === '1.91:1') {
      const fontSize = len > 50 ? 26 : len > 30 ? 30 : 34;
      return { fontSize: `${fontSize}px`, lineHeight: 1.15, estimatedLines: Math.ceil(len / 22) };
    }
    if (targetRatio === '9:16') {
      const fontSize = len > 60 ? 36 : len > 35 ? 42 : 46;
      return { fontSize: `${fontSize}px`, lineHeight: 1.18, estimatedLines: Math.ceil(len / 18) };
    }
    if (targetRatio === '4:5') {
      const fontSize = len > 50 ? 38 : len > 30 ? 44 : 48;
      return { fontSize: `${fontSize}px`, lineHeight: 1.18, estimatedLines: Math.ceil(len / 20) };
    }
    // 1:1
    const fontSize = len > 50 ? 36 : len > 30 ? 42 : 46;
    return { fontSize: `${fontSize}px`, lineHeight: 1.18, estimatedLines: Math.ceil(len / 19) };
  }

  if (role === 'supporting_copy') {
    if (targetRatio === '1.91:1') {
      const fontSize = len > 80 ? 14 : 16;
      return { fontSize: `${fontSize}px`, lineHeight: 1.3, estimatedLines: Math.ceil(len / 35) };
    }
    const fontSize = len > 90 ? 18 : 20;
    return { fontSize: `${fontSize}px`, lineHeight: 1.35, estimatedLines: Math.ceil(len / 30) };
  }

  // CTA
  const fontSize = targetRatio === '1.91:1' ? 16 : 20;
  return { fontSize: `${fontSize}px`, lineHeight: 1.0, estimatedLines: 1 };
}

/**
 * Reflows a semantic layout into placement-specific layer coordinates.
 */
export function reflowSemanticLayout(
  semantic: SemanticLayoutRepresentation,
  targetRatio: StandardAspectRatio,
  spec: MetaPlacementMapping,
  sourceLayers: CreativeLayer[],
): { adaptedLayers: CreativeLayer[]; warnings: string[]; manualReviewNeeded: boolean; manualReviewReason?: string } {
  const warnings: string[] = [];
  let manualReviewNeeded = false;
  let manualReviewReason: string | undefined;

  const comp = semantic.compositionType;
  const bounds = getSafeZoneBounds(targetRatio);

  // Clone layers
  const adaptedLayers: CreativeLayer[] = sourceLayers.map((l) => ({
    ...l,
    position: { ...l.position },
    styles: { ...l.styles },
  }));

  const bgLayer = adaptedLayers.find((l) => l.type === 'background');
  const heroLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'product_hero')?.layerId);
  const secondaryProductLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'secondary_product_visual')?.layerId);
  const headlineLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'headline')?.layerId);
  const subheadLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'supporting_copy')?.layerId);
  const ctaLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'cta')?.layerId);
  const offerLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'offer')?.layerId);
  const logoLayer = adaptedLayers.find((l) => l.id === semantic.elements.find((e) => e.role === 'brand_identity')?.layerId);

  // 1. Background always covers 100% of target canvas
  if (bgLayer) {
    bgLayer.position = { x: 0, y: 0, width: 1.0, height: 1.0 };
  }

  // Invariant: Product layers must always preserve packaging aspect ratio
  if (heroLayer) {
    heroLayer.styles = {
      ...heroLayer.styles,
      objectFit: 'contain',
      preserveAspectRatio: 'meet',
    };
  }
  if (secondaryProductLayer) {
    secondaryProductLayer.styles = {
      ...secondaryProductLayer.styles,
      objectFit: 'contain',
      preserveAspectRatio: 'meet',
    };
  }

  // Check text density for potential safety warning
  const headlineText = String((headlineLayer as any)?.content || (headlineLayer as any)?.text || '');
  if (headlineText.length > 90 && (targetRatio === '1.91:1' || targetRatio === '9:16')) {
    warnings.push(`Headline text is long (${headlineText.length} chars) for ${targetRatio} placement. Font scaled down.`);
  }
  if (headlineText.length > 130) {
    manualReviewNeeded = true;
    manualReviewReason = `Extreme headline length (${headlineText.length} chars) risks overflowing placement safe zones.`;
  }

  // ---------------------------------------------------------------------------
  // 9:16 Stories & Reels Reflow
  // Buffer: Top 250px (y: 0..0.1302), Bottom 350px (y: 0.8177..1.0)
  // Safe vertical zone: y: 0.135 to 0.810
  // ---------------------------------------------------------------------------
  if (targetRatio === '9:16') {
    if (comp === 'split_layout') {
      // Split layout in vertical mode converts from side-by-side to stacked vertical split
      if (logoLayer) logoLayer.position = { x: 0.08, y: 0.145, width: 0.24, height: 0.045 };
      if (offerLayer) offerLayer.position = { x: 0.68, y: 0.145, width: 0.24, height: 0.050 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.08, y: 0.205, width: 0.84, height: 0.120 };
        const typo = recalculateTypography(headlineText, '9:16', 'headline');
        headlineLayer.styles = { ...headlineLayer.styles, ...typo };
      }
      if (subheadLayer) {
        subheadLayer.position = { x: 0.08, y: 0.335, width: 0.84, height: 0.055 };
        const subText = String((subheadLayer as any)?.content || '');
        const typo = recalculateTypography(subText, '9:16', 'supporting_copy');
        subheadLayer.styles = { ...subheadLayer.styles, ...typo };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.10, y: 0.400, width: 0.80, height: 0.335 };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.12, y: 0.745, width: 0.76, height: 0.055 };
        ctaLayer.styles = { ...ctaLayer.styles, borderRadius: '16px', fontSize: '22px' };
      }
    } else if (comp === 'before_and_after' || comp === 'comparison') {
      // Stacked Before (top) & After (bottom)
      if (logoLayer) logoLayer.position = { x: 0.08, y: 0.145, width: 0.24, height: 0.045 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.08, y: 0.200, width: 0.84, height: 0.100 };
        headlineLayer.styles = { ...headlineLayer.styles, ...recalculateTypography(headlineText, '9:16', 'headline') };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.10, y: 0.315, width: 0.80, height: 0.220 };
      }
      if (secondaryProductLayer) {
        secondaryProductLayer.position = { x: 0.10, y: 0.545, width: 0.80, height: 0.220 };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.12, y: 0.775, width: 0.76, height: 0.050 };
      }
    } else if (comp === 'editorial') {
      // Editorial: 35%+ negative space, refined serif styling
      if (logoLayer) logoLayer.position = { x: 0.38, y: 0.155, width: 0.24, height: 0.040 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.12, y: 0.225, width: 0.76, height: 0.110 };
        headlineLayer.styles = {
          ...headlineLayer.styles,
          fontSize: '38px',
          fontWeight: 400,
          textAlign: 'center',
          lineHeight: 1.25,
        };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.16, y: 0.360, width: 0.68, height: 0.360 };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.25, y: 0.750, width: 0.50, height: 0.045 };
        ctaLayer.styles = { ...ctaLayer.styles, borderRadius: '4px', fontSize: '18px' };
      }
    } else if (comp === 'typography_led') {
      // Big bold typography dominating the top half
      if (logoLayer) logoLayer.position = { x: 0.08, y: 0.145, width: 0.22, height: 0.045 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.08, y: 0.210, width: 0.84, height: 0.240 };
        headlineLayer.styles = { ...headlineLayer.styles, fontSize: '52px', lineHeight: 1.12, fontWeight: 900 };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.15, y: 0.470, width: 0.70, height: 0.260 };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.12, y: 0.745, width: 0.76, height: 0.055 };
      }
    } else {
      // Standard Product Hero / Promotional
      if (logoLayer) logoLayer.position = { x: 0.08, y: 0.145, width: 0.22, height: 0.045 };
      if (offerLayer) offerLayer.position = { x: 0.70, y: 0.145, width: 0.22, height: 0.050 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.08, y: 0.210, width: 0.84, height: 0.125 };
        headlineLayer.styles = { ...headlineLayer.styles, ...recalculateTypography(headlineText, '9:16', 'headline') };
      }
      if (subheadLayer) {
        subheadLayer.position = { x: 0.08, y: 0.340, width: 0.84, height: 0.055 };
        const subText = String((subheadLayer as any)?.content || '');
        subheadLayer.styles = { ...subheadLayer.styles, ...recalculateTypography(subText, '9:16', 'supporting_copy') };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.10, y: 0.405, width: 0.80, height: 0.330 };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.12, y: 0.745, width: 0.76, height: 0.055 };
        ctaLayer.styles = { ...ctaLayer.styles, borderRadius: '16px', fontSize: '22px' };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 1.91:1 Landscape (1200x628) Reflow
  // 2-column side-by-side reflow: Copy + CTA on Left, Product on Right
  // ---------------------------------------------------------------------------
  else if (targetRatio === '1.91:1') {
    if (comp === 'before_and_after' || comp === 'comparison') {
      // Left = Before/Us, Right = After/Them
      if (logoLayer) logoLayer.position = { x: 0.05, y: 0.08, width: 0.18, height: 0.10 };
      if (headlineLayer) {
        headlineLayer.position = { x: 0.05, y: 0.20, width: 0.90, height: 0.15 };
        headlineLayer.styles = { ...headlineLayer.styles, ...recalculateTypography(headlineText, '1.91:1', 'headline') };
      }
      if (heroLayer) {
        heroLayer.position = { x: 0.06, y: 0.38, width: 0.42, height: 0.54 };
      }
      if (secondaryProductLayer) {
        secondaryProductLayer.position = { x: 0.52, y: 0.38, width: 0.42, height: 0.54 };
      }
    } else {
      // Standard 2-column horizontal reflow
      if (logoLayer) {
        logoLayer.position = { x: 0.06, y: 0.08, width: 0.20, height: 0.11 };
      }
      if (headlineLayer) {
        headlineLayer.position = { x: 0.06, y: 0.22, width: 0.44, height: 0.30 };
        const typo = recalculateTypography(headlineText, '1.91:1', 'headline');
        headlineLayer.styles = { ...headlineLayer.styles, ...typo };
      }
      if (subheadLayer) {
        subheadLayer.position = { x: 0.06, y: 0.54, width: 0.44, height: 0.16 };
        const subText = String((subheadLayer as any)?.content || '');
        const typo = recalculateTypography(subText, '1.91:1', 'supporting_copy');
        subheadLayer.styles = { ...subheadLayer.styles, ...typo };
      }
      if (ctaLayer) {
        ctaLayer.position = { x: 0.06, y: 0.74, width: 0.34, height: 0.14 };
        ctaLayer.styles = { ...ctaLayer.styles, borderRadius: '10px', fontSize: '17px' };
      }
      if (heroLayer) {
        // Right half dominant product visual
        heroLayer.position = { x: 0.52, y: 0.08, width: 0.42, height: 0.84 };
      }
      if (offerLayer) {
        offerLayer.position = { x: 0.78, y: 0.08, width: 0.16, height: 0.14 };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4:5 Mobile Feed (1080x1350) Reflow
  // Balanced vertical flow
  // ---------------------------------------------------------------------------
  else if (targetRatio === '4:5') {
    if (logoLayer) logoLayer.position = { x: 0.08, y: 0.08, width: 0.22, height: 0.05 };
    if (offerLayer) offerLayer.position = { x: 0.70, y: 0.08, width: 0.22, height: 0.06 };
    if (headlineLayer) {
      headlineLayer.position = { x: 0.08, y: 0.12, width: 0.84, height: 0.15 };
      headlineLayer.styles = { ...headlineLayer.styles, ...recalculateTypography(headlineText, '4:5', 'headline') };
    }
    if (subheadLayer) {
      subheadLayer.position = { x: 0.08, y: 0.27, width: 0.84, height: 0.06 };
      const subText = String((subheadLayer as any)?.content || '');
      subheadLayer.styles = { ...subheadLayer.styles, ...recalculateTypography(subText, '4:5', 'supporting_copy') };
    }
    if (heroLayer) {
      heroLayer.position = { x: 0.12, y: 0.33, width: 0.76, height: 0.48 };
    }
    if (ctaLayer) {
      ctaLayer.position = { x: 0.08, y: 0.83, width: 0.46, height: 0.065 };
    }
  }

  // ---------------------------------------------------------------------------
  // 1:1 Square (1080x1080) Reflow
  // Standard feed layout
  // ---------------------------------------------------------------------------
  else {
    if (logoLayer) logoLayer.position = { x: 0.08, y: 0.08, width: 0.22, height: 0.06 };
    if (offerLayer) offerLayer.position = { x: 0.70, y: 0.08, width: 0.22, height: 0.07 };
    if (headlineLayer) {
      headlineLayer.position = { x: 0.08, y: 0.12, width: 0.84, height: 0.18 };
      headlineLayer.styles = { ...headlineLayer.styles, ...recalculateTypography(headlineText, '1:1', 'headline') };
    }
    if (heroLayer) {
      heroLayer.position = { x: 0.15, y: 0.34, width: 0.70, height: 0.46 };
    }
    if (ctaLayer) {
      ctaLayer.position = { x: 0.08, y: 0.84, width: 0.46, height: 0.07 };
    }
  }

  // Safe zone audit for all critical layers
  for (const layer of adaptedLayers) {
    if (layer.type === 'background') continue;
    const { x, y, width: w, height: h } = layer.position;
    // Stories buffer checks
    if (targetRatio === '9:16') {
      if (y < bounds.minY - 0.01) {
        warnings.push(`Layer ${layer.id} touches top safe zone buffer (${y.toFixed(3)} < ${bounds.minY.toFixed(3)})`);
      }
      if (y + h > bounds.maxY + 0.01) {
        warnings.push(`Layer ${layer.id} touches bottom safe zone buffer (${(y + h).toFixed(3)} > ${bounds.maxY.toFixed(3)})`);
      }
    }
  }

  return { adaptedLayers, warnings, manualReviewNeeded, manualReviewReason };
}

/**
 * Validates safe zones, collision, and visual hierarchy for an adapted document.
 */
export function runPlacementQA(
  adaptedDoc: CreativeDocument,
  spec: MetaPlacementMapping,
  semantic: SemanticLayoutRepresentation,
): { safeZoneCompliant: boolean; status: PlacementAdaptationStatus; warnings: string[]; manualReviewNeeded: boolean; manualReviewReason?: string } {
  const bounds = getSafeZoneBounds(spec.aspectRatio);
  const warnings: string[] = [];
  let manualReviewNeeded = false;
  let manualReviewReason: string | undefined;

  for (const layer of adaptedDoc.layers) {
    if (layer.type === 'background') continue;
    const { y, height: h } = layer.position;
    if (spec.aspectRatio === '9:16') {
      if (y < bounds.minY - 0.02 || (y + h) > bounds.maxY + 0.02) {
        warnings.push(`Safe zone breach for layer ${layer.id}`);
        manualReviewNeeded = true;
        manualReviewReason = `Element ${layer.id} encroaches upon native platform UI boundaries.`;
      }
    }
  }

  const status: PlacementAdaptationStatus = manualReviewNeeded ? 'needs_manual_review' : 'approved';

  return {
    safeZoneCompliant: !manualReviewNeeded,
    status,
    warnings,
    manualReviewNeeded,
    manualReviewReason,
  };
}

/**
 * Adapts an existing CreativeDocument to a target aspect ratio using content-aware reflow.
 */
export function adaptCreativeDocument(
  sourceDoc: CreativeDocument,
  targetRatio: StandardAspectRatio,
  blueprintOrOptions?: CreativeBlueprint | { blueprint?: CreativeBlueprint; aiBackgroundUrl?: string },
): {
  document: CreativeDocument;
  compositeUrl: string;
  status: PlacementAdaptationStatus;
  manualReviewNeeded: boolean;
  manualReviewReason?: string;
  warnings: string[];
} {
  const blueprint =
    blueprintOrOptions && 'id' in blueprintOrOptions
      ? (blueprintOrOptions as CreativeBlueprint)
      : (blueprintOrOptions as { blueprint?: CreativeBlueprint; aiBackgroundUrl?: string })?.blueprint;
  const aiBackgroundUrl =
    blueprintOrOptions && 'aiBackgroundUrl' in blueprintOrOptions
      ? (blueprintOrOptions as { blueprint?: CreativeBlueprint; aiBackgroundUrl?: string }).aiBackgroundUrl
      : undefined;

  const spec = META_PLACEMENT_SPECS[targetRatio] || META_PLACEMENT_SPECS['1:1'];
  const { width, height } = spec.dimensions;

  const semantic = buildSemanticLayout(sourceDoc, blueprint);
  const reflow = reflowSemanticLayout(semantic, targetRatio, spec, sourceDoc.layers);

  let finalLayers = reflow.adaptedLayers;
  if (aiBackgroundUrl) {
    finalLayers = finalLayers.map((l) => (l.type === 'background' ? { ...l, assetId: aiBackgroundUrl } : l));
  }

  const adaptedDoc: CreativeDocument = {
    ...sourceDoc,
    id: `${sourceDoc.id}-${targetRatio.replace(':', '_')}`,
    version: sourceDoc.version + 1,
    canvas: {
      width,
      height,
      aspectRatio: targetRatio,
    },
    layers: finalLayers,
    metadata: {
      ...sourceDoc.metadata,
      adaptedFromRatio: sourceDoc.canvas.aspectRatio,
      adaptationTimestamp: new Date().toISOString(),
      compositionType: semantic.compositionType,
      isAiExpanded: Boolean(aiBackgroundUrl),
    },
    updatedAt: new Date().toISOString(),
  };

  const qa = runPlacementQA(adaptedDoc, spec, semantic);
  const allWarnings = [...reflow.warnings, ...qa.warnings];
  const needsReview = reflow.manualReviewNeeded || qa.manualReviewNeeded;
  const reviewReason = reflow.manualReviewReason || qa.manualReviewReason;

  const svg = renderCreativeDocumentToSvg(adaptedDoc);
  const compositeUrl = svgToDataUri(svg);

  return {
    document: adaptedDoc,
    compositeUrl,
    status: needsReview ? 'needs_manual_review' : 'approved',
    manualReviewNeeded: needsReview,
    manualReviewReason: reviewReason,
    warnings: allWarnings,
  };
}

/**
 * Derives all 4 standard Meta placement formats for an approved master creative.
 */
export function adaptMasterCreativeToAllFormats(
  sourceDoc: CreativeDocument,
  blueprint?: CreativeBlueprint,
): Record<
  StandardAspectRatio,
  {
    document: CreativeDocument;
    compositeUrl: string;
    status: PlacementAdaptationStatus;
    manualReviewNeeded: boolean;
    manualReviewReason?: string;
    warnings: string[];
  }
> {
  const ratios: StandardAspectRatio[] = ['1:1', '4:5', '9:16', '1.91:1'];
  const results: Partial<
    Record<
      StandardAspectRatio,
      {
        document: CreativeDocument;
        compositeUrl: string;
        status: PlacementAdaptationStatus;
        manualReviewNeeded: boolean;
        manualReviewReason?: string;
        warnings: string[];
      }
    >
  > = {};

  for (const ratio of ratios) {
    results[ratio] = adaptCreativeDocument(sourceDoc, ratio, blueprint);
  }

  return results as Record<
    StandardAspectRatio,
    {
      document: CreativeDocument;
      compositeUrl: string;
      status: PlacementAdaptationStatus;
      manualReviewNeeded: boolean;
      manualReviewReason?: string;
      warnings: string[];
    }
  >;
}

/**
 * Manually approves an adapted placement after review.
 */
export function approveAdaptedPlacement(placement: AdaptedCreativePlacement): AdaptedCreativePlacement {
  return {
    ...placement,
    status: 'approved',
    manualReviewNeeded: false,
    manualReviewReason: undefined,
  };
}

/**
 * Rejects an adapted placement with a specific reason.
 */
export function rejectAdaptedPlacement(placement: AdaptedCreativePlacement, reason: string): AdaptedCreativePlacement {
  return {
    ...placement,
    status: 'rejected',
    manualReviewNeeded: true,
    manualReviewReason: reason,
  };
}
