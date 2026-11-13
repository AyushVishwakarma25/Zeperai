/**
 * Structured, user-safe error classifier for Campaign Studio V2 image generation & processing.
 *
 * Rules:
 * - NEVER expose credentials, secrets, file paths, or internal JSON stack traces to users.
 * - Always provide structured error codes and plain-English actionable messages.
 * - Distinguish authentication, model availability, quota/rate limits, timeouts, safety, and post-processing failures.
 */

import type { CreativeErrorCode, StructuredCreativeError } from '../../types.js';

export function classifyCreativeError(err: unknown): StructuredCreativeError {
  let rawMsg = '';
  if (typeof err === 'string') {
    rawMsg = err;
  } else if (err instanceof Error) {
    rawMsg = err.message || '';
  } else if (err && typeof err === 'object') {
    const e = err as any;
    rawMsg = e.message || e.error?.message || e.error || JSON.stringify(err);
  }

  const lower = rawMsg.toLowerCase();

  // 1. Authentication & Service Account configuration failures
  if (
    lower.includes('could not load the default credentials') ||
    lower.includes('default credentials') ||
    lower.includes('service account json provided is not valid') ||
    lower.includes('service account') ||
    lower.includes('invalid_grant') ||
    lower.includes('unauthenticated') ||
    lower.includes('permission denied') ||
    lower.includes('iam permission') ||
    lower.includes('missing credentials') ||
    lower.includes('auth initialization timed out') ||
    lower.includes('401 unauthorized') ||
    lower.includes('403 forbidden')
  ) {
    return {
      code: 'AUTH_CONFIG',
      category: 'authentication',
      userMessage: 'AI service authentication is misconfigured or credentials are invalid. Please check Google Cloud settings.',
      retryable: false,
      suggestedAction: 'Contact workspace administrator to verify Vertex AI Service Account credentials.',
    };
  }

  // 2. Model availability failures (404 / Publisher model not found / not permitted in region)
  if (
    lower.includes('publisher model') ||
    lower.includes('not found') ||
    lower.includes('404') ||
    lower.includes('does not have access to it') ||
    lower.includes('model not available') ||
    lower.includes('unsupported model')
  ) {
    return {
      code: 'MODEL_UNAVAILABLE',
      category: 'model_availability',
      userMessage: 'The requested AI visual model is unavailable or not permitted in this region. Standard fallback is active.',
      retryable: true,
      suggestedAction: 'Click "Retry this creative" to regenerate using the standard production model.',
    };
  }

  // 3. Quota & Rate Limit / Billing Exhaustion (429, 402, overloaded)
  if (
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('overloaded') ||
    lower.includes('server overloaded') ||
    lower.includes('prepayment credits are depleted') ||
    lower.includes('402')
  ) {
    return {
      code: 'RATE_LIMIT',
      category: 'quota_or_rate_limit',
      userMessage: 'Overloaded server or AI throughput limit reached. The server will reset capacity momentarily.',
      retryable: true,
      suggestedAction: 'Wait 30-60 seconds, then click "Retry this creative".',
    };
  }

  // 4. Timeouts & Deadlines
  if (
    lower.includes('timeout') ||
    lower.includes('deadline exceeded') ||
    lower.includes('timed out') ||
    lower.includes('network timeout') ||
    lower.includes('504 gateway')
  ) {
    return {
      code: 'TIMEOUT',
      category: 'timeout',
      userMessage: 'Visual generation exceeded the processing timeout window.',
      retryable: true,
      suggestedAction: 'Click "Retry this creative" to request a fresh generation pass.',
    };
  }

  // 5. Content Policy & Safety Filters
  if (
    lower.includes('safety') ||
    lower.includes('safety filters') ||
    lower.includes('harm') ||
    lower.includes('blocked by safety') ||
    lower.includes('policy violation')
  ) {
    return {
      code: 'SAFETY_FILTER',
      category: 'content_policy',
      userMessage: 'Visual direction was blocked by safety filters. Adjust concept prompt keywords or brand notes.',
      retryable: true,
      suggestedAction: 'Adjust the concept prompt keywords or brand notes to avoid sensitive terms.',
    };
  }

  // 6. Insufficient user credits
  if (lower.includes('insufficient credits') || lower.includes('insufficient_credits') || lower.includes('top up')) {
    return {
      code: 'INSUFFICIENT_CREDITS',
      category: 'quota_or_rate_limit',
      userMessage: 'Your account does not have enough credits to generate this creative.',
      retryable: false,
      suggestedAction: 'Top up your ZeperAI credits from the billing dashboard.',
    };
  }

  // 7. Post-processing & Layer Compositing errors
  if (
    lower.includes('compositor') ||
    lower.includes('svg') ||
    lower.includes('canvas') ||
    lower.includes('layer document') ||
    lower.includes('rendering composite')
  ) {
    return {
      code: 'POST_PROCESSING_ERROR',
      category: 'processing',
      userMessage: 'Visual background rendered successfully, but overlay compositing encountered a formatting issue.',
      retryable: true,
      suggestedAction: 'Click "Retry this creative" or adjust the overlay copy.',
    };
  }

  // 8. General Network Connection failures
  if (lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('fetch failed') || lower.includes('network error')) {
    return {
      code: 'NETWORK_ERROR',
      category: 'timeout',
      userMessage: 'Temporary network interruption communicating with the AI service.',
      retryable: true,
      suggestedAction: 'Check your internet connection and click "Retry this creative".',
    };
  }

  // 9. Unknown fallback - NEVER dump raw JSON or stack trace
  return {
    code: 'UNKNOWN_ERROR',
    category: 'processing',
    userMessage: 'The creative could not be generated due to a temporary service issue. No credits were deducted.',
    retryable: true,
    suggestedAction: 'Click "Retry this creative" to regenerate.',
  };
}
