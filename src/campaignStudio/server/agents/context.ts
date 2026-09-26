/** CAMPAIGN STUDIO - helpers for reading approved upstream outputs inside agents. */

import type { BrandContext, CampaignRun, CampaignStrategy, CompetitorResearch, CreativeDirection, MarketResearch } from '../../types.js';
import { defuse } from './promptUtils.js';
import type { AgentRunContext } from './types.js';

/** The approved Brand Context. The engine only runs an agent after this is approved, so a miss is a bug. */
export function requireBrand(ctx: AgentRunContext): BrandContext {
  const brand = ctx.upstream.brand_analysis as BrandContext | undefined;
  if (!brand || typeof brand !== 'object' || !brand.brandName) throw new Error('The approved brand profile is missing.');
  return brand;
}

export function requireMarket(ctx: AgentRunContext): MarketResearch {
  const m = ctx.upstream.market_research as MarketResearch | undefined;
  if (!m || typeof m !== 'object' || !m.marketSummary) throw new Error('The approved market research is missing.');
  return m;
}

export function requireCompetitors(ctx: AgentRunContext): CompetitorResearch {
  const c = ctx.upstream.competitor_research as CompetitorResearch | undefined;
  if (!c || typeof c !== 'object' || !Array.isArray(c.competitors)) throw new Error('The approved competitor research is missing.');
  return c;
}

export function requireStrategy(ctx: AgentRunContext): CampaignStrategy {
  const s = ctx.upstream.strategy as CampaignStrategy | undefined;
  if (!s || typeof s !== 'object' || !s.bigIdea) throw new Error('The approved campaign strategy is missing.');
  return s;
}

export function requireCreativeDirection(ctx: AgentRunContext): CreativeDirection {
  const c = ctx.upstream.creative_direction as CreativeDirection | undefined;
  if (!c || typeof c !== 'object' || !Array.isArray(c.concepts)) throw new Error('The approved creative direction is missing.');
  return c;
}

/** Compact brand facts for prompts (drops images, sources and other bulk). */
export function brandForPrompt(b: BrandContext): Record<string, unknown> {
  return {
    brandName: b.brandName,
    website: b.website,
    category: b.category,
    summary: b.summary,
    positioning: b.positioning,
    usps: b.usps,
    products: (b.products ?? []).map((p) => ({ name: p.name, description: p.description, priceHint: p.priceHint })),
    audience: b.audience,
    voice: b.voice,
    styleKeywords: b.visualIdentity?.styleKeywords,
    markets: b.markets,
  };
}

export function goalLine(run: Pick<CampaignRun, 'goal' | 'goal_notes'>): string {
  return `${run.goal}${run.goal_notes ? ` - ${defuse(run.goal_notes)}` : ''}`;
}

/** Compact strategy facts for prompts (drops nothing important, but keeps it small). */
export function strategyForPrompt(s: CampaignStrategy): Record<string, unknown> {
  return {
    bigIdea: s.bigIdea,
    positioningStatement: s.positioningStatement,
    audience: s.audience,
    keyMessages: s.keyMessages,
    funnelStage: s.funnelStage,
    offer: s.offer,
    cta: s.cta,
    tone: s.tone,
    contentPillars: s.contentPillars,
    creativeMix: s.creativeMix,
    creativeFormats: s.creativeFormats,
    guardrails: s.guardrails,
  };
}
