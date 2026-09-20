import test from 'node:test';
import assert from 'node:assert/strict';
import type { CampaignAgent, CampaignRun, CampaignStep, StepStatus } from '../types.js';
import { agentView, deriveGates, goalLabel, hasInFlight, hostnameOf, isHttpUrl, progressLabel, timeAgo } from './viewModel.js';

let n = 0;
const step = (agent: CampaignAgent, version: number, status: StepStatus, extra: Partial<CampaignStep> = {}): CampaignStep => ({
  id: `s${++n}`, run_id: 'r', user_id: 'u', agent, version, status, input_snapshot: {}, output: status === 'failed' ? null : { v: version },
  user_feedback: null, model: null, usage: {}, error: null, created_at: '', updated_at: '', approved_at: null, ...extra,
});
const run = (over: Partial<CampaignRun> = {}) => ({ current_step: 'brand_analysis', status: 'active', ...over }) as Pick<CampaignRun, 'current_step' | 'status'>;
const statuses = (g: ReturnType<typeof deriveGates>) => g.map((x) => x.status);

test('fresh run: first gate ready, the rest locked, only the brand gate implemented', () => {
  const g = deriveGates(run(), []);
  assert.deepEqual(statuses(g), ['ready', 'locked', 'locked', 'locked', 'locked', 'locked']);
  assert.deepEqual(g.map((x) => x.implemented), [true, false, false, false, false, false]);
  assert.equal(g[1].agents.length, 2, 'research gate holds both research agents');
  assert.equal(g[0].isCurrent, true);
});

test('gate status follows the steps: running, review, failed', () => {
  assert.equal(deriveGates(run(), [step('brand_analysis', 1, 'running')])[0].status, 'running');
  assert.equal(deriveGates(run(), [step('brand_analysis', 1, 'awaiting_review', { model: 'm' })])[0].status, 'review');
  assert.equal(deriveGates(run(), [step('brand_analysis', 1, 'failed', { error: 'boom' })])[0].status, 'failed');
});

test('a failed regeneration does not hide the last good version', () => {
  const v = agentView('brand_analysis', [
    step('brand_analysis', 1, 'superseded', { model: 'm' }),
    step('brand_analysis', 2, 'awaiting_review', { model: 'm', user_feedback: 'redo' }),
    step('brand_analysis', 3, 'failed', { error: 'busy' }),
  ]);
  assert.equal(v.current?.version, 2);
  assert.equal(v.failedAfterCurrent?.version, 3);
  assert.equal(v.inFlight, null);
  // a failure OLDER than the live version is not reported
  const older = agentView('brand_analysis', [step('brand_analysis', 1, 'failed'), step('brand_analysis', 2, 'awaiting_review', { model: 'm' })]);
  assert.equal(older.failedAfterCurrent, null);
});

test('redo accounting counts only successful AI regenerations (not failures or hand edits)', () => {
  const v = agentView('brand_analysis', [
    step('brand_analysis', 1, 'superseded', { model: 'm' }),
    step('brand_analysis', 2, 'superseded', { model: 'm', user_feedback: 'a' }),
    step('brand_analysis', 3, 'failed', { user_feedback: 'b' }), // failed: no model
    step('brand_analysis', 4, 'superseded', { model: null }), // manual edit
    step('brand_analysis', 5, 'awaiting_review', { model: 'm', user_feedback: 'c' }),
  ]);
  assert.equal(v.aiRedosUsed, 2);
  assert.equal(v.redosLeft, 3);
});

test('after approving the brand gate the run moves on: gate 0 approved, gate 1 ready but not implemented', () => {
  const g = deriveGates(run({ current_step: 'market_research' }), [step('brand_analysis', 1, 'approved', { model: 'm' })]);
  assert.deepEqual(statuses(g).slice(0, 3), ['approved', 'ready', 'locked']);
  assert.equal(g[1].implemented, false);
  assert.equal(g[1].isCurrent, true);
});

test('redo of an approved step rewinds: current gate goes back to review, later gates lock', () => {
  const g = deriveGates(run({ current_step: 'brand_analysis' }), [
    step('brand_analysis', 1, 'superseded', { model: 'm' }),
    step('brand_analysis', 2, 'awaiting_review', { model: 'm', user_feedback: 'x' }),
  ]);
  assert.deepEqual(statuses(g), ['review', 'locked', 'locked', 'locked', 'locked', 'locked']);
});

test('completed run shows every gate approved', () => {
  assert.ok(deriveGates(run({ status: 'completed', current_step: 'creatives' }), []).every((x) => x.status === 'approved'));
});

test('hasInFlight, progressLabel, goalLabel', () => {
  assert.equal(hasInFlight([step('brand_analysis', 1, 'running')]), true);
  assert.equal(hasInFlight([step('brand_analysis', 1, 'approved')]), false);
  assert.equal(progressLabel(run()), 'Step 1 of 6 · Brand');
  assert.equal(progressLabel(run({ current_step: 'strategy' })), 'Step 3 of 6 · Strategy');
  assert.equal(progressLabel(run({ status: 'completed' })), 'Completed');
  assert.equal(goalLabel('sales'), 'Drive sales');
  assert.equal(goalLabel('unknown-goal'), 'unknown-goal');
});

test('timeAgo / isHttpUrl / hostnameOf', () => {
  const now = Date.parse('2026-09-20T12:00:00Z');
  assert.equal(timeAgo('2026-09-20T11:59:40Z', now), 'just now');
  assert.equal(timeAgo('2026-09-20T11:30:00Z', now), '30 min ago');
  assert.equal(timeAgo('2026-09-20T09:00:00Z', now), '3 hr ago');
  assert.equal(timeAgo('2026-09-19T09:00:00Z', now), 'yesterday');
  assert.equal(timeAgo('2026-09-10T12:00:00Z', now), '10 days ago');
  assert.equal(timeAgo('garbage', now), '');
  assert.ok(isHttpUrl('https://a.com/x'));
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'not a url', '', undefined, 5]) assert.equal(isHttpUrl(bad as any), false);
  assert.equal(hostnameOf('https://www.prustlr.com/x'), 'prustlr.com');
  assert.equal(hostnameOf(null), '');
});
