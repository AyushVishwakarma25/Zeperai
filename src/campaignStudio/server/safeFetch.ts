/**
 * CAMPAIGN STUDIO - SSRF-safe fetcher for user-supplied website URLs.
 *
 * Defences (all must hold, per hop):
 *  1. URL shape validation (http/https, no credentials, default ports, no IP literals)
 *  2. DNS is resolved by us; if ANY returned address is private/reserved -> refuse
 *  3. The TCP connection is PINNED to the validated IP (custom `lookup`), so a
 *     second DNS answer (rebinding) can never be used. TLS SNI / Host header
 *     still use the real hostname, so certificates are verified normally.
 *  4. Redirects are followed manually (max 3) and every hop repeats 1-3
 *  5. `Accept-Encoding: identity` (no decompression bombs), hard byte cap,
 *     overall deadline, content-type allowlist
 *
 * `createSafeFetcher` accepts overrides ONLY so unit tests can point it at a
 * local server. Application code must use the default `safeFetch` export.
 */

import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isBlockedIp } from './ipRanges.js';
import { normalizeWebsiteUrl } from './validation.js';

export type SafeFetchErrorCode =
  | 'invalid_url'
  | 'blocked_address'
  | 'dns_failed'
  | 'too_many_redirects'
  | 'timeout'
  | 'too_large'
  | 'bad_content_type'
  | 'http_error'
  | 'network';

