/**
 * CAMPAIGN STUDIO V2 - Advertising Format Strategist.
 *
 * Evaluates the campaign strategy, pillars, concepts, and brand DNA to select
 * and assign distinct advertising formats across the creative mix.
 */

import type { AdvertisingFormatDefinition, CampaignGoal, CampaignStrategy, CreativeConcept } from '../../types.js';
import { ADVERTISING_FORMATS, getAdvertisingFormat, matchFormatsForConcept } from '../formatLibrary.js';

export interface FormatAssignment {
  conceptId: string;
  pillar: string;
  format: AdvertisingFormatDefinition;
  rationale: string;
}

/**
 * Assigns optimal advertising formats across a list of concepts, guaranteeing
 * format diversity and matching strategic intent.
 */
export function assignFormatsToConcepts(params: {
  concepts: CreativeConcept[];
  strategy?: CampaignStrategy;
  goal?: CampaignGoal | string;
  category?: string;
} | CreativeConcept[]): FormatAssignment[] {
  const isArray = Array.isArray(params);
  const concepts = isArray ? params : (params?.concepts || []);
  const strategy = isArray ? undefined : params?.strategy;
  const goal = (isArray ? 'sales' : params?.goal) || 'sales';
  const category = (isArray ? 'd2c' : params?.category) || 'd2c';
  const assignments: FormatAssignment[] = [];
  const usedFormatIds: string[] = [];

  for (let i = 0; i < concepts.length; i++) {
    const concept = concepts[i];

    // If concept already requested a specific format by name/id, honor it if valid
    const existingFormatName = concept.blueprint?.advertisingFormat;
    let chosenFormat: AdvertisingFormatDefinition | undefined = undefined;

    if (existingFormatName) {
      chosenFormat = ADVERTISING_FORMATS.find(
        (f) => f.name.toLowerCase() === existingFormatName.toLowerCase() || f.id === existingFormatName.toLowerCase(),
      );
    }

    if (!chosenFormat) {
      chosenFormat = matchFormatsForConcept({
        pillar: concept.pillar || concept.headline || 'General',
        goal: String(goal),
        category,
        usedFormatIds,
      });
    }

    // Record usage to promote variety in subsequent concepts
    usedFormatIds.push(chosenFormat.id);

    const rationale = `Selected ${chosenFormat.name} for concept "${concept.id}" to execute the "${concept.pillar}" angle with optimal ${chosenFormat.recommendedVisualHierarchy[0]}.`;

    assignments.push({
      conceptId: concept.id,
      pillar: concept.pillar,
      format: chosenFormat,
      rationale,
    });
  }

  return assignments;
}

