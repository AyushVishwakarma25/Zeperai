/**
 * CAMPAIGN STUDIO V2 - Deterministic Quality & Compliance Validation Rules.
 *
 * Runs programmatic checks on creative documents, blueprints, and layouts
 * before or in conjunction with AI visual quality evaluation.
 */

import type {
  CreativeBlueprint,
  CreativeDocument,
  DeterministicChecksBreakdown,
  DeterministicCheckDetails,
  QualityIssue,
} from '../../types.js';
import { resolveCanvasDimensions } from '../composition/compositor.js';

export interface DeterministicValidationResult extends DeterministicCheckDetails {}

/**
 * Validates deterministic advertising requirements on a CreativeDocument and its CreativeBlueprint.
 */
export function validateDeterministicQuality(
  doc: CreativeDocument,
  blueprint?: CreativeBlueprint,
): DeterministicValidationResult {
  const failures: string[] = [];
  const issues: QualityIssue[] = [];

  const checks: DeterministicChecksBreakdown = {
    canvasDimensions: true,
    productAssetPresent: true,
    brandLogoPresent: true,
    headlinePresent: true,
    ctaPresent: true,
    offerMatched: true,
    boundaryContainment: true,
  };

  // 1. Canvas Dimension & Aspect Ratio Validation
  const expectedDimensions = resolveCanvasDimensions(doc.canvas?.aspectRatio);
  if (doc.canvas.width !== expectedDimensions.width || doc.canvas.height !== expectedDimensions.height) {
    checks.canvasDimensions = false;
    const msg = `Canvas dimension mismatch: expected ${expectedDimensions.width}x${expectedDimensions.height} for aspect ratio ${doc.canvas.aspectRatio}, but got ${doc.canvas.width}x${doc.canvas.height}.`;
    failures.push(msg);
    issues.push({
      category: 'technicalCompliance',
      severity: 'critical',
      description: msg,
      suggestedFix: `Resize canvas to ${expectedDimensions.width}x${expectedDimensions.height}.`,
    });
  }

  // 2. Mandatory Product Asset Presence
  const productLayer = doc.layers.find((l) => l.type === 'product' && l.visible !== false);
  if (!productLayer || !productLayer.content) {
    checks.productAssetPresent = false;
    const msg = 'Missing required product asset layer. Advertisements must feature a verified product packshot.';
    failures.push(msg);
    issues.push({
      category: 'productAccuracy',
      severity: 'critical',
      affectedLayerId: 'layer-product',
      description: msg,
      suggestedFix: 'Attach a high-resolution product cutout or reference image.',
    });
  }

  // 3. Mandatory Brand Logo Presence
  const logoLayer = doc.layers.find((l) => l.type === 'logo' && l.visible !== false);
  if (blueprint?.constraints?.preserveLogo && (!logoLayer || (!logoLayer.content && !logoLayer.styles?.imageUrl))) {
    checks.brandLogoPresent = false;
    const msg = 'Missing required brand logo layer. Brand guidelines mandate brand logo placement.';
    failures.push(msg);
    issues.push({
      category: 'brandConsistency',
      severity: 'critical',
      affectedLayerId: 'layer-logo',
      description: msg,
      suggestedFix: 'Add the brand logo wordmark or image asset in the top safe margin.',
    });
  }

  // 4. Mandatory Text Completeness (Headline & CTA)
  const headlineLayer = doc.layers.find((l) => l.type === 'text' && l.id === 'layer-headline' && l.visible !== false);
  if (!headlineLayer || !headlineLayer.content || headlineLayer.content.trim().length === 0) {
    checks.headlinePresent = false;
    const msg = 'Missing mandatory ad headline text. Commercial advertisements require a clear hook.';
    failures.push(msg);
    issues.push({
      category: 'typography',
      severity: 'critical',
      affectedLayerId: 'layer-headline',
      description: msg,
      suggestedFix: 'Provide a strong hook headline under 8 words.',
    });
  }

  const ctaLayer = doc.layers.find((l) => l.type === 'cta' && l.visible !== false);
  if (!ctaLayer || !ctaLayer.content || ctaLayer.content.trim().length === 0) {
    checks.ctaPresent = false;
    const msg = 'Missing mandatory Call-to-Action button.';
    failures.push(msg);
    issues.push({
      category: 'messageClarity',
      severity: 'high',
      affectedLayerId: 'layer-cta',
      description: msg,
      suggestedFix: 'Add an actionable CTA button (e.g. SHOP NOW, ORDER TODAY).',
    });
  }

  // 5. Promotional Offer & Price Accuracy
  if (blueprint?.copy?.offer) {
    const expectedOffer = blueprint.copy.offer.trim().toLowerCase();
    const hasOfferInBadge = doc.layers.some(
      (l) => l.type === 'badge' && l.content && l.content.toLowerCase().includes(expectedOffer),
    );
    const hasOfferInText = doc.layers.some(
      (l) => l.type === 'text' && l.content && l.content.toLowerCase().includes(expectedOffer),
    );

    if (!hasOfferInBadge && !hasOfferInText) {
      checks.offerMatched = false;
      const msg = `Approved promotional offer "${blueprint.copy.offer}" is missing from ad copy and badges.`;
      failures.push(msg);
      issues.push({
        category: 'messageClarity',
        severity: 'critical',
        affectedLayerId: 'layer-badge',
        description: msg,
        suggestedFix: `Include the approved promotional offer "${blueprint.copy.offer}" in the promotional badge.`,
      });
    }
  }

  // 6. Element Clipping & Boundary Safety
  for (const layer of doc.layers) {
    if (layer.visible === false || layer.type === 'background') continue;
    const { x, y, width, height } = layer.position;

    if (x < -0.01 || y < -0.01 || x + width > 1.01 || y + height > 1.01) {
      checks.boundaryContainment = false;
      const msg = `Element "${layer.name}" (id: ${layer.id}) overflows canvas boundaries.`;
      failures.push(msg);
      issues.push({
        category: 'technicalCompliance',
        severity: 'high',
        affectedLayerId: layer.id,
        description: msg,
        suggestedFix: 'Reposition or rescale the element within the 0.0 to 1.0 canvas area.',
      });
    } else if (x < 0.02 || y < 0.02 || x + width > 0.98 || y + height > 0.98) {
      // Safe margin warning
      issues.push({
        category: 'visualHierarchy',
        severity: 'low',
        affectedLayerId: layer.id,
        description: `Element "${layer.name}" is positioned very close to canvas edges without safe margin.`,
        suggestedFix: 'Shift element inwards to respect the 5% margin safe zone.',
      });
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    issues,
    checks,
  };
}

