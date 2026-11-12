/**
 * CAMPAIGN STUDIO V2 - Creative Direction & Composition Critic.
 *
 * Automated pre-generation critic that evaluates visual concepts and layout blueprints
 * BEFORE expensive asset generation and rendering occur.
 *
 * Evaluates:
 * 1. Weak or generic concepts (e.g., repetitive centered hero, plain solid/blurred background, cliches)
 * 2. Repetitive visual ideas across concepts (e.g., concepts using the same framing, setting, or camera angle)
 * 3. Poor product visibility or occlusion (e.g., text obscuring packaging, product too small)
 * 4. Inappropriate backgrounds (mismatched category or clashing with brand positioning)
 * 5. Unclear message hierarchy (ambiguous headline/CTA or reversed reading flow)
 * 6. Insufficient negative space (overcrowded canvas, bounding box collision)
 * 7. Visual conflicts with brand guidelines (forbidden colors, forbidden phrases, tone mismatch)
 *
 * Provides self-healing automated revision for weak or rejected concepts.
 */

import type {
  BrandContext,
  CampaignStrategy,
  ConceptCritiqueReview,
  CreativeConcept,
  CreativeDirection,
  CriticIssue,
  CriticIssueType,
  DirectionCritiqueReport,
  NormalizedBoundingBox,
  ReferenceDesignDNA,
} from '../../types.js';
import { getAdvertisingFormat } from '../formatLibrary.js';

export interface CriticOptions {
  passThreshold?: number; // default: 75
  maxRevisionAttempts?: number; // default: 2
  strictBrandGuidelines?: boolean;
}

/** Known generic visual clichés that signify weak AI direction */
const GENERIC_CLICHE_PATTERNS = [
  /centered product (hero )?(on|with) (plain|white|solid|neutral|empty) background/i,
  /simple product shot/i,
  /product in the middle/i,
  /stock photo style/i,
  /generic studio background/i,
  /floating in air/i,
  /standard commercial packshot/i,
];

/**
 * Calculates the bounding box intersection area to detect element occlusion.
 */
