/**
 * CAMPAIGN STUDIO - typed API client (framework-free, unit-testable).
 *
 * `createCampaignApi` takes a token getter and a fetch implementation so it can be
 * tested without Supabase or a browser. The app uses the wired instance from
 * `defaultApi.ts`.
 */

import type {
  CampaignAgent,
  CampaignAsset,
  CampaignGoal,
  CampaignInputType,
  CampaignRun,
  CampaignSettings,
  CampaignStep,
} from '../types.js';

export class CampaignApiError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'CampaignApiError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface CampaignMeta {
  goals: CampaignGoal[];
  aspectRatios: string[];
  maxCreatives: number;
  defaults: CampaignSettings;
}

export interface CreateRunPayload {
  inputType: CampaignInputType;
  websiteUrl?: string;
  brandDetails?: string;
  goal: CampaignGoal;
  goalNotes?: string;
  title?: string;
  settings?: Partial<CampaignSettings>;
}

export type RunSummary = Pick<
  CampaignRun,
  'id' | 'title' | 'input_type' | 'website_url' | 'goal' | 'status' | 'current_step' | 'credits_spent' | 'created_at' | 'updated_at'
>;

export interface RunDetail {
  run: CampaignRun;
  steps: CampaignStep[];
  assets: CampaignAsset[];
}

export interface StepResult {
  run: CampaignRun;
  step: CampaignStep;
}

export interface ApproveResult {
  run: CampaignRun;
  steps: CampaignStep[];
}

export interface CampaignApiDeps {
  getToken: () => Promise<string | null | undefined>;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function createCampaignApi(deps: CampaignApiDeps) {
  const doFetch = deps.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const base = deps.baseUrl ?? '/api/campaign-studio';

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await deps.getToken();
    let res: Response;
    try {
      res = await doFetch(`${base}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new CampaignApiError(0, 'Could not reach the server. Check your connection and try again.');
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON body (e.g. platform timeout page) */
    }

    if (!res.ok || (json && json.success === false)) {
      const message =
        (json && (json.error || json.message)) ||
        (res.status === 504 || res.status === 502 ? 'The request took too long. Please try again.' : GENERIC_ERROR);
      throw new CampaignApiError(res.status, String(message));
    }
    return json as T;
  }

  const enc = encodeURIComponent;

  return {
    getMeta: () => request<{ success: true } & CampaignMeta>('GET', '/meta'),
    listRuns: async () => (await request<{ runs: RunSummary[] }>('GET', '/runs')).runs,
    createRun: async (payload: CreateRunPayload) => (await request<{ run: CampaignRun }>('POST', '/runs', payload)).run,
    getRun: (runId: string) => request<RunDetail>('GET', `/runs/${enc(runId)}`),
    runStep: (runId: string, agent: CampaignAgent) => request<StepResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/run`),
    regenerateStep: (runId: string, agent: CampaignAgent, feedback: string) =>
      request<StepResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/regenerate`, { feedback }),
    editStep: (runId: string, agent: CampaignAgent, output: unknown) =>
      request<StepResult>('PUT', `/runs/${enc(runId)}/steps/${enc(agent)}/output`, { output }),
    approveStep: (runId: string, agent: CampaignAgent) => request<ApproveResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/approve`),
    cancelRun: async (runId: string) => (await request<{ run: CampaignRun }>('POST', `/runs/${enc(runId)}/cancel`)).run,
  };
}

export type CampaignApi = ReturnType<typeof createCampaignApi>;
