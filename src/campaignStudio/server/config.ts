/**
 * CAMPAIGN STUDIO - server configuration.
 *
 * Model IDs live here (and can be overridden by env) so a Google model rename
 * or deprecation is a one-line / env-var change, not a code hunt.
 */

import type { CampaignAgent } from '../types.js';

export type TextModelTier = 'flash' | 'pro';

/** `gemini-flash-latest` is already used elsewhere in this repo and always resolves to the latest stable Flash. */
const DEFAULT_FLASH_MODEL = 'gemini-flash-latest';
/** Preview model: override with CAMPAIGN_MODEL_PRO if Google renames it, or set it equal to the flash model to fall back. */
const DEFAULT_PRO_MODEL = 'gemini-3.1-pro-preview';

const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,80}$/i;

function readModelEnv(name: string, fallback: string): string {
  const raw = (process.env[name] || '').trim();
  return MODEL_ID_PATTERN.test(raw) ? raw : fallback;
}

export function resolveTextModel(tier: TextModelTier): string {
  return tier === 'pro'
    ? readModelEnv('CAMPAIGN_MODEL_PRO', DEFAULT_PRO_MODEL)
    : readModelEnv('CAMPAIGN_MODEL_FLASH', DEFAULT_FLASH_MODEL);
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

/** Campaign Studio is OFF unless CAMPAIGN_STUDIO_ENABLED === 'true'. */
export function isCampaignStudioEnabled(): boolean {
  return (process.env.CAMPAIGN_STUDIO_ENABLED || '').trim().toLowerCase() === 'true';
}

/**
 * Optional beta allowlist. When CAMPAIGN_STUDIO_ALLOWED_EMAILS is set
 * (comma-separated), only those emails (and admins) can use the feature.
 * Returns null when no allowlist is configured (= everyone signed in).
 */
export function getCampaignStudioAllowedEmails(): string[] | null {
  const raw = (process.env.CAMPAIGN_STUDIO_ALLOWED_EMAILS || '').trim();
  if (!raw) return null;
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}