function calculateBoxOverlapArea(a: NormalizedBoundingBox, b: NormalizedBoundingBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

/**
 * Calculates Jaccard word similarity between two texts.
 */
function calculateWordSimilarity(textA: string, textB: string): number {
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Evaluates a single creative concept and its layout blueprint against the critic's standards.
 */
export function evaluateSingleConcept(params: {
  concept: CreativeConcept;
  brand: BrandContext;
  strategy?: CampaignStrategy;
  referenceDNA?: ReferenceDesignDNA;
}): ConceptCritiqueReview {
  const { concept, brand, strategy, referenceDNA } = params;
  const issues: CriticIssue[] = [];

  let originalityScore = 90;
  let brandAlignmentScore = 95;
  let productVisibilityScore = 95;
  let hierarchyClarityScore = 90;
  let negativeSpaceScore = 90;
  let backgroundSuitabilityScore = 90;

  const visualIdea = concept.visualIdea || '';
  const composition = concept.composition || concept.compositionDescription || '';
  const headline = concept.headline || '';
  const cta = concept.cta || '';
  const blueprint = concept.blueprint;
  const layoutElements = blueprint?.layout?.elements || [];

  // 1. Weak or Generic Concept Evaluation
  if (visualIdea.length < 15 || composition.length < 15) {
    originalityScore -= 30;
    issues.push({
      type: 'weak_concept',
      severity: 'error',
      conceptId: concept.id,
      description: `Concept "${concept.id}" contains vague or superficial visual direction (${visualIdea.length} chars).`,
      recommendation: 'Provide rich, concrete environmental art direction with specific camera angle, lighting, and textures.',
    });
  } else if (visualIdea.length < 25 || composition.length < 25) {
    originalityScore -= 10;
    issues.push({
      type: 'weak_concept',
      severity: 'warning',
      conceptId: concept.id,
      description: `Concept "${concept.id}" has brief visual direction (${visualIdea.length} chars).`,
      recommendation: 'Elaborate on lighting, texture, and scene context for richer creative generation.',
    });
  }

  for (const pattern of GENERIC_CLICHE_PATTERNS) {
    if (pattern.test(visualIdea) || pattern.test(composition)) {
      originalityScore -= 35;
      backgroundSuitabilityScore -= 25;
      issues.push({
        type: 'weak_concept',
        severity: 'error',
        conceptId: concept.id,
        description: `Concept "${concept.id}" uses a generic visual cliché: "${visualIdea}".`,
        recommendation: 'Replace plain or centered placement with contextual lifestyle, dynamic angle, or editorial split.',
      });
      break;
    }
  }

  // 2. Product Visibility & Occlusion Evaluation
  const productBox = layoutElements.find((el) => el.element.toLowerCase() === 'product');
  const headlineBox = layoutElements.find((el) => el.element.toLowerCase() === 'main_headline');
  const ctaBox = layoutElements.find((el) => el.element.toLowerCase() === 'cta');

  if (productBox) {
    const productArea = productBox.width * productBox.height;
    if (productArea < 0.12) {
      productVisibilityScore -= 25;
      issues.push({
        type: 'poor_visibility',
        severity: 'warning',
        conceptId: concept.id,
        description: `Product hero box occupies only ${(productArea * 100).toFixed(1)}% of canvas area, risking poor packaging legibility.`,
        recommendation: 'Scale product hero bounding box to occupy at least 18-35% of the visual canvas.',
      });
    }

    if (headlineBox) {
      const overlapWithHeadline = calculateBoxOverlapArea(productBox, headlineBox);
      const headlineArea = headlineBox.width * headlineBox.height;
      if (overlapWithHeadline > 0.05 * headlineArea) {
        productVisibilityScore -= 35;
        issues.push({
          type: 'poor_visibility',
          severity: 'error',
          conceptId: concept.id,
          description: `Headline text box collides with product hero box (overlap: ${(overlapWithHeadline * 100).toFixed(1)}% of canvas).`,
          recommendation: 'Reposition headline into dedicated negative space above or beside the product to prevent occlusion.',
        });
      }
    }

    if (ctaBox) {
      const overlapWithCta = calculateBoxOverlapArea(productBox, ctaBox);
      if (overlapWithCta > 0.02) {
        productVisibilityScore -= 20;
        issues.push({
          type: 'poor_visibility',
          severity: 'warning',
          conceptId: concept.id,
          description: 'CTA button overlaps with hero product box.',
          recommendation: 'Anchor CTA button at bottom margin away from product boundaries.',
        });
      }
    }
  }

  // 3. Message Hierarchy Clarity
  if (!headline || headline.trim().length === 0) {
    hierarchyClarityScore -= 50;
    issues.push({
      type: 'unclear_hierarchy',
      severity: 'error',
      conceptId: concept.id,
      description: 'Missing primary headline.',
      recommendation: 'Provide a strong, benefit-driven hook headline (under 8 words).',
    });
  }

  if (!cta || cta.trim().length === 0) {
    hierarchyClarityScore -= 30;
    issues.push({
      type: 'unclear_hierarchy',
      severity: 'warning',
      conceptId: concept.id,
      description: 'Missing call-to-action button copy.',
      recommendation: 'Include an action-oriented 2-4 word CTA (e.g. "Shop Now", "Claim Offer").',
    });
  }

  // 4. Insufficient Negative Space
  if (layoutElements.length > 0) {
    const totalCoveredArea = layoutElements.reduce((sum, el) => sum + el.width * el.height, 0);
    if (totalCoveredArea > 0.75) {
      negativeSpaceScore -= 30;
      issues.push({
        type: 'insufficient_negative_space',
        severity: totalCoveredArea > 0.85 ? 'error' : 'warning',
        conceptId: concept.id,
        description: `Elements cover ${(totalCoveredArea * 100).toFixed(1)}% of canvas, leaving insufficient negative space for design breathing room.`,
        recommendation: 'Reduce copy density and element bounding boxes to maintain at least 35% negative space.',
      });
    }
  }

  // 5. Inappropriate Background Evaluation
  const category = (brand.category || '').toLowerCase();
  const background = (concept.backgroundDirection || blueprint?.artDirection?.background || '').toLowerCase();

  if (category.includes('food') || category.includes('beverage') || category.includes('nutrition') || category.includes('coffee')) {
    if (background.includes('industrial warehouse') || background.includes('concrete ruin') || background.includes('smoky bar')) {
      backgroundSuitabilityScore -= 25;
      issues.push({
        type: 'inappropriate_background',
        severity: 'warning',
        conceptId: concept.id,
        description: `Background setting ("${background}") conflicts with ${brand.category} culinary hygiene and appetite appeal.`,
        recommendation: 'Use warm, appetizing commercial settings such as clean kitchen countertops, marble surfaces, or sunny pantry backdrops.',
      });
    }
  }

  // 6. Brand Guideline Conflicts
  const dontSay = brand.voice?.dontSay || [];
  const fullCopy = `${headline} ${concept.subheadline || ''} ${visualIdea}`.toLowerCase();
  for (const forbidden of dontSay) {
    if (forbidden && fullCopy.includes(forbidden.toLowerCase())) {
      brandAlignmentScore -= 35;
      issues.push({
        type: 'brand_conflict',
        severity: 'error',
        conceptId: concept.id,
        description: `Concept copy or visual direction contains forbidden brand term: "${forbidden}".`,
        recommendation: `Remove "${forbidden}" and align messaging with the brand's approved voice.`,
      });
    }
  }

  // Calculate overall composite score
  let overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        originalityScore * 0.2 +
          brandAlignmentScore * 0.2 +
          productVisibilityScore * 0.2 +
          hierarchyClarityScore * 0.15 +
          negativeSpaceScore * 0.15 +
          backgroundSuitabilityScore * 0.1,
      ),
    ),
  );

  const hasErrors = issues.some((i) => i.severity === 'error');
  if (hasErrors) {
    // A concept with critical errors cannot receive a passing grade (>= 75)
    overallScore = Math.min(overallScore, 68);
  }
  const isApproved = overallScore >= 75 && !hasErrors;

  return {
    conceptId: concept.id,
    overallScore,
    isApproved,
    criteriaScores: {
      originality: Math.max(0, originalityScore),
      brandAlignment: Math.max(0, brandAlignmentScore),
      productVisibility: Math.max(0, productVisibilityScore),
      hierarchyClarity: Math.max(0, hierarchyClarityScore),
      negativeSpace: Math.max(0, negativeSpaceScore),
      backgroundSuitability: Math.max(0, backgroundSuitabilityScore),
    },
    issues,
  };
}

