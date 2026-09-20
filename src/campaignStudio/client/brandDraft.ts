/**
 * CAMPAIGN STUDIO - editable draft of a BrandContext.
 *
 * The editor works on plain strings (one item per line) and converts back to the
 * server shape on save. Limits mirror server/agents/brandAnalysis.ts so the user is
 * told about a problem instead of having text silently truncated.
 */

import type { BrandContext } from '../types.js';

export const LIMITS = {
  brandName: 120,
  category: 120,
  summary: 1200,
  positioning: 600,
  usps: { items: 8, len: 200 },
  products: { items: 10, name: 120, description: 400, priceHint: 60 },
  audience: { primary: 300, secondary: 300 },
  painPoints: { items: 6, len: 200 },
  desires: { items: 6, len: 200 },
  tone: { items: 8, len: 60 },
  doSay: { items: 8, len: 120 },
  dontSay: { items: 8, len: 120 },
  colors: { items: 6, name: 40 },
  typography: 200,
  styleKeywords: { items: 8, len: 60 },
  markets: { items: 5, len: 60 },
  gaps: { items: 8, len: 200 },
} as const;

export interface DraftProduct {
  name: string;
  description: string;
  priceHint: string;
  /** Preserved from the original; the server does not accept new image URLs from edits. */
  imageUrls: string[];
}

export interface BrandDraft {
  brandName: string;
  category: string;
  summary: string;
  positioning: string;
  usps: string;
  products: DraftProduct[];
  audiencePrimary: string;
  audienceSecondary: string;
  painPoints: string;
  desires: string;
  tone: string;
  doSay: string;
  dontSay: string;
  colors: { name: string; hex: string }[];
  typography: string;
  styleKeywords: string;
  markets: string;
  gaps: string;
  // Preserved as-is
  website?: string;
  logoUrl?: string;
  sources: string[];
}

