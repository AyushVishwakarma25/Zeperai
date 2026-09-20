/**
 * CAMPAIGN STUDIO - shared types (client + server safe, no runtime deps).
 *
 * Mirrors supabase_campaign_studio_migration.sql. Keep the two in sync.
 */

import type { GenerationQuality } from '../config/modelConfig.js';

// ---------------------------------------------------------------------------
// Agents & review gates
// ---------------------------------------------------------------------------

export const CAMPAIGN_AGENTS = [
  'brand_analysis',
  'market_research',
  'competitor_research',
  'strategy',
  'creative_direction',
  'master_prompts',
  'creatives',
] as const;

export type CampaignAgent = (typeof CAMPAIGN_AGENTS)[number];

/**
 * Human review gates, in order. Every gate must be approved before the next
 * one starts. Market + competitor research run in parallel and share ONE gate
 * so the user reviews them together instead of clicking approve twice.
 */
export const REVIEW_GATES: readonly (readonly CampaignAgent[])[] = [
  ['brand_analysis'],
  ['market_research', 'competitor_research'],
  ['strategy'],
  ['creative_direction'],
  ['master_prompts'],
  ['creatives'],
] as const;

export const AGENT_LABELS: Record<CampaignAgent, string> = {
  brand_analysis: 'Brand Analysis',
  market_research: 'Market Research',
  competitor_research: 'Competitor Research',
  strategy: 'Strategy',
  creative_direction: 'Creative Direction',
  master_prompts: 'Master Prompts',
  creatives: 'Creatives',
};

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

export type StepStatus =
  | 'queued'
  | 'running'
  | 'awaiting_review'
  | 'approved'
  | 'superseded' // replaced by a newer version, or invalidated by an upstream redo
  | 'failed';

export type RunStatus = 'active' | 'completed' | 'cancelled';

export type AssetStatus = 'queued' | 'generating' | 'ready' | 'failed' | 'superseded';

// ---------------------------------------------------------------------------
// Run input & settings
// ---------------------------------------------------------------------------

export type CampaignGoal =
  | 'sales'
  | 'awareness'
  | 'engagement'
  | 'leads'
  | 'launch'
  | 'retention'
  | 'custom';

export type CampaignInputType = 'website' | 'details';

export interface CampaignSettings {
  /** Number of creatives to generate in the final step. Default 5, max 10. */
  creativeCount: number;
  /** Maps to Nano Banana 2 (Standard) / Nano Banana Pro (Pro) via modelConfig for paid users. */
  quality: GenerationQuality | 'Standard' | 'Pro';
  /** e.g. '1:1', '4:5', '9:16'. */
  aspectRatio: string;
}

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  creativeCount: 5,
  quality: 'Standard',
  aspectRatio: '1:1',
};

export const MAX_CREATIVES_PER_RUN = 10;

/** AI-generated redos allowed per step (manual edits do not count). Enforced by the server, shown by the UI. */
export const MAX_REGENERATIONS_PER_STEP = 5;

// ---------------------------------------------------------------------------
// DB rows (snake_case, as returned by Supabase)
// ---------------------------------------------------------------------------

export interface CampaignRun {
  id: string;
  user_id: string;
  title: string | null;
  input_type: CampaignInputType;
  website_url: string | null;
  brand_details: string | null;
  goal: CampaignGoal | string;
  goal_notes: string | null;
  status: RunStatus;
  current_step: CampaignAgent;
  brand_context: Partial<BrandContext>;
  settings: CampaignSettings;
  credits_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep<TOutput = unknown> {
  id: string;
  run_id: string;
  user_id: string;
  agent: CampaignAgent;
  version: number;
  status: StepStatus;
  input_snapshot: Record<string, unknown>;
  output: TOutput | null;
  user_feedback: string | null;
  model: string | null;
  usage: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface CampaignAsset {
  id: string;
  run_id: string;
  user_id: string;
  creative_index: number;
  version: number;
  status: AssetStatus;
  prompt: string | null;
  aspect_ratio: string | null;
  model: string | null;
  image_url: string | null;
  storage_path: string | null;
  overlay: CreativeOverlay | Record<string, never>;
  credits_charged: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** Text/logo layer composited on top of a generated image (applied client-side). */
export interface CreativeOverlay {
  headline?: string;
  subheading?: string;
  cta?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

// ---------------------------------------------------------------------------
// Agent 1 output: Brand Context (the single source of truth every later agent reads)
// ---------------------------------------------------------------------------

export interface BrandContext {
  brandName: string;
  website?: string;
  category: string;
  summary: string;
  positioning: string;
  usps: string[];
  products: {
    name: string;
    description?: string;
    priceHint?: string;
    imageUrls?: string[];
  }[];
  audience: {
    primary: string;
    secondary?: string;
    painPoints: string[];
    desires: string[];
  };
  voice: {
    tone: string[];
    doSay: string[];
    dontSay: string[];
  };
  visualIdentity: {
    colors: { name?: string; hex: string }[];
    typography: string;
    logoUrl?: string;
    styleKeywords: string[];
  };
  /** Geographies the brand sells/advertises in, e.g. ['India']. */
  markets: string[];
  /** URLs actually read while building this context. Set by the server, never by the model. */
  sources: string[];
  /** Things the analyst could not determine. Shown at review so the user can fill them in. */
  gaps?: string[];
}
