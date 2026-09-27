/**
 * CAMPAIGN STUDIO - request validation (pure functions, no I/O).
 *
 * NOTE ON URLs: this file only validates the *shape* of a website URL
 * (scheme, host, port, no credentials, no IP literals). It CANNOT stop DNS
 * rebinding or a public hostname that resolves to a private IP. Any code that
 * actually fetches the URL (chunk 3) must additionally resolve DNS, check the
 * resolved IPs against private/reserved ranges, disable redirects and cap size.
 */

import {
  CAMPAIGN_AGENTS,
  DEFAULT_CAMPAIGN_SETTINGS,
  MAX_CREATIVES_PER_RUN,
  MAX_PRODUCT_IMAGES_PER_RUN,
  type CampaignAgent,
  type CampaignGoal,
  type CampaignInputType,
  type CampaignPlatform,
  type CampaignSettings,
} from '../types.js';

export const CAMPAIGN_GOALS: readonly CampaignGoal[] = [
  'sales',
  'awareness',
  'engagement',
  'leads',
  'launch',
  'retention',
  'custom',
];

export const ALLOWED_PLATFORMS: readonly CampaignPlatform[] = [
  'meta_ads',
  'instagram_organic',
  'google_display',
  'amazon',
  'flipkart',
  'blinkit',
  'zepto',
  'swiggy_instamart',
  'whatsapp',
  'other',
] as const;

export const MAX_PLATFORMS_PER_RUN = 4;

/** Same aspect ratios the hardened Gemini proxy accepts. */
export const ALLOWED_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);

export const MAX_KNOWN_FACTS_CHARS = 4000;

export interface CreateRunInput {
  title: string;
  inputType: CampaignInputType;
  websiteUrl: string | null;
  brandDetails: string | null;
  knownFacts?: string;
  goal: CampaignGoal;
  goalNotes: string | null;
  settings: CampaignSettings;
}

/**
 * The optional `undefined` members let callers read `.error` / `.value` without relying on
 * discriminated-union narrowing, which this repo's non-strict tsconfig does not perform.
 */
export type ValidationResult<T> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: string; value?: undefined };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trims, removes control characters (keeps \n and \t) and enforces a max length. */
function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!cleaned) return null;
  return cleaned.length > maxLen ? null : cleaned;
}

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.arpa', '.home', '.corp', '.intranet'];
const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

/** Returns a normalised, safe-looking http(s) URL string, or an error message. */
export function normalizeWebsiteUrl(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') return { ok: false, error: 'Please enter your website URL.' };
  let raw = input.trim();
  if (!raw) return { ok: false, error: 'Please enter your website URL.' };
  if (raw.length > 2048) return { ok: false, error: 'That website URL is too long.' };

  // Only add a scheme when none is present at all; never rewrite other schemes.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: 'That does not look like a valid website URL.' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https website URLs are supported.' };
  }
  if (url.username || url.password) {
    return { ok: false, error: 'Website URLs with embedded credentials are not allowed.' };
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    return { ok: false, error: 'Website URLs with custom ports are not supported.' };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  // WHATWG URL normalises numeric hosts (2130706433, 0x7f.1) to dotted IPv4, so this catches those too.
  const isIpv4Literal = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIpv6Literal = host.startsWith('[') || host.includes(':');
  if (isIpv4Literal || isIpv6Literal) {
    return { ok: false, error: 'Please use your website domain name instead of an IP address.' };
  }
  if (host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, error: 'That website address is not reachable from the public internet.' };
  }
  if (!HOSTNAME_RE.test(host)) {
    return { ok: false, error: 'That does not look like a valid website domain.' };
  }

  url.hash = '';
  url.hostname = host;
  return { ok: true, value: url.toString() };
}

