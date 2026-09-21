/**
 * CAMPAIGN STUDIO - Agent 2: Market Research.
 *
 * Grounded with Google Search. Input: the APPROVED Brand Context + campaign goal (+ redo note).
 * Output: MarketResearch. `sources` and `grounded` come from Google's grounding metadata, never from
 * the model, so the UI can show honest provenance and warn when nothing was actually searched.
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type { MarketResearch } from '../../types.js';
import { brandForPrompt, goalLine, requireBrand } from './context.js';
import { objList, sourceLinks, str, strList } from './normalize.js';
import { UNTRUSTED_DATA_RULE, feedbackBlock, fence } from './promptUtils.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

const S = { type: 'STRING' } as const;
const strings = { type: 'ARRAY', items: S } as const;

/** Used for the repair pass (Gemini cannot combine a response schema with search tools on the first call). */
export const MARKET_RESEARCH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: S,
    marketSummary: S,
    trends: { type: 'ARRAY', items: { type: 'OBJECT', properties: { trend: S, whyItMatters: S }, required: ['trend', 'whyItMatters'] } },
    customerInsights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { insight: S, evidence: S }, required: ['insight'] } },
    seasonalMoments: { type: 'ARRAY', items: { type: 'OBJECT', properties: { moment: S, timing: S, angle: S }, required: ['moment', 'angle'] } },
    channelInsights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { channel: S, insight: S }, required: ['channel', 'insight'] } },
    opportunities: strings,
    risks: strings,
    gaps: strings,
  },
  required: ['category', 'marketSummary', 'trends', 'customerInsights', 'seasonalMoments', 'channelInsights', 'opportunities', 'risks', 'gaps'],
} as const;

const JSON_SHAPE = `{
  "category": "the category you researched",
  "marketSummary": "2-4 sentences: the state of this market for this brand right now",
  "trends": [{"trend": "...", "whyItMatters": "what it means for advertising this brand"}],
  "customerInsights": [{"insight": "what buyers want, fear or misunderstand", "evidence": "what you found that supports it"}],
  "seasonalMoments": [{"moment": "festival, season or event", "timing": "when", "angle": "how an ad could use it"}],
  "channelInsights": [{"channel": "e.g. Instagram, Meta ads, marketplaces", "insight": "how buyers behave there"}],
  "opportunities": ["gaps or openings for this brand"],
  "risks": ["things that could hurt the campaign"],
  "gaps": ["things you could not verify"]
}`;

export const SYSTEM_INSTRUCTION = `You are a market research analyst at a creative studio that makes ads for D2C and e-commerce brands. Your research decides the campaign strategy, so it must be accurate and useful for advertising.

Rules:
1. Ground everything in Google Search results. State only what the results support. NEVER invent statistics, market sizes, percentages, brand names or quotes. If you cannot verify a number, leave it out and add it to "gaps".
2. Prefer recent sources (last 12-18 months). When you cite a figure, include its year.
3. Default to the brand's own markets (India when none are given). Use local context: festivals, price sensitivity, platforms people actually use.
4. Focus on what changes ad creative and strategy: buyer motivations and objections, trends, seasonal moments, channel behaviour, pricing expectations. Skip generic industry filler.
5. Be specific and concise. Every item must be something a strategist could act on.
6. ${UNTRUSTED_DATA_RULE}
7. Reply with ONLY the requested JSON object.`;

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const parts = [
    `<task>Research the market for this brand so the campaign strategy is grounded in evidence. Campaign goal (for emphasis): ${goalLine(ctx.run)}.\nRun several targeted searches: category trends, buyer needs and objections, seasonal and festive demand in the brand's markets, social and paid-ads behaviour, and price expectations.</task>`,
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    `Return exactly this JSON structure (3-6 trends, 3-6 customer insights, up to 5 seasonal moments, up to 5 channel insights):\n${JSON_SHAPE}`,
  ];
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

/** Normalises model output; sources/grounded are filled in by the agent from grounding metadata. */
export function parseMarketResearch(raw: unknown, fallbackCategory: string): MarketResearch {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;

  const marketSummary = str(r.marketSummary, 900);
  if (!marketSummary) throw new Error('marketSummary is required and must be a non-empty string.');

  const trends = objList(r.trends, 6, (t) => {
    const trend = str(t.trend, 200);
    return trend ? { trend, whyItMatters: str(t.whyItMatters, 300) } : null;
  });
  const customerInsights = objList(r.customerInsights, 6, (c) => {
    const insight = str(c.insight, 250);
    return insight ? { insight, evidence: str(c.evidence, 300) || undefined } : null;
  });
  const opportunities = strList(r.opportunities, 6, 250);
  if (trends.length + customerInsights.length + opportunities.length === 0) {
    throw new Error('Provide at least one trend, customer insight or opportunity.');
  }

  return {
    category: str(r.category, 120) || fallbackCategory,
    marketSummary,
    trends,
    customerInsights,
    seasonalMoments: objList(r.seasonalMoments, 5, (m) => {
      const moment = str(m.moment, 100);
      return moment ? { moment, timing: str(m.timing, 80) || undefined, angle: str(m.angle, 250) } : null;
    }),
    channelInsights: objList(r.channelInsights, 5, (c) => {
      const channel = str(c.channel, 60);
      return channel ? { channel, insight: str(c.insight, 300) } : null;
    }),
    opportunities,
    risks: strList(r.risks, 5, 250),
    gaps: strList(r.gaps, 6, 200),
    sources: [],
    grounded: false,
  };
}

export const marketResearchAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const brand = requireBrand(ctx);
    const cfg = AGENT_RUNTIME.market_research;
    const model = resolveTextModel(cfg.tier);
    const remaining = ctx.deadlineAt - Date.now();

    const result = await generateStructured<MarketResearch>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: MARKET_RESEARCH_SCHEMA as unknown as Record<string, unknown>,
      tools: { googleSearch: cfg.googleSearch },
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseMarketResearch(raw, brand.category),
    });

    const sources = sourceLinks(result.sources);
    return {
      output: { ...result.data, sources, grounded: sources.length > 0 },
      model: result.model,
      usage: result.usage,
      snapshot: { groundingSources: result.sources },
    };
  },
  // No parseEdited: research is regenerated with feedback rather than hand-edited.
};