/** Splits a textarea into trimmed, non-empty, de-duplicated items. */
export function splitList(text: string, opts: { commas?: boolean } = {}): string[] {
  const parts = (text || '').split(opts.commas ? /[\r\n,;]+/ : /\r?\n+/);
  const out: string[] = [];
  for (const p of parts) {
    const v = p.replace(/\s+/g, ' ').trim();
    if (v && !out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
}

const join = (items: string[] | undefined) => (items ?? []).join('\n');

export function brandContextToDraft(bc: BrandContext): BrandDraft {
  return {
    brandName: bc.brandName ?? '',
    category: bc.category ?? '',
    summary: bc.summary ?? '',
    positioning: bc.positioning ?? '',
    usps: join(bc.usps),
    products: (bc.products ?? []).map((p) => ({
      name: p.name ?? '',
      description: p.description ?? '',
      priceHint: p.priceHint ?? '',
      imageUrls: p.imageUrls ?? [],
    })),
    audiencePrimary: bc.audience?.primary ?? '',
    audienceSecondary: bc.audience?.secondary ?? '',
    painPoints: join(bc.audience?.painPoints),
    desires: join(bc.audience?.desires),
    tone: (bc.voice?.tone ?? []).join(', '),
    doSay: join(bc.voice?.doSay),
    dontSay: join(bc.voice?.dontSay),
    colors: (bc.visualIdentity?.colors ?? []).map((c) => ({ name: c.name ?? '', hex: c.hex })),
    typography: bc.visualIdentity?.typography ?? '',
    styleKeywords: (bc.visualIdentity?.styleKeywords ?? []).join(', '),
    markets: (bc.markets ?? []).join(', '),
    gaps: join(bc.gaps),
    website: bc.website,
    logoUrl: bc.visualIdentity?.logoUrl,
    sources: bc.sources ?? [],
  };
}

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;
export const isValidHex = (v: string) => HEX_RE.test((v || '').trim());

export function normalizeHex(v: string): string {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((v || '').trim());
  if (!m) return v;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return `#${h.toUpperCase()}`;
}

export type DraftErrors = Partial<Record<string, string>>;

export function validateDraft(d: BrandDraft): { ok: boolean; errors: DraftErrors } {
  const e: DraftErrors = {};
  const required = (key: keyof BrandDraft, label: string, max: number) => {
    const v = String(d[key] ?? '').trim();
    if (!v) e[key] = `${label} is required.`;
    else if (v.length > max) e[key] = `${label} must be at most ${max} characters.`;
  };
  required('brandName', 'Brand name', LIMITS.brandName);
  required('category', 'Category', LIMITS.category);
  required('summary', 'Summary', LIMITS.summary);
  required('positioning', 'Positioning', LIMITS.positioning);

  const maxLen = (key: keyof BrandDraft, label: string, max: number) => {
    if (String(d[key] ?? '').trim().length > max) e[key] = `${label} must be at most ${max} characters.`;
  };
  maxLen('audiencePrimary', 'Primary audience', LIMITS.audience.primary);
  maxLen('audienceSecondary', 'Secondary audience', LIMITS.audience.secondary);
  maxLen('typography', 'Typography', LIMITS.typography);

  const list = (key: keyof BrandDraft, label: string, lim: { items: number; len: number }, commas = false) => {
    const items = splitList(String(d[key] ?? ''), { commas });
    if (items.length > lim.items) e[key] = `${label}: up to ${lim.items} items.`;
    else if (items.some((i) => i.length > lim.len)) e[key] = `${label}: each item must be at most ${lim.len} characters.`;
  };
  list('usps', 'Selling points', LIMITS.usps);
  list('painPoints', 'Pain points', LIMITS.painPoints);
  list('desires', 'Desires', LIMITS.desires);
  list('tone', 'Tone', LIMITS.tone, true);
  list('doSay', 'Do say', LIMITS.doSay);
  list('dontSay', "Don't say", LIMITS.dontSay);
  list('styleKeywords', 'Style keywords', LIMITS.styleKeywords, true);
  list('markets', 'Markets', LIMITS.markets, true);
  list('gaps', 'Open questions', LIMITS.gaps);

  if (d.products.length > LIMITS.products.items) e.products = `Up to ${LIMITS.products.items} products.`;
  d.products.forEach((p, i) => {
    if (!p.name.trim()) e[`products.${i}`] = 'Each product needs a name.';
    else if (p.name.length > LIMITS.products.name) e[`products.${i}`] = `Product name must be at most ${LIMITS.products.name} characters.`;
    else if (p.description.length > LIMITS.products.description) e[`products.${i}`] = `Product description must be at most ${LIMITS.products.description} characters.`;
    else if (p.priceHint.length > LIMITS.products.priceHint) e[`products.${i}`] = `Price note must be at most ${LIMITS.products.priceHint} characters.`;
  });

  if (d.colors.length > LIMITS.colors.items) e.colors = `Up to ${LIMITS.colors.items} colours.`;
  d.colors.forEach((c, i) => {
    if (!isValidHex(c.hex)) e[`colors.${i}`] = 'Use a hex colour like #E4572E.';
    else if (c.name.length > LIMITS.colors.name) e[`colors.${i}`] = `Colour name must be at most ${LIMITS.colors.name} characters.`;
  });

  return { ok: Object.keys(e).length === 0, errors: e };
}

export function draftToBrandContext(d: BrandDraft): BrandContext {
  const colors: { name?: string; hex: string }[] = [];
  for (const c of d.colors) {
    const hex = normalizeHex(c.hex);
    if (isValidHex(hex) && !colors.some((x) => x.hex === hex)) colors.push({ name: c.name.trim() || undefined, hex });
  }
  return {
    brandName: d.brandName.trim(),
    website: d.website,
    category: d.category.trim(),
    summary: d.summary.trim(),
    positioning: d.positioning.trim(),
    usps: splitList(d.usps),
    products: d.products
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        description: p.description.trim() || undefined,
        priceHint: p.priceHint.trim() || undefined,
        imageUrls: p.imageUrls.length ? p.imageUrls : undefined,
      })),
    audience: {
      primary: d.audiencePrimary.trim(),
      secondary: d.audienceSecondary.trim() || undefined,
      painPoints: splitList(d.painPoints),
      desires: splitList(d.desires),
    },
    voice: { tone: splitList(d.tone, { commas: true }), doSay: splitList(d.doSay), dontSay: splitList(d.dontSay) },
    visualIdentity: {
      colors,
      typography: d.typography.trim(),
      logoUrl: d.logoUrl,
      styleKeywords: splitList(d.styleKeywords, { commas: true }),
    },
    markets: splitList(d.markets, { commas: true }),
    sources: d.sources,
    gaps: splitList(d.gaps),
  };
}

/** True when the two drafts differ in any user-editable way. */
export function draftsDiffer(a: BrandDraft, b: BrandDraft): boolean {
  return JSON.stringify(draftToBrandContext(a)) !== JSON.stringify(draftToBrandContext(b));
}
