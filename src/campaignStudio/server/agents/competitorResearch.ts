/**
 * CAMPAIGN STUDIO - Agent 3: Competitor Research.
 *
 * Grounded with Google Search (Google fetches pages; our server never contacts competitor sites).
 * Competitor websites in the output are only kept when they are plain http(s) URLs.
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type { CompetitorResearch } from '../../types.js';
import { brandForPrompt, goalLine, requireBrand } from './context.js';
import { httpUrl, objList, sourceLinks, str, strList } from './normalize.js';
import { UNTRUSTED_DATA_RULE, feedbackBlock, fence } from './promptUtils.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

const S = { type: 'STRING' } as const;
const strings = { type: 'ARRAY', items: S } as const;

export const COMPETITOR_RESEARCH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    competitors: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: S, website: S, positioning: S, strengths: strings, weaknesses: strings, pricePoint: S, adAngles: strings, audienceFocus: S },
        required: ['name', 'positioning'],
      },
    },
    whiteSpace: strings,
    differentiators: strings,
    messagingToAvoid: strings,
    adPatterns: strings,
    searchGaps: strings,
    askUserGaps: strings,
  },
  required: ['competitors', 'whiteSpace', 'differentiators', 'messagingToAvoid', 'adPatterns', 'searchGaps', 'askUserGaps'],
} as const;

const JSON_SHAPE = `{
  "competitors": [{
    "name": "brand name",
    "website": "https://official-site (optional)",
    "positioning": "how they position themselves",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "pricePoint": "price range/tier if found (optional)",
    "adAngles": ["hooks and angles their ads or social content use"],
    "audienceFocus": "who they target (optional)"
  }],
  "whiteSpace": ["positioning gaps this brand can own"],
  "differentiators": ["specific ways this brand can stand apart"],
  "messagingToAvoid": ["overused claims and clichés in this category"],
  "adPatterns": ["common creative formats and hooks in the category's ads"],
  "searchGaps": ["facts worth searching again for that search didn't verify"],
  "askUserGaps": ["private business data no search will ever find (CAC, ROAS, AOV, exact distribution/listing status, internal formulation history, unpublished offers)"]
}`;

export const SYSTEM_INSTRUCTION = `You are a competitive intelligence analyst at a creative studio that makes ads for D2C and e-commerce brands. Your findings shape positioning and creative direction.

Rules:
1. Ground everything in Google Search results. Only report competitors, prices and claims you actually found. NEVER invent brands, prices, quotes or ad copy.
2. Classify anything you cannot verify into exactly one of two buckets: searchGaps (a search-findable fact you didn't confirm — will be retried) or askUserGaps (private business data no search will ever find — CAC, ROAS, AOV, exact distribution/listing status, internal formulation history, unpublished offers). Never put a private-data item in searchGaps.
3. If <known_facts> is present and already answers one of the askUserGaps items, the agent should not list it as a gap at all.
4. Choose 3-5 DIRECT competitors: same category, same buyers, sold in the brand's markets (India when none are given). Include at least one large incumbent and one similar-sized D2C brand when they exist. Never list the brand itself.
5. Describe what competitors' marketing actually does (hooks, claims, formats) so the studio can differentiate. Do not suggest copying anyone.
6. Be specific and concise. "whiteSpace" and "differentiators" must be things this brand can credibly claim given its own facts.
7. ${UNTRUSTED_DATA_RULE}
8. If <known_facts> conflicts with or adds to public information, ALWAYS trust <known_facts> — it comes directly from the brand, not from search. Never contradict it. Use it to fill gaps that search cannot answer (internal metrics, unpublished changes, business specifics).
9. Reply with ONLY the requested JSON object.`;

export function buildPrompt(ctx: AgentRunContext): string {
  const brand = requireBrand(ctx);
  const parts = [
    `<task>Research this brand's direct competitors and how they market. Campaign goal (for emphasis): ${goalLine(ctx.run)}.\nSearch for the leading brands in the category and market, their positioning, pricing, and the ads and social content they run.</task>`,
  ];
  if (ctx.run.known_facts) {
    parts.push(fence('known_facts', ctx.run.known_facts));
  }
  parts.push(
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    `Return exactly this JSON structure:\n${JSON_SHAPE}`,
  );
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

export function parseCompetitorResearch(raw: unknown, brandName: string): CompetitorResearch {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;
  const self = brandName.trim().toLowerCase();

  const seen = new Set<string>();
  const competitors = objList(r.competitors, 6, (c) => {
    const name = str(c.name, 100);
    const positioning = str(c.positioning, 350);
    const key = name.toLowerCase();
    if (!name || !positioning || key === self || seen.has(key)) return null;
    seen.add(key);
    return {
      name,
      website: httpUrl(c.website),
      positioning,
      strengths: strList(c.strengths, 4, 200),
      weaknesses: strList(c.weaknesses, 4, 200),
      pricePoint: str(c.pricePoint, 80) || undefined,
      adAngles: strList(c.adAngles, 4, 200),
      audienceFocus: str(c.audienceFocus, 200) || undefined,
    };
  });
  const searchGaps = strList(r.searchGaps ?? r.gaps, 6, 200);
  const askUserGaps = strList(r.askUserGaps, 6, 200);
  if (competitors.length === 0 && searchGaps.length === 0 && askUserGaps.length === 0) {
    throw new Error('Provide at least one competitor, or explain in "searchGaps" or "askUserGaps" why none could be found.');
  }

  return {
    competitors,
    whiteSpace: strList(r.whiteSpace, 5, 250),
    differentiators: strList(r.differentiators, 5, 250),
    messagingToAvoid: strList(r.messagingToAvoid, 5, 200),
    adPatterns: strList(r.adPatterns, 5, 250),
    searchGaps,
    askUserGaps,
    sources: [],
    grounded: false,
  };
}

export const competitorResearchAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const brand = requireBrand(ctx);
    const cfg = AGENT_RUNTIME.competitor_research;
    const model = resolveTextModel(cfg.tier);
    const remaining = ctx.deadlineAt - Date.now();

    const result = await generateStructured<CompetitorResearch>({
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(ctx),
      schema: COMPETITOR_RESEARCH_SCHEMA as unknown as Record<string, unknown>,
      tools: { googleSearch: cfg.googleSearch, urlContext: cfg.urlContext },
      temperature: cfg.temperature,
      timeoutMs: Math.min(cfg.timeoutMs, Math.max(5_000, remaining - 1_000)),
      budgetMs: Math.max(5_000, remaining - 1_000),
      client: ctx.geminiClient,
      parse: (raw) => parseCompetitorResearch(raw, brand.brandName),
    });

    const sources = sourceLinks(result.sources);
    return {
      output: { ...result.data, sources, grounded: sources.length > 0 },
      model: result.model,
      usage: result.usage,
      snapshot: { groundingSources: result.sources },
    };
  },
};
