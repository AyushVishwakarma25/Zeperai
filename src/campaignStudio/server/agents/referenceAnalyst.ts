/**
 * CAMPAIGN STUDIO V2 - Reference Analyst Agent.
 *
 * Vision-based agent that analyzes uploaded advertising references and extracts
 * structured ReferenceDesignDNA (composition, layout, typography, colors, reading order).
 *
 * Grounding Rule: The analysis describes abstract design principles, structural
 * geometry and artistic direction without reproducing or claiming other brands'
 * proprietary trademarks or exact artwork.
 */

import { getAI } from '../../../../config/ai.js';
import type { CampaignReference, ReferenceDesignDNA, ReferenceMode, ReferenceRole } from '../../types.js';
import { resolveModelForTask, resolveTextModel } from '../config.js';
import { extractJson, type GenAIClientLike } from '../gemini.js';
import { safeFetch as defaultSafeFetch, type SafeFetcher } from '../safeFetch.js';
import { fetchReferenceImagePart } from './creatives.js';

export const REFERENCE_DESIGN_DNA_SCHEMA = {
  type: 'OBJECT',
  properties: {
    layoutType: { type: 'STRING' },
    composition: { type: 'STRING' },
    productPlacement: { type: 'STRING' },
    cameraAngle: { type: 'STRING' },
    lighting: { type: 'STRING' },
    backgroundTreatment: { type: 'STRING' },
    colorRelationships: { type: 'ARRAY', items: { type: 'STRING' } },
    colorPalette: { type: 'ARRAY', items: { type: 'STRING' } },
    typography: {
      type: 'OBJECT',
      properties: {
        style: { type: 'STRING' },
        weight: { type: 'STRING' },
        scale: { type: 'STRING' },
        positioning: { type: 'STRING' },
      },
      required: ['style', 'weight', 'scale', 'positioning'],
    },
    typographyHierarchy: { type: 'ARRAY', items: { type: 'STRING' } },
    visualHierarchy: { type: 'ARRAY', items: { type: 'STRING' } },
    negativeSpace: { type: 'STRING' },
    graphicElements: { type: 'ARRAY', items: { type: 'STRING' } },
    supportingElements: { type: 'ARRAY', items: { type: 'STRING' } },
    advertisingMessage: { type: 'STRING' },
    ctaPlacement: { type: 'STRING' },
    photographyStyle: { type: 'STRING' },
    visualDensity: { type: 'STRING' },
    readingOrder: { type: 'ARRAY', items: { type: 'STRING' } },
    designCharacteristics: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'layoutType',
    'composition',
    'visualHierarchy',
    'colorRelationships',
    'typography',
    'productPlacement',
    'photographyStyle',
    'graphicElements',
    'backgroundTreatment',
    'visualDensity',
    'readingOrder',
    'designCharacteristics',
  ],
} as const;

