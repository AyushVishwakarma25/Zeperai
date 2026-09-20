/**
 * CAMPAIGN STUDIO - data access.
 *
 * SECURITY: these helpers run with the service-role client, which BYPASSES
 * row level security. Every query therefore filters on user_id explicitly.
 * Never add a query here that reads or writes by row id alone.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../../utils/errorHandler.js';
import { MAX_ACTIVE_RUNS_PER_USER } from './config.js';
import type { CreateRunInput } from './validation.js';
import type { CampaignAsset, CampaignRun, CampaignStep } from '../types.js';

/** Columns returned to the client for a run list (no heavy jsonb). */
const RUN_LIST_COLUMNS = 'id, title, input_type, website_url, goal, status, current_step, credits_spent, created_at, updated_at';

/** Step columns returned to the client. input_snapshot is intentionally excluded (large, internal). */
const STEP_COLUMNS =
  'id, run_id, agent, version, status, output, user_feedback, model, usage, error, created_at, updated_at, approved_at';

const ASSET_COLUMNS =
  'id, run_id, creative_index, version, status, prompt, aspect_ratio, model, image_url, overlay, credits_charged, error, created_at, updated_at';

function fail(context: string, error: { message?: string; code?: string } | null, userMessage: string): never {
  console.error(`[campaign-studio] ${context} failed:`, error?.code, error?.message);
  // Message deliberately generic: never leak table/column names to the client.
  throw new AppError(`Campaign Studio: ${context} failed`, 500, userMessage);
}

/**
 * Creates a run for the user, enforcing the active-run cap.
 * The cap is a soft limit (count-then-insert is not atomic), which is fine for spam protection.
 */
export async function createRun(client: SupabaseClient, userId: string, input: CreateRunInput): Promise<CampaignRun> {
  const { count, error: countError } = await client
    .from('campaign_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (countError) fail('count active runs', countError, 'Could not start your campaign. Please try again.');
  if ((count ?? 0) >= MAX_ACTIVE_RUNS_PER_USER) {
    throw new AppError(
      'Active campaign limit reached',
      429,
      `You already have ${MAX_ACTIVE_RUNS_PER_USER} active campaigns. Finish or cancel one before starting another.`,
    );
  }

  const { data, error } = await client
    .from('campaign_runs')
    .insert({
      user_id: userId,
      title: input.title,
      input_type: input.inputType,
      website_url: input.websiteUrl,
      brand_details: input.brandDetails,
      goal: input.goal,
      goal_notes: input.goalNotes,
      settings: input.settings,
    })
    .select('*')
    .single();

  if (error || !data) fail('create run', error, 'Could not start your campaign. Please try again.');
  return data as CampaignRun;
}

export async function listRuns(client: SupabaseClient, userId: string, limit = 30): Promise<Partial<CampaignRun>[]> {
  const { data, error } = await client
    .from('campaign_runs')
    .select(RUN_LIST_COLUMNS)
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) fail('list runs', error, 'Could not load your campaigns. Please try again.');
  return (data ?? []) as Partial<CampaignRun>[];
}

/** Returns the run only if it belongs to the user, else null. */
export async function getRun(client: SupabaseClient, userId: string, runId: string): Promise<CampaignRun | null> {
  const { data, error } = await client
    .from('campaign_runs')
    .select('*')
    .eq('id', runId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) fail('get run', error, 'Could not load this campaign. Please try again.');
  return (data as CampaignRun | null) ?? null;
}

export interface RunDetail {
  run: CampaignRun;
  steps: CampaignStep[];
  assets: CampaignAsset[];
}

/** Run + all step versions + all assets, or null if the run is not the user's. */
export async function getRunDetail(client: SupabaseClient, userId: string, runId: string): Promise<RunDetail | null> {
  const run = await getRun(client, userId, runId);
  if (!run) return null;

  const [stepsRes, assetsRes] = await Promise.all([
    client
      .from('campaign_steps')
      .select(STEP_COLUMNS)
      .eq('run_id', runId)
      .eq('user_id', userId)
      .order('agent', { ascending: true })
      .order('version', { ascending: true }),
    client
      .from('campaign_assets')
      .select(ASSET_COLUMNS)
      .eq('run_id', runId)
      .eq('user_id', userId)
      .order('creative_index', { ascending: true })
      .order('version', { ascending: true }),
  ]);

  if (stepsRes.error) fail('get steps', stepsRes.error, 'Could not load this campaign. Please try again.');
  if (assetsRes.error) fail('get assets', assetsRes.error, 'Could not load this campaign. Please try again.');

  return {
    run,
    steps: (stepsRes.data ?? []) as unknown as CampaignStep[],
    assets: (assetsRes.data ?? []) as unknown as CampaignAsset[],
  };
}
