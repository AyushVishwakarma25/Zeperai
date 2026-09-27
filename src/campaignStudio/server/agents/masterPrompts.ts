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
import type { CampaignPlatform, CreativeConcept, MasterPrompt, MasterPrompts } from '../../types.js';
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

export const SYSTEM_INSTRUCTION = `You are a prompt engineer and copywriter at a creative studio, preparing final inputs for an AI image generator that will produce premium commercial ad creatives. Text and logos are added on top of the image afterwards by the design tool, so the image itself must never contain words, letters, numbers, logos or watermarks.

For EACH concept given, produce ONE entry with:
1. "headline": a short, punchy, final ad headline (ideally under 8 words) that could run as-is. Base it on the concept's headline idea and the brand's voice, sharpened for impact.
2. "subheadline": optional, one short supporting line.
3. "cta": the final call-to-action button text (2-4 words), consistent with the strategy's CTA.
4. "imagePrompt": a detailed, high-fidelity prompt following this exact five-part structure inline as prose (not as literal numbered headings in the final prompt — write it as one flowing, detailed paragraph that an image model reads well, minimum 150 characters):
   ACT AS A COMMERCIAL PRODUCT PHOTOGRAPHER shooting for a premium editorial/Pinterest-style campaign.
   1. PRIMARY PRODUCT SUBJECT: [what the product is, from brand facts]
      - If a reference photo is available: 'Maintain exact product identity, label, color, shape and materials from the provided reference image. Do not alter the product itself in any way.'
      - If no reference photo: describe the product's known physical appearance from brand facts only, never invented details.
   2. SCENE & COMPOSITION: [the concept's visualIdea/composition, written as concrete art direction — camera angle, framing, focal point, negative space for the overlay text]
   3. LIGHTING & MOOD: [soft/hard light, time of day, mood keywords from creative direction]
   4. STYLE REFERENCE: 'Shot in the style of high-end Pinterest/editorial product photography — clean, aspirational, magazine-quality, not generic stock photography.'
   5. STRICT EXCLUSIONS: 'NO text, words, letters, numbers, logos, or watermarks anywhere in the image. NO added products not mentioned above. NO people unless the concept explicitly calls for a lifestyle shot with a person.'
5. "negativePrompt": optional short phrase of things to avoid in the image (e.g. "no clutter, no people, no text, no watermarks, no distorted labels").

Rules:
- One entry per concept id given, using that exact id. Do not invent, skip or merge concepts.
- Every imagePrompt must follow the five-part structure as a rich, single flowing paragraph (minimum 150 characters).
- NEVER instruct the model to render any text, words, numbers, logos or labels in the image (e.g. never use phrases like "add text", "with the words", "logo saying").
- Never invent product claims, prices or features not present in the brand facts.
- Respect anything in "thingsToAvoid" and the strategy's guardrails.
- Adapt framing, copy and composition to the selected platforms in <platforms> (e.g. Meta feed favours 4:5 or 1:1, Stories 9:16, marketplace listings like Amazon/Flipkart/Blinkit/Zepto favour 1:1 square). If an explicit aspect ratio is set, it wins; otherwise default per platform.
- When <product_images> are provided, product reference photos are available (listed below); write the imagePrompt assuming the generation step will use these as the ACTUAL product appearance — describe the SCENE, LIGHTING and COMPOSITION around the product, not the product's own appearance (color/shape/label), since that comes from the reference photo.
- ${UNTRUSTED_DATA_RULE}
- If <known_facts> conflicts with or adds to public information, ALWAYS trust <known_facts> — it comes directly from the brand, not from search. Never contradict it. Use it to fill gaps that search cannot answer (internal metrics, unpublished changes, business specifics).
- Reply with ONLY the requested JSON object.`;

export const MIN_IMAGE_PROMPT_CHARS = 150;

const BANNED_IMAGE_PROMPT_PATTERNS: Array<{ re: RegExp; phrase: string }> = [
  { re: /\badd text\b/i, phrase: 'add text' },
  { re: /\bwith the words\b/i, phrase: 'with the words' },
  { re: /\blogo saying\b/i, phrase: 'logo saying' },
  { re: /\bwith text\b/i, phrase: 'with text' },
  { re: /\btext saying\b/i, phrase: 'text saying' },
  { re: /\btext reading\b/i, phrase: 'text reading' },
  { re: /\bwords saying\b/i, phrase: 'words saying' },
];

