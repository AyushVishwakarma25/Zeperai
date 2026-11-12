/**
 * CAMPAIGN STUDIO - typed API client (framework-free, unit-testable).
 *
 * `createCampaignApi` takes a token getter and a fetch implementation so it can be
 * tested without Supabase or a browser. The app uses the wired instance from
 * `defaultApi.ts`.
 */

import type {
  AdvertisingFormatDefinition,
  CampaignAgent,
  CampaignAsset,
  CampaignGoal,
  CampaignInputType,
  CampaignPlatform,
  CampaignProductImage,
  CampaignReference,
  CampaignRun,
  CampaignSettings,
  CampaignStep,
  CreativeDocument,
  CreativeEvaluation,
  CreativeLayer,
  MetaCampaignPackage,
  ReferenceMode,
  ReferenceRole,
  StandardAspectRatio,
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
  platforms: CampaignPlatform[];
  aspectRatios: string[];
  maxCreatives: number;
  defaults: CampaignSettings;
}

export interface CreateRunPayload {
  inputType: CampaignInputType;
  websiteUrl?: string;
  brandDetails?: string;
  knownFacts?: string;
  goal: CampaignGoal;
  goalNotes?: string;
  title?: string;
  settings?: Partial<CampaignSettings>;
}

export type RunSummary = Pick<
  CampaignRun,
  'id' | 'title' | 'input_type' | 'website_url' | 'goal' | 'status' | 'current_step' | 'settings' | 'credits_spent' | 'created_at' | 'updated_at'
>;

export interface RunDetail {
  run: CampaignRun;
  steps: CampaignStep[];
  assets: CampaignAsset[];
  productImages?: CampaignProductImage[];
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
    updateKnownFacts: (runId: string, knownFacts: string | null) =>
      request<{ success: true; run: CampaignRun }>('POST', `/runs/${enc(runId)}/known-facts`, { knownFacts }),
    getProductImages: async (runId: string) =>
      (await request<{ success: true; images: CampaignProductImage[] }>('GET', `/runs/${enc(runId)}/product-images`)).images,
    addProductImage: async (runId: string, payload: { storagePath: string; imageUrl?: string; label?: string }) =>
      (await request<{ success: true; image: CampaignProductImage }>('POST', `/runs/${enc(runId)}/product-images`, payload)).image,
    deleteProductImage: async (runId: string, imageId: string) =>
      request<{ success: true }>('DELETE', `/runs/${enc(runId)}/product-images/${enc(imageId)}`).then(() => undefined),
    getFormats: async () => (await request<{ success: true; formats: AdvertisingFormatDefinition[] }>('GET', '/formats')).formats,
    addReference: async (payload: {
      runId?: string;
      conceptId?: string;
      imageUrl: string;
      storagePath?: string;
      referenceMode?: ReferenceMode;
      referenceRole?: ReferenceRole;
      metadata?: Record<string, unknown>;
    }) => (await request<{ success: true; reference: CampaignReference }>('POST', '/references', payload)).reference,
    listReferences: async (runId?: string) =>
      (await request<{ success: true; references: CampaignReference[] }>('GET', `/references${runId ? `?runId=${enc(runId)}` : ''}`)).references,
    getReference: (refId: string) => request<{ success: true; reference: CampaignReference }>('GET', `/references/${enc(refId)}`),
    deleteReference: (refId: string) => request<{ success: true }>('DELETE', `/references/${enc(refId)}`),
    analyzeReference: (refId: string) => request<{ success: true; reference: CampaignReference }>('POST', `/references/${enc(refId)}/analyze`),
    runStep: (runId: string, agent: CampaignAgent) => request<StepResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/run`),
    regenerateStep: (runId: string, agent: CampaignAgent, feedback: string) =>
      request<StepResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/regenerate`, { feedback }),
    regenerateCreative: (runId: string, creativeIndex: number, feedback?: string) =>
      request<{ success: true; asset: CampaignAsset }>('POST', `/runs/${enc(runId)}/creatives/${creativeIndex}/regenerate`, { feedback }),
    getCreativeDocument: (runId: string, creativeIndex: number) =>
      request<{ success: true; document: CreativeDocument; renderedCompositeUrl?: string }>(
        'GET',
        `/runs/${enc(runId)}/creatives/${creativeIndex}/document`,
      ),
    updateCreativeDocument: (
      runId: string,
      creativeIndex: number,
      payload: { document?: CreativeDocument; layerId?: string; patch?: Partial<CreativeLayer> },
    ) =>
      request<{ success: true; document: CreativeDocument; compositeUrl: string }>(
        'PUT',
        `/runs/${enc(runId)}/creatives/${creativeIndex}/document`,
        payload,
      ),
    evaluateCreative: (runId: string, creativeIndex: number) =>
      request<{ success: true; evaluation: CreativeEvaluation }>(
        'POST',
        `/runs/${enc(runId)}/creatives/${creativeIndex}/evaluate`,
      ),
    getCreativeEvaluation: (runId: string, creativeIndex: number) =>
      request<{ success: true; evaluation: CreativeEvaluation }>(
        'GET',
        `/runs/${enc(runId)}/creatives/${creativeIndex}/evaluation`,
      ),
    targetedRegenerateCreative: (
      runId: string,
      creativeIndex: number,
      payload: {
        component: 'headline' | 'background' | 'product' | 'badge' | 'cta' | 'subheadline';
        instructions?: string;
        newAssetUrl?: string;
        patchStyles?: Record<string, unknown>;
        newContent?: string;
      },
    ) =>
      request<{
        success: true;
        document: CreativeDocument;
        compositeUrl: string;
        evaluation: CreativeEvaluation;
        actionTaken: string;
      }>('POST', `/runs/${enc(runId)}/creatives/${creativeIndex}/targeted-regenerate`, payload),
    revertCreative: (runId: string, creativeIndex: number, targetVersion: number) =>
      request<{
        success: true;
        document: CreativeDocument;
        compositeUrl: string;
        evaluation: CreativeEvaluation;
        actionTaken: string;
      }>('POST', `/runs/${enc(runId)}/creatives/${creativeIndex}/revert`, { targetVersion }),
    adaptCreative: (runId: string, creativeIndex: number, targetRatio: StandardAspectRatio) =>
      request<{
        success: true;
        document: CreativeDocument;
        compositeUrl: string;
        aspectRatio: StandardAspectRatio;
      }>('POST', `/runs/${enc(runId)}/creatives/${creativeIndex}/adapt`, { targetRatio }),
    getMetaPackage: (runId: string) =>
      request<{ success: true; package: MetaCampaignPackage }>('POST', `/runs/${enc(runId)}/meta-package`),
    getExportZipUrl: (runId: string) => `/api/campaign/runs/${enc(runId)}/export-zip`,
    editStep: (runId: string, agent: CampaignAgent, output: unknown) =>
      request<StepResult>('PUT', `/runs/${enc(runId)}/steps/${enc(agent)}/output`, { output }),
    approveStep: (runId: string, agent: CampaignAgent) => request<ApproveResult>('POST', `/runs/${enc(runId)}/steps/${enc(agent)}/approve`),
    cancelRun: async (runId: string) => (await request<{ run: CampaignRun }>('POST', `/runs/${enc(runId)}/cancel`)).run,
  };
}

export type CampaignApi = ReturnType<typeof createCampaignApi>;
