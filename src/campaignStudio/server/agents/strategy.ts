/**
 * CAMPAIGN STUDIO - Agent 4: Strategy.
 *
 * Pro model, high thinking, no tools. Input: approved Brand Context + Market Research + Competitor
 * Research + goal + how many creatives will be made. Output: ONE decisive strategy, whose
 * `creativeMix` splits exactly `creativeCount` creatives across its content pillars (validated here,
 * so the later creative steps can rely on it).
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type { CampaignStrategy, FunnelStage } from '../../types.js';
import { brandForPrompt, goalLine, requireBrand, requireCompetitors, requireMarket } from './context.js';
import { objList, str, strList } from './normalize.js';
import { UNTRUSTED_DATA_RULE, fence } from './promptUtils.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

const S = { type: 'STRING' } as const;
const strings = { type: 'ARRAY', items: S } as const;
export const FUNNEL_STAGES: readonly FunnelStage[] = ['awareness', 'consideration', 'conversion', 'retention'];

export const STRATEGY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    objective: S,
    bigIdea: S,
    positioningStatement: S,
    audience: { type: 'OBJECT', properties: { primary: S, insight: S, mindset: S }, required: ['primary', 'insight', 'mindset'] },
    keyMessages: { type: 'ARRAY', items: { type: 'OBJECT', properties: { message: S, proof: S }, required: ['message', 'proof'] } },
    funnelStage: { type: 'STRING', enum: [...FUNNEL_STAGES] },
    offer: S,
    cta: S,
    tone: strings,
    contentPillars: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: S, description: S, exampleAd: S }, required: ['name', 'description', 'exampleAd'] } },
    creativeMix: { type: 'ARRAY', items: { type: 'OBJECT', properties: { pillar: S, count: { type: 'INTEGER' } }, required: ['pillar', 'count'] } },
    creativeFormats: { type: 'ARRAY', items: { type: 'OBJECT', properties: { format: S, why: S }, required: ['format', 'why'] } },
    successMetrics: strings,
    guardrails: strings,
    rationale: S,
  },
  required: ['objective', 'bigIdea', 'positioningStatement', 'audience', 'keyMessages', 'funnelStage', 'cta', 'tone', 'contentPillars', 'creativeMix', 'creativeFormats', 'successMetrics', 'guardrails', 'rationale'],
} as const;

export const SYSTEM_INSTRUCTION = `You are a senior performance-creative strategist at a studio that makes static ads and social posts for D2C and e-commerce brands. You turn a brand profile, market research and competitor research into ONE decisive campaign strategy that a designer and copywriter can execute.

Rules:
1. Be decisive. Commit to a single big idea, not a menu of options. It must be specific to this brand, not a generic slogan.
2. Ground every choice in the materials. Each key message needs "proof": a concrete brand fact, product feature or research finding from the materials. Never invent claims, statistics, awards, discounts or testimonials.
3. Respect the brand voice (its "doSay"/"dontSay") and use the competitor "whiteSpace" and "messagingToAvoid" to differentiate, not imitate.
4. The campaign goal decides the funnel stage, offer and call to action. Stay consistent with it.
5. "contentPillars" are 2-4 distinct themes the creatives will explore. "creativeMix" assigns EVERY creative to a pillar, and its counts MUST add up to exactly the number of creatives requested. Use pillar names exactly as written in "contentPillars".
6. "guardrails" lists claims or approaches to avoid (health, finance, comparative or regulated claims, tone risks) so nobody creates a non-compliant ad.
7. "rationale" explains in 2-4 sentences why this strategy fits the evidence. When the user asked for changes, say what changed and why.
8. ${UNTRUSTED_DATA_RULE}
9. Reply with ONLY the requested JSON object.`;

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const market = requireMarket(ctx);
  const competitors = requireCompetitors(ctx);
  const count = ctx.run.settings?.creativeCount ?? 5;

  const parts = [
    `<task>Create the campaign strategy. Goal: ${goalLine(ctx.run)}.\nNumber of static creatives to be produced: ${count}. Aspect ratio: ${ctx.run.settings?.aspectRatio ?? '1:1'}.\nThe creativeMix counts must add up to exactly ${count}.</task>`,
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    fence('market_research', JSON.stringify({ ...market, sources: undefined })),
    fence('competitor_research', JSON.stringify({ ...competitors, sources: undefined })),
  ];

  if (ctx.previous?.output) {
    parts.push(fence('previous_output', JSON.stringify(ctx.previous.output)));
  }
  if (ctx.feedback) {
    parts.push(
      `${fence('user_feedback', ctx.feedback)}\nThe user reviewed the previous strategy and asked for the changes above. If they want a different angle or direction, produce a genuinely DIFFERENT big idea and pillars, not a rewording of the previous one. Keep what they did not criticise. Every fact must still come from the materials or from their feedback.`,
    );
  }
  return parts.join('\n\n');
}

export function parseStrategy(raw: unknown, creativeCount: number): CampaignStrategy {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;

  const need = (key: string, max: number): string => {
    const v = str(r[key], max);
    if (!v) throw new Error(`${key} is required and must be a non-empty string.`);
    return v;
  };
  const objective = need('objective', 300);
  const bigIdea = need('bigIdea', 300);
  const positioningStatement = need('positioningStatement', 400);
  const cta = need('cta', 100);
  const rationale = need('rationale', 900);

  const stage = str(r.funnelStage, 30).toLowerCase() as FunnelStage;
  if (!FUNNEL_STAGES.includes(stage)) throw new Error(`funnelStage must be one of: ${FUNNEL_STAGES.join(', ')}.`);

  const audience = {
    primary: str(r.audience?.primary, 300),
    insight: str(r.audience?.insight, 400),
    mindset: str(r.audience?.mindset, 300),
  };
  if (!audience.primary) throw new Error('audience.primary is required.');

  const keyMessages = objList(r.keyMessages, 5, (m) => {
    const message = str(m.message, 200);
    return message ? { message, proof: str(m.proof, 250) } : null;
  });
  if (keyMessages.length < 2) throw new Error('Provide at least 2 keyMessages, each with proof.');

  const seenPillars = new Set<string>();
  const contentPillars = objList(r.contentPillars, 4, (p) => {
    const name = str(p.name, 60);
    const key = name.toLowerCase();
    if (!name || seenPillars.has(key)) return null;
    seenPillars.add(key);
    return { name, description: str(p.description, 300), exampleAd: str(p.exampleAd, 300) };
  });
  if (contentPillars.length < 1) throw new Error('Provide at least 1 content pillar.');

  // creativeMix: every count is a positive integer, pillars must exist, and the total must match.
  const byName = new Map(contentPillars.map((p) => [p.name.toLowerCase(), p.name]));
  const mixTotals = new Map<string, number>();
  for (const m of Array.isArray(r.creativeMix) ? r.creativeMix : []) {
    const pillar = byName.get(str(m?.pillar, 60).toLowerCase());
    const count = Number(m?.count);
    if (!pillar) throw new Error(`creativeMix pillar "${str(m?.pillar, 60)}" does not match any contentPillars name.`);
    if (!Number.isInteger(count) || count < 1) throw new Error('creativeMix counts must be whole numbers of at least 1.');
    mixTotals.set(pillar, (mixTotals.get(pillar) ?? 0) + count);
  }
  const creativeMix = [...mixTotals.entries()].map(([pillar, count]) => ({ pillar, count }));
  const total = creativeMix.reduce((n, m) => n + m.count, 0);
  if (total !== creativeCount) throw new Error(`creativeMix counts must add up to exactly ${creativeCount} (they add up to ${total}).`);

  const creativeFormats = objList(r.creativeFormats, 6, (f) => {
    const format = str(f.format, 80);
    return format ? { format, why: str(f.why, 250) } : null;
  });
  if (creativeFormats.length < 1) throw new Error('Provide at least 1 creative format.');

  return {
    objective,
    bigIdea,
    positioningStatement,
    audience,
    keyMessages,
    funnelStage: stage,
    offer: str(r.offer, 200) || undefined,
    cta,
    tone: strList(r.tone, 6, 60),
    contentPillars,
    creativeMix,
    creativeFormats,
    successMetrics: strList(r.successMetrics, 5, 150),
    guardrails: strList(r.guardrails, 6, 200),
    rationale,
  };
}

export const strategyAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const cfg = AGENT_RUNTIME.strategy;
    const model = resolveTextModel(cfg.tier);
    const remaining = ctx.deadlineAt - Date.now();
    const count = ctx.run.settings?.creativeCount ?? 5;

    const result = await generateStructured<CampaignStrategy>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: STRATEGY_SCHEMA as unknown as Record<string, unknown>,
      thinkingLevel: cfg.thinkingLevel,
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseStrategy(raw, count),
    });

    return { output: result.data, model: result.model, usage: result.usage, snapshot: { creativeCount: count } };
  },
};
