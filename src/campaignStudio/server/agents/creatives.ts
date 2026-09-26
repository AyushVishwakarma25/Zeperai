/**
 * CAMPAIGN STUDIO - Agent 7: Creatives (Bulk Creative Image Generation).
 *
 * Input: approved Master Prompts (one prompt per concept).
 * For each prompt, calls the image generation model (via modelConfig resolution)
 * to produce a background image with NO text baked in.
 *
 * Credits: Charged atomically per image via campaign_spend_credits Postgres RPC
 * BEFORE generating, and refunded via campaign_refund_credits on failure.
 * Never trusts client prices/counts — uses run.settings.creativeCount and
 * approved master_prompts.prompts.length as source of truth (must match).
 *
 * Storage: Stored in campaign_assets (not campaign_steps). One row per concept,
 * with image_url, overlay text (headline/subheadline/cta), and credits_charged.
 *
 * Partial success: Some images may fail while others succeed; failed images can
 * be retried individually ("regenerate this one").
 */

import { AppError } from '../../../../utils/errorHandler.js';
import { getAI } from '../../../../config/ai.js';
import { resolveModelForGeneration } from '../../../config/modelConfig.js';
import type { CampaignAsset, MasterPrompt, MasterPrompts } from '../../types.js';
import {
  insertAsset,
  maxAssetVersion,
  refundCampaignCredits,
  spendCampaignCredits,
  updateAsset,
  updateAssetsWhere,
} from '../db.js';
import type { GenAIClientLike } from '../gemini.js';
import type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';

export interface CreativesStepOutput {
  totalCount: number;
  readyCount: number;
  failedCount: number;
  assetIds: string[];
}

export function normalizeAspectRatio(ratio?: string | null): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' {
  switch (ratio) {
    case '9:16':
      return '9:16';
    case '16:9':
      return '16:9';
    case '3:4':
    case '4:5':
      return '3:4';
    case '4:3':
      return '4:3';
    case '1:1':
    default:
      return '1:1';
  }
}

export function extractImageUrl(response: any): string {
  if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('Generation blocked by safety filters.');
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      return `data:${mime};base64,${part.inlineData.data}`;
    }
    if (typeof part.text === 'string' && part.text.startsWith('data:image/')) {
      return part.text;
    }
  }

  if (typeof response?.text === 'string' && response.text.startsWith('data:image/')) {
    return response.text;
  }

  throw new Error('AI image generator failed to return image data.');
}

