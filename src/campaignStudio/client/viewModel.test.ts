import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import type { CampaignAgent, CampaignRun, CampaignStep, StepStatus } from '../types.js';
import { AGENT_IMPLS } from '../server/agents/index.js';
import { EDITABLE_AGENTS, IMPLEMENTED_AGENTS, PLATFORM_INFO, agentView, deriveGates, goalLabel, hasInFlight, hostnameOf, isHttpUrl, platformLabel, progressLabel, timeAgo } from './viewModel.js';
import { AskUserGapsNotice, GroundingNotice, SearchGapsNotice } from '../../../components/campaign/viewParts.js';
import { validateNewCampaign } from '../../../components/campaign/NewCampaignForm.js';

let n = 0;
const step = (agent: CampaignAgent, version: number, status: StepStatus, extra: Partial<CampaignStep> = {}): CampaignStep => ({
  id: `s${++n}`, run_id: 'r', user_id: 'u', agent, version, status, input_snapshot: {}, output: status === 'failed' ? null : { v: version },
  user_feedback: null, model: null, usage: {}, error: null, created_at: '', updated_at: '', approved_at: null, ...extra,
});
const run = (over: Partial<CampaignRun> = {}) => ({ current_step: 'brand_analysis', status: 'active', ...over }) as Pick<CampaignRun, 'current_step' | 'status'>;
const statuses = (g: ReturnType<typeof deriveGates>) => g.map((x) => x.status);

test('fresh run: first gate ready, the rest locked, all stages implemented', () => {
  const g = deriveGates(run(), []);
  assert.deepEqual(statuses(g), ['ready', 'locked', 'locked', 'locked', 'locked', 'locked']);
  assert.deepEqual(g.map((x) => x.implemented), [true, true, true, true, true, true]);
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

test('after approving the brand gate the run moves on: gate 0 approved, research gate ready', () => {
  const g = deriveGates(run({ current_step: 'market_research' }), [step('brand_analysis', 1, 'approved', { model: 'm' })]);
  assert.deepEqual(statuses(g).slice(0, 3), ['approved', 'ready', 'locked']);
  assert.equal(g[1].implemented, true);
  assert.equal(g[1].isCurrent, true);
});

test('CONTRACT: the UI treats exactly the agents the server can run as implemented', () => {
  assert.deepEqual([...IMPLEMENTED_AGENTS].sort(), Object.keys(AGENT_IMPLS).sort());
  // and hand-editing is offered exactly where the server has an editor
  const editable = Object.entries(AGENT_IMPLS).filter(([, impl]) => typeof impl!.parseEdited === 'function').map(([a]) => a);
  assert.deepEqual([...EDITABLE_AGENTS].sort(), editable.sort());
});

test('research gate: partial progress is "ready", both done is "review", one running is "running"', () => {
  const r = run({ current_step: 'market_research' });
  const done = (agent: CampaignAgent) => step(agent, 1, 'awaiting_review', { model: 'm' });
  assert.equal(deriveGates(r, [done('market_research')])[1].status, 'ready');
  assert.equal(deriveGates(r, [done('market_research'), done('competitor_research')])[1].status, 'review');
  assert.equal(deriveGates(r, [done('market_research'), step('competitor_research', 1, 'running')])[1].status, 'running');
  assert.equal(deriveGates(r, [done('market_research'), step('competitor_research', 1, 'failed', { error: 'x' })])[1].status, 'failed');
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

test('SearchGapsNotice: returns null when empty, tone=warning with copy when populated', () => {
  assert.equal(SearchGapsNotice({ gaps: [] }), null);

  const el = SearchGapsNotice({ gaps: ['Market sizing in India'] }) as React.ReactElement<any>;
  assert.ok(el);
  assert.equal(el.props.tone, 'warning');
  const str = JSON.stringify(el);
  assert.match(str, /Worth double-checking/);
  assert.match(str, /Market sizing in India/);
  assert.match(str, /Regenerate to search again/);
});

test('AskUserGapsNotice: returns null when empty, tone=info with button and copy when populated', () => {
  assert.equal(AskUserGapsNotice({ gaps: [] }), null);

  let opened = false;
  const el = AskUserGapsNotice({
    gaps: ['Blended CAC on Meta is unknown'],
    onOpenKnownFacts: () => { opened = true; },
  }) as React.ReactElement<any>;

  assert.ok(el);
  assert.equal(el.props.tone, 'info');
  const str = JSON.stringify(el);
  assert.match(str, /Only you know this/);
  assert.match(str, /Blended CAC on Meta is unknown/);
  assert.match(str, /These are business details no search can find/);
  assert.match(str, /Add to context/);
});

test('GroundingNotice: returns null when grounded, non-alarming notice when ungrounded', () => {
  assert.equal(GroundingNotice({ grounded: true }), null);

  const ungrounded = GroundingNotice({ grounded: false }) as React.ReactElement<any>;
  assert.ok(ungrounded);
  assert.equal(ungrounded.props.tone, 'warning');
  const str = JSON.stringify(ungrounded);
  assert.match(str, /This answer used general knowledge rather than a live search this time — regenerate if you want it to search again/);
  assert.doesNotMatch(str, /treat any figures with caution/);
});

test('platformLabel: resolves known platform labels and falls back to key for unknown', () => {
  assert.equal(platformLabel('meta_ads'), 'Meta Ads');
  assert.equal(platformLabel('instagram_organic'), 'Instagram Organic');
  assert.equal(platformLabel('blinkit'), 'Blinkit');
  assert.equal(platformLabel('zepto'), 'Zepto');
  assert.equal(platformLabel('swiggy_instamart'), 'Instamart');
  assert.equal(platformLabel('custom_platform'), 'custom_platform');
  assert.ok(PLATFORM_INFO.meta_ads.label && PLATFORM_INFO.meta_ads.hint);
});

test('validateNewCampaign: validates inputs including platform selection', () => {
  const baseValid = {
    inputType: 'website' as const,
    url: 'example.com',
    details: '',
    goal: 'sales' as const,
    goalNotes: '',
    platforms: ['meta_ads' as const],
  };

  // Valid input
  assert.equal(validateNewCampaign(baseValid), null);

  // Missing website url
  assert.equal(validateNewCampaign({ ...baseValid, url: '  ' }), 'Enter your website address.');

  // Details too short when details inputType
  assert.equal(
    validateNewCampaign({ ...baseValid, inputType: 'details', details: 'Too short' }),
    'Describe your brand in a couple of sentences (at least 20 characters).',
  );

  // Missing goal
  assert.equal(validateNewCampaign({ ...baseValid, goal: '' }), 'Choose what this campaign should achieve.');

  // Custom goal without notes
  assert.equal(validateNewCampaign({ ...baseValid, goal: 'custom', goalNotes: ' ' }), 'Tell us about your goal.');

  // Empty platforms rejected
  assert.equal(
    validateNewCampaign({ ...baseValid, platforms: [] }),
    'Choose at least one platform for your creatives.',
  );

  // Multiple valid platforms accepted
  assert.equal(
    validateNewCampaign({ ...baseValid, platforms: ['meta_ads', 'blinkit', 'zepto'] }),
    null,
  );
});
