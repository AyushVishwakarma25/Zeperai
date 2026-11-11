/**
 * CAMPAIGN STUDIO V2 - Creative Composition Engine.
 *
 * Converts a CreativeBlueprint, generated visual background, and original product assets
 * into a structured, editable CreativeDocument and renders the final standalone advertisement.
 */

import type {
  BrandContext,
  CreativeBlueprint,
  CreativeDocument,
  CreativeLayer,
  DesignIntensity,
  NormalizedBoundingBox,
} from '../../types.js';
import { renderCreativeDocumentToSvg, svgToDataUri } from './svgRenderer.js';

export interface ComposeCreativeParams {
  blueprint: CreativeBlueprint;
  backgroundUrl?: string;
  productImageUrl?: string;
  logoUrl?: string;
  brandName?: string;
  brandColors?: string[];
  overrides?: Partial<CreativeDocument>;
}

export function resolveCanvasDimensions(aspectRatio?: string): { width: number; height: number; aspectRatio: string } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920, aspectRatio: '9:16' };
    case '16:9':
      return { width: 1920, height: 1080, aspectRatio: '16:9' };
    case '1:1':
      return { width: 1080, height: 1080, aspectRatio: '1:1' };
    case '3:4':
      return { width: 1080, height: 1440, aspectRatio: '3:4' };
    case '4:5':
    default:
      return { width: 1080, height: 1350, aspectRatio: '4:5' };
  }
}

/**
 * Builds a structured, editable CreativeDocument from a CreativeBlueprint.
 */
