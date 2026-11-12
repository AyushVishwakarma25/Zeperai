/**
 * CAMPAIGN STUDIO - server configuration.
 *
 * Model IDs live here (and can be overridden by env) so a Google model rename
 * or deprecation is a one-line / env-var change, not a code hunt.
 */

import type { CampaignAgent } from '../types.js';
import {
  resolveModelForTask,
  checkModelConfigurationHealth,
  MODEL_REGISTRY,
  markModelUnavailable,
  isModelMarkedUnavailable,
  clearUnavailableModels,
  recordModelFallback,
  getFallbackHistory,
  clearFallbackHistory,
  type CampaignTask,
  type ModelHealthCheckResult,
  type ModelResolutionResult,
} from './models/modelRegistry.js';

export {
  resolveModelForTask,
  checkModelConfigurationHealth,
  MODEL_REGISTRY,
  markModelUnavailable,
  isModelMarkedUnavailable,
  clearUnavailableModels,
  recordModelFallback,
  getFallbackHistory,
  clearFallbackHistory,
  type CampaignTask,
  type ModelHealthCheckResult,
  type ModelResolutionResult,
};

export type TextModelTier = 'flash' | 'pro';

/**
 * Resolves the appropriate model for general text tiers via central model registry.
 * Backward-compatible wrapper over resolveModelForTask.
 */
export function resolveTextModel(tier: TextModelTier): string {
  const task: CampaignTask = tier === 'pro' ? 'reasoning_strategy' : 'copy_generation';
  return resolveModelForTask(task).model;
}

export interface AgentRuntimeConfig {
  tier: TextModelTier;
  /** Grounding with Google Search (billed per query on Gemini 3 models). */
  googleSearch: boolean;
  /** Let the model read URLs directly. */
  urlContext: boolean;
  thinkingLevel?: 'low' | 'medium' | 'high';
  temperature: number;
  /** Per-attempt timeout. Keep below the hosting platform's function limit. */
  timeoutMs: number;
}

/** Text agents only. The `creatives` step uses the image models via modelConfig.ts. */
export type TextAgent = Exclude<CampaignAgent, 'creatives'>;

export const AGENT_RUNTIME: Record<TextAgent, AgentRuntimeConfig> = {
  brand_analysis:      { tier: 'flash', googleSearch: false, urlContext: true,  temperature: 0.4, timeoutMs: 45_000 },
  market_research:     { tier: 'flash', googleSearch: true,  urlContext: false, temperature: 0.4, timeoutMs: 60_000 },
  competitor_research: { tier: 'flash', googleSearch: true,  urlContext: false, temperature: 0.4, timeoutMs: 60_000 },
  strategy:            { tier: 'pro',   googleSearch: false, urlContext: false, thinkingLevel: 'high', temperature: 0.7, timeoutMs: 60_000 },
  creative_direction:  { tier: 'pro',   googleSearch: false, urlContext: false, thinkingLevel: 'medium', temperature: 0.9, timeoutMs: 60_000 },
  master_prompts:      { tier: 'flash', googleSearch: false, urlContext: false, temperature: 0.7, timeoutMs: 45_000 },
};

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Stops one user from creating unbounded runs. */
export const MAX_ACTIVE_RUNS_PER_USER = 10;

/** AI-generated redos allowed per step. Defined in ../types.ts so the UI shows the same number. */
export { MAX_REGENERATIONS_PER_STEP } from '../types.js';

/** A step stuck in 'running' longer than this is assumed dead (function killed) and may be retried. */
export const STALE_RUNNING_MS = 3 * 60_000;

/**
 * Wall-clock budget for ONE agent request, including site fetching and retries.
 * Keep it below the hosting function limit (vercel.json maxDuration = 60s -> default 55s).
 */
export function getStepDeadlineMs(): number {
  const n = Number(process.env.CAMPAIGN_STEP_DEADLINE_MS);
  return Number.isFinite(n) && n >= 20_000 && n <= 280_000 ? n : 55_000;
}

// ---------------------------------------------------------------------------
// Feature gate (fail closed)
// ---------------------------------------------------------------------------

/** Campaign Studio is a global dashboard feature (enabled by default unless explicitly disabled via CAMPAIGN_STUDIO_ENABLED === 'false'). */
export function isCampaignStudioEnabled(): boolean {
  const envVal = (process.env.CAMPAIGN_STUDIO_ENABLED || '').trim().toLowerCase();
  return envVal !== 'false';
}

/**
 * Optional beta allowlist. When CAMPAIGN_STUDIO_ALLOWED_EMAILS is set
 * (comma-separated), only those emails (and admins) can use the feature.
 * Returns null when no allowlist is configured (= everyone signed in has access).
 */
export function getCampaignStudioAllowedEmails(): string[] | null {
  const raw = (process.env.CAMPAIGN_STUDIO_ALLOWED_EMAILS || '').trim();
  if (!raw || raw === '*' || raw === 'all') return null;
  const list = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.length > 0 ? list : null;
}