export async function callImageModel(params: {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  model: string;
  client?: GenAIClientLike;
}): Promise<string> {
  const ai = params.client ?? getAI();
  const aspectRatioConfig = normalizeAspectRatio(params.aspectRatio);

  let fullPrompt = params.prompt;
  if (params.negativePrompt) {
    fullPrompt += `\nAvoid: ${params.negativePrompt}`;
  }
  // Enforce invariant: NO text baked into background image
  fullPrompt += `\nImportant: Clean background visual only. Do not render any typography, text, letters, numbers, watermarks, or logos in the image.`;

  const response = await ai.models.generateContent({
    model: params.model,
    contents: {
      parts: [{ text: fullPrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatioConfig,
      },
    },
  });

  return extractImageUrl(response);
}

export interface GenerateSingleCreativeParams {
  runId: string;
  userId: string;
  creativeIndex: number;
  prompt: MasterPrompt;
  quality: string;
  client: any;
  imageClient?: GenAIClientLike;
  feedback?: string | null;
}

export async function generateSingleCreative(params: GenerateSingleCreativeParams): Promise<CampaignAsset> {
  const { runId, userId, creativeIndex, prompt, quality, client, imageClient, feedback } = params;

  // 1. Resolve model & credit cost
  let userTier = 'Free';
  if (client) {
    try {
      const { data: profile } = await client.from('profiles').select('tier').eq('id', userId).maybeSingle();
      if (profile?.tier) userTier = profile.tier;
    } catch {
      // Fallback to Free tier
    }
  }
  const modelDef = resolveModelForGeneration(userTier, quality);
  const creditCost = modelDef.credits;

  // 2. Determine new version
  let nextVersion = 1;
  if (client) {
    const currentMax = await maxAssetVersion(client, userId, runId, creativeIndex);
    nextVersion = currentMax + 1;
    // Mark prior active versions as superseded
    await updateAssetsWhere(
      client,
      userId,
      runId,
      { creativeIndex, fromStatuses: ['ready', 'failed', 'queued', 'generating'], versionBelow: nextVersion },
      { status: 'superseded' },
    );
  }

  const referenceId = `${runId}:${creativeIndex}:${nextVersion}`;

  // 3. Insert asset in 'generating' state
  let asset: CampaignAsset = {
    id: `temp-${creativeIndex}-${nextVersion}`,
    run_id: runId,
    user_id: userId,
    creative_index: creativeIndex,
    version: nextVersion,
    status: 'generating',
    prompt: feedback ? `${prompt.imagePrompt}\nFeedback: ${feedback}` : prompt.imagePrompt,
    aspect_ratio: prompt.aspectRatio,
    model: modelDef.apiModel,
    image_url: null,
    storage_path: null,
    overlay: {
      headline: prompt.headline,
      subheading: prompt.subheadline,
      cta: prompt.cta,
    },
    credits_charged: creditCost,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (client) {
    asset = await insertAsset(client, userId, {
      run_id: runId,
      creative_index: creativeIndex,
      version: nextVersion,
      status: 'generating',
      prompt: asset.prompt,
      aspect_ratio: asset.aspect_ratio,
      model: asset.model,
      overlay: asset.overlay as Record<string, unknown>,
      credits_charged: creditCost,
      error: null,
    });
  }

  // 4. Charge credits atomically BEFORE generation
  let creditsCharged = false;
  if (client) {
    try {
      await spendCampaignCredits(client, userId, creditCost, referenceId, modelDef.apiModel, {
        runId,
        creativeIndex,
        version: nextVersion,
        conceptId: prompt.conceptId,
      });
      creditsCharged = true;
    } catch (spendErr: any) {
      const errMsg = spendErr.userMessage || spendErr.message || 'Insufficient credits.';
      if (client) {
        await updateAsset(client, userId, runId, creativeIndex, nextVersion, {
          status: 'failed',
          credits_charged: 0,
          error: errMsg,
        });
      }
      return {
        ...asset,
        status: 'failed',
        credits_charged: 0,
        error: errMsg,
      };
    }
  }

  // 5. Generate background image
  try {
    const imageUrl = await callImageModel({
      prompt: asset.prompt || prompt.imagePrompt,
      negativePrompt: prompt.negativePrompt,
      aspectRatio: prompt.aspectRatio,
      model: modelDef.apiModel,
      client: imageClient,
    });

    // Success! Update asset to ready
    if (client) {
      const updated = await updateAsset(client, userId, runId, creativeIndex, nextVersion, {
        status: 'ready',
        image_url: imageUrl,
        credits_charged: creditCost,
        error: null,
      });
      return updated ?? { ...asset, status: 'ready', image_url: imageUrl, credits_charged: creditCost };
    }
    return { ...asset, status: 'ready', image_url: imageUrl, credits_charged: creditCost };
  } catch (genErr: any) {
    const errMsg = genErr.message || 'Image generation failed.';
    // Refund credits if they were charged
    if (creditsCharged && client) {
      await refundCampaignCredits(client, userId, referenceId);
    }
    if (client) {
      const updated = await updateAsset(client, userId, runId, creativeIndex, nextVersion, {
        status: 'failed',
        credits_charged: 0,
        error: errMsg,
      });
      return updated ?? { ...asset, status: 'failed', credits_charged: 0, error: errMsg };
    }
    return { ...asset, status: 'failed', credits_charged: 0, error: errMsg };
  }
}

export const creativesAgent: AgentImpl = {
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const masterPrompts = ctx.upstream.master_prompts as MasterPrompts | undefined;
    if (!masterPrompts || !Array.isArray(masterPrompts.prompts) || masterPrompts.prompts.length === 0) {
      throw new AppError('Master prompts missing', 400, 'Approved master prompts are required before generating creatives.');
    }

    const expectedCount = ctx.run.settings?.creativeCount ?? 5;
    if (masterPrompts.prompts.length !== expectedCount) {
      throw new AppError(
        'Prompt count mismatch',
        400,
        `Approved master prompts count (${masterPrompts.prompts.length}) does not match campaign settings creativeCount (${expectedCount}).`,
      );
    }

    const userId = ctx.userId || ctx.run.user_id;
    const quality = ctx.run.settings?.quality || 'Standard';

    // Model name resolution for step tracking
    let userTier = 'Free';
    if (ctx.client) {
      try {
        const { data: profile } = await ctx.client.from('profiles').select('tier').eq('id', userId).maybeSingle();
        if (profile?.tier) userTier = profile.tier;
      } catch {
        // Fallback
      }
    }
    const modelDef = resolveModelForGeneration(userTier, quality);

    const assetResults: CampaignAsset[] = [];
    const client = ctx.client;

    // Generate each creative sequentially to respect rate limits & atomic credit spend
    for (let i = 0; i < masterPrompts.prompts.length; i++) {
      const prompt = masterPrompts.prompts[i];
      const creativeIndex = i + 1;

      const asset = await generateSingleCreative({
        runId: ctx.run.id,
        userId,
        creativeIndex,
        prompt,
        quality,
        client,
        imageClient: ctx.imageClient || ctx.geminiClient,
        feedback: ctx.feedback,
      });

      assetResults.push(asset);
    }

    const readyCount = assetResults.filter((a) => a.status === 'ready').length;
    const failedCount = assetResults.filter((a) => a.status === 'failed').length;

    const output: CreativesStepOutput = {
      totalCount: assetResults.length,
      readyCount,
      failedCount,
      assetIds: assetResults.map((a) => a.id),
    };

    return {
      output,
      model: modelDef.apiModel,
      usage: { promptTokens: 0, outputTokens: 0, thinkingTokens: 0, totalTokens: 0 },
      snapshot: {
        creativeCount: expectedCount,
        quality,
        model: modelDef.apiModel,
        readyCount,
        failedCount,
      },
    };
  },
};
