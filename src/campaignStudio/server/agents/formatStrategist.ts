/**
 * CAMPAIGN STUDIO V2 - Campaign-Wide Advertising Format Strategist.
 *
 * Evaluates the entire campaign creative mix holistically to allocate diverse,
 * high-performing advertising formats across all concepts.
 *
 * Features:
 *  1. Holistic Campaign-Wide Pass: Evaluates all concepts together rather than in isolation.
 *  2. Multi-Factor Suitability Scoring: Objective, audience, category, angle, message hierarchy,
 *     reference design, platforms, and assets.
 *  3. Structural Diversity Enforcement: Prevents duplicate visual structure archetypes.
 *  4. De-duplication of Preselected Formats: Resolves duplicate format IDs across concepts.
 *  5. Explicit Locking Support: Honors user-locked formats unconditionally.
 *  6. Controlled Fallbacks: Prevents assigning unsuitable formats solely for diversity.
 *  7. Full Diversity Reporting: Documents distribution, repeated formats, and exceptions.
 */

import type {
  AdvertisingFormatDefinition,
  CampaignFormatAllocationResult,
  CampaignFormatDiversityOptions,
  CampaignFormatDiversityReport,
  CampaignGoal,
  CampaignStrategy,
  CreativeConcept,
  FormatAssignment,
  ReferenceDesignDNA,
} from '../../types.js';
import {
  ADVERTISING_FORMATS,
  getAdvertisingFormat,
  getFormatVisualStructure,
} from '../formatLibrary.js';

export interface FormatSuitabilityFactors {
  objectiveScore: number;
  industryScore: number;
  angleScore: number;
  hierarchyScore: number;
  referenceScore: number;
  platformScore: number;
  assetScore: number;
  preselectedBonus: number;
  totalScore: number;
  explanation: string;
}

export interface AllocateCampaignFormatsParams {
  concepts: CreativeConcept[];
  strategy?: CampaignStrategy;
  goal?: CampaignGoal | string;
  category?: string;
  platforms?: string[];
  referenceDesignDNA?: ReferenceDesignDNA;
  productImageCount?: number;
  options?: CampaignFormatDiversityOptions;
}

const DEFAULT_OPTIONS: Required<CampaignFormatDiversityOptions> = {
  maxRepeatsPerFormat: 1,
  allowStructuralOverlap: false,
  minSuitabilityThreshold: 4,
  formatRepeatPenalty: 15,
  structuralRepeatPenalty: 5,
};

/**
 * Scores the suitability of a single format for a specific concept.
 */
