/**
 * CAMPAIGN STUDIO - step engine.
 *
 * Implements the human-in-the-loop state machine on top of campaign_runs /
 * campaign_steps:
 *
 *   run         first generation of an agent's output        (none    -> awaiting_review)
 *   regenerate  redo with the user's written feedback        (vN      -> vN+1, vN superseded)
 *   edit        user edits the output by hand                (vN      -> vN+1, no AI call)
 *   approve     accepts a whole gate and moves to the next   (awaiting_review -> approved)
 *
 * Invariants
 *  - Only the CURRENT gate can run; later gates need every earlier gate approved.
 *  - Only approved outputs feed later agents.
 *  - A failed regeneration never loses the previous version (it is superseded
 *    only after the new one succeeded).
 *  - Redoing an already-approved step reopens its gate and supersedes everything downstream.
 *  - Concurrency: (run, agent, version) is unique, so double-clicks lose with 409;
 *    approvals are compare-and-set on status.
 *  - Every DB call is scoped by user_id (service role bypasses RLS).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../../utils/errorHandler.js';
import { REVIEW_GATES, type CampaignAgent, type CampaignRun, type CampaignStep } from '../types.js';
import { AGENT_IMPLS } from './agents/index.js';
import type { AgentImpl } from './agents/types.js';
import { MAX_REGENERATIONS_PER_STEP, STALE_RUNNING_MS, getStepDeadlineMs } from './config.js';
import { getRun, getStepFull, insertStep, listStepsLight, updateRun, updateStep, updateStepsWhere } from './db.js';
import { GeminiCallError, type GenAIClientLike } from './gemini.js';
import type { SafeFetcher } from './safeFetch.js';
import { SiteReadError } from './siteReader.js';
import { generateSingleCreative } from './agents/creatives.js';
import type { CampaignAsset, MasterPrompts } from '../types.js';

export interface EngineContext {
  client: SupabaseClient;
  userId: string;
  /** Test hooks only. */
  geminiClient?: GenAIClientLike;
  fetcher?: SafeFetcher;
  imageClient?: GenAIClientLike;
}

// ---------------------------------------------------------------------------
// Gate helpers (pure)
// ---------------------------------------------------------------------------

export const gateIndexOf = (agent: CampaignAgent): number => REVIEW_GATES.findIndex((g) => g.includes(agent));

const IN_FLIGHT = ['queued', 'running'] as const;
const isInFlight = (s: CampaignStep | null) => !!s && (IN_FLIGHT as readonly string[]).includes(s.status);

/** Highest version number used so far (failed attempts included), for numbering the next version. */
export const maxVersion = (steps: CampaignStep[], agent: CampaignAgent): number =>
  steps.reduce((m, s) => (s.agent === agent && s.version > m ? s.version : m), 0);

/** The version the user is looking at: newest awaiting_review/approved step. Failed/superseded attempts never count. */
export function currentOf(steps: CampaignStep[], agent: CampaignAgent): CampaignStep | null {
  let best: CampaignStep | null = null;
  for (const s of steps) {
    if (s.agent === agent && (s.status === 'awaiting_review' || s.status === 'approved') && (!best || s.version > best.version)) best = s;
  }
  return best;
}

const inFlightOf = (steps: CampaignStep[], agent: CampaignAgent): CampaignStep | null =>
  steps.find((s) => s.agent === agent && isInFlight(s)) ?? null;

