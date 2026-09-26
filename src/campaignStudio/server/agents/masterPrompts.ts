/**
 * CAMPAIGN STUDIO - Agent 6: Master Prompts.
 *
 * Flash model, no tools. Input: approved Brand Context + Strategy + Creative Direction (+ redo note).
 * Output: MasterPrompts, one entry per creative concept, matched by id (validated: same set of ids
 * as the approved Creative Direction, no more, no less).
 *
 * Design: imagePrompt describes ONLY the visual scene (no text-in-image), matching this app's
 * existing background-generation + overlay pattern (see AdTextOverlay). headline/subheadline/cta are
 * separate fields the generation step (chunk 7) will render as an overlay, not bake into the image.
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type { CreativeConcept, MasterPrompt, MasterPrompts } from '../../types.js';
import { brandForPrompt, requireBrand, requireCreativeDirection, requireStrategy, strategyForPrompt } from './context.js';
import { str } from './normalize.js';
import { UNTRUSTED_DATA_RULE, feedbackBlock, fence } from './promptUtils.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

const S = { type: 'STRING' } as const;

export const MASTER_PROMPTS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    prompts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { conceptId: S, headline: S, subheadline: S, cta: S, imagePrompt: S, negativePrompt: S },
        required: ['conceptId', 'headline', 'cta', 'imagePrompt'],
      },
    },
  },
  required: ['prompts'],
} as const;

export const SYSTEM_INSTRUCTION = `You are a prompt engineer and copywriter at a creative studio, preparing final inputs for an AI image generator that will produce ad backgrounds. Text and logos are added on top of the image afterwards by the design tool, so the image itself must never contain words, letters, numbers, logos or watermarks.

For EACH concept given, produce ONE entry with:
1. "headline": a short, punchy, final ad headline (ideally under 8 words) that could run as-is. Base it on the concept's headline idea and the brand's voice, sharpened for impact.
2. "subheadline": optional, one short supporting line.
3. "cta": the final call-to-action button text (2-4 words), consistent with the strategy's CTA.
4. "imagePrompt": a detailed, concrete prompt an image model can follow: subject, setting, composition/framing, lighting, colour palette, mood, photographic or illustration style. Reflect the concept's visualIdea and composition, and the campaign's colorGuidance/typographyGuidance/photographyStyle. NEVER instruct the model to render any text, words, numbers, logos or labels in the image.
5. "negativePrompt": optional short phrase of things to avoid in the image (e.g. "no clutter, no people, no text").

Rules:
- One entry per concept id given, using that exact id. Do not invent, skip or merge concepts.
- Never invent product claims, prices or features not present in the brand facts.
- Respect anything in "thingsToAvoid" and the strategy's guardrails.
- ${UNTRUSTED_DATA_RULE}
- Reply with ONLY the requested JSON object.`;

function conceptBlock(concepts: CreativeConcept[]): string {
  return JSON.stringify(
    concepts.map((c) => ({ id: c.id, pillar: c.pillar, headline: c.headline, subheadline: c.subheadline, visualIdea: c.visualIdea, storyline: c.storyline, cta: c.cta, composition: c.composition })),
  );
}

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const strategy = requireStrategy(ctx);
  const direction = requireCreativeDirection(ctx);

  const directionMeta = {
    visualTheme: direction.visualTheme,
    moodKeywords: direction.moodKeywords,
    colorGuidance: direction.colorGuidance,
    typographyGuidance: direction.typographyGuidance,
    photographyStyle: direction.photographyStyle,
    thingsToAvoid: direction.thingsToAvoid,
  };

  const parts = [
    `<task>Write the final ad copy and image-generation prompt for each of the ${direction.concepts.length} concepts below. Use each concept's exact "id" as "conceptId".</task>`,
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    fence('strategy_inputs', JSON.stringify({ tone: strategy.tone, cta: strategy.cta, guardrails: strategy.guardrails })),
    fence('previous_analysis', JSON.stringify(directionMeta)),
    `<task>Concepts:\n${conceptBlock(direction.concepts)}</task>`,
  ];
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

/** Normalises model output; enforces exact concept-id coverage. pillar/aspectRatio are server-set, never model-trusted. */
export function parseMasterPrompts(raw: unknown, concepts: CreativeConcept[], aspectRatio: string): MasterPrompts {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;
  const byId = new Map(concepts.map((c) => [c.id, c]));

  const seen = new Set<string>();
  const prompts: MasterPrompt[] = [];
  for (const p of Array.isArray(r.prompts) ? r.prompts : []) {
    if (!p || typeof p !== 'object') continue;
    const conceptId = str(p.conceptId, 60);
    const concept = byId.get(conceptId);
    if (!concept) throw new Error(`conceptId "${conceptId}" does not match any of the given concepts.`);
    if (seen.has(conceptId)) throw new Error(`conceptId "${conceptId}" appears more than once.`);
    seen.add(conceptId);

    const headline = str(p.headline, 120);
    const imagePrompt = str(p.imagePrompt, 2000);
    if (!headline) throw new Error(`Concept "${conceptId}" is missing a headline.`);
    if (!imagePrompt) throw new Error(`Concept "${conceptId}" is missing an imagePrompt.`);

    prompts.push({
      conceptId,
      pillar: concept.pillar,
      headline,
      subheadline: str(p.subheadline, 150) || undefined,
      cta: str(p.cta, 60) || concept.cta,
      imagePrompt,
      negativePrompt: str(p.negativePrompt, 300) || undefined,
      aspectRatio,
    });
  }

  const missing = concepts.filter((c) => !seen.has(c.id)).map((c) => c.id);
  if (missing.length > 0) throw new Error(`Missing prompts for concept id(s): ${missing.join(', ')}.`);

  return { prompts };
}

export const masterPromptsAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const direction = requireCreativeDirection(ctx);
    const cfg = AGENT_RUNTIME.master_prompts;
    const model = resolveTextModel(cfg.tier);
    const remaining = ctx.deadlineAt - Date.now();
    const aspectRatio = ctx.run.settings?.aspectRatio || '1:1';

    const result = await generateStructured<MasterPrompts>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: MASTER_PROMPTS_SCHEMA as unknown as Record<string, unknown>,
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseMasterPrompts(raw, direction.concepts, aspectRatio),
    });

    return { output: result.data, model: result.model, usage: result.usage, snapshot: {} };
  },
};
