/**
 * CAMPAIGN STUDIO V2 - Agent 5: Creative Direction & AI Art Director.
 *
 * Pro model, medium thinking, no tools.
 * Input: Approved Brand Context + Market Research + Competitor Research + Strategy (+ redo note).
 * Output: CreativeDirection & CreativeBlueprints whose `concepts` must cover the strategy's `creativeMix` EXACTLY -
 * same pillars, same count per pillar.
 *
 * Each concept contains a complete, strongly-typed Creative Blueprint with:
 *  - Canvas dimensions and aspect ratio
 *  - Format and marketing angle
 *  - Visual narrative and art direction
 *  - Normalized bounding boxes (0.0 to 1.0)
 *  - Design intensity (minimal, balanced, bold, experimental)
 *  - Typographic hierarchy and Google Font selections
 *  - Supporting graphic elements (badges, pills, price callouts)
 *  - Brand and packaging fidelity constraints
 */

import { AGENT_RUNTIME, resolveTextModel } from '../config.js';
import { generateStructured } from '../gemini.js';
import type {
  BrandContext,
  CampaignReference,
  CampaignStrategy,
  CreativeConcept,
  CreativeDirection,
  DesignIntensity,
  NormalizedBoundingBox,
  ReferenceDesignDNA,
} from '../../types.js';
import { createDefaultBlueprintFromConcept, DESIGN_INTENSITIES, normalizeBoundingBox } from '../blueprintSchema.js';
import { brandForPrompt, requireBrand, requireStrategy, strategyForPrompt } from './context.js';
import { str, strList } from './normalize.js';
import { UNTRUSTED_DATA_RULE, feedbackBlock, fence } from './promptUtils.js';
import { reconcileMultiReferences } from './referenceAnalyst.js';
import { allocateCampaignFormats } from './formatStrategist.js';
import { getAdvertisingFormat } from '../formatLibrary.js';
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
        properties: {
          pillar: S,
          headline: S,
          subheadline: S,
          visualIdea: S,
          storyline: S,
          cta: S,
          composition: S,
          advertisingFormat: S,
          designIntensity: { type: 'STRING', enum: ['minimal', 'balanced', 'bold', 'experimental'] },
          layoutElements: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                element: S,
                x: { type: 'NUMBER' },
                y: { type: 'NUMBER' },
                width: { type: 'NUMBER' },
                height: { type: 'NUMBER' },
                alignment: S,
                layer: { type: 'INTEGER' },
              },
              required: ['element', 'x', 'y', 'width', 'height'],
            },
          },
        },
        required: ['pillar', 'headline', 'visualIdea', 'storyline', 'cta', 'composition'],
      },
    },
    thingsToAvoid: strings,
  },
  required: ['visualTheme', 'moodKeywords', 'colorGuidance', 'typographyGuidance', 'photographyStyle', 'concepts', 'thingsToAvoid'],
} as const;

