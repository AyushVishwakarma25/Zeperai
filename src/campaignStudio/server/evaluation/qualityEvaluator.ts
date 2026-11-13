/**
 * CAMPAIGN STUDIO V2 - Creative Quality Evaluator Agent.
 *
 * Rigorously inspects rendered advertising creatives across 7 commercial dimensions
 * using genuine multimodal vision capabilities (comparing the final rendered creative
 * directly against uploaded product reference photos and approved blueprint specifications)
 * combined with deterministic hard validation rules.
 */

import { getAI } from '../../../../config/ai.js';
import type {
  BrandContext,
  CreativeBlueprint,
  CreativeDocument,
  CreativeEvaluation,
  CreativeQualityScores,
  EvaluationStatus,
  QualityIssue,
} from '../../types.js';
import { resolveModelForTask } from '../config.js';
import { extractJson, type GenAIClientLike } from '../gemini.js';
import { validateDeterministicQuality } from './qualityRules.js';
import { renderCreativeDocumentToSvg } from '../composition/svgRenderer.js';
import { renderSvgToRasterBuffers } from '../export/rasterRenderer.js';
import {
  buildReferenceImageParts,
  fetchReferenceImagePart,
  type InlineImagePart,
} from '../agents/creatives.js';
import { safeFetch as defaultSafeFetch, type SafeFetcher } from '../safeFetch.js';

export const CREATIVE_EVALUATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    scores: {
      type: 'OBJECT',
      properties: {
        visualHierarchy: { type: 'INTEGER' },
        productAccuracy: { type: 'INTEGER' },
        brandConsistency: { type: 'INTEGER' },
        typography: { type: 'INTEGER' },
        visualQuality: { type: 'INTEGER' },
        messageClarity: { type: 'INTEGER' },
        technicalCompliance: { type: 'INTEGER' },
      },
      required: [
        'visualHierarchy',
        'productAccuracy',
        'brandConsistency',
        'typography',
        'visualQuality',
        'messageClarity',
        'technicalCompliance',
      ],
    },
    issues: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING' },
          severity: { type: 'STRING', enum: ['low', 'medium', 'high', 'critical'] },
          description: { type: 'STRING' },
          affectedLayerId: { type: 'STRING' },
          suggestedFix: { type: 'STRING' },
        },
        required: ['category', 'severity', 'description', 'suggestedFix'],
      },
    },
  },
  required: ['scores', 'issues'],
} as const;

export const QUALITY_EVALUATOR_SYSTEM_PROMPT = `You are a Chief Creative Officer and Master Advertising Quality Evaluator.
You rigorously inspect rendered advertising creatives against commercial design standards, brand identity, and technical compliance.

You are provided with:
1. The rendered advertisement creative image (Part 1).
2. (Optional) Ground-truth reference photos of the actual product (Subsequent image parts).
3. The approved creative blueprint, brand visual identity, typography guidance, and safe-zone rules.

Score the advertisement strictly across the 7 dimensions (maximum 100 points total):
1. visualHierarchy (0 to 20): Clear eye trace from Level 1 hook to product proof to CTA. Zero focal point clutter.
2. productAccuracy (0 to 20): Compare the rendered product against the reference photos. Verify packaging integrity, label text fidelity, geometry, realistic grounded shadow, and zero AI deformation.
3. brandConsistency (0 to 15): Palette alignment with approved brand colors, appropriate tone of voice, and logo prominence.
4. typography (0 to 15): Typographic scale contrast, readability against the background, and font hierarchy. Zero unreadable or overlapping text.
5. visualQuality (0 to 15): Professional studio lighting, crisp texture realism, and cohesive foreground/background integration. Zero hallucinations or AI artifacts.
6. messageClarity (0 to 10): Instant value proposition hook, unambiguous offer, and high-visibility CTA button.
7. technicalCompliance (0 to 5): Canvas margins, safe zone preservation, and zero clipped text elements.

Provide actionable diagnostic issues for anything scoring below maximum.
Reply with ONLY the requested JSON object matching the schema.`;

export const EVALUATOR_VERSION = '2.3.0';

export interface EvaluateCreativeParams {
  doc: CreativeDocument;
  blueprint?: CreativeBlueprint;
  brand?: BrandContext;
  client?: GenAIClientLike;
  compositeUrl?: string;
  referenceImageUrls?: string[];
  fetcher?: SafeFetcher;
}

/**
 * Safely resolves the rendered creative image into a base64 inline part for multimodal inspection.
 */
