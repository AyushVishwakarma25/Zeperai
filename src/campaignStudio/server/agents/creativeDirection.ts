/**
 * CAMPAIGN STUDIO - Agent 5: Creative Direction.
 *
 * Pro model, medium thinking, no tools. Input: approved Brand Context + Strategy (+ redo note).
 * Output: CreativeDirection whose `concepts` must cover the strategy's `creativeMix` EXACTLY -
 * same pillars, same count per pillar. Concept ids are assigned by the server (pillar slug + index),
 * never trusted from the model, so later steps (master prompts, generation) can rely on them.
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type { CreativeConcept, CreativeDirection } from '../../types.js';
import { brandForPrompt, requireBrand, requireStrategy, strategyForPrompt } from './context.js';
import { str, strList } from './normalize.js';
import { UNTRUSTED_DATA_RULE, feedbackBlock, fence } from './promptUtils.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

const S = { type: 'STRING' } as const;
const strings = { type: 'ARRAY', items: S } as const;

export const CREATIVE_DIRECTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    visualTheme: S,
    moodKeywords: strings,
    colorGuidance: S,
    typographyGuidance: S,
    photographyStyle: S,
    concepts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { pillar: S, headline: S, subheadline: S, visualIdea: S, storyline: S, cta: S, composition: S },
        required: ['pillar', 'headline', 'visualIdea', 'storyline', 'cta', 'composition'],
      },
    },
    thingsToAvoid: strings,
  },
  required: ['visualTheme', 'moodKeywords', 'colorGuidance', 'typographyGuidance', 'photographyStyle', 'concepts', 'thingsToAvoid'],
} as const;

export const SYSTEM_INSTRUCTION = `You are an art director at a creative studio that makes static ads and social posts for D2C and e-commerce brands. You turn an approved campaign strategy into concrete creative concepts a designer can shoot or generate images from.

Rules:
1. Produce EXACTLY the number of concepts requested for EACH content pillar (given in <required_mix>). Use the pillar names exactly as written there.
2. Each concept must clearly execute its pillar's idea from the strategy, not repeat the same visual across concepts. Vary composition, setting and framing across concepts in the same pillar.
3. "visualIdea" is a one-sentence description of what the image shows. "storyline" is 1-2 sentences on the narrative or feeling. "composition" gives concrete art-direction: framing, camera angle, focal point, background - enough for someone to shoot or generate it.
4. "headline" and "subheadline" are short ad copy ideas (headline under 8 words). "cta" matches the strategy's call to action unless the concept needs a small variant.
5. Base every claim on the brand facts and strategy given. Never invent product features, prices or claims.
6. "colorGuidance" and "typographyGuidance" translate the brand's visual identity into direction for these creatives. "photographyStyle" describes the overall look (lighting, texture, realism vs illustration).
7. "thingsToAvoid" lists visual or messaging mistakes to avoid for this brand and category (clichés, competitor look-alikes, claims the guardrails forbid).
8. ${UNTRUSTED_DATA_RULE}
9. Reply with ONLY the requested JSON object.`;

function slugify(pillar: string): string {
  const s = pillar
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'concept';
}

function requiredMixLine(mix: { pillar: string; count: number }[]): string {
  return mix.map((m) => `- ${m.pillar}: ${m.count} concept${m.count === 1 ? '' : 's'}`).join('\n');
}

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const strategy = requireStrategy(ctx);
  const total = strategy.creativeMix.reduce((n, m) => n + m.count, 0);

  const parts = [
    `<task>Create the creative concepts for this campaign. Produce exactly ${total} concepts in total, split across pillars exactly as follows:\n<required_mix>\n${requiredMixLine(strategy.creativeMix)}\n</required_mix></task>`,
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    fence('strategy_inputs', JSON.stringify(strategyForPrompt(strategy))),
  ];
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

/**
 * Normalises model output and enforces the pillar/count contract against `requiredMix`.
 * Concept ids are assigned here (pillar slug + 1-based index within that pillar), so they are
 * stable and unique regardless of what the model returned.
 */
export function parseCreativeDirection(raw: unknown, requiredMix: { pillar: string; count: number }[]): CreativeDirection {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;

  const visualTheme = str(r.visualTheme, 300);
  if (!visualTheme) throw new Error('visualTheme is required and must be a non-empty string.');

  const validPillars = new Map(requiredMix.map((m) => [m.pillar.toLowerCase(), m.pillar]));
  const wanted = new Map(requiredMix.map((m) => [m.pillar, m.count]));

  const rawConcepts = Array.isArray(r.concepts) ? r.concepts : [];
  const byPillar = new Map<string, { headline: string; subheadline?: string; visualIdea: string; storyline: string; cta: string; composition: string }[]>();
  for (const c of rawConcepts) {
    if (!c || typeof c !== 'object') continue;
    const pillar = validPillars.get(str(c.pillar, 60).toLowerCase());
    const headline = str(c.headline, 120);
    const visualIdea = str(c.visualIdea, 300);
    if (!pillar) throw new Error(`concept pillar "${str(c.pillar, 60)}" does not match any pillar in <required_mix>.`);
    if (!headline || !visualIdea) throw new Error('Every concept needs a headline and a visualIdea.');
    const list = byPillar.get(pillar) ?? [];
    list.push({
      headline,
      subheadline: str(c.subheadline, 150) || undefined,
      visualIdea,
      storyline: str(c.storyline, 400),
      cta: str(c.cta, 100),
      composition: str(c.composition, 400),
    });
    byPillar.set(pillar, list);
  }

  for (const [pillar, count] of wanted) {
    const got = byPillar.get(pillar)?.length ?? 0;
    if (got !== count) {
      throw new Error(`Pillar "${pillar}" needs exactly ${count} concept${count === 1 ? '' : 's'} but got ${got}. Follow <required_mix> exactly.`);
    }
  }

  const concepts: CreativeConcept[] = [];
  for (const m of requiredMix) {
    const list = byPillar.get(m.pillar) ?? [];
    const slug = slugify(m.pillar);
    list.forEach((c, i) => concepts.push({ id: `${slug}-${i + 1}`, pillar: m.pillar, ...c }));
  }

  return {
    visualTheme,
    moodKeywords: strList(r.moodKeywords, 8, 40),
    colorGuidance: str(r.colorGuidance, 400),
    typographyGuidance: str(r.typographyGuidance, 300),
    photographyStyle: str(r.photographyStyle, 400),
    concepts,
    thingsToAvoid: strList(r.thingsToAvoid, 8, 200),
  };
}

export const creativeDirectionAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const strategy = requireStrategy(ctx);
    const cfg = AGENT_RUNTIME.creative_direction;
    const model = resolveTextModel(cfg.tier);
    const remaining = ctx.deadlineAt - Date.now();

    const result = await generateStructured<CreativeDirection>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: CREATIVE_DIRECTION_SCHEMA as unknown as Record<string, unknown>,
      thinkingLevel: cfg.thinkingLevel,
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseCreativeDirection(raw, strategy.creativeMix),
    });

    return { output: result.data, model: result.model, usage: result.usage, snapshot: {} };
  },
};
