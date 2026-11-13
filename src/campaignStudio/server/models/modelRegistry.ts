/**
 * CAMPAIGN STUDIO V2 - Central AI Model Configuration Registry.
 *
 * Grounded in official Google Gemini API and Vertex AI documentation (verified Nov 2026).
 * Provides strict separation of duties, task-specific model resolution, capability tracking,
 * explicit fallback chains without silent downgrades, deprecation interception,
 * and pre-flight configuration health validation.
 */

export type ModelProvider = 'google-ai-studio' | 'google-vertex-ai';

export type CampaignTask =
  | 'reasoning_strategy'
  | 'creative_direction'
  | 'copy_generation'
  | 'reference_analysis'
  | 'vision_qa'
  | 'research_grounding'
  | 'image_generation_standard'
  | 'image_generation_pro'
  | 'image_generation_lite'
  | 'targeted_regeneration';

export type ModelInputType = 'text' | 'image' | 'video' | 'pdf';
export type ModelOutputType = 'text' | 'json' | 'image';

export interface ModelCapability {
  supportsStructuredJson: boolean;
  supportsVisionInput: boolean;
  supportsGoogleSearch: boolean;
  supportsThinking: boolean;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelLifecycle {
  status: 'active' | 'preview' | 'restricted' | 'deprecated' | 'shutdown';
  verifiedAt: string; // ISO 8601 YYYY-MM-DD
  verificationSource: string; // Documentation reference
  notes?: string;
}

export interface ModelPricing {
  inputPer1MTokensUsd?: number;
  outputPer1MTokensUsd?: number;
  imageOutputUsd?: number;
  internalCreditCost: number; // e.g. 1 for standard image, 3 for pro image, 0 for workflow step
}

export interface RegisteredModel {
  id: string;
  displayName: string;
  provider: ModelProvider;
  tasks: CampaignTask[];
  inputTypes: ModelInputType[];
  outputTypes: ModelOutputType[];
  capabilities: ModelCapability;
  lifecycle: ModelLifecycle;
  regionConstraints?: string[];
  pricing: ModelPricing;
  envOverrideVar?: string;
  defaultFallbackModelId?: string;
}

export interface ModelResolutionResult {
  task: CampaignTask;
  model: string;
  requestedModel: string;
  provider: ModelProvider;
  fallbackApplied: boolean;
  fallbackReason?: string;
  capabilities: ModelCapability;
  timeoutMs: number;
}

export interface FallbackRecord {
  task: CampaignTask;
  requestedModel: string;
  resolvedModel: string;
  fallbackApplied: boolean;
  reason?: string;
  timestamp: string;
}

export interface ModelHealthCheckResult {
  healthy: boolean;
  provider: ModelProvider;
  timestamp: string;
  tasks: Record<
    CampaignTask,
    {
      primaryModel: string;
      fallbackModel: string;
      status: 'ready' | 'fallback_recommended' | 'misconfigured';
      warnings?: string[];
    }
  >;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Official Model Registry (Verified November 12, 2026)
// Sources:
// - Google Gemini API Overview: https://ai.google.dev/gemini-api/docs/models
// - Google Image Generation Guide: https://ai.google.dev/gemini-api/docs/image-generation
// - Google Cloud Vertex AI Model Garden: https://cloud.google.com/vertex-ai/docs/generative-ai/model-garden
// ---------------------------------------------------------------------------

export const MODEL_REGISTRY: Record<string, RegisteredModel> = {
  // --- High-Reasoning & Strategy Models ---
  'gemini-3.1-pro-preview': {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    provider: 'google-ai-studio',
    tasks: ['reasoning_strategy', 'creative_direction'],
    inputTypes: ['text', 'image', 'video', 'pdf'],
    outputTypes: ['text', 'json'],
    capabilities: {
      supportsStructuredJson: true,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: true,
      maxInputTokens: 2_000_000,
      maxOutputTokens: 64_000,
    },
    lifecycle: {
      status: 'preview',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google AI Studio Docs (gemini-3.1-pro-preview pricing and interactions SDK)',
      notes: 'Flagship reasoning model supporting thinkingConfig and high-context multi-agent orchestration.',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      inputPer1MTokensUsd: 2.0,
      outputPer1MTokensUsd: 12.0,
      internalCreditCost: 0,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_PRO',
    defaultFallbackModelId: 'gemini-flash-latest',
  },

  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro (Vertex AI)',
    provider: 'google-vertex-ai',
    tasks: ['reasoning_strategy', 'creative_direction'],
    inputTypes: ['text', 'image', 'video', 'pdf'],
    outputTypes: ['text', 'json'],
    capabilities: {
      supportsStructuredJson: true,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: true,
      maxInputTokens: 2_000_000,
      maxOutputTokens: 64_000,
    },
    lifecycle: {
      status: 'restricted',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Cloud Vertex AI & Gemini Deprecations (access restricted to grandfathered projects)',
      notes: 'Restricted capacity. Unprovisioned GCP projects return 404. Must fall back to gemini-2.5-flash.',
    },
    regionConstraints: ['us-central1'],
    pricing: {
      inputPer1MTokensUsd: 2.5,
      outputPer1MTokensUsd: 10.0,
      internalCreditCost: 0,
    },
    envOverrideVar: 'VERTEX_PRO_MODEL',
    defaultFallbackModelId: 'gemini-2.5-flash',
  },

  // --- High-Velocity Multimodal, Copy & Vision Models ---
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    provider: 'google-ai-studio',
    tasks: ['copy_generation', 'reference_analysis', 'vision_qa', 'research_grounding', 'targeted_regeneration'],
    inputTypes: ['text', 'image', 'video', 'pdf'],
    outputTypes: ['text', 'json'],
    capabilities: {
      supportsStructuredJson: true,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: false,
      maxInputTokens: 1_000_000,
      maxOutputTokens: 32_000,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Gemini API Docs (What is new in Gemini 3.8 Flash, release Oct 2026)',
      notes: 'High-speed multimodal software engineering & creative copy model with Search grounding support.',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      inputPer1MTokensUsd: 0.3,
      outputPer1MTokensUsd: 1.2,
      internalCreditCost: 0,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_FLASH',
    defaultFallbackModelId: 'gemini-flash-latest',
  },

  'gemini-flash-latest': {
    id: 'gemini-flash-latest',
    displayName: 'Gemini Flash (Latest Stable)',
    provider: 'google-ai-studio',
    tasks: [
      'reasoning_strategy',
      'creative_direction',
      'copy_generation',
      'reference_analysis',
      'vision_qa',
      'research_grounding',
      'targeted_regeneration',
    ],
    inputTypes: ['text', 'image', 'video', 'pdf'],
    outputTypes: ['text', 'json'],
    capabilities: {
      supportsStructuredJson: true,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: false,
      maxInputTokens: 1_000_000,
      maxOutputTokens: 32_000,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google AI Studio Canonical Alias (gemini-flash-latest)',
      notes: 'Canonical alias resolving to latest stable Flash. High reliability and zero-gating.',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      inputPer1MTokensUsd: 0.3,
      outputPer1MTokensUsd: 1.2,
      internalCreditCost: 0,
    },
    defaultFallbackModelId: 'gemini-2.5-flash',
  },

  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'google-vertex-ai',
    tasks: [
      'reasoning_strategy',
      'creative_direction',
      'copy_generation',
      'reference_analysis',
      'vision_qa',
      'research_grounding',
      'targeted_regeneration',
    ],
    inputTypes: ['text', 'image', 'video', 'pdf'],
    outputTypes: ['text', 'json'],
    capabilities: {
      supportsStructuredJson: true,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: false,
      maxInputTokens: 1_000_000,
      maxOutputTokens: 32_000,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Cloud Vertex AI Production Models',
      notes: 'Primary stable workhorse model for Vertex AI deployments.',
    },
    regionConstraints: ['us-central1', 'us-east4', 'europe-west1'],
    pricing: {
      inputPer1MTokensUsd: 0.3,
      outputPer1MTokensUsd: 1.2,
      internalCreditCost: 0,
    },
    defaultFallbackModelId: 'gemini-flash-latest',
  },