export async function resolveRenderedImagePart(
  doc: CreativeDocument,
  compositeUrl?: string,
  fetcher: SafeFetcher = defaultSafeFetch,
): Promise<InlineImagePart | null> {
  if (compositeUrl && typeof compositeUrl === 'string') {
    if (compositeUrl.startsWith('data:image/svg+xml')) {
      try {
        const isBase64 = compositeUrl.includes(';base64,');
        const payload = compositeUrl.split(',')[1] || '';
        const svgContent = isBase64 ? Buffer.from(payload, 'base64').toString('utf-8') : decodeURIComponent(payload);
        const raster = await renderSvgToRasterBuffers(svgContent, {
          width: doc.canvas?.width || 1080,
          height: doc.canvas?.height || 1080,
          backgroundColor: '#FFFFFF',
          jpegQuality: 85,
        });
        return {
          inlineData: {
            mimeType: 'image/png',
            data: raster.png.toString('base64'),
          },
        };
      } catch (err) {
        console.warn('[qualityEvaluator] Failed to rasterize SVG data URI for visual evaluation:', err);
      }
    } else if (compositeUrl.startsWith('data:image/')) {
      const match = compositeUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        };
      }
    } else if (compositeUrl.startsWith('http://') || compositeUrl.startsWith('https://')) {
      return fetchReferenceImagePart(compositeUrl, fetcher);
    }
  }

  // Attempt direct rasterization of the document SVG
  try {
    const svg = renderCreativeDocumentToSvg(doc);
    const raster = await renderSvgToRasterBuffers(svg, {
      width: doc.canvas?.width || 1080,
      height: doc.canvas?.height || 1080,
      backgroundColor: '#FFFFFF',
      jpegQuality: 85,
    });
    return {
      inlineData: {
        mimeType: 'image/png',
        data: raster.png.toString('base64'),
      },
    };
  } catch (err) {
    console.warn('[qualityEvaluator] Document SVG rasterization for visual evaluation failed:', err);
    return null;
  }
}

/**
 * Evaluates a creative document combining deterministic validation and multimodal AI scoring.
 * Strict zero-false-positive and zero-fabricated-score policy:
 * - Deterministic failure -> 'rejected', scores: null, totalScore: null
 * - AI failure / missing image / unverified -> 'unverified', scores: null, totalScore: null (NEVER 64)
 * - Both passed & totalScore >= 80 & no critical issues -> 'passed', approvalEligible: true
 */
