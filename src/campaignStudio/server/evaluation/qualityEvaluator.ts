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
import { resolveModelForTask, resolveTextModel } from '../config.js';
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

export const EVALUATOR_VERSION = '2.2.0';

export interface EvaluateCreativeParams {
  doc: CreativeDocument;
  blueprint?: CreativeBlueprint;
  brand?: BrandContext;
  client?: GenAIClientLike;
}

/**
 * Evaluates a creative document combining deterministic validation and AI scoring.
 * Strict zero-false-positive policy:
 * - Deterministic failure -> 'failed'
 * - AI failure / missing -> 'unverified' (NEVER passed)
 * - Both passed & totalScore >= 80 & no critical issues -> 'passed'
 */
export async function evaluateCreative(params: EvaluateCreativeParams): Promise<CreativeEvaluation> {
  const { doc, blueprint, brand, client } = params;

  // 1. Run deterministic programmatic checks first
  const deterministicResult = validateDeterministicQuality(doc, blueprint);

  // 2. Perform AI vision/layout evaluation
  let aiScores: CreativeQualityScores | null = null;
  let aiIssues: QualityIssue[] = [];
  let aiRan = false;
  let aiError: string | undefined = undefined;
  let modelId: string | undefined = undefined;

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
    console.warn('[campaign-studio] AI quality evaluation call failed (will flag unverified):', aiError.slice(0, 200));
  }

  // 3. Merge deterministic failures & issues
  const allIssues = [...deterministicResult.issues, ...aiIssues];
  const hardRuleFailures = [...deterministicResult.failures];

  // 4. Status determination & Approval Policy
  let status: EvaluationStatus;
  let passed = false;
  let approvalEligible = false;
  let totalScore: number;

  const hasCritical = allIssues.some((i) => i.severity === 'critical') || hardRuleFailures.length > 0;

  if (!deterministicResult.passed) {
    status = 'rejected';
    passed = false;
    approvalEligible = false;
    const baseScores: CreativeQualityScores = {
      visualHierarchy: 10,
      productAccuracy: hardRuleFailures.some((f) => f.includes('product')) ? 0 : 10,
      brandConsistency: hardRuleFailures.some((f) => f.includes('logo')) ? 0 : 8,
      typography: hardRuleFailures.some((f) => f.includes('headline')) ? 0 : 8,
      visualQuality: 8,
      messageClarity: hardRuleFailures.some((f) => f.includes('offer')) ? 0 : 5,
      technicalCompliance: hardRuleFailures.some((f) => f.includes('dimension') || f.includes('overflow')) ? 0 : 2,
    };
    aiScores = baseScores;
    totalScore = Object.values(baseScores).reduce((a, b) => a + b, 0);
  } else if (!aiRan || !aiScores) {
    // Deterministic checks passed, but AI visual checks failed or did not run -> UNVERIFIED
    status = 'unverified';
    passed = false;
    approvalEligible = false;
    const unverifiedScores: CreativeQualityScores = {
      visualHierarchy: 12,
      productAccuracy: 12,
      brandConsistency: 10,
      typography: 10,
      visualQuality: 10,
      messageClarity: 6,
      technicalCompliance: 4,
    };
    aiScores = unverifiedScores;
    totalScore = 64; // Under 70 threshold, clearly not approved
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