export const SYSTEM_INSTRUCTION = `You are a World-Class Advertising Art Director and Creative Director at an elite advertising design studio. You turn an approved campaign strategy, brand profile and research into complete, professionally art-directed advertising creative concepts and layout blueprints.

Rules:
1. Produce EXACTLY the number of concepts requested for EACH content pillar (given in <required_mix>). Use the pillar names exactly as written there.
2. Each concept must clearly execute its pillar's idea from the strategy, not repeat the same visual across concepts. Vary composition, setting, layout and framing across concepts in the same pillar.
3. "visualIdea" is a one-sentence description of what the advertisement shows. "storyline" is 1-2 sentences on the emotional narrative or consumer insight. "composition" gives concrete art-direction: framing, camera angle, focal point, visual hierarchy, background, and graphic element placement. Composition guidance should reflect the selected platforms in <platforms> (e.g. quick-commerce = tight product-forward crop, thumb-stopping in a small tile; Meta = lifestyle/story-driven framing with room for text overlay).
4. "headline" and "subheadline" are short ad copy ideas (headline under 8 words). "cta" matches the strategy's call to action unless the concept needs a small variant.
5. Base every claim on the brand facts and strategy given. Never invent product features, prices, unapproved discounts or unsupported claims.
6. "colorGuidance" and "typographyGuidance" translate the brand's visual identity into actionable direction for these creatives. "photographyStyle" describes the overall look (lighting, texture, realism vs illustration).
7. "thingsToAvoid" lists visual or messaging mistakes to avoid for this brand and category (clichés, competitor look-alikes, claims the guardrails forbid).
8. LAYOUT INTELLIGENCE & BOUNDING BOXES:
   - For each concept, define "advertisingFormat" (e.g. "Promotional Retail Poster", "Editorial Product Advertisement", "Feature Spotlight", "Product Hero", "Offer-led Advertisement").
   - Define "designIntensity" ("minimal" | "balanced" | "bold" | "experimental").
   - Where possible, specify "layoutElements" with normalized coordinates (0.0 to 1.0 from top-left): main_headline, subheadline, product, badge, cta, logo.
9. AVOID GENERIC AI COMPOSITIONS:
   - Avoid repetitive centered-product placements.
   - Use asymmetrical balance, dynamic diagonals, negative space, and clear reading order (Level 1: Dominant hook, Level 2: Product hero proof, Level 3: Action/Offer, Level 4: Brand authority).
10. ${UNTRUSTED_DATA_RULE}
11. If <known_facts> conflicts with or adds to public information, ALWAYS trust <known_facts> — it comes directly from the brand, not from search. Never contradict it. Use it to fill gaps that search cannot answer (internal metrics, unpublished changes, business specifics).
12. REFERENCE HARMONIZATION:
    - If <design_references> are provided, harmonize creative direction with the extracted Design DNA while preserving brand identity.
    - In "layout" mode, borrow compositional balance, reading order, and element arrangement from the controlling layout reference.
    - In "style_transfer" mode, adapt the lighting, visual density, and color relationships from the controlling style reference.
    - In "inspiration" mode, adapt the high-level aesthetic mood.
    - NEVER copy proprietary third-party logos, trademarked slogans, or unapproved product designs.
13. Reply with ONLY the requested JSON object.`;

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
  const platforms = ctx.run.settings?.platforms ?? ['meta_ads'];

  const parts = [
    `<task>Create the creative concepts for this campaign. Produce exactly ${total} concepts in total, split across pillars exactly as follows:\n<required_mix>\n${requiredMixLine(strategy.creativeMix)}\n</required_mix></task>`,
  ];
  if (ctx.run.known_facts) {
    parts.push(fence('known_facts', ctx.run.known_facts));
  }
  parts.push(
    fence('brand_context', JSON.stringify(brandForPrompt(brand))),
    fence('platforms', JSON.stringify(platforms)),
    fence('strategy_inputs', JSON.stringify(strategyForPrompt(strategy))),
  );
  if (ctx.upstream.market_research) {
    parts.push(fence('market_research', JSON.stringify(ctx.upstream.market_research)));
  }
  if (ctx.upstream.competitor_research) {
    parts.push(fence('competitor_research', JSON.stringify(ctx.upstream.competitor_research)));
  }
  if (ctx.productImages && ctx.productImages.length > 0) {
    parts.push(fence('product_images', JSON.stringify(ctx.productImages)));
  }
  if (ctx.references && ctx.references.length > 0) {
    const reconciled = reconcileMultiReferences(ctx.references);
    const refSummaries = ctx.references.map((r) => {
      const dna = r.design_dna;
      return {
        id: r.id,
        role: r.reference_role,
        mode: r.reference_mode,
        dna: dna
          ? {
              layoutType: dna.layoutType,
              composition: dna.composition,
              visualHierarchy: dna.visualHierarchy,
              typography: dna.typography,
              productPlacement: dna.productPlacement,
              photographyStyle: dna.photographyStyle,
              colorRelationships: dna.colorRelationships,
              graphicElements: dna.graphicElements,
              visualDensity: dna.visualDensity,
            }
          : undefined,
      };
    });
    parts.push(
      fence(
        'design_references',
        JSON.stringify({
          reconciliation: reconciled.reconciliationSummary,
          references: refSummaries,
        }),
      ),
    );
  }
  const redo = feedbackBlock(ctx.feedback, ctx.previous?.output);
  if (redo) parts.push(redo);
  return parts.join('\n\n');
}

