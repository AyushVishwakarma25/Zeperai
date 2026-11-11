/**
 * CAMPAIGN STUDIO V2 - Targeted Component Regenerator.
 *
 * Allows users and automated QA workflows to regenerate or surgically adjust
 * individual advertising layers (headline, background, product anchor, badges, CTA)
 * without destroying the rest of the approved advertisement.
 */

import type { CreativeDocument, CreativeLayer } from '../../types.js';
import { renderCreativeDocumentToSvg, svgToDataUri } from '../composition/svgRenderer.js';

export type TargetedComponent = 'headline' | 'background' | 'product' | 'badge' | 'cta' | 'subheadline';

export interface TargetedRegenerationParams {
  doc: CreativeDocument;
  component: TargetedComponent;
  instructions?: string;
  newAssetUrl?: string;
  patchStyles?: Record<string, unknown>;
  newContent?: string;
}

export interface TargetedRegenerationResult {
  document: CreativeDocument;
  compositeUrl: string;
  svg: string;
  actionTaken: string;
}

/**
 * Regenerates or updates a specific component in a CreativeDocument while
 * keeping all other layers completely intact.
 */
export function targetedRegenerateCreative(params: TargetedRegenerationParams): TargetedRegenerationResult {
  const { doc, component, instructions, newAssetUrl, patchStyles = {}, newContent } = params;

  let targetLayerId = '';
  let defaultAction = '';

  switch (component) {
    case 'headline':
      targetLayerId = 'layer-headline';
      defaultAction = 'Updated headline typography and layout';
      break;
    case 'subheadline':
      targetLayerId = 'layer-subheadline';
      defaultAction = 'Updated subheadline copy';
      break;
    case 'background':
      targetLayerId = 'layer-background';
      defaultAction = 'Replaced background environment while preserving foreground advertising elements';
      break;
    case 'product':
      targetLayerId = 'layer-product';
      defaultAction = 'Adjusted product positioning, scale, and grounded cast shadow';
      break;
    case 'badge':
      targetLayerId = 'layer-badge';
      defaultAction = 'Updated promotional offer badge and styling';
      break;
    case 'cta':
      targetLayerId = 'layer-cta';
      defaultAction = 'Updated Call-to-Action button copy and styling';
      break;
  }

  const updatedLayers = doc.layers.map((layer) => {
    if (layer.id !== targetLayerId) return layer;

    const updatedStyles = { ...layer.styles, ...patchStyles };
    let updatedContent = newContent || layer.content;

    if (component === 'background' && newAssetUrl) {
      updatedStyles.backgroundImage = newAssetUrl;
    }
    if (component === 'product' && newAssetUrl) {
      updatedStyles.imageUrl = newAssetUrl;
      updatedContent = newAssetUrl;
    }

    if (instructions && !newContent) {
      // If instructions specify text changes
      const textMatch = instructions.match(/["']([^"']+)["']/);
      if (textMatch && (component === 'headline' || component === 'subheadline' || component === 'cta' || component === 'badge')) {
        updatedContent = textMatch[1];
      }
    }

    return {
      ...layer,
      content: updatedContent,
      styles: updatedStyles,
    };
  });

  const updatedDoc: CreativeDocument = {
    ...doc,
    version: doc.version + 1,
    layers: updatedLayers,
    updatedAt: new Date().toISOString(),
  };

  const svg = renderCreativeDocumentToSvg(updatedDoc);
  const compositeUrl = svgToDataUri(svg);

  return {
    document: updatedDoc,
    compositeUrl,
    svg,
    actionTaken: instructions ? `${defaultAction}: ${instructions}` : defaultAction,
  };
}

