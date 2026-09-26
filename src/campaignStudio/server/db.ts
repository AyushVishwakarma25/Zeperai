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
import type { AssetStatus, CampaignAgent, CampaignAsset, CampaignRun, CampaignStep, RunStatus, StepStatus } from '../types.js';

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

// ---------------------------------------------------------------------------
// Step + run mutations (used by the step engine). All scoped by user_id.
// ---------------------------------------------------------------------------

/** Every step column except the large input_snapshot. */
const STEP_LIGHT = STEP_COLUMNS;

/** All step versions of a run WITHOUT input_snapshot (cheap). */
export async function listStepsLight(client: SupabaseClient, userId: string, runId: string): Promise<CampaignStep[]> {
  const { data, error } = await client
    .from('campaign_steps')
    .select(STEP_LIGHT)
    .eq('run_id', runId)
    .eq('user_id', userId)
    .order('agent', { ascending: true })
    .order('version', { ascending: true });
  if (error) fail('list steps', error, 'Could not load this campaign. Please try again.');
  return (data ?? []) as unknown as CampaignStep[];
}

/** One step INCLUDING input_snapshot (needed to reuse work on a redo). */
export async function getStepFull(client: SupabaseClient, userId: string, stepId: string): Promise<CampaignStep | null> {
  const { data, error } = await client.from('campaign_steps').select('*').eq('id', stepId).eq('user_id', userId).maybeSingle();
  if (error) fail('get step', error, 'Could not load this campaign. Please try again.');
  return (data as CampaignStep | null) ?? null;
}

export interface NewStep {
  run_id: string;
  agent: CampaignAgent;
  version: number;
  status: StepStatus;
  input_snapshot?: Record<string, unknown>;
  user_feedback?: string | null;
  output?: unknown;
  model?: string | null;
  usage?: Record<string, unknown>;
}

/** Inserts a step version. A duplicate (run, agent, version) means a concurrent request won: 409. */
export async function insertStep(client: SupabaseClient, userId: string, step: NewStep): Promise<CampaignStep> {
  const { data, error } = await client
    .from('campaign_steps')
    .insert({ ...step, user_id: userId })
    .select(STEP_LIGHT)
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new AppError('Concurrent step request', 409, 'This step is already being worked on. Please wait a moment.');
    }
    fail('insert step', error, 'Could not save this step. Please try again.');
  }
  return data as unknown as CampaignStep;
}

export type StepPatch = Partial<{
  status: StepStatus;
  output: unknown;
  model: string | null;
  usage: Record<string, unknown>;
  input_snapshot: Record<string, unknown>;
  error: string | null;
  approved_at: string | null;
}>;

/** Updates one step; with onlyIfStatus it is a compare-and-set. Returns null when nothing matched. */
export async function updateStep(
  client: SupabaseClient,
  userId: string,
  stepId: string,
  patch: StepPatch,
  onlyIfStatus?: StepStatus[],
): Promise<CampaignStep | null> {
  let q = client.from('campaign_steps').update(patch).eq('id', stepId).eq('user_id', userId);
  if (onlyIfStatus) q = q.in('status', onlyIfStatus);
  const { data, error } = await q.select(STEP_LIGHT);
  if (error) fail('update step', error, 'Could not save this step. Please try again.');
  return ((data ?? [])[0] as unknown as CampaignStep) ?? null;
}

/** Bulk status change over agents/versions of one run. Returns the rows that changed. */
export async function updateStepsWhere(
  client: SupabaseClient,
  userId: string,
  runId: string,
  filter: { agents: CampaignAgent[]; fromStatuses: StepStatus[]; versionBelow?: number },
  patch: StepPatch,
): Promise<CampaignStep[]> {
  if (filter.agents.length === 0) return [];
  let q = client
    .from('campaign_steps')
    .update(patch)
    .eq('run_id', runId)
    .eq('user_id', userId)
    .in('agent', filter.agents)
    .in('status', filter.fromStatuses);
  if (filter.versionBelow !== undefined) q = q.lt('version', filter.versionBelow);
  const { data, error } = await q.select(STEP_LIGHT);
  if (error) fail('update steps', error, 'Could not save this step. Please try again.');
  return (data ?? []) as unknown as CampaignStep[];
}

export type RunPatch = Partial<{
  status: RunStatus;
  current_step: CampaignAgent;
  brand_context: unknown;
  title: string;
}>;

export async function updateRun(
  client: SupabaseClient,
  userId: string,
  runId: string,
  patch: RunPatch,
  onlyIfStatus?: RunStatus,
): Promise<CampaignRun | null> {
  let q = client.from('campaign_runs').update(patch).eq('id', runId).eq('user_id', userId);
  if (onlyIfStatus) q = q.eq('status', onlyIfStatus);
  const { data, error } = await q.select('*');
  if (error) fail('update run', error, 'Could not save your campaign. Please try again.');
  return ((data ?? [])[0] as CampaignRun) ?? null;
}