/** Outputs of the latest APPROVED version of every agent in gates before `gateIdx`, or null if any is missing. */
export function collectUpstream(steps: CampaignStep[], gateIdx: number): Partial<Record<CampaignAgent, unknown>> | null {
  const out: Partial<Record<CampaignAgent, unknown>> = {};
  for (let g = 0; g < gateIdx; g++) {
    for (const agent of REVIEW_GATES[g]) {
      const current = currentOf(steps, agent);
      if (!current || current.status !== 'approved') return null;
      out[agent] = current.output;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Error mapping (never leaks internals)
// ---------------------------------------------------------------------------

export function mapAgentError(err: unknown): { status: number; message: string } {
  if (err instanceof SiteReadError) {
    return {
      status: 422,
      message: `We couldn't read that website (${err.message.replace(/\.$/, '')}). Check the address, or start a new campaign and describe your brand instead.`,
    };
  }
  if (err instanceof GeminiCallError) {
    switch (err.kind) {
      case 'blocked':
        return { status: 422, message: "The AI couldn't process this content because of its safety filters. Try rewording your brand details or feedback." };
      case 'timeout':
        return { status: 504, message: 'The AI took too long to respond. Please try again.' };
      case 'transient':
        return { status: 503, message: 'The AI service is busy right now. Please try again in a moment.' };
      case 'invalid_output':
        return { status: 502, message: 'The AI returned an unusable answer. Please try again.' };
      default:
        console.error('[campaign-studio] Gemini call failed:', err.kind, err.status, err.message.slice(0, 200));
        return { status: 500, message: 'Something went wrong while generating this step. Please try again.' };
    }
  }
  console.error('[campaign-studio] agent crashed:', (err as Error)?.message?.slice(0, 300));
  return { status: 500, message: 'Something went wrong while generating this step. Please try again.' };
}

// ---------------------------------------------------------------------------
// Shared loading / guards
// ---------------------------------------------------------------------------

async function loadRunAndSteps(ctx: EngineContext, runId: string) {
  const run = await getRun(ctx.client, ctx.userId, runId);
  if (!run) throw new AppError('Run not found', 404, 'Campaign not found.');
  if (run.status !== 'active') throw new AppError('Run not active', 409, 'This campaign is no longer active.');
  const steps = await listStepsLight(ctx.client, ctx.userId, runId);
  return { run, steps };
}

function requireImpl(agent: CampaignAgent): AgentImpl {
  const impl = AGENT_IMPLS[agent];
  if (!impl) throw new AppError('Agent not implemented', 501, 'This step is coming soon.');
  return impl;
}

/** Fails a step that has been "running" for too long (its request died) so the user is not stuck. */
async function reapIfStale(ctx: EngineContext, step: CampaignStep | null): Promise<CampaignStep | null> {
  if (!step || !isInFlight(step)) return step;
  const age = Date.now() - new Date(step.updated_at).getTime();
  if (age < STALE_RUNNING_MS) return step;
  const failed = await updateStep(
    ctx.client,
    ctx.userId,
    step.id,
    { status: 'failed', error: 'This step timed out. Please try again.' },
    ['queued', 'running'],
  );
  return failed ?? step;
}

// ---------------------------------------------------------------------------
// run / regenerate
// ---------------------------------------------------------------------------

export interface StepResult {
  run: CampaignRun;
  step: CampaignStep;
}

async function executeAgent(
  ctx: EngineContext,
  run: CampaignRun,
  steps: CampaignStep[],
  agent: CampaignAgent,
  mode: 'run' | 'regenerate',
  feedback: string | null,
): Promise<StepResult> {
  const impl = requireImpl(agent);
  const gateIdx = gateIndexOf(agent);
  const currentGateIdx = gateIndexOf(run.current_step);

  // Which gates may this agent run in?
  if (mode === 'run' && gateIdx !== currentGateIdx) {
    throw new AppError('Gate not current', 409, gateIdx < currentGateIdx ? 'This step is already approved. Use "Regenerate" to redo it.' : 'Finish and approve the earlier steps first.');
  }
  if (mode === 'regenerate' && gateIdx > currentGateIdx) {
    throw new AppError('Gate not reached', 409, 'Finish and approve the earlier steps first.');
  }

  const upstream = collectUpstream(steps, gateIdx);
  if (!upstream) throw new AppError('Upstream not approved', 409, 'Approve the earlier steps first.');

  const inFlight = await reapIfStale(ctx, inFlightOf(steps, agent));
  if (isInFlight(inFlight)) throw new AppError('Step in flight', 409, 'This step is already being generated. Please wait a moment.');

  const current = currentOf(steps, agent);
  let previousFull: CampaignStep | null = null;
  if (mode === 'run') {
    if (current) {
      throw new AppError('Already generated', 409, 'This step already has a result. Use "Regenerate" to redo it.');
    }
  } else {
    if (!current) {
      throw new AppError('Nothing to regenerate', 409, 'Generate this step first.');
    }
    const aiRedos = steps.filter((s) => s.agent === agent && s.model && s.user_feedback).length;
    if (aiRedos >= MAX_REGENERATIONS_PER_STEP) {
      throw new AppError('Redo cap', 429, `You've reached the limit of ${MAX_REGENERATIONS_PER_STEP} regenerations for this step. Edit the result by hand or start a new campaign.`);
    }
    previousFull = await getStepFull(ctx.client, ctx.userId, current.id);
  }

  const version = maxVersion(steps, agent) + 1;
  const wasApproved = mode === 'regenerate' && current?.status === 'approved';

  const started = await insertStep(ctx.client, ctx.userId, {
    run_id: run.id,
    agent,
    version,
    status: 'running',
    user_feedback: feedback,
  });

  let result;
  try {
    result = await impl.run({
      run,
      feedback,
      previous: previousFull ? { output: previousFull.output, input_snapshot: previousFull.input_snapshot ?? {} } : null,
      upstream,
      deadlineAt: Date.now() + getStepDeadlineMs(),
      geminiClient: ctx.geminiClient,
      fetcher: ctx.fetcher,
      client: ctx.client,
      userId: ctx.userId,
      imageClient: ctx.imageClient,
    });
  } catch (err) {
    const mapped = mapAgentError(err);
    await updateStep(ctx.client, ctx.userId, started.id, { status: 'failed', error: mapped.message }, ['running']);
    throw new AppError(`Agent ${agent} failed`, mapped.status, mapped.message);
  }

  const done = await updateStep(
    ctx.client,
    ctx.userId,
    started.id,
    {
      status: 'awaiting_review',
      output: result.output,
      model: result.model,
      usage: result.usage as unknown as Record<string, unknown>,
      input_snapshot: result.snapshot,
      error: null,
    },
    ['running'],
  );
  if (!done) throw new AppError('Step lost', 409, 'This step was changed while it was generating. Please refresh.');

  let updatedRun = run;
  if (mode === 'regenerate') {
    // Only now that the new version exists do we retire the old ones.
    await updateStepsWhere(ctx.client, ctx.userId, run.id, { agents: [agent], fromStatuses: ['awaiting_review', 'approved'], versionBelow: version }, { status: 'superseded', approved_at: null });

    if (wasApproved) {
      // Reopen the gate: siblings need re-approval, everything downstream is invalid, and we move back.
      const gate = REVIEW_GATES[gateIdx];
      const siblings = gate.filter((a) => a !== agent);
      await updateStepsWhere(ctx.client, ctx.userId, run.id, { agents: [...siblings], fromStatuses: ['approved'] }, { status: 'awaiting_review', approved_at: null });
      const downstream = REVIEW_GATES.slice(gateIdx + 1).flat();
      await updateStepsWhere(ctx.client, ctx.userId, run.id, { agents: [...downstream], fromStatuses: ['awaiting_review', 'approved', 'failed'] }, { status: 'superseded', approved_at: null });
      updatedRun = (await updateRun(ctx.client, ctx.userId, run.id, { current_step: gate[0] })) ?? run;
    }
  }
  return { run: updatedRun, step: done };
}

export async function runAgentStep(ctx: EngineContext, runId: string, agent: CampaignAgent): Promise<StepResult> {
  requireImpl(agent);
  const { run, steps } = await loadRunAndSteps(ctx, runId);
  return executeAgent(ctx, run, steps, agent, 'run', null);
}

export async function regenerateAgentStep(ctx: EngineContext, runId: string, agent: CampaignAgent, feedback: string): Promise<StepResult> {
  requireImpl(agent);
  const { run, steps } = await loadRunAndSteps(ctx, runId);
  return executeAgent(ctx, run, steps, agent, 'regenerate', feedback);
}

export async function regenerateSingleCreativeStep(
  ctx: EngineContext,
  runId: string,
  creativeIndex: number,
  feedback?: string | null,
): Promise<CampaignAsset> {
  const { run, steps } = await loadRunAndSteps(ctx, runId);
  const gateIdx = gateIndexOf('creatives');
  const upstream = collectUpstream(steps, gateIdx);
  if (!upstream) {
    throw new AppError('Upstream not approved', 409, 'Approve the earlier steps first.');
  }

  const masterPrompts = upstream.master_prompts as MasterPrompts | undefined;
  if (!masterPrompts || !Array.isArray(masterPrompts.prompts)) {
    throw new AppError('Master prompts missing', 400, 'Approved master prompts are required.');
  }

  if (creativeIndex < 1 || creativeIndex > masterPrompts.prompts.length) {
    throw new AppError('Invalid creative index', 400, `Creative index must be between 1 and ${masterPrompts.prompts.length}.`);
  }

  const prompt = masterPrompts.prompts[creativeIndex - 1];
  return generateSingleCreative({
    runId: run.id,
    userId: ctx.userId,
    creativeIndex,
    prompt,
    quality: run.settings?.quality || 'Standard',
    client: ctx.client,
    imageClient: ctx.imageClient || ctx.geminiClient,
    feedback,
  });
}

// ---------------------------------------------------------------------------
// edit (no AI call)
// ---------------------------------------------------------------------------

const MAX_EDIT_BYTES = 100_000;

export async function editAgentOutput(ctx: EngineContext, runId: string, agent: CampaignAgent, rawOutput: unknown): Promise<StepResult> {
  const impl = requireImpl(agent);
  if (!impl.parseEdited) throw new AppError('Edit unsupported', 400, "This step can't be edited by hand. Use Regenerate to tell us what to change.");
  const { run, steps } = await loadRunAndSteps(ctx, runId);

  const latest = currentOf(steps, agent);
  if (!latest || latest.status !== 'awaiting_review') {
    throw new AppError('Not editable', 409, 'You can edit a result while it is waiting for your review.');
  }
  if (inFlightOf(steps, agent)) throw new AppError('Step in flight', 409, 'This step is being regenerated. Please wait a moment.');
  if (JSON.stringify(rawOutput ?? null).length > MAX_EDIT_BYTES) {
    throw new AppError('Edit too large', 400, 'That edit is too large.');
  }

  const previousFull = await getStepFull(ctx.client, ctx.userId, latest.id);
  let normalized: unknown;
  try {
    normalized = impl.parseEdited!(rawOutput, { run, previousOutput: previousFull?.output });
  } catch (err) {
    throw new AppError('Invalid edit', 400, `That edit isn't valid: ${(err as Error).message}`);
  }

  const version = maxVersion(steps, agent) + 1;
  const created = await insertStep(ctx.client, ctx.userId, {
    run_id: run.id,
    agent,
    version,
    status: 'awaiting_review',
    output: normalized,
    model: null,
    usage: { editedByUser: true },
    // keep the site snapshot so a later AI redo still avoids re-fetching
    input_snapshot: previousFull?.input_snapshot ?? {},
  });
  await updateStepsWhere(ctx.client, ctx.userId, run.id, { agents: [agent], fromStatuses: ['awaiting_review'], versionBelow: version }, { status: 'superseded' });
  return { run, step: created };
}

// ---------------------------------------------------------------------------
// approve
// ---------------------------------------------------------------------------

export interface ApproveResult {
  run: CampaignRun;
  steps: CampaignStep[];
}

export async function approveGate(ctx: EngineContext, runId: string, agent: CampaignAgent): Promise<ApproveResult> {
  requireImpl(agent);
  const { run, steps } = await loadRunAndSteps(ctx, runId);

  const gateIdx = gateIndexOf(agent);
  const gate = REVIEW_GATES[gateIdx];
  const latests = gate.map((a) => currentOf(steps, a));

  // Idempotent: a double-click on Approve is a success, not an error.
  if (latests.every((s) => s && s.status === 'approved')) {
    return { run, steps: latests as CampaignStep[] };
  }
  if (gateIdx !== gateIndexOf(run.current_step)) {
    throw new AppError('Not current gate', 409, 'Approve the earlier steps first.');
  }
  if (latests.some((s) => !s || s.status !== 'awaiting_review')) {
    throw new AppError('Gate not ready', 409, 'Wait until every step in this stage has finished generating.');
  }

  if (gate.some((a) => inFlightOf(steps, a))) {
    throw new AppError('Gate busy', 409, 'A step in this stage is being regenerated. Please wait a moment.');
  }
  const approvedAt = new Date().toISOString();
  const approved: CampaignStep[] = [];
  for (const s of latests as CampaignStep[]) {
    const u = await updateStep(ctx.client, ctx.userId, s.id, { status: 'approved', approved_at: approvedAt }, ['awaiting_review']);
    if (!u) {
      // Someone else changed it (redo/approve race): undo what we did and report.
      for (const done of approved) await updateStep(ctx.client, ctx.userId, done.id, { status: 'awaiting_review', approved_at: null }, ['approved']);
      throw new AppError('Approve race', 409, 'This step changed while you were approving. Please review it again.');
    }
    approved.push(u);
  }

  const isLast = gateIdx === REVIEW_GATES.length - 1;
  const patch: Parameters<typeof updateRun>[3] = isLast ? { status: 'completed' } : { current_step: REVIEW_GATES[gateIdx + 1][0] };
  if (gate.includes('brand_analysis')) {
    const brand = approved.find((s) => s.agent === 'brand_analysis');
    // The approved Brand Context is the single source of truth for every later agent.
    patch.brand_context = brand?.output ?? {};
  }
  const updatedRun = await updateRun(ctx.client, ctx.userId, run.id, patch, 'active');
  return { run: updatedRun ?? run, steps: approved };
}

// ---------------------------------------------------------------------------
// cancel
// ---------------------------------------------------------------------------

export async function cancelRun(ctx: EngineContext, runId: string): Promise<CampaignRun> {
  const run = await getRun(ctx.client, ctx.userId, runId);
  if (!run) throw new AppError('Run not found', 404, 'Campaign not found.');
  if (run.status === 'cancelled') return run;
  const updated = await updateRun(ctx.client, ctx.userId, runId, { status: 'cancelled' });
  return updated ?? run;
}