export class SafeFetchError extends Error {
  public readonly code: SafeFetchErrorCode;
  public readonly status?: number;
  constructor(code: SafeFetchErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'SafeFetchError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface SafeFetchOptions {
  /** Max response body size. Default 1.5 MB. */
  maxBytes?: number;
  /** Overall deadline across all hops. Default 8s. */
  timeoutMs?: number;
  /** Max redirects followed. Default 3. */
  maxRedirects?: number;
  accept?: string;
  /** Allowed Content-Type values. Default: HTML. */
  allowedContentTypes?: RegExp;
}

export interface SafeFetchResult {
  /** Final URL after redirects. */
  url: string;
  status: number;
  contentType: string;
  body: Buffer;
  redirects: string[];
}

export type SafeFetcher = (url: string, options?: SafeFetchOptions) => Promise<SafeFetchResult>;

interface ResolvedAddress {
  address: string;
  family: number;
}

export interface FetcherOverrides {
  lookup?: (hostname: string) => Promise<ResolvedAddress[]>;
  isBlockedIp?: (ip: string) => boolean;
  /** Skips the URL-shape check (tests hit http://127.0.0.1:port). Never set in application code. */
  skipUrlShapeCheck?: boolean;
}

const USER_AGENT = 'ZeperAI-BrandReader/1.0 (+https://zeperai.in)';
const HTML_TYPES = /^(text\/html|application\/xhtml\+xml)\b/i;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

const defaultLookup = async (hostname: string): Promise<ResolvedAddress[]> => {
  const records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return records.map((r) => ({ address: r.address, family: r.family }));
};

export function createSafeFetcher(overrides: FetcherOverrides = {}): SafeFetcher {
  const lookup = overrides.lookup ?? defaultLookup;
  const blocked = overrides.isBlockedIp ?? isBlockedIp;

  async function resolvePublic(hostname: string): Promise<ResolvedAddress> {
    let records: ResolvedAddress[];
    try {
      records = await lookup(hostname);
    } catch {
      throw new SafeFetchError('dns_failed', 'Could not resolve that website address.');
    }
    if (!records || records.length === 0) throw new SafeFetchError('dns_failed', 'Could not resolve that website address.');
    // Strict: a single private/reserved record poisons the whole answer.
    if (records.some((r) => blocked(r.address))) {
      throw new SafeFetchError('blocked_address', 'That website address is not reachable from the public internet.');
    }
    return records.find((r) => r.family === 4) ?? records[0];
  }

  function requestOnce(
    url: URL,
    pinned: ResolvedAddress,
    opts: Required<Pick<SafeFetchOptions, 'maxBytes' | 'accept' | 'allowedContentTypes'>>,
    msLeft: number,
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      let settled = false;
      const done = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      let req: http.ClientRequest;
      try {
        req = lib.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          method: 'GET',
          headers: {
            Host: url.host,
            'User-Agent': USER_AGENT,
            Accept: opts.accept,
            'Accept-Encoding': 'identity',
            'Accept-Language': 'en-US,en;q=0.8',
            Connection: 'close',
          },
          // Pin the connection to the address we validated. Node >= 20 may ask for all addresses.
          lookup: (_host: string, options: any, cb: any) => {
            if (options && options.all) cb(null, [{ address: pinned.address, family: pinned.family }]);
            else cb(null, pinned.address, pinned.family);
          },
          ...(isHttps ? { servername: url.hostname } : {}),
        } as any,
        (res) => {
          const status = res.statusCode || 0;

          if (REDIRECT_CODES.has(status)) {
            res.resume();
            return done(() => resolve({ status, headers: res.headers, body: Buffer.alloc(0) }));
          }
          if (status < 200 || status >= 300) {
            res.resume();
            return done(() => reject(new SafeFetchError('http_error', `The website responded with HTTP ${status}.`, status)));
          }

          const contentType = String(res.headers['content-type'] || '');
          if (!opts.allowedContentTypes.test(contentType)) {
            res.resume();
            return done(() => reject(new SafeFetchError('bad_content_type', 'That address did not return a web page.')));
          }
          const declared = Number(res.headers['content-length']);
          if (Number.isFinite(declared) && declared > opts.maxBytes) {
            res.resume();
            return done(() => reject(new SafeFetchError('too_large', 'That page is too large to read.')));
          }

          const chunks: Buffer[] = [];
          let total = 0;
          res.on('data', (chunk: Buffer) => {
            total += chunk.length;
            if (total > opts.maxBytes) {
              req.destroy();
              return done(() => reject(new SafeFetchError('too_large', 'That page is too large to read.')));
            }
            chunks.push(chunk);
          });
          res.on('end', () => done(() => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) })));
          res.on('error', () => done(() => reject(new SafeFetchError('network', 'The connection was interrupted.'))));
        },
      );
      } catch {
        return reject(new SafeFetchError('network', 'Could not connect to that website.'));
      }

      const timer = setTimeout(() => {
        req.destroy();
        done(() => reject(new SafeFetchError('timeout', 'The website took too long to respond.')));
      }, Math.max(1, msLeft));

      req.on('error', () => done(() => reject(new SafeFetchError('network', 'Could not connect to that website.'))));
      req.end();
    });
  }

  return async function safeFetch(inputUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
    const opts = {
      maxBytes: options.maxBytes ?? 1_500_000,
      accept: options.accept ?? 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      allowedContentTypes: options.allowedContentTypes ?? HTML_TYPES,
    };
    const maxRedirects = options.maxRedirects ?? 3;
    const deadline = Date.now() + (options.timeoutMs ?? 8_000);
    const redirects: string[] = [];

    let current = inputUrl;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      let url: URL;
      if (overrides.skipUrlShapeCheck) {
        try {
          url = new URL(current);
        } catch {
          throw new SafeFetchError('invalid_url', 'That does not look like a valid website URL.');
        }
      } else {
        const norm = normalizeWebsiteUrl(current);
        if (!norm.ok) throw new SafeFetchError('invalid_url', norm.error as string);
        url = new URL(norm.value as string);
      }

      const msLeft = deadline - Date.now();
      if (msLeft <= 0) throw new SafeFetchError('timeout', 'The website took too long to respond.');

      const pinned = await resolvePublic(url.hostname);
      const res = await requestOnce(url, pinned, opts, deadline - Date.now());

      if (REDIRECT_CODES.has(res.status)) {
        const location = res.headers.location;
        if (!location || typeof location !== 'string') {
          throw new SafeFetchError('http_error', 'The website sent an invalid redirect.', res.status);
        }
        if (hop === maxRedirects) throw new SafeFetchError('too_many_redirects', 'The website redirected too many times.');
        let next: URL;
        try {
          next = new URL(location, url);
        } catch {
          throw new SafeFetchError('http_error', 'The website sent an invalid redirect.', res.status);
        }
        if (next.protocol !== 'http:' && next.protocol !== 'https:') {
          throw new SafeFetchError('invalid_url', 'The website redirected to an unsupported address.');
        }
        redirects.push(next.toString());
        current = next.toString(); // re-validated at the top of the loop
        continue;
      }

      return {
        url: url.toString(),
        status: res.status,
        contentType: String(res.headers['content-type'] || ''),
        body: res.body,
        redirects,
      };
    }
    throw new SafeFetchError('too_many_redirects', 'The website redirected too many times.');
  };
}

/** The fetcher application code must use. */
export const safeFetch: SafeFetcher = createSafeFetcher();
