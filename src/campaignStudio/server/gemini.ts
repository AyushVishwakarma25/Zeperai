/**
 * CAMPAIGN STUDIO - Gemini wrapper for the text agents.
 *
 * One function, `generateStructured`, that every agent uses:
 *   - asks Gemini for JSON, validates it with the caller's `parse` function
 *   - retries transient failures (429 / 5xx / network) with exponential backoff
 *   - does ONE "repair" pass if the JSON is invalid, feeding the error back
 *   - enforces a per-attempt timeout and an overall time budget
 *   - reports safety blocks, token usage and grounding sources
 *
 * The client is injectable so the logic is unit-testable without network.
 * NOTE: this wrapper does not touch credits. Credit spending is done by the
 * routes via spend_credits()/refund_credits() (see the migration).
 */

import { ThinkingLevel } from '@google/genai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenAIClientLike {
  models: { generateContent(args: any): Promise<any> };
}

export type GeminiFailureKind =
  | 'transient' // retries exhausted on 429/5xx/network errors
  | 'timeout'
  | 'blocked' // safety / policy block
  | 'invalid_output' // JSON could not be parsed/validated even after repair
  | 'bad_request' // 400/401/403/404: our request or configuration is wrong
  | 'unknown';

export class GeminiCallError extends Error {
  public readonly kind: GeminiFailureKind;
  public readonly attempts: number;
  public readonly status?: number;

  constructor(kind: GeminiFailureKind, message: string, attempts: number, status?: number) {
    super(message);
    this.name = 'GeminiCallError';
    this.kind = kind;
    this.attempts = attempts;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalTokens: number;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}

export interface StructuredCallOptions<T> {
  model: string;
  systemInstruction: string;
  /** The user prompt. */
  prompt: string;
  /** Extra multimodal parts (e.g. { inlineData: { mimeType, data } } brand images). */
  extraParts?: unknown[];
  /** Gemini response schema (OpenAPI subset). Ignored while search/URL tools are on (see below). */
  schema?: Record<string, unknown>;
  /** Validates and narrows the parsed JSON. MUST throw on invalid input. */
  parse: (raw: unknown) => T;
  temperature?: number;
  thinkingLevel?: 'low' | 'medium' | 'high';
  tools?: { googleSearch?: boolean; urlContext?: boolean };
  /** Per-attempt timeout. Default 45s. */
  timeoutMs?: number;
  /** Overall budget across retries + repair. Default 1.6 x timeoutMs. */
  budgetMs?: number;
  /** Max attempts for transient errors. Default 3. */
  maxAttempts?: number;
  /** Base backoff. Default 800ms (doubles each retry, with jitter). */
  backoffMs?: number;
  client?: GenAIClientLike;
  /** Test hook. */
  sleep?: (ms: number) => Promise<void>;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  usage: TokenUsage;
  /** Total model calls made (retries and repair included). */
  attempts: number;
  sources: GroundingSource[];
}

// ---------------------------------------------------------------------------
// Small helpers (exported for tests)
// ---------------------------------------------------------------------------

/** Parses JSON that may be wrapped in markdown fences or surrounded by prose. */
export function extractJson(text: string): unknown {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Empty model response.');

  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    /* fall through to substring extraction */
  }

  const firstObj = unfenced.indexOf('{');
  const firstArr = unfenced.indexOf('[');
  const starts = [firstObj, firstArr].filter((i) => i >= 0);
  if (starts.length === 0) throw new Error('No JSON found in model response.');
  const start = Math.min(...starts);
  const closer = unfenced[start] === '{' ? '}' : ']';
  const end = unfenced.lastIndexOf(closer);
  if (end <= start) throw new Error('Unterminated JSON in model response.');
  return JSON.parse(unfenced.slice(start, end + 1));
}

function statusOf(err: any): number | undefined {
  const candidates = [err?.status, err?.code, err?.error?.code, err?.response?.status];
  for (const c of candidates) {
    const n = typeof c === 'string' ? parseInt(c, 10) : c;
    if (typeof n === 'number' && Number.isFinite(n) && n >= 100 && n <= 599) return n;
  }
  return undefined;
}