export function evaluateFormatSuitability(params: {
  concept: CreativeConcept;
  format: AdvertisingFormatDefinition;
  goal?: string;
  category?: string;
  platforms?: string[];
  referenceDesignDNA?: ReferenceDesignDNA;
  productImageCount?: number;
  strategy?: CampaignStrategy;
}): FormatSuitabilityFactors {
  const { concept, format, goal = 'sales', category = 'd2c', platforms = [], referenceDesignDNA, productImageCount = 1, strategy } = params;

  let objectiveScore = 0;
  let industryScore = 0;
  let angleScore = 0;
  let hierarchyScore = 0;
  let referenceScore = 0;
  let platformScore = 0;
  let assetScore = 0;
  let preselectedBonus = 0;

  const gLower = goal.toLowerCase() as CampaignGoal;
  const catLower = category.toLowerCase();
  const pillarLower = (concept.pillar || '').toLowerCase();
  const headlineLower = (concept.headline || '').toLowerCase();
  const visualLower = (concept.visualIdea || '').toLowerCase();
  const combinedText = `${pillarLower} ${headlineLower} ${visualLower}`;

  // 1. Objective Alignment
  if (format.suitableObjectives.includes(gLower)) {
    objectiveScore += 4;
  }

  // 2. Industry / Product Category Alignment
  if (format.suitableIndustries.some((ind) => catLower.includes(ind) || ind.includes(catLower))) {
    industryScore += 3;
  }

  // 3. Concept Angle & Pillar Alignment
  if (combinedText.includes('urgency') || combinedText.includes('speed') || combinedText.includes('fast') || combinedText.includes('time')) {
    if (format.id === 'promotional-retail-poster' || format.id === 'dynamic-product-ad') angleScore += 8;
  }
  if (combinedText.includes('offer') || combinedText.includes('discount') || combinedText.includes('deal') || combinedText.includes('price') || combinedText.includes('sale') || combinedText.includes('bogo')) {
    if (format.id === 'offer-led-ad' || format.id === 'promotional-retail-poster') angleScore += 10;
  }
  if (combinedText.includes('ingredient') || combinedText.includes('feature') || combinedText.includes('formula') || combinedText.includes('clean') || combinedText.includes('protein') || combinedText.includes('botanical')) {
    if (format.id === 'ingredient-feature-spotlight' || format.id === 'benefit-infographic') angleScore += 10;
  }
  if (combinedText.includes('proof') || combinedText.includes('review') || combinedText.includes('rating') || combinedText.includes('social') || combinedText.includes('stars') || combinedText.includes('loved by')) {
    if (format.id === 'social-proof-ad') angleScore += 10;
  }
  if (combinedText.includes('compare') || combinedText.includes('vs') || combinedText.includes('versus') || combinedText.includes('better than') || combinedText.includes('switch')) {
    if (format.id === 'comparison-ad' || format.id === 'problem-solution-ad') angleScore += 10;
  }
  if (combinedText.includes('problem') || combinedText.includes('struggle') || combinedText.includes('tired of') || combinedText.includes('solution') || combinedText.includes('fix')) {
    if (format.id === 'problem-solution-ad' || format.id === 'comparison-ad') angleScore += 9;
  }
  if (combinedText.includes('luxury') || combinedText.includes('editorial') || combinedText.includes('pure') || combinedText.includes('craft') || combinedText.includes('artisan') || combinedText.includes('minimal')) {
    if (format.id === 'editorial-product-ad' || format.id === 'product-hero-ad') angleScore += 8;
  }
  if (combinedText.includes('lifestyle') || combinedText.includes('routine') || combinedText.includes('daily') || combinedText.includes('morning') || combinedText.includes('story')) {
    if (format.id === 'lifestyle-ad') angleScore += 8;
  }
  if (combinedText.includes('range') || combinedText.includes('variety') || combinedText.includes('flavors') || combinedText.includes('collection') || combinedText.includes('bundle')) {
    if (format.id === 'product-range-ad' || format.id === 'offer-led-ad') angleScore += 9;
  }
  if (combinedText.includes('founder') || combinedText.includes('expert') || combinedText.includes('story') || combinedText.includes('dermatologist') || combinedText.includes('chef')) {
    if (format.id === 'founder-expert-led-ad') angleScore += 9;
  }
  if (combinedText.includes('statement') || combinedText.includes('bold copy') || combinedText.includes('words') || combinedText.includes('loud')) {
    if (format.id === 'typography-first-ad') angleScore += 8;
  }
  if (combinedText.includes('festival') || combinedText.includes('diwali') || combinedText.includes('holiday') || combinedText.includes('seasonal') || combinedText.includes('summer')) {
    if (format.id === 'seasonal-festival-ad') angleScore += 9;
  }

  // Baseline generic angle affinity if no specific keywords matched
  if (angleScore === 0) {
    if (format.id === 'promotional-retail-poster' || format.id === 'product-hero-ad' || format.id === 'lifestyle-ad') {
      angleScore += 4;
    }
  }

  // 4. Message Hierarchy & Copy Fit
  const hasOffer = Boolean(concept.blueprint?.copy?.offer || strategy?.offer || (concept as any).offer);
  if (hasOffer && (format.id === 'offer-led-ad' || format.id === 'promotional-retail-poster')) {
    hierarchyScore += 3;
  }
  if (concept.headline && concept.headline.length > 45 && (format.id === 'typography-first-ad' || format.id === 'editorial-product-ad')) {
    hierarchyScore += 2;
  }

  // 5. Reference Design DNA Alignment
  if (referenceDesignDNA?.layoutType) {
    const refLayout = referenceDesignDNA.layoutType.toLowerCase();
    if (refLayout.includes(format.id) || format.name.toLowerCase().includes(refLayout)) {
      referenceScore += 6;
    }
  }

  // 6. Platform Placement Compatibility
  const pList = platforms.map((p) => p.toLowerCase());
  const isQuickCommerce = pList.some((p) => p.includes('blinkit') || p.includes('zepto') || p.includes('instamart'));
  if (isQuickCommerce && (format.id === 'promotional-retail-poster' || format.id === 'offer-led-ad' || format.id === 'product-hero-ad')) {
    platformScore += 3;
  }
  const isSocialFeed = pList.some((p) => p.includes('meta') || p.includes('instagram') || p.includes('facebook'));
  if (isSocialFeed && (format.id === 'lifestyle-ad' || format.id === 'social-proof-ad' || format.id === 'editorial-product-ad')) {
    platformScore += 2;
  }

  // 7. Available Asset Support
  if (productImageCount > 1 && format.id === 'product-range-ad') {
    assetScore += 3;
  } else if (productImageCount === 1 && (format.id === 'product-hero-ad' || format.id === 'promotional-retail-poster')) {
    assetScore += 2;
  }

  // 8. Preselected Affinity Bonus (Soft preference if concept previously suggested this format)
  const existingFormat = concept.blueprint?.advertisingFormat || (concept as any).advertisingFormat;
  if (existingFormat) {
    const matches = format.name.toLowerCase() === existingFormat.toLowerCase() || format.id === existingFormat.toLowerCase();
    if (matches) {
      preselectedBonus += 4;
    }
  }

  const totalScore = objectiveScore + industryScore + angleScore + hierarchyScore + referenceScore + platformScore + assetScore + preselectedBonus;

  const keyFactors: string[] = [];
  if (angleScore >= 8) keyFactors.push(`Strong angle match for "${concept.pillar}"`);
  if (objectiveScore > 0) keyFactors.push(`Matches ${goal} objective`);
  if (industryScore > 0) keyFactors.push(`Suited for ${category}`);
  if (hasOffer && hierarchyScore > 0) keyFactors.push('Features offer badge hierarchy');
  if (preselectedBonus > 0) keyFactors.push('Aligned with preselected direction');

  const explanation = keyFactors.length > 0 ? keyFactors.join(', ') : `General commercial fit for ${concept.pillar}`;

  return {
    objectiveScore,
    industryScore,
    angleScore,
    hierarchyScore,
    referenceScore,
    platformScore,
    assetScore,
    preselectedBonus,
    totalScore,
    explanation,
  };
}

