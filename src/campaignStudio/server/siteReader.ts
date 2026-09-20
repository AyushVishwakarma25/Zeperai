/**
 * CAMPAIGN STUDIO - website reader.
 *
 * Fetches a brand's homepage (+ up to 2 useful same-site pages) through the
 * SSRF-safe fetcher and extracts the signals the Brand Analyst needs. No HTML
 * parser dependency: extraction is regex-based, bounded (input is capped by the
 * fetcher at 1.5 MB) and only trusts what it can validate (http(s) URLs, hex
 * colours). Everything returned is UNTRUSTED text and must be presented to the
 * model as data, never as instructions.
 */

import { SafeFetchError, safeFetch as defaultFetcher, type SafeFetcher } from './safeFetch.js';

export interface ProductSignal {
  name: string;
  description?: string;
  price?: string;
  image?: string;
}

export interface PageInfo {
  url: string;
  title: string;
  description: string;
  ogTitle: string;
  ogSiteName: string;
  headings: string[];
  text: string;
  products: ProductSignal[];
}

export interface SiteSnapshot {
  pages: PageInfo[];
  /** Ranked hex colours found in styles / theme-color, greys removed. */
  colors: string[];
  logoCandidates: string[];
  imageCandidates: string[];
  fetchedUrls: string[];
  failures: string[];
  /** True when almost no readable text was found (typically a JS-rendered site). */
  thin: boolean;
}

export class SiteReadError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'SiteReadError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Low-level helpers (exported for tests)
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"',
  ndash: '-', mdash: '-', hellip: '...', copy: '(c)', reg: '(R)', trade: '(TM)', bull: '-', middot: '.',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return ' ';
      try {
        return String.fromCodePoint(code);
      } catch {
        return ' ';
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

export function decodeBody(body: Buffer, contentType: string): string {
  let charset = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1];
  if (!charset) {
    const head = body.subarray(0, 2048).toString('latin1');
    charset = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1];
  }
  try {
    return new TextDecoder(charset || 'utf-8').decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}

export function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

const clean = (s: string, max: number) => decodeEntities(s).replace(/\s+/g, ' ').trim().slice(0, max);

function absoluteHttpUrl(raw: string | undefined, base: string): string | null {
  if (!raw) return null;
  const first = raw.trim().split(/\s+/)[0]; // srcset: first candidate
  if (!first || first.startsWith('data:') || first.startsWith('javascript:')) return null;
  try {
    const u = new URL(first, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    u.hash = '';
    const s = u.toString();
    return s.length <= 500 ? s : null;
  } catch {
    return null;
  }
}

export function htmlToText(html: string, maxChars: number): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|br|ul|ol|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of decodeEntities(stripped).split('\n')) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 2 || seen.has(line)) continue; // menus/footers repeat the same lines
    seen.add(line);
    lines.push(line.slice(0, 400));
  }
  return lines.join('\n').slice(0, maxChars);
}

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `#${full.toUpperCase()}`;
}

function isBrandishColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return s >= 0.18 && l > 0.1 && l < 0.92;
}

export function extractColors(html: string): string[] {
  const sources: string[] = [];
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) sources.push(m[1]);
  for (const m of html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) sources.push(m[1]);
  const theme = /<meta[^>]+name\s*=\s*["']theme-color["'][^>]*>/i.exec(html);
  const counts = new Map<string, number>();
  const bump = (hex: string, weight = 1) => {
    const n = normalizeHex(hex);
    if (isBrandishColor(n)) counts.set(n, (counts.get(n) || 0) + weight);
  };
  if (theme) {
    const c = /content\s*=\s*["']?(#[0-9a-f]{3,6})\b/i.exec(theme[0]);
    if (c && (c[1].length === 4 || c[1].length === 7)) bump(c[1], 5);
  }
  for (const css of sources) {
    for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) bump(m[0]);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([hex]) => hex);
}