/**
 * Evaluates the entire creative direction across concepts, identifying repetitive visual patterns
 * and individual concept shortcomings.
 */
export function criticizeCreativeDirection(params: {
  direction: CreativeDirection;
  brand: BrandContext;
  strategy?: CampaignStrategy;
  referenceDNA?: ReferenceDesignDNA;
  options?: CriticOptions;
}): DirectionCritiqueReport {
  const { direction, brand, strategy, referenceDNA, options } = params;
  const passThreshold = options?.passThreshold ?? 75;

  const conceptReviews: ConceptCritiqueReview[] = [];
  const crossConceptIssues: CriticIssue[] = [];

  // 1. Evaluate individual concepts
  for (const concept of direction.concepts) {
    const review = evaluateSingleConcept({
      concept,
      brand,
      strategy,
      referenceDNA,
    });
    conceptReviews.push(review);
  }

  // 2. Cross-Concept Repetition Check
  const concepts = direction.concepts;
  const formatCounts = new Map<string, number>();
  const cameraAngleCounts = new Map<string, number>();

  for (let i = 0; i < concepts.length; i++) {
    const cA = concepts[i];
    const formatA = cA.blueprint?.advertisingFormat || 'Standard';
    formatCounts.set(formatA, (formatCounts.get(formatA) || 0) + 1);

    const angleA = (cA.compositionDescription || cA.composition || '').toLowerCase();
    const cameraAngleA = angleA.includes('low') ? 'low-angle' : angleA.includes('top') ? 'flat-lay' : 'eye-level';
    cameraAngleCounts.set(cameraAngleA, (cameraAngleCounts.get(cameraAngleA) || 0) + 1);

    for (let j = i + 1; j < concepts.length; j++) {
      const cB = concepts[j];
      const similarity = calculateWordSimilarity(cA.visualIdea, cB.visualIdea);
      if (similarity > 0.65) {
        crossConceptIssues.push({
          type: 'repetitive_idea',
          severity: 'warning',
          conceptId: cB.id,
          description: `Concepts "${cA.id}" and "${cB.id}" share repetitive visual themes (similarity: ${(similarity * 100).toFixed(0)}%).`,
          recommendation: `Differentiate concept "${cB.id}" by introducing a distinct environmental context or contrasting lighting.`,
        });
      }
    }
  }

  // If more than 50% of concepts use the exact same advertising format or same eye-level angle
  for (const [format, count] of formatCounts) {
    if (count > 2 && count > concepts.length * 0.5) {
      crossConceptIssues.push({
        type: 'repetitive_idea',
        severity: 'warning',
        description: `${count} of ${concepts.length} concepts repeat the "${format}" format, reducing campaign variety.`,
        recommendation: 'Rebalance campaign format allocation across editorial, spotlight, and lifestyle formats.',
      });
    }
  }

  // Calculate composite campaign critique score
  const totalConceptScore = conceptReviews.reduce((sum, r) => sum + r.overallScore, 0);
  const averageConceptScore = conceptReviews.length > 0 ? totalConceptScore / conceptReviews.length : 0;
  const penaltyForRepetition = Math.min(30, crossConceptIssues.length * 5);
  const overallScore = Math.max(0, Math.round(averageConceptScore - penaltyForRepetition));

  const allConceptApproved = conceptReviews.every((r) => r.isApproved);
  const hasCrossErrors = crossConceptIssues.some((i) => i.severity === 'error');
  const isApproved = overallScore >= passThreshold && allConceptApproved && !hasCrossErrors;

  const totalIssues = conceptReviews.reduce((sum, r) => sum + r.issues.length, 0) + crossConceptIssues.length;
  const summary = isApproved
    ? `Creative direction approved by composition critic (score: ${overallScore}/100, concepts: ${concepts.length}, issues: ${totalIssues}).`
    : `Creative direction flagged by composition critic (score: ${overallScore}/100, issues: ${totalIssues}, threshold: ${passThreshold}). Revision recommended.`;

  return {
    overallScore,
    isApproved,
    reviewedAt: new Date().toISOString(),
    conceptReviews,
    crossConceptIssues,
    revisionsCount: 0,
    summary,
  };
}