export const REFERENCE_ANALYST_SYSTEM_PROMPT = `You are a Senior Design Systems Architect and Visual Art Director at an elite creative advertising agency.

Your task is to analyze an uploaded advertising design reference and deconstruct its visual DNA into a structured architectural design specification across 11 key dimensions.

ANALYSIS GUIDELINES:
1. FOCUS ON DESIGN LANGUAGE, NOT TRADEMARKS:
   - Describe visual properties, composition geometry, typography scale, reading hierarchy, and color relationships.
   - Do NOT attempt to identify, name, or copy proprietary third-party brand logos, trademarks, or character artwork.
   - Translate what you see into reusable, platform-agnostic advertising design principles.

2. EXTRACT EXACT 11 CORE ADVERTISING DESIGN DIMENSIONS:
   - 1. "composition": Detailed geometric description of layout balance, grid, negative space distribution, and element framing.
   - 2. "productPlacement": How the product is anchored, scale relative to canvas, grounded shadow, and depth positioning.
   - 3. "cameraAngle": Perspective and camera elevation (e.g. eye-level hero, low-angle monument, 45-degree tabletop, top-down flat lay).
   - 4. "lighting": Key/fill lighting character (e.g. soft diffuse morning sunlight, dramatic high-contrast studio rim light, moody chiaroscuro).
   - 5. "backgroundTreatment": Environmental backdrop (e.g. clean neutral studio seamless, architectural marble countertop, warm gradient wash).
   - 6. "colorPalette" / "colorRelationships": Dominant, secondary, and accent color relationships and contrast hierarchy.
   - 7. "typographyHierarchy": Structural scale order of text (e.g. bold condensed primary headline -> medium subline -> secondary badge -> micro-copy).
   - 8. "negativeSpace": Amount and strategic placement of uncluttered breathing space allocated for text legibility and visual focus.
   - 9. "supportingElements" / "graphicElements": Supporting graphical artifacts (e.g. discount badge pill, star cluster, organic ribbon, trust stamp).
   - 10. "advertisingMessage": Underlying psychological hook and advertising persuasion mechanism (e.g. speed-of-action benefit, scientific proof, sensory indulgence).
   - 11. "ctaPlacement": Action trigger position, container geometry, and visual emphasis (e.g. bottom-center rounded pill, bottom-right floating button).

3. ADDITIONAL STRUCTURAL PROPERTIES:
   - "layoutType": e.g. "top-heavy editorial", "diagonal split", "bottom hero anchor", "minimalist centered", "multi-card bento".
   - "photographyStyle": Overall camera capture technique and depth-of-field.
   - "visualDensity": "minimal" | "balanced" | "dense" | "bold".
   - "readingOrder": Explicit list of element reading order from initial eye hook to final call to action.
   - "designCharacteristics": Core abstract design principles that make this advertisement visually effective.

Reply with ONLY the requested JSON object matching the schema.`;

/**
 * Analyzes a reference image using vision capabilities and extracts strongly-typed ReferenceDesignDNA.
 */
