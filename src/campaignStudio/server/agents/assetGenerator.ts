/**
 * CAMPAIGN STUDIO V2 - Visual Asset Generation Service.
 *
 * Converts a CreativeBlueprint's art direction into isolated visual assets
 * (backgrounds, product environments, textures, lighting elements)
 * WITHOUT baking in text, logos, or hallucinated product labels.
 */

import type { CreativeBlueprint, CreativeConcept } from '../../types.js';
import { callImageModel, type InlineImagePart } from './creatives.js';
import type { GenAIClientLike } from '../gemini.js';
import { resolveModelForTask } from '../models/modelRegistry.js';

export type VisualAssetType =
  | 'background'
  | 'environment'
  | 'lifestyle_setting'
  | 'ingredient_scene'
  | 'texture'
  | 'lighting_atmosphere';

export interface GenerateAssetParams {
  blueprint: CreativeBlueprint;
  concept?: Partial<CreativeConcept>;
  assetType?: VisualAssetType;
  model?: string;
  client?: GenAIClientLike;
  referenceParts?: InlineImagePart[];
  aspectRatio?: string;
}

/**
 * Builds a prompt for generating an isolated visual background or environment.
 */
export function buildAssetGenerationPrompt(
  blueprint: CreativeBlueprint,
  assetType: VisualAssetType = 'environment',
  concept?: Partial<CreativeConcept>,
): string {
  const art = blueprint.artDirection;
  const format = blueprint.advertisingFormat;
  const narrative = blueprint.visualNarrative;

  const parts: string[] = [];

  parts.push(`Commercial advertising background scene for a ${format}.`);
  if (narrative) {
    parts.push(`Narrative context: ${narrative}.`);
  }

  const bg = concept?.backgroundDirection || art.background;
  if (bg) {
    parts.push(`Setting and surface: ${bg}.`);
  }

  const lighting = concept?.lightingDirection || art.lighting;
  if (lighting) {
    parts.push(`Lighting: ${lighting}.`);
  }

  const compDesc = concept?.compositionDescription;
  if (compDesc) {
    parts.push(`Compositional framing: ${compDesc}.`);
  }

  if (art.photographyStyle) {
    parts.push(`Photography style: ${art.photographyStyle}.`);
  }
  if (art.colorPalette && art.colorPalette.length > 0) {
    parts.push(`Color palette mood: ${art.colorPalette.join(', ')}.`);
  }

  if (concept?.supportingElements && concept.supportingElements.length > 0) {
    parts.push(`Atmospheric accents: ${concept.supportingElements.join(', ')}.`);
  }

  // Strict negative constraints to protect typography and product separation
  parts.push('Clean studio advertising environment plate.');
  parts.push('Leave clear central negative space for hero product placement.');
  parts.push('DO NOT render any text, typography, letters, words, prices, logos, or watermarks.');

  return parts.join(' ');
}

/**
 * Generates an isolated visual asset using the configured image generation model.
 */
export async function generateVisualAsset(params: GenerateAssetParams): Promise<string> {
  const defaultModel = resolveModelForTask('image_generation_standard').model;
  const {
    blueprint,
    concept,
    assetType = 'environment',
    model = defaultModel,
    client,
    referenceParts = [],
    aspectRatio,
  } = params;

  // Intercept any legacy discontinued Imagen model calls
  const targetModel = model.includes('imagen') ? defaultModel : model;

  const prompt = buildAssetGenerationPrompt(blueprint, assetType, concept);
  const ratio = aspectRatio || blueprint.canvas?.aspectRatio || '4:5';

  return callImageModel({
    prompt,
    negativePrompt: 'text, typography, letters, words, numbers, labels, signs, clutter, low quality, distorted, blurry',
    aspectRatio: ratio,
    model: targetModel,
    client,
    referenceParts,
  });
}

