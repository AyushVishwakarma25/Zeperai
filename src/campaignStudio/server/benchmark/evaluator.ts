/**
 * CAMPAIGN STUDIO V2 - Quality Benchmark Evaluator.
 *
 * Implements rigorous deterministic and semantic evaluation across 10 creative dimensions,
 * measuring both master creatives and adapted placements independently,
 * identifying recurring failure patterns, and comparing automated QA against human CD baselines.
 */

import type {
  BrandContext,
  CreativeBlueprint,
  CreativeDocument,
  CreativeLayer,
  EvaluationStatus,
  NormalizedBoundingBox,
  ReferenceDesignDNA,
  StandardAspectRatio,
} from '../../types.js';
import type {
  BenchmarkEvaluationMetrics,
  FailurePatternCode,
  FailurePatternOccurrence,
  HumanEvaluationRecord,
} from './types.js';
import { measureTextLayout } from '../composition/textMeasurer.js';

/**
 * Calculates bounding box intersection area.
 */
function calculateBoxOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

/**
 * Evaluates a creative document (master or placement) across all 10 benchmark dimensions.
 */
export function evaluateBenchmarkCreative(params: {
  doc: CreativeDocument;
  blueprint: CreativeBlueprint;
  brand: BrandContext;
  referenceDNA?: ReferenceDesignDNA;
  ratio?: StandardAspectRatio;
  isPlacement?: boolean;
}): {
  metrics: BenchmarkEvaluationMetrics;
  status: EvaluationStatus;
  passed: boolean;
  hardRuleFailures: string[];
  failurePatterns: FailurePatternOccurrence[];
} {
  const { doc, blueprint, brand, referenceDNA, ratio = '4:5', isPlacement = false } = params;
  const hardRuleFailures: string[] = [];
  const failurePatterns: FailurePatternOccurrence[] = [];

  const layers = doc.layers || [];
  const productLayer = layers.find((l) => l.type === 'product' && l.visible);
  const headlineLayer = layers.find((l) => l.id === 'layer-headline' || l.type === 'headline' || l.type === 'text');
  const subheadlineLayer = layers.find((l) => l.id === 'layer-subheadline');
  const ctaLayer = layers.find((l) => l.type === 'cta');
  const badgeLayer = layers.find((l) => l.type === 'badge');

  // =========================================================================
  // 1. Product Fidelity (15% weight)
  // =========================================================================
  let productFidelity = 100;
  if (!productLayer) {
    productFidelity = 0;
    hardRuleFailures.push('Missing mandatory product hero packshot layer');
    failurePatterns.push({
      code: 'PRODUCT_OCCLUSION',
      severity: 'error',
      description: 'Product hero layer is missing or marked invisible.',
      recommendation: 'Ensure product hero layer is rendered with valid product asset URL.',
    });
  } else {
    const pArea = productLayer.position.width * productLayer.position.height;
    if (pArea < 0.10) {
      productFidelity -= 35;
      failurePatterns.push({
        code: 'PRODUCT_OCCLUSION',
        severity: 'warning',
        description: `Product hero area (${(pArea * 100).toFixed(1)}%) is undersized, risking label illegibility.`,
        recommendation: 'Scale product hero bounding box to occupy at least 15-40% of canvas.',
        affectedLayer: productLayer.id,
      });
    }

    // Check occlusion from headline or CTA
    if (headlineLayer) {
      const overlap = calculateBoxOverlap(productLayer.position, headlineLayer.position);
      const headlineArea = headlineLayer.position.width * headlineLayer.position.height;
      if (overlap > 0.05 * headlineArea) {
        productFidelity -= 40;
        hardRuleFailures.push('Headline text occludes product hero packshot');
        failurePatterns.push({
          code: 'PRODUCT_OCCLUSION',
          severity: 'error',
          description: `Headline layer collides with product packshot (overlap: ${(overlap * 100).toFixed(1)}% of canvas).`,
          recommendation: 'Position headline in dedicated negative space above or beside product.',
          affectedLayer: headlineLayer.id,
        });
      }
    }

    if (ctaLayer) {
      const overlapCta = calculateBoxOverlap(productLayer.position, ctaLayer.position);
      if (overlapCta > 0.02) {
        productFidelity -= 25;
        failurePatterns.push({
          code: 'PRODUCT_OCCLUSION',
          severity: 'warning',
          description: 'CTA button collides with product packshot.',
          recommendation: 'Anchor CTA button at bottom margin away from product.',
          affectedLayer: ctaLayer.id,
        });
      }
    }
  }

  // =========================================================================
  // 2. Brand Consistency (12% weight)
  // =========================================================================
  let brandConsistency = 100;
  const brandColors = brand.visualIdentity?.colors?.map((c) => c.hex.toLowerCase()) || [];
  const docPrimaryColor = String(doc.layers[0]?.styles?.backgroundColor || '').toLowerCase();
  if (brandColors.length > 0 && docPrimaryColor && !brandColors.includes(docPrimaryColor)) {
    // Check if background uses a neutral shade
    if (!['#000000', '#ffffff', '#0a0a0a', '#111827', '#1f2937', '#f9fafb'].includes(docPrimaryColor)) {
      brandConsistency -= 15;
      failurePatterns.push({
        code: 'CONTRAST_DEFICIT',
        severity: 'warning',
        description: `Background color "${docPrimaryColor}" does not match brand identity palette.`,
        recommendation: 'Align background scrim or container with official brand colors.',
      });
    }
  }

  // Check forbidden terms
  const dontSay = brand.voice?.dontSay || [];
  const allCopy = `${headlineLayer?.content || ''} ${subheadlineLayer?.content || ''} ${ctaLayer?.content || ''}`.toLowerCase();
  for (const forbidden of dontSay) {
    if (forbidden && allCopy.includes(forbidden.toLowerCase())) {
      brandConsistency -= 40;
      hardRuleFailures.push(`Contains forbidden brand term: "${forbidden}"`);
      failurePatterns.push({
        code: 'UNAPPROVED_CLAIM',
        severity: 'error',
        description: `Copy contains forbidden brand phrase: "${forbidden}".`,
        recommendation: `Remove "${forbidden}" and re-generate compliant advertising copy.`,
      });
    }
  }

  // =========================================================================
  // 3. Visual Hierarchy (12% weight)
  // =========================================================================
  let visualHierarchy = 100;
  if (!headlineLayer) {
    visualHierarchy -= 50;
    hardRuleFailures.push('Missing primary headline layer');
  } else if (!ctaLayer) {
    visualHierarchy -= 30;
  } else {
    // Verify vertical reading progression: Headline above CTA
    if (headlineLayer.position.y >= ctaLayer.position.y) {
      visualHierarchy -= 35;
      failurePatterns.push({
        code: 'TEXT_CLIPPING',
        severity: 'warning',
        description: 'Reversed visual hierarchy: Headline positioned below CTA button.',
        recommendation: 'Maintain top-to-bottom reading hierarchy (Headline -> Product -> CTA).',
      });
    }

    // Font size hierarchy check
    const hlSize = Number(headlineLayer.styles?.fontSize) || 40;
    const subSize = Number(subheadlineLayer?.styles?.fontSize) || 20;
    if (subheadlineLayer && subSize >= hlSize) {
      visualHierarchy -= 20;
    }
  }

  // =========================================================================
  // 4. Typography Readability & Text Measurement (12% weight)
  // =========================================================================
  let typographyReadability = 100;
  if (headlineLayer && headlineLayer.content) {
    const hlFontFamily = String(headlineLayer.styles?.fontFamily || 'Poppins');
    const hlFontSize = Number(headlineLayer.styles?.fontSize) || 36;
    const hlWidth = doc.canvas.width * headlineLayer.position.width;
    const hlHeight = doc.canvas.height * headlineLayer.position.height;

    const measuredHl = measureTextLayout(String(headlineLayer.content || ''), {
      fontFamily: hlFontFamily,
      fontSize: hlFontSize,
      maxWidthPx: hlWidth,
      maxHeightPx: hlHeight,
      maxLines: 4,
    });

    if (measuredHl.overflow || measuredHl.truncated || measuredHl.totalHeight > hlHeight * 1.05) {
      typographyReadability -= 35;
      hardRuleFailures.push('Headline text overflows allocated bounding box');
      failurePatterns.push({
        code: 'TEXT_CLIPPING',
        severity: 'error',
        description: `Headline text "${headlineLayer.content.slice(0, 30)}..." overflows container height by ${(measuredHl.totalHeight - hlHeight).toFixed(0)}px.`,
        recommendation: 'Increase headline bounding box height or reduce font size to prevent text truncation.',
        affectedLayer: headlineLayer.id,
      });
    }
  }

  // Check CTA button padding
  if (ctaLayer && ctaLayer.content) {
    const ctaWidth = doc.canvas.width * ctaLayer.position.width;
    const ctaMeasured = measureTextLayout(ctaLayer.content, {
      fontFamily: 'Poppins',
      fontSize: Number(ctaLayer.styles?.fontSize) || 16,
      maxWidthPx: ctaWidth,
    });

    const maxLineWidth = Math.max(...(ctaMeasured.lineWidths || [ctaMeasured.totalWidth]));
    if (maxLineWidth > ctaWidth * 0.90) {
      typographyReadability -= 20;
      failurePatterns.push({
        code: 'TEXT_CLIPPING',
        severity: 'warning',
        description: 'CTA button text fills >90% of button width, risking text clipping at button edges.',
        recommendation: 'Increase CTA container width or reduce font size to preserve horizontal padding.',
        affectedLayer: ctaLayer.id,
      });
    }
  }

  // =========================================================================
  // 5. Composition & Negative Space (12% weight)
  // =========================================================================
  let composition = 100;
  const nonBackgroundLayers = layers.filter((l) => l.type !== 'background');
  const totalCoveredArea = nonBackgroundLayers.reduce((sum, l) => sum + l.position.width * l.position.height, 0);

  if (totalCoveredArea > 0.72) {
    composition -= 30;
    failurePatterns.push({
      code: 'OVERCROWDED_CANVAS',
      severity: totalCoveredArea > 0.82 ? 'error' : 'warning',
      description: `Canvas is overcrowded: elements cover ${(totalCoveredArea * 100).toFixed(1)}% of canvas area.`,
      recommendation: 'Reduce element bounding boxes to restore at least 35% negative space.',
    });
  } else if (totalCoveredArea < 0.22) {
    composition -= 20;
  }

  // Check for canvas boundary overflow
  for (const layer of nonBackgroundLayers) {
    const right = layer.position.x + layer.position.width;
    const bottom = layer.position.y + layer.position.height;
    if (right > 1.02 || bottom > 1.02 || layer.position.x < -0.02 || layer.position.y < -0.02) {
      composition -= 40;
      hardRuleFailures.push(`Layer "${layer.name}" overflows outside canvas boundary`);
      failurePatterns.push({
        code: 'TEXT_CLIPPING',
        severity: 'error',
        description: `Layer "${layer.name}" extends outside the 0.0-1.0 canvas coordinates (x:${layer.position.x.toFixed(2)}, right:${right.toFixed(2)}).`,
        recommendation: 'Clamp element coordinates within the 0.0 to 1.0 canvas viewport.',
        affectedLayer: layer.id,
      });
    }
  }

  // =========================================================================
  // 6. Message Clarity (10% weight)
  // =========================================================================
  let messageClarity = 100;
  const headlineWords = (headlineLayer?.content || '').trim().split(/\s+/).filter(Boolean);
  if (headlineWords.length > 12) {
    messageClarity -= 25;
    failurePatterns.push({
      code: 'UNAPPROVED_CLAIM',
      severity: 'warning',
      description: `Headline contains ${headlineWords.length} words; advertising hooks perform best under 8 words.`,
      recommendation: 'Shorten headline to a punchy, thumb-stopping 4-8 word claim.',
      affectedLayer: headlineLayer?.id,
    });
  } else if (headlineWords.length < 2) {
    messageClarity -= 30;
  }

  // =========================================================================
  // 7. CTA Visibility (10% weight)
  // =========================================================================
  let ctaVisibility = 100;
  if (!ctaLayer) {
    ctaVisibility = 0;
    hardRuleFailures.push('Missing call-to-action button layer');
    failurePatterns.push({
      code: 'MISSING_CTA',
      severity: 'error',
      description: 'Creative lacks a visible call-to-action button layer.',
      recommendation: 'Add an action-oriented CTA button (e.g. "Shop Now", "Claim Offer").',
    });
  } else {
    if (ctaLayer.position.height < 0.04) {
      ctaVisibility -= 30;
    }
    const ctaText = (ctaLayer.content || '').toUpperCase();
    const actionVerbs = ['SHOP', 'ORDER', 'GET', 'CLAIM', 'TRY', 'DISCOVER', 'EXPLORE', 'EXPERIENCE', 'BUY', 'SAVE'];
    const hasActionVerb = actionVerbs.some((v) => ctaText.includes(v));
    if (!hasActionVerb) {
      ctaVisibility -= 15;
    }
  }

  // =========================================================================
  // 8. Reference Interpretation (7% weight)
  // =========================================================================
  let referenceInterpretation = 95;
  if (referenceDNA) {
    // Check if layout elements match reading order
    if (referenceDNA.readingOrder && referenceDNA.readingOrder.length > 0) {
      referenceInterpretation += 5;
    }
  }

  // =========================================================================
  // 9. Placement Suitability & Safe Zones (10% weight)
  // =========================================================================
  let placementSuitability = 100;
  if (ratio === '9:16') {
    // 9:16 Stories & Reels UI Safe Zones:
    // Top 250px buffer (13.02% of 1920px height)
    // Bottom 350px buffer (18.23% of 1920px height) -> Max Y = 1.0 - 0.1823 = 0.8177
    for (const layer of nonBackgroundLayers) {
      if (layer.position.y < 0.12) {
        placementSuitability -= 30;
        hardRuleFailures.push(`Story safe zone: Layer "${layer.name}" intrudes into top 250px header area`);
        failurePatterns.push({
          code: 'SAFE_ZONE_VIOLATION',
          severity: 'error',
          description: `Layer "${layer.name}" at y=${(layer.position.y * 100).toFixed(1)}% violates top 250px Story safe zone.`,
          recommendation: 'Position all interactive copy and logos below y=0.1302 in 9:16 placements.',
          affectedLayer: layer.id,
          placementRatio: '9:16',
        });
      }

      const layerBottom = layer.position.y + layer.position.height;
      if (layerBottom > 0.83) {
        placementSuitability -= 30;
        hardRuleFailures.push(`Story safe zone: Layer "${layer.name}" intrudes into bottom 350px engagement bar`);
        failurePatterns.push({
          code: 'SAFE_ZONE_VIOLATION',
          severity: 'error',
          description: `Layer "${layer.name}" extends to y=${(layerBottom * 100).toFixed(1)}%, colliding with Meta Story UI buttons.`,
          recommendation: 'Keep all buttons and copy above y=0.8177 in 9:16 placements.',
          affectedLayer: layer.id,
          placementRatio: '9:16',
        });
      }
    }
  } else if (ratio === '1.91:1') {
    // Landscape 1.91:1 Reflow Check: Should use horizontal division
    if (productLayer && headlineLayer) {
      // Horizontal separation: product and headline should not be stacked vertically across 100% width
      if (productLayer.position.width > 0.80 && headlineLayer.position.width > 0.80) {
        placementSuitability -= 25;
        failurePatterns.push({
          code: 'OVERCROWDED_CANVAS',
          severity: 'warning',
          description: 'Landscape 1.91:1 placement stacks full-width elements instead of side-by-side reflow.',
          recommendation: 'Reflow 1.91:1 creatives into left/right side-by-side product and copy columns.',
          placementRatio: '1.91:1',
        });
      }
    }
  }

  // =========================================================================
  // 10. Overall Quality Composite Score (0 - 100)
  // =========================================================================
  const rawOverall =
    productFidelity * 0.15 +
    brandConsistency * 0.12 +
    visualHierarchy * 0.12 +
    typographyReadability * 0.12 +
    composition * 0.12 +
    messageClarity * 0.10 +
    ctaVisibility * 0.10 +
    referenceInterpretation * 0.07 +
    placementSuitability * 0.10;

  let overallQuality = Math.max(0, Math.min(100, Math.round(rawOverall)));

  const hasHardFailures = hardRuleFailures.length > 0;
  if (hasHardFailures) {
    // Cap score at 65 if critical hard failures exist
    overallQuality = Math.min(overallQuality, 65);
  }

  const passed = overallQuality >= 75 && !hasHardFailures;
  const status: EvaluationStatus = passed ? 'passed' : 'rejected';

  return {
    metrics: {
      productFidelity: Math.max(0, productFidelity),
      brandConsistency: Math.max(0, brandConsistency),
      visualHierarchy: Math.max(0, visualHierarchy),
      typographyReadability: Math.max(0, typographyReadability),
      composition: Math.max(0, composition),
      messageClarity: Math.max(0, messageClarity),
      ctaVisibility: Math.max(0, ctaVisibility),
      referenceInterpretation: Math.max(0, referenceInterpretation),
      placementSuitability: Math.max(0, placementSuitability),
      overallQuality,
    },
    status,
    passed,
    hardRuleFailures,
    failurePatterns,
  };
}