export async function analyzeReferenceImage(params: {
  imageUrl: string;
  referenceRole?: ReferenceRole;
  client?: GenAIClientLike;
  fetcher?: SafeFetcher;
}): Promise<ReferenceDesignDNA> {
  const { imageUrl, referenceRole = 'general', client, fetcher = defaultSafeFetch } = params;

  // 1. Fetch image part as inline base64 data
  const imagePart = await fetchReferenceImagePart(imageUrl, fetcher);
  if (!imagePart) {
    throw new Error(`Could not access reference image at ${imageUrl.slice(0, 80)}. Ensure the image is reachable.`);
  }

  const ai = client ?? getAI();
  const resolution = resolveModelForTask('reference_analysis');
  const model = resolution.model;

  const roleInstruction =
    referenceRole !== 'general'
      ? `\nNOTE: The user has designated this reference specifically for: ${referenceRole.toUpperCase()}. Pay special attention to the ${referenceRole} characteristics in your analysis.`
      : '';

  const response = await ai.models.generateContent({
    model,
    contents: {
      role: 'user',
      parts: [
        imagePart,
        {
          text: `Analyze this advertising creative reference and extract its complete Design DNA according to the system instructions.${roleInstruction}`,
        },
      ],
    },
    config: {
      systemInstruction: REFERENCE_ANALYST_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: REFERENCE_DESIGN_DNA_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.2,
    },
  });

  const rawJson = extractJson(response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  if (!rawJson) {
    throw new Error('Failed to parse structured Design DNA from reference image.');
  }

  return normalizeReferenceDesignDNA(rawJson);
}

/** Validates and normalizes raw JSON into strongly typed ReferenceDesignDNA. */
export function normalizeReferenceDesignDNA(raw: any): ReferenceDesignDNA {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid Design DNA object.');
  }

  const strList = (arr: any, maxItems = 8): string[] =>
    Array.isArray(arr) ? arr.map((item) => String(item || '').trim().slice(0, 200)).filter(Boolean).slice(0, maxItems) : [];

  const typo = raw.typography || {};

  const graphicElements = strList(raw.graphicElements || raw.supportingElements);
  const supportingElements = strList(raw.supportingElements || raw.graphicElements);
  const colorRelationships = strList(raw.colorRelationships || raw.colorPalette);
  const colorPalette = strList(raw.colorPalette || raw.colorRelationships);
  const visualHierarchy = strList(raw.visualHierarchy || raw.typographyHierarchy);
  const typographyHierarchy = strList(raw.typographyHierarchy || raw.visualHierarchy);

  return {
    layoutType: String(raw.layoutType || 'standard-commercial').slice(0, 100),
    composition: String(raw.composition || 'Balanced commercial composition').slice(0, 500),
    visualHierarchy,
    typographyHierarchy,
    colorRelationships,
    colorPalette,
    typography: {
      style: String(typo.style || 'Bold sans-serif display').slice(0, 100),
      weight: String(typo.weight || 'bold').slice(0, 50),
      scale: String(typo.scale || 'large headline with medium CTA').slice(0, 100),
      positioning: String(typo.positioning || 'top-aligned headline, bottom CTA').slice(0, 100),
    },
    productPlacement: String(raw.productPlacement || 'Centered hero with realistic grounded shadow').slice(0, 200),
    cameraAngle: String(raw.cameraAngle || 'Eye-level straight on').slice(0, 100),
    lighting: String(raw.lighting || raw.photographyStyle || 'Balanced soft commercial studio lighting').slice(0, 200),
    photographyStyle: String(raw.photographyStyle || 'Crisp studio commercial photography').slice(0, 200),
    graphicElements,
    supportingElements,
    backgroundTreatment: String(raw.backgroundTreatment || 'Clean studio neutral background').slice(0, 200),
    visualDensity: String(raw.visualDensity || 'balanced').slice(0, 50),
    readingOrder: strList(raw.readingOrder),
    designCharacteristics: strList(raw.designCharacteristics),
    negativeSpace: String(raw.negativeSpace || 'Generous negative space surrounding main headline and product').slice(0, 200),
    advertisingMessage: String(raw.advertisingMessage || 'Clear product-led value proposition').slice(0, 300),
    ctaPlacement: String(raw.ctaPlacement || 'Bottom right/center actionable conversion pill').slice(0, 100),
  };
}

/**
 * Reconciles multiple references with designated roles into a unified design direction.
 * Resolves conflicts by granting authority to specialized roles (e.g. typography reference
 * controls fonts; layout reference controls bounding boxes).
 */
export function reconcileMultiReferences(references: CampaignReference[]): {
  controllingLayout?: CampaignReference;
  controllingTypography?: CampaignReference;
  controllingColor?: CampaignReference;
  controllingPhotography?: CampaignReference;
  reconciliationSummary: string;
} {
  if (!references || references.length === 0) {
    return { reconciliationSummary: 'No external advertising references attached. Using brand DNA defaults.' };
  }

  const controllingLayout = references.find((r) => r.reference_role === 'layout') || references[0];
  const controllingTypography = references.find((r) => r.reference_role === 'typography') || controllingLayout;
  const controllingColor = references.find((r) => r.reference_role === 'color') || controllingLayout;
  const controllingPhotography = references.find((r) => r.reference_role === 'photography') || controllingLayout;

  const summary = [
    `Reconciled ${references.length} reference(s):`,
    `- Layout geometry guided by reference ${controllingLayout.id.slice(0, 8)} (${controllingLayout.reference_mode} mode).`,
    `- Typographic hierarchy guided by reference ${controllingTypography.id.slice(0, 8)}.`,
    `- Color harmony guided by reference ${controllingColor.id.slice(0, 8)}.`,
    `- Photographic styling guided by reference ${controllingPhotography.id.slice(0, 8)}.`,
  ].join(' ');

  return {
    controllingLayout,
    controllingTypography,
    controllingColor,
    controllingPhotography,
    reconciliationSummary: summary,
  };
}