export function defaultAspectRatioForPlatforms(platforms?: CampaignPlatform[]): string {
  if (!platforms || platforms.length === 0) return '1:1';
  if (platforms.length === 1 && platforms[0] === 'instagram_organic') return '4:5';
  return '1:1';
}

function conceptBlock(concepts: CreativeConcept[]): string {
  return JSON.stringify(
    concepts.map((c) => ({ id: c.id, pillar: c.pillar, headline: c.headline, subheadline: c.subheadline, visualIdea: c.visualIdea, storyline: c.storyline, cta: c.cta, composition: c.composition })),
  );
}

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const strategy = requireStrategy(ctx);
  const direction = requireCreativeDirection(ctx);
  const platforms = ctx.run.settings?.platforms ?? ['meta_ads'];

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
  ];
  if (ctx.run.known_facts) {
    parts.push(fence('known_facts', ctx.run.known_facts));
  }
  parts.push(
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    fence('platforms', JSON.stringify(platforms)),
  );
  if (ctx.productImages && ctx.productImages.length > 0) {
    parts.push(
      fence('product_images', JSON.stringify(ctx.productImages)),
      `<instruction>PRODUCT REFERENCE PHOTOS ARE AVAILABLE for concepts (${direction.concepts.map((c) => c.id).join(', ')}). For every prompt, apply Primary Product Subject instruction: Maintain exact product identity, label, color, shape and materials from the provided reference image without altering the product in any way.</instruction>`,
    );
  }
  parts.push(
    fence('strategy_inputs', JSON.stringify({ tone: strategy.tone, cta: strategy.cta, guardrails: strategy.guardrails })),
    fence('previous_analysis', JSON.stringify(directionMeta)),
    `<task>Concepts:\n${conceptBlock(direction.concepts)}</task>`,
  );
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

/** Normalises model output; enforces exact concept-id coverage. pillar/aspectRatio are server-set, never model-trusted. */
export function parseMasterPrompts(
  raw: unknown,
  concepts: CreativeConcept[],
  aspectRatio: string,
  referenceImageUrls?: string[],
): MasterPrompts {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;
  const byId = new Map(concepts.map((c) => [c.id, c]));

  const seen = new Set<string>();
  const prompts: MasterPrompt[] = [];
  const refUrls = referenceImageUrls && referenceImageUrls.length > 0 ? referenceImageUrls : undefined;

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

    if (imagePrompt.length < MIN_IMAGE_PROMPT_CHARS) {
      throw new Error(`Concept "${conceptId}" imagePrompt is too short (${imagePrompt.length} chars). Minimum ${MIN_IMAGE_PROMPT_CHARS} characters required.`);
    }

    for (const { re, phrase } of BANNED_IMAGE_PROMPT_PATTERNS) {
      if (re.test(imagePrompt)) {
        throw new Error(
          `Concept "${conceptId}" imagePrompt contains forbidden phrase "${phrase}". The image itself must never contain rendered text; copy and CTAs are applied as separate overlay layers.`,
        );
      }
    }

    prompts.push({
      conceptId,
      pillar: concept.pillar,
      headline,
      subheadline: str(p.subheadline, 150) || undefined,
      cta: str(p.cta, 60) || concept.cta,
      imagePrompt,
      negativePrompt: str(p.negativePrompt, 300) || undefined,
      aspectRatio,
      referenceImageUrls: refUrls,
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
    const aspectRatio = ctx.run.settings?.aspectRatio || defaultAspectRatioForPlatforms(ctx.run.settings?.platforms) || '1:1';
    const refUrls = ctx.productImages?.map((img) => img.url).filter(Boolean);

    const result = await generateStructured<MasterPrompts>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: MASTER_PROMPTS_SCHEMA as unknown as Record<string, unknown>,
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseMasterPrompts(raw, direction.concepts, aspectRatio, refUrls),
    });

    return { output: result.data, model: result.model, usage: result.usage, snapshot: {} };
  },
};