// ---------------------------------------------------------------------------
// Assets & credits (chunk 7)
// ---------------------------------------------------------------------------

export interface NewCampaignAsset {
  run_id: string;
  creative_index: number;
  version: number;
  status: AssetStatus;
  prompt?: string | null;
  aspect_ratio?: string | null;
  model?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  overlay?: Record<string, unknown>;
  credits_charged?: number;
  error?: string | null;
}

export type AssetPatch = Partial<{
  status: AssetStatus;
  prompt: string | null;
  aspect_ratio: string | null;
  model: string | null;
  image_url: string | null;
  storage_path: string | null;
  overlay: Record<string, unknown>;
  credits_charged: number;
  error: string | null;
}>;

export async function listAssets(client: SupabaseClient, userId: string, runId: string): Promise<CampaignAsset[]> {
  const { data, error } = await client
    .from('campaign_assets')
    .select(ASSET_COLUMNS)
    .eq('run_id', runId)
    .eq('user_id', userId)
    .order('creative_index', { ascending: true })
    .order('version', { ascending: true });
  if (error) fail('list assets', error, 'Could not load campaign assets. Please try again.');
  return (data ?? []) as unknown as CampaignAsset[];
}

export async function insertAsset(client: SupabaseClient, userId: string, asset: NewCampaignAsset): Promise<CampaignAsset> {
  const { data, error } = await client
    .from('campaign_assets')
    .insert({ ...asset, user_id: userId })
    .select(ASSET_COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new AppError('Concurrent asset generation', 409, 'This creative is already being generated. Please wait a moment.');
    }
    fail('insert asset', error, 'Could not save this creative asset. Please try again.');
  }
  return data as unknown as CampaignAsset;
}

export async function updateAsset(
  client: SupabaseClient,
  userId: string,
  runId: string,
  creativeIndex: number,
  version: number,
  patch: AssetPatch,
): Promise<CampaignAsset | null> {
  const { data, error } = await client
    .from('campaign_assets')
    .update(patch)
    .eq('run_id', runId)
    .eq('user_id', userId)
    .eq('creative_index', creativeIndex)
    .eq('version', version)
    .select(ASSET_COLUMNS);
  if (error) fail('update asset', error, 'Could not update this creative asset. Please try again.');
  return ((data ?? [])[0] as unknown as CampaignAsset) ?? null;
}

export async function updateAssetsWhere(
  client: SupabaseClient,
  userId: string,
  runId: string,
  filter: { creativeIndex?: number; fromStatuses: AssetStatus[]; versionBelow?: number },
  patch: AssetPatch,
): Promise<CampaignAsset[]> {
  let q = client
    .from('campaign_assets')
    .update(patch)
    .eq('run_id', runId)
    .eq('user_id', userId)
    .in('status', filter.fromStatuses);
  if (filter.creativeIndex !== undefined) q = q.eq('creative_index', filter.creativeIndex);
  if (filter.versionBelow !== undefined) q = q.lt('version', filter.versionBelow);
  const { data, error } = await q.select(ASSET_COLUMNS);
  if (error) fail('update assets', error, 'Could not update assets. Please try again.');
  return (data ?? []) as unknown as CampaignAsset[];
}

export async function maxAssetVersion(client: SupabaseClient, userId: string, runId: string, creativeIndex: number): Promise<number> {
  const { data, error } = await client
    .from('campaign_assets')
    .select('version')
    .eq('run_id', runId)
    .eq('user_id', userId)
    .eq('creative_index', creativeIndex)
    .order('version', { ascending: false })
    .limit(1);
  if (error) fail('max asset version', error, 'Could not inspect asset version.');
  return data && data.length > 0 ? (data[0].version as number) : 0;
}

export async function spendCampaignCredits(
  client: SupabaseClient,
  userId: string,
  amount: number,
  referenceId: string,
  model?: string | null,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const { data, error } = await client.rpc('campaign_spend_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reference_type: 'campaign_asset',
    p_reference_id: referenceId,
    p_model: model ?? null,
    p_studio: 'campaign_studio',
    p_metadata: metadata ?? {},
  });
  if (error) {
    if (error.message?.includes('insufficient_credits')) {
      throw new AppError('Insufficient credits', 402, 'You do not have enough credits to generate these creatives. Please top up your credits.');
    }
    fail('spend credits', error, 'Could not charge credits for this generation.');
  }
  return Number(data);
}

export async function refundCampaignCredits(
  client: SupabaseClient,
  userId: string,
  referenceId: string,
): Promise<number> {
  const { data, error } = await client.rpc('campaign_refund_credits', {
    p_user_id: userId,
    p_reference_type: 'campaign_asset',
    p_reference_id: referenceId,
  });
  if (error) {
    console.error('[campaign-studio] refundCampaignCredits error:', error.message);
    return 0;
  }
  return Number(data);
}