export function isTransientError(err: any): boolean {
  const status = statusOf(err);
  if (status === 408 || status === 429 || (status !== undefined && status >= 500)) return true;
  const msg = String(err?.message || err || '').toLowerCase();
  return [
    'unavailable',
    'resource_exhausted',
    'overloaded',
    'fetch failed',
    'econnreset',
    'etimedout',
    'eai_again',
    'socket hang up',
    'internal error',
    'deadline_exceeded',
  ].some((needle) => msg.includes(needle));
}

function readUsage(resp: any): TokenUsage {
  const u = resp?.usageMetadata || {};
  return {
    promptTokens: Number(u.promptTokenCount) || 0,
    outputTokens: Number(u.candidatesTokenCount) || 0,
    thinkingTokens: Number(u.thoughtsTokenCount) || 0,
    totalTokens: Number(u.totalTokenCount) || 0,
  };
}

function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    thinkingTokens: a.thinkingTokens + b.thinkingTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

function readSources(resp: any): GroundingSource[] {
  const chunks = resp?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const out: GroundingSource[] = [];
  for (const c of chunks) {
    const uri = c?.web?.uri;
    if (typeof uri === 'string' && !seen.has(uri)) {
      seen.add(uri);
      out.push({ uri, title: typeof c?.web?.title === 'string' ? c.web.title : undefined });
    }
    if (out.length >= 20) break;
  }
  return out;
}

const BLOCK_FINISH_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY']);

function readText(resp: any): string {
  try {
    if (typeof resp?.text === 'string') return resp.text;
  } catch {
    /* getter can throw on non-text parts */
  }
  const parts = resp?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .filter((p: any) => typeof p?.text === 'string' && !p?.thought)
      .map((p: any) => p.text)
      .join('');
  }
  return '';
}

