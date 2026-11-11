/**
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
 * Never naive center crop. Repositions layers into format-specific safe zones,
 * recalibrates typographic hierarchy, and renders valid SVG composites.
 */

import type {
  CreativeDocument,
  CreativeLayer,
  MetaPlacementMapping,
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
 * Adapts an existing CreativeDocument to a target aspect ratio using content-aware reflow.
 */
export function adaptCreativeDocument(
  sourceDoc: CreativeDocument,
  targetRatio: StandardAspectRatio,
): { document: CreativeDocument; compositeUrl: string } {
  const spec = META_PLACEMENT_SPECS[targetRatio] || META_PLACEMENT_SPECS['1:1'];
  const { width, height } = spec.dimensions;

  // Deep clone layers
  const adaptedLayers: CreativeLayer[] = sourceDoc.layers.map((l) => ({
    ...l,
    position: { ...l.position },
    styles: { ...l.styles },
  }));

  // Identify key layers
  const bgLayer = adaptedLayers.find((l) => l.type === 'background');
  const productLayer = adaptedLayers.find((l) => l.type === 'product');
  const headlineLayer = adaptedLayers.find((l) => l.type === 'headline' || l.id === 'layer-headline');
  const subheadLayer = adaptedLayers.find((l) => l.type === 'text' && l.id === 'layer-subheadline');
  const ctaLayer = adaptedLayers.find((l) => l.type === 'cta' || l.id === 'layer-cta');
  const badgeLayer = adaptedLayers.find((l) => l.type === 'badge' || l.id === 'layer-badge');
  const logoLayer = adaptedLayers.find((l) => l.type === 'logo' || l.id === 'layer-logo');

  // Background always covers 100% of the target canvas
  if (bgLayer) {
    bgLayer.position = { x: 0, y: 0, width: 1.0, height: 1.0 };
  }

  // Reflow based on target aspect ratio rules
  if (targetRatio === '9:16') {
    // -------------------------------------------------------------------------
    // 9:16 Stories & Reels:
    // Top buffer: 250px (y: 0..0.1302) -> Reserve for user profile & audio
    // Bottom buffer: 350px (y: 0.8177..1.0) -> Reserve for caption & action bar
    // Safe vertical zone: y: 0.135 to 0.810
    // -------------------------------------------------------------------------
    if (logoLayer) {
      logoLayer.position = { x: 0.08, y: 0.145, width: 0.22, height: 0.045 };
    }
    if (badgeLayer) {
      badgeLayer.position = { x: 0.70, y: 0.145, width: 0.22, height: 0.050 };
    }
    if (headlineLayer) {
      headlineLayer.position = { x: 0.08, y: 0.210, width: 0.84, height: 0.125 };
      headlineLayer.styles = {
        ...headlineLayer.styles,
        fontSize: '44px',
        lineHeight: 1.15,
      };
    }
    if (subheadLayer) {
      subheadLayer.position = { x: 0.08, y: 0.340, width: 0.84, height: 0.055 };
      subheadLayer.styles = {
        ...subheadLayer.styles,
        fontSize: '20px',
      };
    }
    if (productLayer) {
      // Anchored centrally in the primary visual zone
      productLayer.position = { x: 0.10, y: 0.405, width: 0.80, height: 0.330 };
    }
    if (ctaLayer) {
      // Wide CTA centered above the bottom UI buffer
      ctaLayer.position = { x: 0.12, y: 0.745, width: 0.76, height: 0.055 };
      ctaLayer.styles = {
        ...ctaLayer.styles,
        borderRadius: '16px',
        fontSize: '22px',
      };
    }
  } else if (targetRatio === '1.91:1') {
    // -------------------------------------------------------------------------
    // 1.91:1 Landscape (1200x628):
    // Left/Right Split Layout: Product occupies right, Copy/CTA occupies left.
    // Prevents cramped vertically-centered stacking on wide banners.
    // -------------------------------------------------------------------------
    if (logoLayer) {
      logoLayer.position = { x: 0.06, y: 0.08, width: 0.20, height: 0.11 };
    }
    if (headlineLayer) {
      headlineLayer.position = { x: 0.06, y: 0.22, width: 0.44, height: 0.30 };
      headlineLayer.styles = {
        ...headlineLayer.styles,
        fontSize: '32px',
        lineHeight: 1.15,
      };
    }
    if (subheadLayer) {
      subheadLayer.position = { x: 0.06, y: 0.54, width: 0.44, height: 0.16 };
      subheadLayer.styles = {
        ...subheadLayer.styles,
        fontSize: '16px',
      };
    }
    if (ctaLayer) {
      ctaLayer.position = { x: 0.06, y: 0.74, width: 0.34, height: 0.14 };
      ctaLayer.styles = {
        ...ctaLayer.styles,
        borderRadius: '10px',
        fontSize: '17px',
      };
    }
    if (productLayer) {
      // Right half dominant product visual
      productLayer.position = { x: 0.52, y: 0.08, width: 0.42, height: 0.84 };
    }
    if (badgeLayer) {
      badgeLayer.position = { x: 0.78, y: 0.08, width: 0.16, height: 0.14 };
    }
  } else if (targetRatio === '4:5') {
    // -------------------------------------------------------------------------
    // 4:5 Mobile Feed (1080x1350):
    // Balanced vertical hierarchy
    // -------------------------------------------------------------------------
    if (logoLayer) {
      logoLayer.position = { x: 0.08, y: 0.08, width: 0.22, height: 0.05 };
    }
    if (badgeLayer) {
      badgeLayer.position = { x: 0.70, y: 0.08, width: 0.22, height: 0.06 };
    }
    if (headlineLayer) {
      headlineLayer.position = { x: 0.08, y: 0.12, width: 0.84, height: 0.15 };
      headlineLayer.styles = {
        ...headlineLayer.styles,
        fontSize: '46px',
      };
    }
    if (subheadLayer) {
      subheadLayer.position = { x: 0.08, y: 0.27, width: 0.84, height: 0.06 };
      subheadLayer.styles = {
        ...subheadLayer.styles,
        fontSize: '22px',
      };
    }
    if (productLayer) {
      productLayer.position = { x: 0.12, y: 0.33, width: 0.76, height: 0.48 };
    }
    if (ctaLayer) {
      ctaLayer.position = { x: 0.08, y: 0.83, width: 0.46, height: 0.065 };
    }
  } else {
    // -------------------------------------------------------------------------
    // 1:1 Square (1080x1080):
    // Standard square commercial layout
    // -------------------------------------------------------------------------
    if (logoLayer) {
      logoLayer.position = { x: 0.08, y: 0.08, width: 0.22, height: 0.06 };
    }
    if (badgeLayer) {
      badgeLayer.position = { x: 0.70, y: 0.08, width: 0.22, height: 0.07 };
    }
    if (headlineLayer) {
      headlineLayer.position = { x: 0.08, y: 0.12, width: 0.84, height: 0.18 };
      headlineLayer.styles = {
        ...headlineLayer.styles,
        fontSize: '44px',
      };
    }
    if (productLayer) {
      productLayer.position = { x: 0.15, y: 0.34, width: 0.70, height: 0.46 };
    }
    if (ctaLayer) {
      ctaLayer.position = { x: 0.08, y: 0.84, width: 0.46, height: 0.07 };
    }
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
    layers: adaptedLayers,
    metadata: {
      ...sourceDoc.metadata,
      adaptedFromRatio: sourceDoc.canvas.aspectRatio,
      adaptationTimestamp: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  const svg = renderCreativeDocumentToSvg(adaptedDoc);
  const compositeUrl = svgToDataUri(svg);

  return {
    document: adaptedDoc,
    compositeUrl,
  };
}

/**
 * Derives all 4 standard Meta placement formats for an approved master creative.
 */
export function adaptMasterCreativeToAllFormats(
  sourceDoc: CreativeDocument,
): Record<StandardAspectRatio, { document: CreativeDocument; compositeUrl: string }> {
  const ratios: StandardAspectRatio[] = ['1:1', '4:5', '9:16', '1.91:1'];
  const results: Partial<Record<StandardAspectRatio, { document: CreativeDocument; compositeUrl: string }>> = {};

  for (const ratio of ratios) {
    results[ratio] = adaptCreativeDocument(sourceDoc, ratio);
  }

  return results as Record<StandardAspectRatio, { document: CreativeDocument; compositeUrl: string }>;
}