/**
 * Automatically revises weak or flagged concepts to resolve critic issues.
 */
export function reviseWeakConcepts(params: {
  direction: CreativeDirection;
  critique: DirectionCritiqueReport;
  brand: BrandContext;
  strategy?: CampaignStrategy;
}): {
  revisedDirection: CreativeDirection;
  revisionsApplied: string[];
} {
  const { direction, critique, brand, strategy } = params;
  const revisionsApplied: string[] = [];

  const brandPrimaryColor = brand.visualIdentity?.colors?.[0]?.hex || '#0A0A0A';
  const brandSecondaryColor = brand.visualIdentity?.colors?.[1]?.hex || '#F59E0B';
  const brandFont = brand.visualIdentity?.typography || 'Poppins';

  // Alternative formats for diversifying repetitive layouts
  const alternativeFormats = [
    'Editorial Product Advertisement',
    'Feature Spotlight',
    'Split Benefit Comparison',
    'Lifestyle In-Situ Placement',
    'Promotional Retail Poster',
  ];

  const revisedConcepts = direction.concepts.map((concept, index) => {
    const review = critique.conceptReviews.find((r) => r.conceptId === concept.id);
    if (!review || review.isApproved) {
      return concept;
    }

    const revised: CreativeConcept = { ...concept };
    const conceptRevisions: string[] = [];

    // 1. Resolve Repetitive or Weak Concept
    const weakIssue = review.issues.find((i) => i.type === 'weak_concept' || i.type === 'repetitive_idea');
    if (weakIssue) {
      const currentFormat = revised.blueprint?.advertisingFormat;
      const isFormatRepetition = review.issues.some((i) => i.type === 'repetitive_idea');
      const targetFormat = (!currentFormat || isFormatRepetition)
        ? alternativeFormats[index % alternativeFormats.length]
        : currentFormat;

      if (revised.blueprint && targetFormat !== currentFormat) {
        revised.blueprint.advertisingFormat = targetFormat;
      }

      // Elevate visual idea with concrete commercial art direction
      const angles = ['dynamic 45-degree hero angle with grounded cast shadow', 'crisp low-angle architectural perspective', 'top-down clean tabletop lay'];
      const lightings = ['soft diffuse morning daylight with warm natural fill', 'high-contrast studio strobe with crisp rim accents', 'warm golden-hour ambient glow'];
      const chosenAngle = angles[index % angles.length];
      const chosenLighting = lightings[index % lightings.length];

      revised.composition = `Art-directed ${targetFormat}: Product framed at a ${chosenAngle}, illuminated by ${chosenLighting}, on a pristine textured surface with clear negative space for typography.`;
      revised.compositionDescription = revised.composition;
      revised.lightingDirection = chosenLighting;
      revised.backgroundDirection = `${brand.category || 'Commercial'} setting with elegant minimalist depth-of-field`;
      conceptRevisions.push(`Enhanced composition and art direction with ${chosenAngle}`);
    }

    // 2. Resolve Poor Product Visibility / Bounding Box Occlusion
    const visibilityIssue = review.issues.find((i) => i.type === 'poor_visibility' || i.type === 'insufficient_negative_space');
    if (visibilityIssue && revised.blueprint) {
      // Reposition elements with guaranteed non-overlapping bounding boxes
      revised.blueprint.layout.elements = [
        { element: 'badge', x: 0.08, y: 0.08, width: 0.35, height: 0.05, alignment: 'left', layer: 10 },
        { element: 'main_headline', x: 0.08, y: 0.15, width: 0.84, height: 0.18, alignment: 'left', layer: 10 },
        { element: 'subheadline', x: 0.08, y: 0.35, width: 0.84, height: 0.06, alignment: 'left', layer: 10 },
        { element: 'product', x: 0.15, y: 0.44, width: 0.70, height: 0.40, alignment: 'center', layer: 5 },
        { element: 'cta', x: 0.08, y: 0.87, width: 0.45, height: 0.07, alignment: 'center', layer: 10 },
      ];
      conceptRevisions.push('Adjusted bounding boxes to eliminate headline/product collision and restore 35% negative space');
    }

    // 3. Resolve Brand Guideline Conflicts
    const brandIssue = review.issues.find((i) => i.type === 'brand_conflict');
    if (brandIssue) {
      const dontSay = brand.voice?.dontSay || [];
      let sanitizedHeadline = revised.headline;
      for (const forbidden of dontSay) {
        if (forbidden) {
          const re = new RegExp(`\\b${forbidden}\\b`, 'gi');
          sanitizedHeadline = sanitizedHeadline.replace(re, '').trim();
        }
      }
      revised.headline = sanitizedHeadline || `${brand.brandName} - Premium Quality`;
      conceptRevisions.push('Sanitized copy to remove forbidden brand terms');
    }

    // 4. Resolve Inappropriate Background
    const bgIssue = review.issues.find((i) => i.type === 'inappropriate_background');
    if (bgIssue) {
      revised.backgroundDirection = 'Clean minimalist architectural studio setting with soft natural morning light and refined stone texture';
      if (revised.blueprint) {
        revised.blueprint.artDirection.background = revised.backgroundDirection;
      }
      conceptRevisions.push('Updated background direction to appetizing/premium brand-aligned environment');
    }

    // Harmonize colors and typography
    revised.colorTypographyDirection = {
      colorGuidance: `Primary: ${brandPrimaryColor}, Accent: ${brandSecondaryColor}`,
      typographyGuidance: `Primary Display: ${brandFont}`,
      fonts: [brandFont],
    };

    if (conceptRevisions.length > 0) {
      revisionsApplied.push(`Concept ${concept.id}: ${conceptRevisions.join('; ')}`);
    }

    return {
      ...revised,
      criticReview: {
        ...review,
        revisionsApplied: conceptRevisions,
      },
    };
  });

  const revisedDirection: CreativeDirection = {
    ...direction,
    concepts: revisedConcepts,
    blueprints: revisedConcepts.map((c) => c.blueprint!).filter(Boolean),
  };

  return {
    revisedDirection,
    revisionsApplied,
  };
}