function deriveTitle(inputType: CampaignInputType, websiteUrl: string | null, details: string | null): string {
  if (inputType === 'website' && websiteUrl) {
    try {
      return new URL(websiteUrl).hostname.replace(/^www\./, '');
    } catch {
      /* fall through */
    }
  }
  const text = (details || 'New campaign').replace(/\s+/g, ' ');
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function normalizeSettings(raw: unknown): ValidationResult<CampaignSettings> {
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  let creativeCount = DEFAULT_CAMPAIGN_SETTINGS.creativeCount;
  if (s.creativeCount !== undefined) {
    const n = Number(s.creativeCount);
    if (!Number.isInteger(n) || n < 1 || n > MAX_CREATIVES_PER_RUN) {
      return { ok: false, error: `Number of creatives must be between 1 and ${MAX_CREATIVES_PER_RUN}.` };
    }
    creativeCount = n;
  }

  let quality: CampaignSettings['quality'] = DEFAULT_CAMPAIGN_SETTINGS.quality;
  if (s.quality !== undefined) {
    const q = String(s.quality).toLowerCase();
    if (q === 'standard') quality = 'Standard';
    else if (q === 'pro') quality = 'Pro';
    else return { ok: false, error: 'Quality must be Standard or Pro.' };
  }

  let aspectRatio = DEFAULT_CAMPAIGN_SETTINGS.aspectRatio;
  if (s.aspectRatio !== undefined) {
    if (typeof s.aspectRatio !== 'string' || !(ALLOWED_ASPECT_RATIOS as readonly string[]).includes(s.aspectRatio)) {
      return { ok: false, error: `Aspect ratio must be one of: ${ALLOWED_ASPECT_RATIOS.join(', ')}.` };
    }
    aspectRatio = s.aspectRatio;
  }

  let platforms: CampaignPlatform[] = DEFAULT_CAMPAIGN_SETTINGS.platforms ?? ['meta_ads'];
  if (s.platforms !== undefined) {
    if (!Array.isArray(s.platforms) || s.platforms.length === 0) {
      return { ok: false, error: 'Platforms must be a non-empty list of selected platforms.' };
    }
    if (s.platforms.length > MAX_PLATFORMS_PER_RUN) {
      return { ok: false, error: `You can select at most ${MAX_PLATFORMS_PER_RUN} platforms.` };
    }
    const deduped: CampaignPlatform[] = [];
    for (const p of s.platforms) {
      if (typeof p !== 'string' || !(ALLOWED_PLATFORMS as readonly string[]).includes(p as any)) {
        return { ok: false, error: `Invalid platform "${p}". Allowed platforms: ${ALLOWED_PLATFORMS.join(', ')}.` };
      }
      if (!deduped.includes(p as CampaignPlatform)) {
        deduped.push(p as CampaignPlatform);
      }
    }
    if (deduped.length === 0) {
      return { ok: false, error: 'Platforms must be a non-empty list of selected platforms.' };
    }
    platforms = deduped;
  }

  return { ok: true, value: { creativeCount, quality, aspectRatio, platforms } };
}

// ---------------------------------------------------------------------------
// Create run
// ---------------------------------------------------------------------------

export function validateCreateRunInput(body: unknown): ValidationResult<CreateRunInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  const b = body as Record<string, unknown>;

  const inputType = b.inputType;
  if (inputType !== 'website' && inputType !== 'details') {
    return { ok: false, error: 'Choose whether to start from a website or from brand details.' };
  }

  // Goal
  const goal = b.goal;
  if (typeof goal !== 'string' || !(CAMPAIGN_GOALS as readonly string[]).includes(goal)) {
    return { ok: false, error: `Goal must be one of: ${CAMPAIGN_GOALS.join(', ')}.` };
  }
  const goalNotesRaw = b.goalNotes;
  if (goalNotesRaw !== undefined && goalNotesRaw !== null && goalNotesRaw !== '' && cleanText(goalNotesRaw, 2000) === null) {
    return { ok: false, error: 'Goal notes must be text of at most 2000 characters.' };
  }
  const goalNotes = cleanText(goalNotesRaw, 2000);
  if (goal === 'custom' && (!goalNotes || goalNotes.length < 5)) {
    return { ok: false, error: 'Please describe your custom goal.' };
  }

  // Brand details
  const detailsRaw = b.brandDetails;
  if (detailsRaw !== undefined && detailsRaw !== null && detailsRaw !== '' && cleanText(detailsRaw, 8000) === null) {
    return { ok: false, error: 'Brand details must be text of at most 8000 characters.' };
  }
  const brandDetails = cleanText(detailsRaw, 8000);

  // Known facts & business metrics (optional, trusted user input)
  const knownFactsRaw = b.knownFacts;
  let knownFacts: string | undefined;
  if (knownFactsRaw !== undefined && knownFactsRaw !== null) {
    if (typeof knownFactsRaw !== 'string') {
      return { ok: false, error: 'Known facts must be text.' };
    }
    if (knownFactsRaw.trim() !== '') {
      const cleaned = cleanText(knownFactsRaw, MAX_KNOWN_FACTS_CHARS);
      if (cleaned === null) {
        return { ok: false, error: `Known facts must be text of at most ${MAX_KNOWN_FACTS_CHARS} characters.` };
      }
      knownFacts = cleaned;
    }
  }

  // Website
  let websiteUrl: string | null = null;
  if (inputType === 'website') {
    const url = normalizeWebsiteUrl(b.websiteUrl);
    if (!url.ok) return { ok: false, error: url.error as string };
    websiteUrl = url.value as string;
  } else if (!brandDetails || brandDetails.length < 20) {
    return { ok: false, error: 'Please describe your brand in at least a couple of sentences (20+ characters).' };
  }

  // Title
  let title: string;
  if (b.title !== undefined && b.title !== null && b.title !== '') {
    const t = cleanText(b.title, 120);
    if (!t) return { ok: false, error: 'Title must be text of at most 120 characters.' };
    title = t;
  } else {
    title = deriveTitle(inputType, websiteUrl, brandDetails);
  }

  const settings = normalizeSettings(b.settings);
  if (!settings.ok) return { ok: false, error: settings.error as string };

  return {
    ok: true,
    value: {
      title,
      inputType,
      websiteUrl,
      brandDetails,
      knownFacts,
      goal: goal as CampaignGoal,
      goalNotes,
      settings: settings.value as CampaignSettings,
    },
  };
}

