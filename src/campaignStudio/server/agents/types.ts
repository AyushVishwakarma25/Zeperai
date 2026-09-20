/**
 * CAMPAIGN STUDIO - shared contract for agents.
 * An agent is a pure-ish function: (run + approved upstream outputs + optional feedback) -> structured output.
 * It never touches the database or credits; the step engine does.
 */

import type { CampaignAgent, CampaignRun } from '../../types.js';
import type { GenAIClientLike, TokenUsage } from '../gemini.js';
import type { SafeFetcher } from '../safeFetch.js';

export interface AgentRunContext {
  run: CampaignRun;
  /** User's redo note (regenerate only). */
  feedback?: string | null;
  /** The version being redone, if any. Its input_snapshot lets agents skip repeated work (e.g. re-fetching a site). */
  previous?: { output: unknown; input_snapshot: Record<string, unknown> } | null;
  /** Approved outputs of earlier gates. */
  upstream: Partial<Record<CampaignAgent, unknown>>;
  /** Epoch ms by which the agent must be finished (hosting function limit). */
  deadlineAt: number;
  /** Test hooks; production leaves both undefined. */
  geminiClient?: GenAIClientLike;
  fetcher?: SafeFetcher;
}

export interface AgentRunResult {
  output: unknown;
  model: string;
  usage: TokenUsage;
  /** Stored on the step row so a redo can reuse it and so the run is reproducible/debuggable. */
  snapshot: Record<string, unknown>;
}

export interface AgentImpl {
  run(ctx: AgentRunContext): Promise<AgentRunResult>;
  /** Validates a user-edited output. Must throw a plain Error with a user-safe message when invalid. */
  parseEdited(raw: unknown, ctx: { run: CampaignRun; previousOutput: unknown }): unknown;
}