export async function evaluateCreative(params: EvaluateCreativeParams): Promise<CreativeEvaluation> {
  const { doc, blueprint, brand, client, compositeUrl, referenceImageUrls, fetcher = defaultSafeFetch } = params;

  // 1. Run deterministic programmatic checks first
  const deterministicResult = validateDeterministicQuality(doc, blueprint);

  // 2. Resolve rendered image and reference images for multimodal inspection
  const renderedImagePart = await resolveRenderedImagePart(doc, compositeUrl, fetcher);
  const referenceParts = await buildReferenceImageParts(referenceImageUrls, fetcher);

  // 3. Perform AI multimodal vision evaluation
  let aiScores: CreativeQualityScores | null = null;
  let aiIssues: QualityIssue[] = [];
  let aiRan = false;
  let aiError: string | undefined = undefined;
  let modelId: string | undefined = undefined;

  // Visual evaluation requires a valid rendered image part
  if (!renderedImagePart) {
    aiError = 'Rendered creative image unavailable for visual inspection.';
  } else {
    try {
      const ai = client ?? getAI();
      const resolution = resolveModelForTask('vision_qa');
      const model = resolution.model;
      modelId = model;

      const promptContext = [
        `<advertisement_spec>`,
        `Format: ${doc.advertisingFormat}`,
        `Design Intensity: ${doc.designIntensity}`,
        `Canvas: ${doc.canvas.width}x${doc.canvas.height} (${doc.canvas.aspectRatio})`,
        `Brand Name: ${brand?.brandName || 'Brand'}`,
        `Brand Colors: ${JSON.stringify(brand?.visualIdentity?.colors || [])}`,
        `Brand Typography: ${brand?.visualIdentity?.typography || 'Commercial standard'}`,
        `Approved Headline: ${blueprint?.copy?.headline || doc.layers.find((l) => l.type === 'headline')?.content || ''}`,
        `Approved Subheadline: ${blueprint?.copy?.subheadline || doc.layers.find((l) => l.type === 'subheadline')?.content || ''}`,
        `Approved CTA: ${blueprint?.copy?.cta || doc.layers.find((l) => l.type === 'cta')?.content || ''}`,
        `Safe Zones: ${JSON.stringify(blueprint?.layout?.safeZones || [])}`,
        `Layers: ${JSON.stringify(
          doc.layers.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            zIndex: l.zIndex,
            position: l.position,
            content: l.content,
          })),
        )}`,
        `</advertisement_spec>`,
        `Multimodal Visual Inspection Task:`,
        `The first attached image is the final rendered creative advertisement.`,
        referenceParts.length > 0
          ? `${referenceParts.length} ground-truth reference product image(s) are attached afterwards.`
          : `No separate reference photos attached; inspect product fidelity based on advertised category.`,
        `Inspect the creative visually across all 7 dimensions and output strict JSON scores and issues.`,
      ].join('\n');

      const parts: any[] = [
        renderedImagePart,
        ...referenceParts,
        { text: promptContext },
      ];

      const response = await ai.models.generateContent({
        model,
        contents: {
          role: 'user',
          parts,
        },
        config: {
          systemInstruction: QUALITY_EVALUATOR_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: CREATIVE_EVALUATION_SCHEMA as unknown as Record<string, unknown>,
          temperature: 0.1,
        },
      });

      const rawJson = extractJson(response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '') as any;
      if (rawJson && rawJson.scores) {
        aiRan = true;
        aiScores = {
          visualHierarchy: Math.min(20, Math.max(0, Number(rawJson.scores.visualHierarchy) || 0)),
          productAccuracy: Math.min(20, Math.max(0, Number(rawJson.scores.productAccuracy) || 0)),
          brandConsistency: Math.min(15, Math.max(0, Number(rawJson.scores.brandConsistency) || 0)),
          typography: Math.min(15, Math.max(0, Number(rawJson.scores.typography) || 0)),
          visualQuality: Math.min(15, Math.max(0, Number(rawJson.scores.visualQuality) || 0)),
          messageClarity: Math.min(10, Math.max(0, Number(rawJson.scores.messageClarity) || 0)),
          technicalCompliance: Math.min(5, Math.max(0, Number(rawJson.scores.technicalCompliance) || 0)),
        };
        if (Array.isArray(rawJson.issues)) {
          aiIssues = rawJson.issues.map((iss: any) => ({
            category: String(iss.category || 'visualQuality'),
            severity: (['low', 'medium', 'high', 'critical'] as const).includes(iss.severity) ? iss.severity : 'medium',
            description: String(iss.description || '').slice(0, 300),
            affectedLayerId: iss.affectedLayerId ? String(iss.affectedLayerId) : undefined,
            suggestedFix: String(iss.suggestedFix || '').slice(0, 300),
          }));
        }
      } else {
        aiError = 'Model returned empty or non-conforming evaluation scores.';
      }
    } catch (aiErr: any) {
      aiError = String(aiErr?.message || aiErr || 'AI evaluation call failed.');
      console.warn('[campaign-studio] AI quality evaluation call failed (flagged unverified):', aiError.slice(0, 200));
    }
  }

  // 4. Merge deterministic failures & issues
  const allIssues = [...deterministicResult.issues, ...aiIssues];
  const hardRuleFailures = [...deterministicResult.failures];

  // 5. Status determination & Strict Approval Policy (Zero Fabricated Scores)
  let status: EvaluationStatus;
  let passed = false;
  let approvalEligible = false;
  let totalScore: number | null = null;

  const hasCritical = allIssues.some((i) => i.severity === 'critical') || hardRuleFailures.length > 0;

  if (!deterministicResult.passed) {
    status = 'rejected';
    passed = false;
    approvalEligible = false;
    aiScores = null;
    totalScore = null;
  } else if (!aiRan || !aiScores) {
    // Deterministic checks passed, but AI visual checks failed, timed out, or did not run -> UNVERIFIED
    status = 'unverified';
    passed = false;
    approvalEligible = false;
    aiScores = null;
    totalScore = null; // No fabricated 64 score
  } else {
    // Both deterministic AND AI evaluation completed
    totalScore =
      aiScores.visualHierarchy +
      aiScores.productAccuracy +
      aiScores.brandConsistency +
      aiScores.typography +
      aiScores.visualQuality +
      aiScores.messageClarity +
      aiScores.technicalCompliance;

    if (hasCritical || totalScore < 70) {
      status = 'rejected';
      passed = false;
      approvalEligible = false;
    } else if (totalScore < 80 || allIssues.some((i) => i.severity === 'high')) {
      status = 'needs_improvement';
      passed = false;
      approvalEligible = false;
    } else {
      status = 'passed';
      passed = true;
      approvalEligible = true;
    }
  }

  return {
    creativeId: doc.id,
    totalScore,
    status,
    scores: aiScores,
    issues: allIssues,
    hardRuleFailures,
    passed,
    approvalEligible,
    deterministic: deterministicResult,
    visual: {
      status: aiRan ? (passed ? 'passed' : 'failed') : 'unverified',
      modelId,
      error: aiError,
      scores: aiRan ? aiScores : null,
      checksRun: aiRan,
    },
    documentVersion: doc.version,
    evaluatorVersion: EVALUATOR_VERSION,
    failureDetails: !passed ? (hardRuleFailures.length > 0 ? hardRuleFailures.join('; ') : aiError) : undefined,
    evaluatedAt: new Date().toISOString(),
  };
}