const THINKING_MAP: Record<'low' | 'medium' | 'high', ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateStructured<T>(opts: StructuredCallOptions<T>): Promise<StructuredResult<T>> {
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const budgetMs = opts.budgetMs ?? Math.round(timeoutMs * 1.6);
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  const backoffMs = opts.backoffMs ?? 800;
  const sleep = opts.sleep ?? defaultSleep;
  const startedAt = Date.now();
  const remaining = () => budgetMs - (Date.now() - startedAt);
  // Don't start a call (or a retry / repair) that has no realistic time left to finish.
  const minRemaining = Math.min(3_000, Math.floor(timeoutMs / 2));

  const client: GenAIClientLike =
    opts.client ?? ((await import('../../../config/ai.js')).getAI() as unknown as GenAIClientLike);

  const usesTools = !!(opts.tools?.googleSearch || opts.tools?.urlContext);

  // Gemini can reject `responseSchema` combined with built-in tools, so with tools on we
  // ask for JSON in the instructions and validate on our side instead.
  const jsonInstruction =
    '\n\nRespond with ONLY a single valid JSON object. No markdown fences, no commentary before or after.';

  const buildConfig = (withTools: boolean): Record<string, unknown> => {
    const config: Record<string, unknown> = {
      systemInstruction: withTools ? opts.systemInstruction + jsonInstruction : opts.systemInstruction,
    };
    if (opts.temperature !== undefined) config.temperature = opts.temperature;
    if (opts.thinkingLevel) config.thinkingConfig = { thinkingLevel: THINKING_MAP[opts.thinkingLevel] };
    if (withTools) {
      const tools: Record<string, unknown>[] = [];
      if (opts.tools?.googleSearch) tools.push({ googleSearch: {} });
      if (opts.tools?.urlContext) tools.push({ urlContext: {} });
      config.tools = tools;
    } else {
      config.responseMimeType = 'application/json';
      if (opts.schema) config.responseSchema = opts.schema;
    }
    return config;
  };

  let usage: TokenUsage = { promptTokens: 0, outputTokens: 0, thinkingTokens: 0, totalTokens: 0 };
  let calls = 0;

  /** One model call with a hard timeout. Throws GeminiCallError on any failure. */
  const callOnce = async (contents: unknown, config: Record<string, unknown>, attemptTimeoutMs: number) => {
    calls += 1;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new GeminiCallError('timeout', 'The AI took too long to respond.', calls));
      }, attemptTimeoutMs);
    });
    try {
      const resp = await Promise.race([
        client.models.generateContent({
          model: opts.model,
          contents,
          config: { ...config, abortSignal: controller.signal },
        }),
        timeout,
      ]);
      usage = addUsage(usage, readUsage(resp));

      const blockReason = resp?.promptFeedback?.blockReason;
      const finishReason = resp?.candidates?.[0]?.finishReason;
      if (blockReason || (finishReason && BLOCK_FINISH_REASONS.has(String(finishReason)))) {
        throw new GeminiCallError('blocked', 'The request was blocked by Google safety filters.', calls);
      }
      return resp;
    } catch (err: any) {
      if (err instanceof GeminiCallError) throw err;
      const status = statusOf(err);
      if (isTransientError(err)) {
        throw new GeminiCallError('transient', String(err?.message || 'Temporary AI service error.'), calls, status);
      }
      if (status !== undefined && status >= 400 && status < 500) {
        throw new GeminiCallError('bad_request', String(err?.message || 'The AI request was rejected.'), calls, status);
      }
      throw new GeminiCallError('unknown', String(err?.message || 'Unexpected AI error.'), calls, status);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const userParts: unknown[] = [{ text: opts.prompt }, ...(opts.extraParts ?? [])];
  const userContents = [{ role: 'user', parts: userParts }];

  // ---- Phase 1: the real call, retrying transient failures ----
  let resp: any;
  for (let attempt = 1; ; attempt++) {
    const left = remaining();
    if (left < minRemaining) {
      throw new GeminiCallError('timeout', 'The AI took too long to respond.', calls);
    }
    try {
      resp = await callOnce(userContents, buildConfig(usesTools), Math.min(timeoutMs, left));
      break;
    } catch (err) {
      if (!(err instanceof GeminiCallError) || err.kind !== 'transient' || attempt >= maxAttempts) throw err;
      const wait = backoffMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      if (wait >= remaining() - minRemaining) throw err; // no time left to retry
      console.warn(`[campaign-studio] transient Gemini error (attempt ${attempt}/${maxAttempts}), retrying in ${wait}ms: ${err.message.slice(0, 120)}`);
      await sleep(wait);
    }
  }

  const sources = readSources(resp);
  const firstText = readText(resp);

  // ---- Phase 2: parse + validate, with ONE repair pass ----
  let firstError: string;
  try {
    return { data: opts.parse(extractJson(firstText)), model: opts.model, usage, attempts: calls, sources };
  } catch (err: any) {
    firstError = String(err?.message || err).slice(0, 600);
  }

  const left = remaining();
  if (left < Math.min(5_000, timeoutMs)) {
    throw new GeminiCallError('invalid_output', 'The AI returned an unusable response. Please try again.', calls);
  }

  const repairPrompt =
    `Your previous reply could not be used.\nProblem: ${firstError}\n\n` +
    `Previous reply:\n${firstText.slice(0, 12_000)}\n\n` +
    'Return the corrected result as ONLY a single valid JSON object matching the required schema.';

  const repairResp = await callOnce(
    [{ role: 'user', parts: [{ text: repairPrompt }] }],
    // Repair never uses tools, so the JSON mime type + schema are always allowed here.
    buildConfig(false),
    Math.min(timeoutMs, left),
  );

  try {
    return {
      data: opts.parse(extractJson(readText(repairResp))),
      model: opts.model,
      usage,
      attempts: calls,
      sources,
    };
  } catch {
    throw new GeminiCallError('invalid_output', 'The AI returned an unusable response. Please try again.', calls);
  }
}