function collectJsonLdProducts(html: string, pageUrl: string): ProductSignal[] {
  const out: ProductSignal[] = [];
  const visit = (node: any, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 6 || out.length >= 10) return;
    if (Array.isArray(node)) return node.forEach((n) => visit(n, depth + 1));
    const type = node['@type'];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes('Product') && typeof node.name === 'string') {
      const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      const price = offer?.price ?? offer?.lowPrice;
      const image = Array.isArray(node.image) ? node.image[0] : node.image;
      out.push({
        name: clean(node.name, 120),
        description: typeof node.description === 'string' ? clean(node.description, 300) : undefined,
        price: price !== undefined ? clean(`${offer?.priceCurrency ?? ''} ${price}`, 40) : undefined,
        image: absoluteHttpUrl(typeof image === 'string' ? image : image?.url, pageUrl) ?? undefined,
      });
    }
    for (const key of ['@graph', 'itemListElement', 'item', 'hasVariant', 'mainEntity']) visit(node[key], depth + 1);
  };
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(m[1].trim()));
    } catch {
      /* malformed JSON-LD is common; ignore */
    }
  }
  return out;
}

const NOISE_IMAGE = /(sprite|pixel|tracking|blank|spacer|avatar|favicon|emoji|badge|payment|flag|arrow|chevron|star-?rating|placeholder)/i;

interface ExtractedPage {
  info: PageInfo;
  logoCandidates: string[];
  images: string[];
  colors: string[];
  links: { url: string; text: string }[];
}

export function extractPage(html: string, pageUrl: string, maxText = 12_000): ExtractedPage {
  const metas: Record<string, string> = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = parseAttrs(m[0]);
    const key = (a.property || a.name || '').toLowerCase();
    if (key && a.content !== undefined && metas[key] === undefined) metas[key] = a.content;
  }
  const title = clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '', 200);

  const headings: string[] = [];
  for (const m of html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = clean(m[2].replace(/<[^>]+>/g, ' '), 160);
    if (t && !headings.includes(t)) headings.push(t);
    if (headings.length >= 20) break;
  }

  const products = collectJsonLdProducts(html, pageUrl);

  // Logo + image candidates
  const logoCandidates: string[] = [];
  const images: string[] = [];
  const pushUnique = (list: string[], url: string | null, cap: number) => {
    if (url && !list.includes(url) && list.length < cap) list.push(url);
  };
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = parseAttrs(m[0]);
    const src = absoluteHttpUrl(a['data-src'] || a.src || a['data-lazy-src'] || a.srcset || a['data-srcset'], pageUrl);
    if (!src) continue;
    const hay = `${a.class || ''} ${a.id || ''} ${a.alt || ''} ${src}`;
    if (/logo/i.test(hay)) pushUnique(logoCandidates, src, 4);
    else if (!NOISE_IMAGE.test(hay) && Number(a.width) !== 1) pushUnique(images, src, 12);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = parseAttrs(m[0]);
    const rel = (a.rel || '').toLowerCase();
    if (rel.includes('apple-touch-icon')) pushUnique(logoCandidates, absoluteHttpUrl(a.href, pageUrl), 4);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = parseAttrs(m[0]);
    if ((a.rel || '').toLowerCase().split(/\s+/).includes('icon')) pushUnique(logoCandidates, absoluteHttpUrl(a.href, pageUrl), 4);
  }
  const ogImage = absoluteHttpUrl(metas['og:image'], pageUrl);
  const ordered: string[] = [];
  for (const p of products) pushUnique(ordered, p.image ?? null, 12);
  pushUnique(ordered, ogImage, 12);
  for (const i of images) pushUnique(ordered, i, 12);

  // Same-site links (for choosing extra pages)
  const links: { url: string; text: string }[] = [];
  const baseHost = new URL(pageUrl).hostname.replace(/^www\./, '');
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const a = parseAttrs(`<a ${m[1]}>`);
    const abs = absoluteHttpUrl(a.href, pageUrl);
    if (!abs) continue;
    try {
      if (new URL(abs).hostname.replace(/^www\./, '') !== baseHost) continue;
    } catch {
      continue;
    }
    links.push({ url: abs, text: clean(m[2].replace(/<[^>]+>/g, ' '), 80) });
    if (links.length >= 200) break;
  }

  return {
    info: {
      url: pageUrl,
      title,
      description: clean(metas.description || metas['og:description'] || '', 400),
      ogTitle: clean(metas['og:title'] || '', 200),
      ogSiteName: clean(metas['og:site_name'] || '', 120),
      headings,
      text: htmlToText(html, maxText),
      products,
    },
    logoCandidates,
    images: ordered,
    colors: extractColors(html),
    links,
  };
}

