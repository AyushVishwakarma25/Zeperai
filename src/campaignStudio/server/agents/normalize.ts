/**
 * CAMPAIGN STUDIO - shared normalisers for agent output.
 * Model output is never trusted: every string is cleaned and length-capped, lists are capped and
 * de-duplicated, and URLs must be plain http(s). Missing optional fields become empty, never throw.
 */

import type { GroundingSource } from '../gemini.js';
import type { SourceLink } from '../../types.js';

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Cleaned, single-spaced, length-capped string ('' when not a string). */
export function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Capped, de-duplicated (case-insensitive) list of cleaned strings. */
export function strList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = str(item, maxLen);
    if (s && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

/** http(s) URL without credentials, or undefined. */
export function httpUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const raw = v.trim();
  if (!raw || raw.length > 500) return undefined;
  try {
    const u = new URL(raw);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || u.username || u.password) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

/** Maps up to `max` array items through `mapper`; items the mapper rejects (null) are dropped. */
export function objList<T>(v: unknown, max: number, mapper: (item: any) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const mapped = mapper(item);
    if (mapped) out.push(mapped);
    if (out.length >= max) break;
  }
  return out;
}

/** Grounding sources reported by Google (never by the model) as safe, capped links. */
export function sourceLinks(sources: GroundingSource[] | undefined, max = 12): SourceLink[] {
  const out: SourceLink[] = [];
  for (const s of sources ?? []) {
    const url = httpUrl(s.uri);
    if (!url || out.some((o) => o.url === url)) continue;
    let host = '';
    try {
      host = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      /* ignore */
    }
    out.push({ title: str(s.title, 120) || host || 'Source', url });
    if (out.length >= max) break;
  }
  return out;
}