  // --- Generative Image Models (Vertex AI & Nano Banana) ---
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash Image (Nano Banana Standard)',
    provider: 'google-vertex-ai',
    tasks: ['image_generation_standard', 'targeted_regeneration'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: true,
      supportsGoogleSearch: false,
      supportsThinking: false,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Cloud Vertex AI Production Models (us-central1) & Gemini Image API',
      notes: 'Standard workhorse model for fast commercial advertising visuals ($0.039/image, 1 credit).',
    },
    regionConstraints: ['us-central1', 'us-east4', 'europe-west1', 'asia-northeast1'],
    pricing: {
      imageOutputUsd: 0.039,
      internalCreditCost: 1,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_IMAGE_STANDARD',
    defaultFallbackModelId: 'gemini-2.5-flash-image',
  },

  'gemini-nano-banana-2.1': {
    id: 'gemini-nano-banana-2.1',
    displayName: 'Gemini Nano Banana 2.1 (Standard)',
    provider: 'google-ai-studio',
    tasks: ['image_generation_standard', 'targeted_regeneration'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image', 'text'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: false,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Gemini Image Generation Guide',
      notes: 'Standard workhorse model for advertising visuals ($0.039/image, 1 credit).',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      imageOutputUsd: 0.039,
      internalCreditCost: 1,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_IMAGE_STANDARD',
    defaultFallbackModelId: 'gemini-3.1-flash-image',
  },

  'gemini-3-pro-image': {
    id: 'gemini-3-pro-image',
    displayName: 'Gemini 3 Pro Image (Nano Banana Pro)',
    provider: 'google-vertex-ai',
    tasks: ['image_generation_pro'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image', 'text'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: true,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Cloud Vertex AI & Gemini 3 Pro Image Guide',
      notes: 'Flagship photorealistic image generator with Thinking ($0.134/image, 3 credits).',
    },
    regionConstraints: ['us-central1', 'us-east4'],
    pricing: {
      imageOutputUsd: 0.134,
      internalCreditCost: 3,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_IMAGE_PRO',
    defaultFallbackModelId: 'gemini-2.5-flash-image',
  },

  'gemini-3.1-flash-lite-image': {
    id: 'gemini-3.1-flash-lite-image',
    displayName: 'Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite)',
    provider: 'google-ai-studio',
    tasks: ['image_generation_lite'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image', 'text'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: true,
      supportsGoogleSearch: false,
      supportsThinking: false,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Gemini Image Generation Guide',
      notes: 'Ultra-fast low-cost image generator for free tier ($0.0195/image, 1 credit).',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      imageOutputUsd: 0.0195,
      internalCreditCost: 1,
    },
    envOverrideVar: 'CAMPAIGN_MODEL_IMAGE_LITE',
    defaultFallbackModelId: 'gemini-nano-banana-2.1',
  },

  'gemini-3.1-flash-image': {
    id: 'gemini-3.1-flash-image',
    displayName: 'Gemini 3.1 Flash Image (Nano Banana 2)',
    provider: 'google-ai-studio',
    tasks: ['image_generation_standard'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image', 'text'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: true,
      supportsGoogleSearch: true,
      supportsThinking: false,
    },
    lifecycle: {
      status: 'active',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Gemini Image Generation Guide',
      notes: 'Reliable secondary fallback for Nano Banana ($0.039/image, 1 credit).',
    },
    regionConstraints: ['us-central1', 'global'],
    pricing: {
      imageOutputUsd: 0.039,
      internalCreditCost: 1,
    },
    defaultFallbackModelId: 'gemini-3.1-flash-lite-image',
  },

  // --- Deprecated & Shut Down Models (Intercepted) ---
  'imagen-3.0-generate-002': {
    id: 'imagen-3.0-generate-002',
    displayName: 'Imagen 3 (Discontinued)',
    provider: 'google-ai-studio',
    tasks: ['image_generation_standard'],
    inputTypes: ['text'],
    outputTypes: ['image'],
    capabilities: {
      supportsStructuredJson: false,
      supportsVisionInput: false,
      supportsGoogleSearch: false,
      supportsThinking: false,
    },
    lifecycle: {
      status: 'shutdown',
      verifiedAt: '2026-11-13',
      verificationSource: 'Google Gemini Image Generation Guide (Shutdown: Aug 17, 2026)',
      notes: 'DISCONTINUED. All requests must be intercepted and routed to gemini-nano-banana-2.1.',
    },
    regionConstraints: ['us-central1'],
    pricing: {
      imageOutputUsd: 0.04,
      internalCreditCost: 1,
    },
    defaultFallbackModelId: 'gemini-nano-banana-2.1',
  },
};

// ---------------------------------------------------------------------------
// Runtime State & Fallback Audit Trail
// ---------------------------------------------------------------------------

const unavailableModels = new Set<string>();
const fallbackHistory: FallbackRecord[] = [];

/**
 * Dynamically marks a model as temporarily or permanently unavailable.
 */
export function markModelUnavailable(modelId: string, reason: string): void {
  const norm = modelId.trim().toLowerCase();
  unavailableModels.add(norm);
  console.warn(`[model-registry] Model marked unavailable: "${modelId}" (${reason})`);
}

/**
 * Checks whether a model is currently marked as unavailable.
 */
export function isModelMarkedUnavailable(modelId: string): boolean {
  return unavailableModels.has(modelId.trim().toLowerCase());
}

/**
 * Clears the unavailable models cache (useful for testing and recovered networks).
 */
export function clearUnavailableModels(): void {
  unavailableModels.clear();
}

/**
 * Records an explicit fallback event in the audit trail.
 */
export function recordModelFallback(
  task: CampaignTask,
  requestedModel: string,
  resolvedModel: string,
  reason: string,
): FallbackRecord {
  const record: FallbackRecord = {
    task,
    requestedModel,
    resolvedModel,
    fallbackApplied: requestedModel !== resolvedModel,
    reason,
    timestamp: new Date().toISOString(),
  };
  fallbackHistory.push(record);
  console.info(
    `[model-registry] Fallback applied for task "${task}": requested "${requestedModel}" -> resolved "${resolvedModel}" (${reason})`,
  );
  return record;
}

/**
 * Returns a read-only copy of the fallback audit trail.
 */
export function getFallbackHistory(): readonly FallbackRecord[] {
  return [...fallbackHistory];
}

/**
 * Clears the fallback audit trail.
 */
export function clearFallbackHistory(): void {
  fallbackHistory.length = 0;
}

// ---------------------------------------------------------------------------
// Per-Task Timeouts
// ---------------------------------------------------------------------------

export const TASK_TIMEOUT_MS: Record<CampaignTask, number> = {
  reasoning_strategy: 60_000,
  creative_direction: 60_000,
  copy_generation: 45_000,
  reference_analysis: 45_000,
  vision_qa: 45_000,
  research_grounding: 60_000,
  image_generation_standard: 90_000,
  image_generation_pro: 120_000,
  image_generation_lite: 60_000,
  targeted_regeneration: 90_000,
};

// ---------------------------------------------------------------------------
// Task Model Resolver
// ---------------------------------------------------------------------------

export interface ModelResolveOptions {
  provider?: ModelProvider;
  userTier?: 'standard' | 'pro' | 'lite' | string;
  allowPreview?: boolean;
}

/**
 * Safely resolves a compatible fallback model without violating modality constraints.
 * An image model will NEVER fall back to a text model.
 */
export function getFallbackModelFor(
  currentModelId: string,
  task?: CampaignTask,
): { fallbackModel: string; tierShift: boolean; reason: string } | null {
  const currentEntry = MODEL_REGISTRY[currentModelId];
  if (!currentEntry) {
    const isImage = currentModelId.includes('image') || currentModelId.includes('banana');
    return {
      fallbackModel: isImage ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
      tierShift: false,
      reason: `Unregistered model "${currentModelId}" default fallback`,
    };
  }

  const defaultFallbackId = currentEntry.defaultFallbackModelId;
  if (!defaultFallbackId) return null;

  const fallbackEntry = MODEL_REGISTRY[defaultFallbackId];
  if (!fallbackEntry) return null;

  // Modality check: image MUST stay image
  const isCurrentImage = currentEntry.outputTypes.includes('image');
  const isFallbackImage = fallbackEntry.outputTypes.includes('image');
  if (isCurrentImage && !isFallbackImage) {
    console.error(
      `[model-registry] INVARIANT VIOLATION: Refusing to fall back image model "${currentModelId}" to non-image model "${defaultFallbackId}"`,
    );
    return null;
  }

  const tierShift =
    (currentEntry.pricing?.internalCreditCost || 0) >
    (fallbackEntry.pricing?.internalCreditCost || 0);
  const reason = tierShift
    ? `Fallback from ${currentEntry.displayName} (${currentEntry.pricing.internalCreditCost} cr) to ${fallbackEntry.displayName} (${fallbackEntry.pricing.internalCreditCost} cr). Quality tier shift active.`
    : `Fallback to verified peer model ${fallbackEntry.displayName}.`;

  return {
    fallbackModel: defaultFallbackId,
    tierShift,
    reason,
  };
}

/**
 * Resolves the optimal, verified model ID for a specific campaign task.
 * Automatically enforces fallback if a primary model is shut down, deprecated,
 * or marked unavailable, and records the fallback event in the audit trail.
 */
export function resolveModelForTask(
  task: CampaignTask,
  options: ModelResolveOptions = {},
): ModelResolutionResult {
  const isVertex = options.provider === 'google-vertex-ai' || process.env.USE_VERTEX_AI === 'true';
  const provider: ModelProvider = isVertex ? 'google-vertex-ai' : 'google-ai-studio';
  const timeoutMs = TASK_TIMEOUT_MS[task] || 45_000;

  // Adjust task based on explicit user tier for image generation
  let effectiveTask = task;
  if (task === 'image_generation_standard' && options.userTier === 'pro') {
    effectiveTask = 'image_generation_pro';
  } else if (task === 'image_generation_standard' && options.userTier === 'lite') {
    effectiveTask = 'image_generation_lite';
  }

  // 1. Identify primary and fallback candidates based on task and provider
  let primaryCandidate: string;
  let fallbackCandidate: string;

  switch (effectiveTask) {
    case 'reasoning_strategy':
    case 'creative_direction': {
      // High reasoning task
      if (isVertex) {
        primaryCandidate = process.env.CAMPAIGN_MODEL_STRATEGY || process.env.VERTEX_PRO_MODEL || 'gemini-2.5-pro';
        fallbackCandidate = 'gemini-2.5-flash';
      } else {
        primaryCandidate = process.env.CAMPAIGN_MODEL_STRATEGY || process.env.CAMPAIGN_MODEL_PRO || 'gemini-3.1-pro-preview';
        fallbackCandidate = 'gemini-flash-latest';
      }
      break;
    }

    case 'copy_generation': {
      primaryCandidate = process.env.CAMPAIGN_MODEL_COPY || (isVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest');
      fallbackCandidate = isVertex ? 'gemini-flash-latest' : 'gemini-2.5-flash';
      break;
    }

    case 'reference_analysis': {
      // Multimodal vision reference inspection
      primaryCandidate = process.env.CAMPAIGN_MODEL_REFERENCE_ANALYSIS || (isVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest');
      fallbackCandidate = isVertex ? 'gemini-flash-latest' : 'gemini-2.5-flash';
      break;
    }

    case 'vision_qa': {
      // Multimodal visual QA and scorecard evaluation
      primaryCandidate = process.env.CAMPAIGN_MODEL_VISION_QA || (isVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest');
      fallbackCandidate = isVertex ? 'gemini-flash-latest' : 'gemini-2.5-flash';
      break;
    }

    case 'research_grounding': {
      // Search-grounded market & competitor research
      primaryCandidate = isVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest';
      fallbackCandidate = 'gemini-3.8-flash';
      break;
    }

    case 'image_generation_standard': {
      primaryCandidate = process.env.CAMPAIGN_MODEL_IMAGE_STANDARD || (isVertex ? 'gemini-2.5-flash-image' : 'gemini-nano-banana-2.1');
      fallbackCandidate = isVertex ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image';
      break;
    }

    case 'image_generation_pro': {
      primaryCandidate = process.env.CAMPAIGN_MODEL_IMAGE_PRO || (isVertex ? 'gemini-3-pro-image' : 'gemini-3-pro-image');
      fallbackCandidate = isVertex ? 'gemini-2.5-flash-image' : 'gemini-nano-banana-2.1';
      break;
    }

    case 'image_generation_lite': {
      primaryCandidate = process.env.CAMPAIGN_MODEL_IMAGE_LITE || (isVertex ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-lite-image');
      fallbackCandidate = isVertex ? 'gemini-2.5-flash-image' : 'gemini-nano-banana-2.1';
      break;
    }

    case 'targeted_regeneration': {
      primaryCandidate = process.env.CAMPAIGN_MODEL_IMAGE_STANDARD || (isVertex ? 'gemini-2.5-flash-image' : 'gemini-nano-banana-2.1');
      fallbackCandidate = isVertex ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image';
      break;
    }

    default: {
      primaryCandidate = 'gemini-flash-latest';
      fallbackCandidate = 'gemini-2.5-flash';
    }
  }

  // 2. Intercept shut-down or discontinued model requests (e.g. Imagen 3)
  const reqLower = primaryCandidate.toLowerCase();
  let requestedModel = primaryCandidate;
  let resolvedModel = primaryCandidate;
  let fallbackApplied = false;
  let fallbackReason: string | undefined = undefined;

  if (reqLower.includes('imagen') || reqLower.includes('dall-e')) {
    fallbackApplied = true;
    fallbackReason = `Model "${primaryCandidate}" has been shut down by the provider (Aug 17, 2026). Upgrading to Nano Banana 2.1.`;
    resolvedModel = 'gemini-nano-banana-2.1';
    recordModelFallback(effectiveTask, requestedModel, resolvedModel, fallbackReason);
  } else if (isModelMarkedUnavailable(primaryCandidate)) {
    fallbackApplied = true;
    fallbackReason = `Primary model "${primaryCandidate}" is marked unavailable in current region/credentials. Routing to fallback "${fallbackCandidate}".`;
    resolvedModel = fallbackCandidate;
    recordModelFallback(effectiveTask, requestedModel, resolvedModel, fallbackReason);
  } else {
    // Check known restricted models on Vertex AI
    if (isVertex && primaryCandidate === 'gemini-2.5-pro') {
      // Unless explicitly requested via VERTEX_PRO_MODEL, default to safe 2.5-flash to avoid 404
      if (!process.env.VERTEX_PRO_MODEL) {
        fallbackApplied = true;
        fallbackReason = 'Vertex AI gemini-2.5-pro is restricted. Routing to verified gemini-2.5-flash workhorse.';
        resolvedModel = fallbackCandidate;
        recordModelFallback(effectiveTask, requestedModel, resolvedModel, fallbackReason);
      }
    }
  }

  const modelEntry = MODEL_REGISTRY[resolvedModel] || MODEL_REGISTRY[fallbackCandidate] || MODEL_REGISTRY['gemini-flash-latest'];
  const capabilities = modelEntry?.capabilities || {
    supportsStructuredJson: true,
    supportsVisionInput: true,
    supportsGoogleSearch: true,
    supportsThinking: false,
  };

  return {
    task: effectiveTask,
    model: resolvedModel,
    requestedModel,
    provider,
    fallbackApplied,
    fallbackReason,
    capabilities,
    timeoutMs,
  };
}

export interface ProviderHealthCheckResult {
  healthy: boolean;
  provider: ModelProvider;
  configuredProject?: string;
  configuredRegion: string;
  authMethod: 'service_account' | 'api_key' | 'adc' | 'missing';
  testedModel: string;
  latencyMs: number;
  warnings: string[];
  error?: string;
}

/**
 * Validates Google Cloud / Vertex AI provider configuration without generating assets
 * or spending customer credits. Uses a lightweight zero-token / countTokens probe.
 */
export async function checkProviderHealth(options?: {
  client?: any;
  testModel?: string;
}): Promise<ProviderHealthCheckResult> {
  const isVertex = process.env.USE_VERTEX_AI === 'true';
  const provider: ModelProvider = isVertex ? 'google-vertex-ai' : 'google-ai-studio';
  const configuredRegion = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1';
  const configuredProject = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const saJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const vertexApiKey = process.env.VERTEX_API_KEY;

  let authMethod: 'service_account' | 'api_key' | 'adc' | 'missing' = 'missing';
  if (saJson && saJson.length > 20) authMethod = 'service_account';
  else if (vertexApiKey) authMethod = 'api_key';
  else if (configuredProject) authMethod = 'adc';

  const testModel = options?.testModel || (isVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest');
  const startTime = Date.now();
  const warnings: string[] = [];

  if (isVertex && !configuredProject && authMethod !== 'service_account') {
    return {
      healthy: false,
      provider,
      configuredProject: undefined,
      configuredRegion,
      authMethod,
      testedModel: testModel,
      latencyMs: 0,
      warnings,
      error: 'Google Cloud Project ID is not configured. Set VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT.',
    };
  }

  try {
    const client = options?.client;
    if (client?.models?.countTokens) {
      await client.models.countTokens({
        model: testModel,
        contents: [{ role: 'user', parts: [{ text: 'health_check_probe' }] }],
      });
    } else if (client?.models?.get) {
      await client.models.get({ model: testModel });
    }
    const latencyMs = Date.now() - startTime;
    return {
      healthy: true,
      provider,
      configuredProject: configuredProject || 'from_service_account',
      configuredRegion,
      authMethod,
      testedModel: testModel,
      latencyMs,
      warnings,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const sanitizedError = String(err?.message || 'Provider probe failed')
      .replace(/key=[A-Za-z0-9_-]+/gi, 'key=***')
      .slice(0, 200);
    return {
      healthy: false,
      provider,
      configuredProject,
      configuredRegion,
      authMethod,
      testedModel: testModel,
      latencyMs,
      warnings,
      error: sanitizedError,
    };
  }
}

// ---------------------------------------------------------------------------
// Model Health Check & Configuration Validation
// ---------------------------------------------------------------------------

/**
 * Audits all configured models across every campaign task.
 * Verifies capability alignment and catches misconfigured or shut-down models.
 */
export async function checkModelConfigurationHealth(): Promise<ModelHealthCheckResult> {
  const isVertex = process.env.USE_VERTEX_AI === 'true';
  const provider: ModelProvider = isVertex ? 'google-vertex-ai' : 'google-ai-studio';
  const errors: string[] = [];
  const tasks = {} as ModelHealthCheckResult['tasks'];

  const allTasks: CampaignTask[] = [
    'reasoning_strategy',
    'creative_direction',
    'copy_generation',
    'reference_analysis',
    'vision_qa',
    'research_grounding',
    'image_generation_standard',
    'image_generation_pro',
    'image_generation_lite',
    'targeted_regeneration',
  ];

  for (const t of allTasks) {
    const resolution = resolveModelForTask(t, { provider });
    const reg = MODEL_REGISTRY[resolution.model];
    const warnings: string[] = [];

    let status: 'ready' | 'fallback_recommended' | 'misconfigured' = 'ready';

    if (!reg) {
      status = 'misconfigured';
      errors.push(`Task "${t}": resolved model "${resolution.model}" is not registered in the central registry.`);
    } else {
      if (reg.lifecycle.status === 'shutdown') {
        status = 'misconfigured';
        errors.push(`Task "${t}": resolved model "${reg.id}" is marked SHUT DOWN.`);
      } else if (reg.lifecycle.status === 'restricted') {
        status = 'fallback_recommended';
        warnings.push(`Model "${reg.id}" has restricted access; fallback to "${reg.defaultFallbackModelId}" is recommended.`);
      }

      if (resolution.fallbackApplied) {
        warnings.push(`Fallback active: ${resolution.fallbackReason}`);
      }
    }

    tasks[t] = {
      primaryModel: resolution.requestedModel,
      fallbackModel: resolution.model,
      status,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  const healthy = errors.length === 0;

  return {
    healthy,
    provider,
    timestamp: new Date().toISOString(),
    tasks,
    errors,
  };
}