const PAGE_HINTS: Array<[RegExp, number]> = [
  [/(about|our-story|story|who-we-are|mission)/i, 5],
  [/(collections?|shop|products?|catalog|store|menu|services|pricing|offerings)/i, 4],
  [/(faq|why-|benefits|ingredients|how-it-works)/i, 2],
];

export function pickExtraPages(links: { url: string; text: string }[], homeUrl: string, max = 2): string[] {
  const home = new URL(homeUrl);
  const scored = new Map<string, number>();
  for (const l of links) {
    let u: URL;
    try {
      u = new URL(l.url);
    } catch {
      continue;
    }
    if (u.pathname === '/' || u.pathname === home.pathname) continue;
    if (/\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4)$/i.test(u.pathname)) continue;
    if (/(cart|checkout|login|account|policy|policies|terms|privacy|refund|shipping|cdn-cgi|wp-admin)/i.test(u.pathname)) continue;
    const hay = `${u.pathname} ${l.text}`;
    const score = PAGE_HINTS.reduce((s, [re, w]) => (re.test(hay) ? Math.max(s, w) : s), 0);
    if (score > 0) scored.set(u.toString(), Math.max(scored.get(u.toString()) || 0, score));
  }
  return [...scored.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([url]) => url);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface ReadSiteOptions {
  fetcher?: SafeFetcher;
  /** Total time budget for reading (home + extra pages). Default 12s. */
  budgetMs?: number;
}

export async function readSite(url: string, options: ReadSiteOptions = {}): Promise<SiteSnapshot> {
  const fetcher = options.fetcher ?? defaultFetcher;
  const deadline = Date.now() + (options.budgetMs ?? 12_000);
  const failures: string[] = [];

  let home: ExtractedPage;
  let homeFinalUrl: string;
  try {
    const res = await fetcher(url, { timeoutMs: Math.min(8_000, deadline - Date.now()) });
    homeFinalUrl = res.url;
    home = extractPage(decodeBody(res.body, res.contentType), res.url, 12_000);
  } catch (err) {
    const code = err instanceof SafeFetchError ? err.code : 'network';
    throw new SiteReadError(code, err instanceof SafeFetchError ? err.message : 'Could not read that website.');
  }

  const pages: PageInfo[] = [home.info];
  const fetchedUrls: string[] = [homeFinalUrl];
  const logoCandidates = [...home.logoCandidates];
  const imageCandidates = [...home.images];
  const colorCounts = new Map<string, number>(home.colors.map((c, i) => [c, 10 - i]));

  const extra = pickExtraPages(home.links, homeFinalUrl, 2);
  const results = await Promise.allSettled(
    extra.map((u) => {
      const left = deadline - Date.now() - 300;
      if (left < 1_500) return Promise.reject(new SafeFetchError('timeout', 'out of time'));
      return fetcher(u, { timeoutMs: Math.min(6_000, left) });
    }),
  );
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const page = extractPage(decodeBody(r.value.body, r.value.contentType), r.value.url, 8_000);
      pages.push(page.info);
      fetchedUrls.push(r.value.url);
      for (const l of page.logoCandidates) if (!logoCandidates.includes(l) && logoCandidates.length < 4) logoCandidates.push(l);
      for (const im of page.images) if (!imageCandidates.includes(im) && imageCandidates.length < 16) imageCandidates.push(im);
      page.colors.forEach((c, idx) => colorCounts.set(c, (colorCounts.get(c) || 0) + 5 - idx));
    } else {
      failures.push(`${new URL(extra[i]).pathname}: ${r.reason instanceof SafeFetchError ? r.reason.code : 'failed'}`);
    }
  });

  const totalText = pages.reduce((n, p) => n + p.text.length, 0);
  return {
    pages,
    colors: [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c),
    logoCandidates,
    imageCandidates,
    fetchedUrls,
    failures,
    thin: totalText < 300,
  };
}
