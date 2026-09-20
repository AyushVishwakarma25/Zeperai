/**
 * CAMPAIGN STUDIO - pure view-model helpers (no React, no I/O). Everything the UI
 * needs to decide "what state is each stage in and what can the user do" lives here
 * so it can be unit-tested.
 */

import {
  AGENT_LABELS,
  MAX_REGENERATIONS_PER_STEP,
  REVIEW_GATES,
  type CampaignAgent,
  type CampaignGoal,
  type CampaignRun,
  type CampaignStep,
} from '../types.js';

/** Agents the server can run today. Keep in sync with server/agents/index.ts. */
export const IMPLEMENTED_AGENTS: readonly CampaignAgent[] = ['brand_analysis'];

export const GATE_LABELS = ['Brand', 'Research', 'Strategy', 'Creative direction', 'Prompts', 'Creatives'] as const;

export const GATE_BLURBS = [
  'We read your website and build a brand profile every later step relies on.',
  'Market and competitor research to find your opening.',
  'A campaign strategy built around your goal.',
  'Creative concepts and storytelling angles.',
  'Master prompts for the image generator.',
  'Your finished static creatives.',
] as const;

export type GateStatus = 'approved' | 'review' | 'running' | 'failed' | 'ready' | 'locked';

export interface AgentView {
  agent: CampaignAgent;
  label: string;
  /** Every version, oldest first (includes superseded and failed attempts). */
  versions: CampaignStep[];
  /** The live version: newest awaiting_review / approved. */
  current: CampaignStep | null;
  /** A version that is generating right now. */
  inFlight: CampaignStep | null;
  /** A failed attempt newer than `current` (the user should be told, `current` stays usable). */
  failedAfterCurrent: CampaignStep | null;
  aiRedosUsed: number;
  redosLeft: number;
}

export interface GateView {
  index: number;
  label: string;
  blurb: string;
  agents: AgentView[];
  status: GateStatus;
  /** False when the server has no agent for this stage yet. */
  implemented: boolean;
  isCurrent: boolean;
}

const IN_FLIGHT = new Set(['queued', 'running']);

export function agentView(agent: CampaignAgent, steps: CampaignStep[]): AgentView {
  const versions = steps.filter((s) => s.agent === agent).sort((a, b) => a.version - b.version);
  let current: CampaignStep | null = null;
  for (const s of versions) {
    if ((s.status === 'awaiting_review' || s.status === 'approved') && (!current || s.version > current.version)) current = s;
  }
  const inFlight = [...versions].reverse().find((s) => IN_FLIGHT.has(s.status)) ?? null;
  const failedAfterCurrent = [...versions].reverse().find((s) => s.status === 'failed' && s.version > (current?.version ?? 0)) ?? null;
  const aiRedosUsed = versions.filter((s) => s.model && s.user_feedback).length;
  return {
    agent,
    label: AGENT_LABELS[agent],
    versions,
    current,
    inFlight,
    failedAfterCurrent,
    aiRedosUsed,
    redosLeft: Math.max(0, MAX_REGENERATIONS_PER_STEP - aiRedosUsed),
  };
}

export function currentGateIndex(run: Pick<CampaignRun, 'current_step'>): number {
  const i = REVIEW_GATES.findIndex((g) => g.includes(run.current_step));
  return i < 0 ? 0 : i;
}

export function deriveGates(run: Pick<CampaignRun, 'current_step' | 'status'>, steps: CampaignStep[]): GateView[] {
  const cur = currentGateIndex(run);
  return REVIEW_GATES.map((agents, index): GateView => {
    const views = agents.map((a) => agentView(a, steps));
    const allApproved = views.every((v) => v.current?.status === 'approved');
    const implemented = agents.every((a) => IMPLEMENTED_AGENTS.includes(a));

    let status: GateStatus;
    if (run.status === 'completed' || (index < cur && allApproved)) status = 'approved';
    else if (index > cur) status = 'locked';
    else if (views.some((v) => v.inFlight)) status = 'running';
    else if (views.every((v) => v.current?.status === 'awaiting_review')) status = 'review';
    else if (views.some((v) => !v.current && v.failedAfterCurrent)) status = 'failed';
    else status = 'ready';

    return { index, label: GATE_LABELS[index], blurb: GATE_BLURBS[index], agents: views, status, implemented, isCurrent: index === cur };
  });
}

export const hasInFlight = (steps: CampaignStep[]): boolean => steps.some((s) => IN_FLIGHT.has(s.status));

export function progressLabel(run: Pick<CampaignRun, 'current_step' | 'status'>): string {
  if (run.status === 'completed') return 'Completed';
  if (run.status === 'cancelled') return 'Cancelled';
  const i = currentGateIndex(run);
  return `Step ${i + 1} of ${REVIEW_GATES.length} · ${GATE_LABELS[i]}`;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const GOAL_INFO: Record<CampaignGoal, { label: string; hint: string }> = {
  sales: { label: 'Drive sales', hint: 'Conversions, offers and purchase intent' },
  awareness: { label: 'Build awareness', hint: 'Reach new people and get remembered' },
  engagement: { label: 'Boost engagement', hint: 'Saves, shares, comments and follows' },
  leads: { label: 'Generate leads', hint: 'Enquiries, sign-ups and bookings' },
  launch: { label: 'Launch a product', hint: 'Make a new product or collection land' },
  retention: { label: 'Retain customers', hint: 'Bring buyers back and grow repeat orders' },
  custom: { label: 'Something else', hint: 'Describe your own goal' },
};

export const goalLabel = (goal: string): string => (goal in GOAL_INFO ? GOAL_INFO[goal as CampaignGoal].label : goal);

// ---------------------------------------------------------------------------
// Redo suggestions shown as one-tap chips
// ---------------------------------------------------------------------------

export const FEEDBACK_SUGGESTIONS: Partial<Record<CampaignAgent, string[]>> = {
  brand_analysis: [
    'Make the tone more premium',
    'Focus on a younger audience',
    'Emphasise our unique selling points more',
    'Our main product is different from what you picked',
  ],
};

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** Only ever render http(s) URLs as links or images. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function hostnameOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