export interface ParseOptions {
  brand?: BrandContext;
  strategy?: CampaignStrategy;
  aspectRatio?: string;
  runId?: string;
  references?: CampaignReference[];
}

/**
 * Normalises model output, enforces the pillar/count contract against `requiredMix`,
 * and constructs strongly-typed Creative Blueprints for every concept.
 */
export function parseCreativeDirection(
  raw: unknown,
  requiredMix: { pillar: string; count: number }[],
  options?: ParseOptions,
): CreativeDirection {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON object.');
  const r = raw as Record<string, any>;

  const visualTheme = str(r.visualTheme, 300);
  if (!visualTheme) throw new Error('visualTheme is required and must be a non-empty string.');

  const validPillars = new Map(requiredMix.map((m) => [m.pillar.toLowerCase(), m.pillar]));
  const wanted = new Map(requiredMix.map((m) => [m.pillar, m.count]));

  const rawConcepts = Array.isArray(r.concepts) ? r.concepts : [];
  const byPillar = new Map<string, Array<{
    headline: string;
    subheadline?: string;
    visualIdea: string;
    storyline: string;
    cta: string;
    composition: string;
    advertisingFormat?: string;
    designIntensity?: DesignIntensity;
    layoutElements?: NormalizedBoundingBox[];
  }>>();

  for (const c of rawConcepts) {
    if (!c || typeof c !== 'object') continue;
    const pillar = validPillars.get(str(c.pillar, 60).toLowerCase());
    const headline = str(c.headline, 120);
    const visualIdea = str(c.visualIdea, 300);
    if (!pillar) throw new Error(`concept pillar "${str(c.pillar, 60)}" does not match any pillar in <required_mix>.`);
    if (!headline || !visualIdea) throw new Error('Every concept needs a headline and a visualIdea.');

    const rawIntensity = str(c.designIntensity || c.intensity, 20)?.toLowerCase();
    const designIntensity: DesignIntensity | undefined = (DESIGN_INTENSITIES as readonly string[]).includes(rawIntensity)
      ? (rawIntensity as DesignIntensity)
      : undefined;

    const rawFormat = str(c.advertisingFormat || c.format, 100) || undefined;

    let layoutElements: NormalizedBoundingBox[] | undefined = undefined;
    if (Array.isArray(c.layoutElements) && c.layoutElements.length > 0) {
      layoutElements = c.layoutElements.map((el: any) => normalizeBoundingBox(el));
    }

    const list = byPillar.get(pillar) ?? [];
    list.push({
      headline,
      subheadline: str(c.subheadline, 150) || undefined,
      visualIdea,
      storyline: str(c.storyline, 400),
      cta: str(c.cta, 100),
      composition: str(c.composition, 400),
      advertisingFormat: rawFormat,
      designIntensity,
      layoutElements,
    });
    byPillar.set(pillar, list);
  }

  for (const [pillar, count] of wanted) {
    const got = byPillar.get(pillar)?.length ?? 0;
    if (got !== count) {
      throw new Error(`Pillar "${pillar}" needs exactly ${count} concept${count === 1 ? '' : 's'} but got ${got}. Follow <required_mix> exactly.`);
    }
  }

  const fallbackBrand: BrandContext = options?.brand ?? {
    brandName: 'Brand',
    category: 'Commercial Brand',
    summary: '',
    positioning: '',
    usps: [],
    products: [],
    audience: { primary: '', painPoints: [], desires: [] },
    voice: { tone: ['professional'], doSay: [], dontSay: [] },
    visualIdentity: { colors: [{ hex: '#0A0A0A' }, { hex: '#F59E0B' }], typography: 'Poppins', styleKeywords: [] },
    markets: ['Global'],
    sources: [],
  };

  const concepts: CreativeConcept[] = [];
  for (const m of requiredMix) {
    const list = byPillar.get(m.pillar) ?? [];
    const slug = slugify(m.pillar);
    list.forEach((c, i) => {
      const conceptId = `${slug}-${i + 1}`;
      const baseConcept: CreativeConcept = {
        id: conceptId,
        pillar: m.pillar,
        headline: c.headline,
        subheadline: c.subheadline,
        visualIdea: c.visualIdea,
        storyline: c.storyline,
        cta: c.cta,
        composition: c.composition,
      };

      const blueprint = createDefaultBlueprintFromConcept({
        concept: baseConcept,
        brand: fallbackBrand,
        strategy: options?.strategy,
        aspectRatio: options?.aspectRatio ?? '4:5',
        designIntensity: c.designIntensity ?? 'balanced',
        runId: options?.runId,
      });

      if (c.advertisingFormat) {
        blueprint.advertisingFormat = c.advertisingFormat;
      } else if (options?.references && options.references.length > 0) {
        const reconciled = reconcileMultiReferences(options.references);
        if (reconciled.controllingLayout?.design_dna?.layoutType) {
          blueprint.advertisingFormat = reconciled.controllingLayout.design_dna.layoutType;
        }
      }
      if (c.layoutElements && c.layoutElements.length > 0) {
        blueprint.layout.elements = c.layoutElements;
      }

      if (options?.references && options.references.length > 0) {
        const reconciled = reconcileMultiReferences(options.references);
        const controllingRef = reconciled.controllingLayout;
        if (controllingRef?.design_dna) {
          const dna = controllingRef.design_dna;
          if (controllingRef.reference_mode === 'layout' || controllingRef.reference_mode === 'style_transfer') {
            if (dna.readingOrder && dna.readingOrder.length > 0) {
              blueprint.layout.readingOrder = dna.readingOrder;
            }
            if (dna.visualDensity && (DESIGN_INTENSITIES as readonly string[]).includes(dna.visualDensity.toLowerCase())) {
              blueprint.designIntensity = dna.visualDensity.toLowerCase() as DesignIntensity;
            }
          }
        }
      }

      concepts.push({
        ...baseConcept,
        blueprint,
      });
    });
  }

  // Holistic campaign-wide advertising format allocation pass
  let diversityReport;
  if (concepts.length > 0) {
    const reconciled = options?.references && options.references.length > 0
      ? reconcileMultiReferences(options.references)
      : undefined;

    const dna = reconciled?.controllingLayout?.design_dna;
    const validDna = dna && 'layoutType' in dna ? dna : undefined;

    const allocation = allocateCampaignFormats({
      concepts,
      strategy: options?.strategy,
      goal: (options?.strategy as any)?.objective || 'sales',
      category: options?.brand?.category || 'd2c',
      referenceDesignDNA: validDna as ReferenceDesignDNA | undefined,
      options: {
        enforceStructuralDiversity: true,
      },
    });

    diversityReport = allocation.diversityReport;

    for (let i = 0; i < concepts.length; i++) {
      const assignment = allocation.assignments.find((a) => a.conceptId === concepts[i].id) || allocation.assignments[i];
      if (assignment && concepts[i].blueprint) {
        concepts[i].blueprint!.advertisingFormat = assignment.formatName;
        // If layoutElements was not explicitly provided by the model, populate default elements from allocated format
        if (!concepts[i].blueprint!.layout.elements || concepts[i].blueprint!.layout.elements.length === 0) {
          const formatDef = getAdvertisingFormat(assignment.formatId);
          if (formatDef?.defaultLayoutElements && formatDef.defaultLayoutElements.length > 0) {
            concepts[i].blueprint!.layout.elements = [...formatDef.defaultLayoutElements];
          }
        }
      }
    }
  }

  return {
    visualTheme,
    moodKeywords: strList(r.moodKeywords, 8, 40),
    colorGuidance: str(r.colorGuidance, 400),
    typographyGuidance: str(r.typographyGuidance, 300),
    photographyStyle: str(r.photographyStyle, 400),
    concepts,
    thingsToAvoid: strList(r.thingsToAvoid, 8, 200),
    blueprints: concepts.map((c) => c.blueprint!),
    diversityReport,
  };
}

export const creativeDirectionAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const brand = requireBrand(ctx);
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
      parse: (raw) =>
        parseCreativeDirection(raw, strategy.creativeMix, {
          brand,
          strategy,
          aspectRatio: ctx.run.settings?.aspectRatio ?? '4:5',
          runId: ctx.run.id,
          references: ctx.references,
        }),
    });

    return { output: result.data, model: result.model, usage: result.usage, snapshot: {} };
  },
};