/**
 * Resolves whether a concept has an explicitly locked advertising format.
 */
function isConceptFormatLocked(concept: CreativeConcept): boolean {
  return Boolean(
    concept.isLocked ||
    concept.formatLocked ||
    (concept.blueprint as any)?.isLocked ||
    (concept.blueprint as any)?.formatLocked ||
    (concept.blueprint?.metadata as any)?.formatLocked
  );
}

/**
 * Resolves a format definition from a name or ID string.
 */
function resolveFormatByNameOrId(nameOrId?: string): AdvertisingFormatDefinition | undefined {
  if (!nameOrId) return undefined;
  const needle = nameOrId.toLowerCase().trim();
  return ADVERTISING_FORMATS.find(
    (f) => f.id === needle || f.name.toLowerCase() === needle
  );
}

/**
 * Allocates diverse, optimal advertising formats across all campaign concepts
 * using a holistic campaign-wide allocation pass.
 */
export function allocateCampaignFormats(
  params: AllocateCampaignFormatsParams | CreativeConcept[],
): CampaignFormatAllocationResult {
  const isArray = Array.isArray(params);
  const concepts = isArray ? params : (params?.concepts || []);
  const strategy = isArray ? undefined : params?.strategy;
  const goal = (isArray ? 'sales' : params?.goal) || 'sales';
  const category = (isArray ? 'd2c' : params?.category) || 'd2c';
  const platforms = isArray ? [] : (params?.platforms || []);
  const referenceDesignDNA = isArray ? undefined : params?.referenceDesignDNA;
  const productImageCount = isArray ? 1 : (params?.productImageCount ?? 1);
  const options: Required<CampaignFormatDiversityOptions> = {
    ...DEFAULT_OPTIONS,
    ...(isArray ? {} : params?.options),
  };

  const totalConcepts = concepts.length;
  if (totalConcepts === 0) {
    return {
      assignments: [],
      diversityReport: {
        totalConcepts: 0,
        uniqueFormatsCount: 0,
        formatDistribution: {},
        structuralDistribution: {},
        repeatedFormats: [],
        diversityScore: 1.0,
        exceptions: [],
      },
    };
  }

  const assignedFormatCounts = new Map<string, number>();
  const assignedStructureCounts = new Map<string, number>();
  const assignmentsByConceptId = new Map<string, FormatAssignment>();
  const exceptions: CampaignFormatDiversityReport['exceptions'] = [];

  // Step 1: Pre-evaluate and lock explicitly locked formats
  const unassignedConcepts: CreativeConcept[] = [];

  for (const concept of concepts) {
    const isLocked = isConceptFormatLocked(concept);
    const preselectedName = concept.blueprint?.advertisingFormat || (concept as any).advertisingFormat;
    const resolvedFormat = resolveFormatByNameOrId(preselectedName);

    if (isLocked && resolvedFormat) {
      const evaluation = evaluateFormatSuitability({
        concept,
        format: resolvedFormat,
        goal,
        category,
        platforms,
        referenceDesignDNA,
        productImageCount,
        strategy,
      });

      const structure = getFormatVisualStructure(resolvedFormat.id);
      assignedFormatCounts.set(resolvedFormat.id, (assignedFormatCounts.get(resolvedFormat.id) || 0) + 1);
      assignedStructureCounts.set(structure, (assignedStructureCounts.get(structure) || 0) + 1);

      assignmentsByConceptId.set(concept.id, {
        conceptId: concept.id,
        pillar: concept.pillar,
        format: resolvedFormat,
        rationale: `User-locked format: strictly preserved ${resolvedFormat.name}. ${evaluation.explanation}.`,
        score: evaluation.totalScore,
        isPreselected: true,
        isLocked: true,
        wasReassigned: false,
      });

      exceptions.push({
        conceptId: concept.id,
        type: 'locked_format',
        description: `Concept "${concept.id}" has format "${resolvedFormat.name}" explicitly locked by user.`,
      });
    } else {
      unassignedConcepts.push(concept);
    }
  }

  // Step 2: Compute suitability matrix for all unassigned concepts across all 15 formats
  const candidateScores = new Map<string, Map<string, FormatSuitabilityFactors>>();

  for (const concept of unassignedConcepts) {
    const conceptFormatScores = new Map<string, FormatSuitabilityFactors>();
    for (const format of ADVERTISING_FORMATS) {
      const factors = evaluateFormatSuitability({
        concept,
        format,
        goal,
        category,
        platforms,
        referenceDesignDNA,
        productImageCount,
        strategy,
      });
      conceptFormatScores.set(format.id, factors);
    }
    candidateScores.set(concept.id, conceptFormatScores);
  }

  // Determine dynamic max repeats based on available formats and campaign size
  const availableFormatCount = ADVERTISING_FORMATS.length;
  const maxRepeatsPerFormat = options.maxRepeatsPerFormat > 1
    ? options.maxRepeatsPerFormat
    : totalConcepts > availableFormatCount
      ? Math.ceil(totalConcepts / availableFormatCount)
      : 1;

  // Step 3: Priority-based Campaign-Wide Allocation Loop
  const remaining = [...unassignedConcepts];

  while (remaining.length > 0) {
    // For each remaining concept, evaluate the net effective score for all formats
    type ConceptCandidate = {
      concept: CreativeConcept;
      bestFormat: AdvertisingFormatDefinition;
      bestEffectiveScore: number;
      bestRawScore: number;
      bestFactors: FormatSuitabilityFactors;
      runnerUpScore: number;
      regret: number;
      preselectedFormat?: AdvertisingFormatDefinition;
    };

    const conceptEvaluations: ConceptCandidate[] = [];

    for (const concept of remaining) {
      const scores = candidateScores.get(concept.id)!;
      const preselectedName = concept.blueprint?.advertisingFormat || (concept as any).advertisingFormat;
      const preselectedFormat = resolveFormatByNameOrId(preselectedName);

      const scoredList: Array<{
        format: AdvertisingFormatDefinition;
        effectiveScore: number;
        rawScore: number;
        factors: FormatSuitabilityFactors;
      }> = [];

      for (const format of ADVERTISING_FORMATS) {
        const factors = scores.get(format.id)!;
        const currentFormatCount = assignedFormatCounts.get(format.id) || 0;
        const currentStructureCount = assignedStructureCounts.get(getFormatVisualStructure(format.id)) || 0;

        let effectiveScore = factors.totalScore;

        // Apply repeat penalty for identical format ID
        if (currentFormatCount > 0) {
          effectiveScore -= currentFormatCount * options.formatRepeatPenalty;
          if (currentFormatCount >= maxRepeatsPerFormat) {
            effectiveScore -= 40; // Heavy barrier to prevent exceeding max repeats when alternatives exist
          }
        }

        // Apply structural diversity penalty for duplicate visual structure archetypes
        if (!options.allowStructuralOverlap && currentStructureCount > 0) {
          effectiveScore -= currentStructureCount * options.structuralRepeatPenalty;
        }

        scoredList.push({
          format,
          effectiveScore,
          rawScore: factors.totalScore,
          factors,
        });
      }

      // Sort by effective score descending, with stable format ID tie-breaker for reproducibility
      scoredList.sort((a, b) => b.effectiveScore - a.effectiveScore || a.format.id.localeCompare(b.format.id));

      const best = scoredList[0];
      const runnerUp = scoredList[1];
      const regret = best && runnerUp ? best.effectiveScore - runnerUp.effectiveScore : 0;

      conceptEvaluations.push({
        concept,
        bestFormat: best.format,
        bestEffectiveScore: best.effectiveScore,
        bestRawScore: best.rawScore,
        bestFactors: best.factors,
        runnerUpScore: runnerUp?.effectiveScore ?? -999,
        regret,
        preselectedFormat,
      });
    }

    // Sort concepts to assign: prioritize concepts with higher regret (fewer good alternatives)
    // or higher absolute effective score, with stable concept ID tie-breaker for reproducibility
    conceptEvaluations.sort((a, b) => {
      if (b.regret !== a.regret) return b.regret - a.regret;
      if (b.bestEffectiveScore !== a.bestEffectiveScore) return b.bestEffectiveScore - a.bestEffectiveScore;
      return a.concept.id.localeCompare(b.concept.id);
    });

    const chosen = conceptEvaluations[0];
    let selectedFormat = chosen.bestFormat;
    let selectedFactors = chosen.bestFactors;
    let selectedScore = chosen.bestRawScore;

    // Check Fallback Requirement: "Never assign an unsuitable format solely to satisfy diversity"
    if (selectedScore < options.minSuitabilityThreshold) {
      // Find the highest raw suitability format regardless of repetition penalties
      const rawScores = Array.from(candidateScores.get(chosen.concept.id)!.entries())
        .map(([fmtId, factors]) => ({ format: getAdvertisingFormat(fmtId)!, factors }))
        .sort((a, b) => b.factors.totalScore - a.factors.totalScore || a.format.id.localeCompare(b.format.id));

      const topSuitable = rawScores[0];
      if (topSuitable && topSuitable.factors.totalScore >= options.minSuitabilityThreshold) {
        selectedFormat = topSuitable.format;
        selectedFactors = topSuitable.factors;
        selectedScore = topSuitable.factors.totalScore;

        exceptions.push({
          conceptId: chosen.concept.id,
          type: 'fallback_applied',
          description: `Allowed repeat of "${selectedFormat.name}" for Concept "${chosen.concept.id}" because all unused alternative formats scored below suitability threshold (${options.minSuitabilityThreshold}).`,
        });
      }
    }

    // Determine whether this was a reassignment from an identical preselected format
    const preselectedName = chosen.concept.blueprint?.advertisingFormat || (chosen.concept as any).advertisingFormat;
    const hadPreselected = Boolean(preselectedName);
    const wasReassigned = Boolean(
      hadPreselected &&
      chosen.preselectedFormat &&
      chosen.preselectedFormat.id !== selectedFormat.id
    );

    let reassignmentReason: string | undefined = undefined;
    if (wasReassigned && chosen.preselectedFormat) {
      reassignmentReason = `Preselected format "${chosen.preselectedFormat.name}" was already allocated or caused visual overlap; allocated "${selectedFormat.name}" to guarantee campaign diversity.`;
    }

    // Record the assignment
    const formatCount = (assignedFormatCounts.get(selectedFormat.id) || 0) + 1;
    assignedFormatCounts.set(selectedFormat.id, formatCount);

    const structure = getFormatVisualStructure(selectedFormat.id);
    const structCount = (assignedStructureCounts.get(structure) || 0) + 1;
    assignedStructureCounts.set(structure, structCount);

    if (formatCount > 1) {
      exceptions.push({
        conceptId: chosen.concept.id,
        type: 'duplicate_allowed',
        description: `Format "${selectedFormat.name}" repeated (${formatCount}x) to satisfy campaign concept count or strategic fit.`,
      });
    }

    const rationale = wasReassigned
      ? `${reassignmentReason} ${selectedFactors.explanation}.`
      : `Allocated ${selectedFormat.name} for concept "${chosen.concept.id}" to execute "${chosen.concept.pillar}" angle. ${selectedFactors.explanation}.`;

    assignmentsByConceptId.set(chosen.concept.id, {
      conceptId: chosen.concept.id,
      pillar: chosen.concept.pillar,
      format: selectedFormat,
      rationale,
      score: selectedScore,
      isPreselected: hadPreselected,
      isLocked: false,
      wasReassigned,
      reassignmentReason,
    });

    // Remove the allocated concept from remaining list
    const indexToRemove = remaining.findIndex((c) => c.id === chosen.concept.id);
    if (indexToRemove !== -1) {
      remaining.splice(indexToRemove, 1);
    }
  }

  // Assemble final ordered assignments matching original concept order
  const finalAssignments: FormatAssignment[] = concepts.map((c) => assignmentsByConceptId.get(c.id)!);

  // Step 4: Build Campaign-level Diversity Report
  const formatDistribution: Record<string, number> = {};
  for (const [id, count] of assignedFormatCounts.entries()) {
    formatDistribution[id] = count;
  }

  const structuralDistribution: Record<string, number> = {};
  for (const [struct, count] of assignedStructureCounts.entries()) {
    structuralDistribution[struct] = count;
  }

  const uniqueFormatsCount = assignedFormatCounts.size;
  const repeatedFormats: CampaignFormatDiversityReport['repeatedFormats'] = [];

  for (const [formatId, count] of assignedFormatCounts.entries()) {
    if (count > 1) {
      const fmt = getAdvertisingFormat(formatId)!;
      const assignedIds = finalAssignments.filter((a) => a.format.id === formatId).map((a) => a.conceptId);
      const isLocked = assignedIds.some((id) => assignmentsByConceptId.get(id)?.isLocked);
      const reason = isLocked
        ? 'Repeated due to user-locked format requirement'
        : totalConcepts > availableFormatCount
          ? `Campaign size (${totalConcepts}) exceeds format library size (${availableFormatCount})`
          : 'Repeated because alternative unused formats lacked sufficient commercial suitability';

      repeatedFormats.push({
        formatId,
        formatName: fmt.name,
        count,
        assignedConceptIds: assignedIds,
        reasonForRepeat: reason,
      });
    }
  }

  const denominator = Math.min(totalConcepts, availableFormatCount);
  const diversityScore = denominator > 0 ? Number((uniqueFormatsCount / denominator).toFixed(2)) : 1.0;

  const diversityReport: CampaignFormatDiversityReport = {
    totalConcepts,
    uniqueFormatsCount,
    formatDistribution,
    structuralDistribution,
    repeatedFormats,
    diversityScore,
    exceptions,
  };

  return {
    assignments: finalAssignments,
    diversityReport,
  };
}

/**
 * Assigns optimal advertising formats across a list of concepts, guaranteeing
 * format diversity and matching strategic intent.
 *
 * Backward-compatible drop-in replacement that uses the holistic campaign-wide allocator.
 */
export function assignFormatsToConcepts(params: {
  concepts: CreativeConcept[];
  strategy?: CampaignStrategy;
  goal?: CampaignGoal | string;
  category?: string;
  platforms?: string[];
  referenceDesignDNA?: ReferenceDesignDNA;
  productImageCount?: number;
  options?: CampaignFormatDiversityOptions;
} | CreativeConcept[]): FormatAssignment[] {
  const result = allocateCampaignFormats(params);

  // Attach diversityReport property directly onto returned array for immediate inspection
  const assignments = result.assignments;
  Object.defineProperty(assignments, 'diversityReport', {
    value: result.diversityReport,
    writable: true,
    enumerable: false,
    configurable: true,
  });

  return assignments;
}
