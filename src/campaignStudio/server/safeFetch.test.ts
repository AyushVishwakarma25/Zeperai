import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { SafeFetchError, createSafeFetcher } from './safeFetch.js';

let server: http.Server;
let port = 0;
let lastHeaders: http.IncomingHttpHeaders = {};

before(async () => {
  server = http.createServer((req, res) => {
    lastHeaders = req.headers;
    const url = req.url || '/';
    if (url === '/ok') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end('<html><title>Hi</title></html>');
    }
    if (url === '/redirect-ok') { res.writeHead(302, { location: '/ok' }); return res.end(); }
    if (url === '/loop') { res.writeHead(302, { location: '/loop' }); return res.end(); }
    if (url === '/redirect-private') { res.writeHead(302, { location: `http://private.test:${port}/ok` }); return res.end(); }
    if (url === '/redirect-file') { res.writeHead(302, { location: 'file:///etc/passwd' }); return res.end(); }
    if (url === '/redirect-noloc') { res.writeHead(302); return res.end(); }
    if (url === '/big') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('x'.repeat(200_000)); }
    if (url === '/big-declared') { res.writeHead(200, { 'content-type': 'text/html', 'content-length': '999999999' }); return res.end('x'); }
    if (url === '/png') { res.writeHead(200, { 'content-type': 'image/png' }); return res.end('PNG'); }
    if (url === '/404') { res.writeHead(404, { 'content-type': 'text/html' }); return res.end('nope'); }
    if (url === '/hang') { return; /* never respond */ }
    res.writeHead(500); res.end();
  }).listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', () => r()));
  port = (server.address() as AddressInfo).port;
});
after(() => { server.closeAllConnections?.(); server.close(); });

/** Test fetcher: resolver maps hostnames; only 10.0.0.1 counts as blocked. */
const testFetcher = () =>
  createSafeFetcher({
    lookup: async (host) => {
      if (host === 'private.test') return [{ address: '10.0.0.1', family: 4 }];
      if (host === 'nx.test') throw new Error('ENOTFOUND');
      return [{ address: '127.0.0.1', family: 4 }]; // everything else "resolves" to the local test server
    },
    isBlockedIp: (ip) => ip === '10.0.0.1',
    skipUrlShapeCheck: true,
  });

const expectCode = async (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: any) => e instanceof SafeFetchError && e.code === code, `expected ${code}`);

test('fetches an HTML page and returns body, content type and final url', async () => {
  const r = await testFetcher()(`http://site.test:${port}/ok`);
  assert.equal(r.status, 200);
  assert.match(r.contentType, /text\/html/);
  assert.match(r.body.toString('utf8'), /<title>Hi<\/title>/);
  assert.deepEqual(r.redirects, []);
});

test('connection is pinned to the validated IP but Host/identity headers use the real hostname', async () => {
  await testFetcher()(`http://pinned.test:${port}/ok`);
  assert.equal(lastHeaders.host, `pinned.test:${port}`);
  assert.equal(lastHeaders['accept-encoding'], 'identity');
  assert.match(String(lastHeaders['user-agent']), /ZeperAI/);
  assert.equal(lastHeaders.cookie, undefined);
  assert.equal(lastHeaders.authorization, undefined);
});

test('follows redirects and records them', async () => {
  const r = await testFetcher()(`http://site.test:${port}/redirect-ok`);
  assert.equal(r.status, 200);
  assert.equal(r.redirects.length, 1);
  assert.match(r.url, /\/ok$/);
});

test('redirect loop stops at the redirect limit', async () => {
  await expectCode(testFetcher()(`http://site.test:${port}/loop`, { maxRedirects: 3 }), 'too_many_redirects');
});

test('a redirect to a private address is blocked on the second hop', async () => {
  await expectCode(testFetcher()(`http://site.test:${port}/redirect-private`), 'blocked_address');
});

test('a redirect to a non-http scheme is rejected; a redirect without Location fails', async () => {
  await expectCode(testFetcher()(`http://site.test:${port}/redirect-file`), 'invalid_url');
  await expectCode(testFetcher()(`http://site.test:${port}/redirect-noloc`), 'http_error');
});

test('size limit: streamed body and declared content-length are both refused', async () => {
  await expectCode(testFetcher()(`http://site.test:${port}/big`, { maxBytes: 1000 }), 'too_large');
  await expectCode(testFetcher()(`http://site.test:${port}/big-declared`, { maxBytes: 1000 }), 'too_large');
});

test('content-type allowlist: images are refused by default', async () => {
  await expectCode(testFetcher()(`http://site.test:${port}/png`), 'bad_content_type');
  const ok = await testFetcher()(`http://site.test:${port}/png`, { allowedContentTypes: /^image\// });
  assert.equal(ok.body.toString(), 'PNG');
});

test('HTTP errors and DNS failures are reported', async () => {
  await assert.rejects(testFetcher()(`http://site.test:${port}/404`), (e: any) => e.code === 'http_error' && e.status === 404);
  await expectCode(testFetcher()(`http://nx.test:${port}/ok`), 'dns_failed');
});

test('overall deadline: a server that never answers times out', async () => {
  const started = Date.now();
  await expectCode(testFetcher()(`http://site.test:${port}/hang`, { timeoutMs: 300 }), 'timeout');
  assert.ok(Date.now() - started < 3000);
});

test('DEFAULT policy: private, loopback and metadata targets are refused before any connection', async () => {
  let dialed = false;
  const strict = createSafeFetcher({
    lookup: async (host) => {
      dialed = true;
      const map: Record<string, string> = {
        'internal.example.com': '10.0.0.5',
        'meta.example.com': '169.254.169.254',
        'loop.example.com': '127.0.0.1',
        'v6.example.com': '::1',
        'mapped.example.com': '::ffff:127.0.0.1',
      };
      return [{ address: map[host] || '8.8.8.8', family: map[host]?.includes(':') ? 6 : 4 }];
    },
  });
  for (const host of ['internal', 'meta', 'loop', 'v6', 'mapped']) {
    await expectCode(strict(`https://${host}.example.com/`), 'blocked_address');
  }
  assert.ok(dialed);
});

test('DEFAULT policy: one private record among public ones still blocks (no rebinding roulette)', async () => {
  const strict = createSafeFetcher({
    lookup: async () => [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.5', family: 4 }],
  });
  await expectCode(strict('https://mixed.example.com/'), 'blocked_address');
});

test('DEFAULT policy: URL shape is checked before DNS is ever consulted', async () => {
  let lookups = 0;
  const strict = createSafeFetcher({ lookup: async () => { lookups++; return [{ address: '8.8.8.8', family: 4 }]; } });
  for (const url of ['http://127.0.0.1/', 'http://localhost/', 'file:///etc/passwd', 'https://user:pw@example.com/', 'https://example.com:8443/', 'http://[::1]/', 'http://2130706433/']) {
    await expectCode(strict(url), 'invalid_url');
  }
  assert.equal(lookups, 0, 'no DNS lookups for shape-invalid URLs');
});