export function buildCreativeDocument(params: ComposeCreativeParams): CreativeDocument {
  const { blueprint, backgroundUrl, productImageUrl, logoUrl, brandName = 'BRAND', brandColors = ['#0A0A0A', '#F59E0B'], overrides } = params;

  const canvas = resolveCanvasDimensions(blueprint.canvas?.aspectRatio);
  const elements = blueprint.layout?.elements || [];

  const findBox = (name: string): NormalizedBoundingBox | undefined =>
    elements.find((el) => el.element.toLowerCase() === name.toLowerCase());

  const headlineBox = findBox('main_headline') || { element: 'main_headline', x: 0.08, y: 0.14, width: 0.84, height: 0.18 };
  const subheadlineBox = findBox('subheadline') || { element: 'subheadline', x: 0.08, y: 0.32, width: 0.84, height: 0.07 };
  const productBox = findBox('product') || { element: 'product', x: 0.15, y: 0.38, width: 0.70, height: 0.44 };
  const badgeBox = findBox('badge') || { element: 'badge', x: 0.08, y: 0.06, width: 0.38, height: 0.06 };
  const ctaBox = findBox('cta') || { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07 };
  const logoBox = findBox('logo') || { element: 'logo', x: 0.08, y: 0.06, width: 0.28, height: 0.05 };

  const primaryColor = brandColors[0] || '#0A0A0A';
  const accentColor = brandColors[1] || '#F59E0B';

  const intensity = blueprint.designIntensity || 'balanced';
  const scrimOpacity = intensity === 'minimal' ? 'rgba(0,0,0,0.18)' : intensity === 'bold' ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.28)';

  const layers: CreativeLayer[] = [];

  // 1. Background Layer (z-index: 0)
  layers.push({
    id: 'layer-background',
    name: 'Background Environment',
    type: 'background',
    zIndex: 0,
    position: { x: 0, y: 0, width: 1, height: 1 },
    styles: {
      backgroundImage: backgroundUrl || '',
      backgroundColor: primaryColor,
      overlayScrim: scrimOpacity,
      gradient: !backgroundUrl
        ? {
            from: primaryColor,
            to: '#1E293B',
          }
        : undefined,
    },
    locked: true,
    visible: true,
  });

  // 2. Product Hero Layer (z-index: 5)
  if (productImageUrl) {
    layers.push({
      id: 'layer-product',
      name: 'Hero Product Packshot',
      type: 'product',
      zIndex: 5,
      position: {
        x: productBox.x,
        y: productBox.y,
        width: productBox.width,
        height: productBox.height,
      },
      content: productImageUrl,
      styles: {
        imageUrl: productImageUrl,
        preserveAspectRatio: 'meet',
      },
      locked: false,
      visible: true,
    });
  }

  // 3. Supporting Graphic Elements / Accent Shapes (z-index: 10)
  if (blueprint.graphicElements && blueprint.graphicElements.length > 0) {
    blueprint.graphicElements.forEach((g, idx) => {
      layers.push({
        id: `layer-graphic-${idx + 1}`,
        name: g.description || `Graphic ${g.type}`,
        type: 'shape',
        zIndex: 10 + idx,
        position: {
          x: g.position.x,
          y: g.position.y,
          width: g.position.width,
          height: g.position.height,
        },
        styles: {
          backgroundColor: g.style.backgroundColor || 'rgba(255,255,255,0.1)',
          borderRadius: g.style.borderRadius ?? 16,
          borderColor: g.style.borderColor || 'none',
          opacity: g.style.opacity ?? 1,
        },
        visible: true,
      });
    });
  }

  // 4. Logo Layer (z-index: 15)
  layers.push({
    id: 'layer-logo',
    name: 'Brand Wordmark / Logo',
    type: 'logo',
    zIndex: 15,
    position: {
      x: logoBox.x,
      y: logoBox.y,
      width: logoBox.width,
      height: logoBox.height,
    },
    content: brandName,
    styles: {
      imageUrl: logoUrl || '',
      fontFamily: blueprint.typography?.headlineStyle?.fontFamily || 'Poppins',
      color: '#FFFFFF',
    },
    visible: true,
  });

  // 5. Promotional Badge / Offer Pill Layer (z-index: 20)
  const badgeText = blueprint.copy?.offer || (blueprint.graphicElements?.[0]?.description ? 'PROMO' : undefined);
  if (badgeText) {
    layers.push({
      id: 'layer-badge',
      name: 'Promotional Offer Badge',
      type: 'badge',
      zIndex: 20,
      position: {
        x: badgeBox.x,
        y: badgeBox.y,
        width: badgeBox.width,
        height: badgeBox.height,
      },
      content: badgeText,
      styles: {
        backgroundColor: accentColor,
        textColor: '#FFFFFF',
        borderRadius: 999,
        fontFamily: 'Poppins',
        fontWeight: 800,
        fontSize: Math.round(canvas.height * badgeBox.height * 0.42),
        textTransform: 'uppercase',
      },
      visible: true,
    });
  }

  // 6. Dominant Headline Layer (z-index: 25)
  if (blueprint.copy?.headline) {
    const headlineStyle = blueprint.typography?.headlineStyle || { fontFamily: 'Poppins', fontWeight: 800, color: '#FFFFFF' };
    layers.push({
      id: 'layer-headline',
      name: 'Dominant Ad Headline',
      type: 'text',
      zIndex: 25,
      position: {
        x: headlineBox.x,
        y: headlineBox.y,
        width: headlineBox.width,
        height: headlineBox.height,
      },
      content: blueprint.copy.headline,
      styles: {
        fontFamily: headlineStyle.fontFamily || 'Poppins',
        fontWeight: headlineStyle.fontWeight || 800,
        color: headlineStyle.color || '#FFFFFF',
        alignment: headlineBox.alignment || 'left',
        fontSize: Math.round(canvas.height * headlineBox.height * 0.32),
        textTransform: headlineStyle.textTransform || 'none',
      },
      visible: true,
    });
  }

  // 7. Subheadline Layer (z-index: 26)
  if (blueprint.copy?.subheadline) {
    const subStyle = blueprint.typography?.subheadlineStyle || { fontFamily: 'Inter', fontWeight: 500, color: '#E2E8F0' };
    layers.push({
      id: 'layer-subheadline',
      name: 'Subheadline / Narrative Hook',
      type: 'text',
      zIndex: 26,
      position: {
        x: subheadlineBox.x,
        y: subheadlineBox.y,
        width: subheadlineBox.width,
        height: subheadlineBox.height,
      },
      content: blueprint.copy.subheadline,
      styles: {
        fontFamily: subStyle.fontFamily || 'Inter',
        fontWeight: subStyle.fontWeight || 500,
        color: subStyle.color || '#E2E8F0',
        alignment: subheadlineBox.alignment || 'left',
        fontSize: Math.round(canvas.height * subheadlineBox.height * 0.45),
      },
      visible: true,
    });
  }

  // 8. Sticky CTA Button Layer (z-index: 30)
  const ctaText = blueprint.copy?.cta || 'SHOP NOW';
  layers.push({
    id: 'layer-cta',
    name: 'Call-to-Action Button',
    type: 'cta',
    zIndex: 30,
    position: {
      x: ctaBox.x,
      y: ctaBox.y,
      width: ctaBox.width,
      height: ctaBox.height,
    },
    content: ctaText,
    styles: {
      backgroundColor: accentColor,
      textColor: '#FFFFFF',
      borderRadius: intensity === 'minimal' ? 6 : 999,
      fontFamily: 'Poppins',
      fontWeight: 800,
      fontSize: Math.round(canvas.height * ctaBox.height * 0.38),
      textTransform: 'uppercase',
    },
    visible: true,
  });

  const now = new Date().toISOString();

  const doc: CreativeDocument = {
    id: `doc-${blueprint.id}`,
    blueprintId: blueprint.id,
    conceptId: blueprint.conceptId,
    campaignId: blueprint.campaignId,
    version: blueprint.version || 1,
    advertisingFormat: blueprint.advertisingFormat || 'Promotional Product Advertisement',
    designIntensity: intensity,
    canvas,
    layers,
    metadata: {
      marketingAngle: blueprint.marketingAngle,
      visualNarrative: blueprint.visualNarrative,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return doc;
}

/**
 * Updates a specific layer inside a CreativeDocument and bumps the update timestamp.
 */
export function updateLayerInDocument(
  doc: CreativeDocument,
  layerId: string,
  patch: Partial<CreativeLayer>,
): CreativeDocument {
  const updatedLayers = doc.layers.map((layer) => {
    if (layer.id !== layerId) return layer;
    return {
      ...layer,
      ...patch,
      position: { ...layer.position, ...(patch.position || {}) },
      styles: { ...layer.styles, ...(patch.styles || {}) },
    };
  });

  return {
    ...doc,
    layers: updatedLayers,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Executes full creative composition, returning both the structured document
 * and the standalone rendered advertisement URL.
 */
export async function composeFinalCreative(params: ComposeCreativeParams): Promise<{
  document: CreativeDocument;
  compositeUrl: string;
  svg: string;
}> {
  const document = buildCreativeDocument(params);
  const svg = renderCreativeDocumentToSvg(document);
  const compositeUrl = svgToDataUri(svg);

  return {
    document,
    compositeUrl,
    svg,
  };
}

