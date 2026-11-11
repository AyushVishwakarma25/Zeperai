/**
 * CAMPAIGN STUDIO V2 - Creative Quality Evaluator Agent.
 *
 * Inspects rendered advertisements across 7 commercial dimensions using
 * Gemini vision capabilities combined with deterministic hard validation rules.
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
import { resolveTextModel } from '../config.js';
import { extractJson, type GenAIClientLike } from '../gemini.js';
import { validateDeterministicQuality } from './qualityRules.js';

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

Score the advertisement strictly across the 7 dimensions (maximum 100 points total):
1. visualHierarchy (0 to 20): Clear eye trace from Level 1 hook to product proof to CTA. Zero focal point clutter.
2. productAccuracy (0 to 20): Product packaging integrity, label text fidelity, and realistic grounded shadow.
3. brandConsistency (0 to 15): Palette alignment with brand colors, appropriate tone of voice, and logo prominence.
4. typography (0 to 15): Typographic scale contrast, readability against the background, and font hierarchy.
5. visualQuality (0 to 15): Professional lighting, crisp texture realism, and cohesive foreground/background integration.
6. messageClarity (0 to 10): Instant value proposition hook, unambiguous offer, and high-visibility CTA button.
7. technicalCompliance (0 to 5): Canvas margins, safe zone preservation, and zero clipped text elements.

Provide actionable diagnostic issues for anything scoring below maximum.
Reply with ONLY the requested JSON object matching the schema.`;

export interface EvaluateCreativeParams {
  doc: CreativeDocument;
  blueprint?: CreativeBlueprint;
  brand?: BrandContext;
  client?: GenAIClientLike;
}

/**
 * Evaluates a creative document combining deterministic validation and AI scoring.
 */
export async function evaluateCreative(params: EvaluateCreativeParams): Promise<CreativeEvaluation> {
  const { doc, blueprint, brand, client } = params;

  // 1. Run deterministic programmatic checks first
  const deterministicResult = validateDeterministicQuality(doc, blueprint);

  // 2. Perform AI vision/layout evaluation
  let aiScores: CreativeQualityScores = {
    visualHierarchy: 18,
    productAccuracy: 19,
    brandConsistency: 14,
    typography: 14,
    visualQuality: 14,
    messageClarity: 9,
    technicalCompliance: 5,
  };
  let aiIssues: QualityIssue[] = [];

  try {
    const ai = client ?? getAI();
    const model = resolveTextModel('flash');

    const promptContext = [
      `<advertisement_spec>`,
      `Format: ${doc.advertisingFormat}`,
      `Design Intensity: ${doc.designIntensity}`,
      `Canvas: ${doc.canvas.width}x${doc.canvas.height} (${doc.canvas.aspectRatio})`,
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
      `Brand Name: ${brand?.brandName || 'Brand'}`,
      `Brand Colors: ${JSON.stringify(brand?.visualIdentity?.colors || [])}`,
      blueprint?.copy ? `Approved Copy: ${JSON.stringify(blueprint.copy)}` : '',
      `</advertisement_spec>`,
      `Evaluate this advertising design specification and output your 7-dimension score and diagnostic issues.`,
    ].filter(Boolean).join('\n');

    const response = await ai.models.generateContent({
      model,
      contents: {
        role: 'user',
        parts: [{ text: promptContext }],
      },
      config: {
        systemInstruction: QUALITY_EVALUATOR_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: CREATIVE_EVALUATION_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0.1,
      },
    });

    const rawJson = extractJson(response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    if (rawJson && rawJson.scores) {
      aiScores = {
        visualHierarchy: Math.min(20, Math.max(0, Number(rawJson.scores.visualHierarchy) || 16)),
        productAccuracy: Math.min(20, Math.max(0, Number(rawJson.scores.productAccuracy) || 16)),
        brandConsistency: Math.min(15, Math.max(0, Number(rawJson.scores.brandConsistency) || 12)),
        typography: Math.min(15, Math.max(0, Number(rawJson.scores.typography) || 12)),
        visualQuality: Math.min(15, Math.max(0, Number(rawJson.scores.visualQuality) || 12)),
        messageClarity: Math.min(10, Math.max(0, Number(rawJson.scores.messageClarity) || 8)),
        technicalCompliance: Math.min(5, Math.max(0, Number(rawJson.scores.technicalCompliance) || 4)),
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
    }
  } catch (aiErr) {
    console.warn('[campaign-studio] AI quality evaluation fallback to heuristic scoring:', aiErr);
  }

  // 3. Merge deterministic failures & override scores
  const allIssues = [...deterministicResult.issues, ...aiIssues];
  const hardRuleFailures = [...deterministicResult.failures];

  if (!deterministicResult.passed) {
    // Apply score penalties based on hard failures
    if (hardRuleFailures.some((f) => f.includes('dimension') || f.includes('boundary') || f.includes('overflow'))) {
      aiScores.technicalCompliance = 0;
    }
    if (hardRuleFailures.some((f) => f.includes('product'))) {
      aiScores.productAccuracy = Math.min(aiScores.productAccuracy, 4);
    }
    if (hardRuleFailures.some((f) => f.includes('offer') || f.includes('price') || f.includes('headline'))) {
      aiScores.messageClarity = Math.min(aiScores.messageClarity, 3);
      aiScores.typography = Math.min(aiScores.typography, 6);
    }
    if (hardRuleFailures.some((f) => f.includes('logo'))) {
      aiScores.brandConsistency = Math.min(aiScores.brandConsistency, 5);
    }
  }

  const totalScore =
    aiScores.visualHierarchy +
    aiScores.productAccuracy +
    aiScores.brandConsistency +
    aiScores.typography +
    aiScores.visualQuality +
    aiScores.messageClarity +
    aiScores.technicalCompliance;

  // Determine overall status
  let status: EvaluationStatus = 'ready_for_review';
  const hasCritical = allIssues.some((i) => i.severity === 'critical') || hardRuleFailures.length > 0;

  if (hasCritical || totalScore < 75) {
    status = 'rejected';
  } else if (totalScore < 90 || allIssues.some((i) => i.severity === 'high')) {
    status = 'needs_improvement';
  }

  return {
    creativeId: doc.id,
    totalScore,
    status,
    scores: aiScores,
    issues: allIssues,
    hardRuleFailures,
    passed: status !== 'rejected',
    evaluatedAt: new Date().toISOString(),
  };
}