/** Validates the body of POST /runs/:runId/known-facts ({ knownFacts: string | null }). */
export function validateKnownFacts(body: unknown): ValidationResult<string | null> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  const raw = (body as Record<string, unknown>).knownFacts;
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }
  if (typeof raw !== 'string') return { ok: false, error: 'Known facts must be text.' };
  if (!raw.trim()) {
    return { ok: true, value: null };
  }
  const cleaned = cleanText(raw, MAX_KNOWN_FACTS_CHARS);
  if (cleaned === null) {
    return { ok: false, error: `Known facts must be text of at most ${MAX_KNOWN_FACTS_CHARS} characters.` };
  }
  return { ok: true, value: cleaned };
}

// ---------------------------------------------------------------------------
// Step routes
// ---------------------------------------------------------------------------

export function parseAgentParam(value: unknown): CampaignAgent | null {
  return typeof value === 'string' && (CAMPAIGN_AGENTS as readonly string[]).includes(value) ? (value as CampaignAgent) : null;
}

export const MIN_FEEDBACK_CHARS = 5;
export const MAX_FEEDBACK_CHARS = 2000;

/** The user's redo note ("try a more premium angle"). */
export function validateFeedback(body: unknown): ValidationResult<string> {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>).feedback : undefined;
  if (typeof raw !== 'string') return { ok: false, error: 'Tell us what you would like changed.' };
  const text = cleanText(raw, MAX_FEEDBACK_CHARS);
  if (text === null) {
    return { ok: false, error: raw.trim() ? `Feedback must be at most ${MAX_FEEDBACK_CHARS} characters.` : 'Tell us what you would like changed.' };
  }
  if (text.length < MIN_FEEDBACK_CHARS) return { ok: false, error: 'Please add a little more detail about what to change.' };
  return { ok: true, value: text };
}

// ---------------------------------------------------------------------------
// Product images validation
// ---------------------------------------------------------------------------

export const MAX_IMAGE_LABEL_CHARS = 100;
const STORAGE_PATH_RE = /^[a-zA-Z0-9_\-\.\/]+$/;
const IMAGE_EXT_RE = /\.(png|jpe?g|webp)$/i;

export interface AddProductImageInput {
  storagePath: string;
  imageUrl: string;
  label: string | null;
}

export function validateAddProductImageInput(body: unknown): ValidationResult<AddProductImageInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  const b = body as Record<string, unknown>;

  const rawPath = typeof b.storagePath === 'string' ? b.storagePath.trim() : '';
  const rawUrl = typeof b.imageUrl === 'string' ? b.imageUrl.trim() : '';

  if (!rawPath && !rawUrl) {
    return { ok: false, error: 'storagePath or imageUrl is required.' };
  }

  let storagePath = rawPath;
  if (storagePath) {
    if (storagePath.length > 500) {
      return { ok: false, error: 'storagePath is too long.' };
    }
    if (storagePath.includes('..') || !STORAGE_PATH_RE.test(storagePath)) {
      return { ok: false, error: 'storagePath contains invalid characters.' };
    }
    if (!IMAGE_EXT_RE.test(storagePath)) {
      return { ok: false, error: 'Only PNG, JPEG, and WebP images are supported.' };
    }
  }

  let imageUrl = rawUrl;
  if (imageUrl) {
    if (imageUrl.length > 2048) {
      return { ok: false, error: 'imageUrl is too long.' };
    }
    try {
      const u = new URL(imageUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, error: 'imageUrl must be http or https.' };
      }
      if (!IMAGE_EXT_RE.test(u.pathname)) {
        return { ok: false, error: 'Only PNG, JPEG, and WebP images are supported.' };
      }
    } catch {
      return { ok: false, error: 'imageUrl is not a valid URL.' };
    }
  } else if (storagePath) {
    imageUrl = storagePath;
  }

  if (!storagePath && imageUrl) {
    storagePath = imageUrl;
  }

  let label: string | null = null;
  if (b.label !== undefined && b.label !== null && b.label !== '') {
    if (typeof b.label !== 'string') {
      return { ok: false, error: 'label must be text.' };
    }
    const cleaned = cleanText(b.label, MAX_IMAGE_LABEL_CHARS);
    if (cleaned === null) {
      return { ok: false, error: `label must be at most ${MAX_IMAGE_LABEL_CHARS} characters.` };
    }
    label = cleaned;
  }

  return {
    ok: true,
    value: {
      storagePath,
      imageUrl,
      label,
    },
  };
}

