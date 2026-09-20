import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignApiError, createCampaignApi } from './api.js';

type Call = { url: string; init: RequestInit };
function fakeFetch(responder: (call: Call) => { status?: number; body?: unknown; raw?: string } | Error) {
  const calls: Call[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    const call = { url, init };
    calls.push(call);
    const r = responder(call);
    if (r instanceof Error) throw r;
    const status = r.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => { if (r.raw !== undefined) throw new Error('bad json'); return r.body; } } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}
const api = (f: ReturnType<typeof fakeFetch>, token: string | null = 'tok') => createCampaignApi({ getToken: async () => token, fetchImpl: f.impl });

test('sends bearer token, JSON body and encodes ids', async () => {
  const f = fakeFetch(() => ({ body: { success: true, run: { id: 'r1' }, step: {} } }));
  await api(f).regenerateStep('a/b?c', 'brand_analysis', 'more playful please');
  const { url, init } = f.calls[0];
  assert.equal(url, '/api/campaign-studio/runs/a%2Fb%3Fc/steps/brand_analysis/regenerate');
  assert.equal(init.method, 'POST');
  assert.deepEqual(init.headers, { 'Content-Type': 'application/json', Authorization: 'Bearer tok' });
  assert.equal(init.body, JSON.stringify({ feedback: 'more playful please' }));
});

test('GET sends no body/content-type; no Authorization header when signed out', async () => {
  const f = fakeFetch(() => ({ body: { success: true, runs: [{ id: 'x' }] } }));
  const runs = await api(f, null).listRuns();
  assert.deepEqual(runs, [{ id: 'x' }]);
  assert.deepEqual(f.calls[0].init.headers, {});
  assert.equal(f.calls[0].init.body, undefined);
});

test('unwraps createRun / cancelRun / approve / edit payloads', async () => {
  const f = fakeFetch((c) => {
    if (c.url.endsWith('/runs') && c.init.method === 'POST') return { status: 201, body: { success: true, run: { id: 'new' } } };
    if (c.url.endsWith('/cancel')) return { body: { success: true, run: { id: 'r', status: 'cancelled' } } };
    if (c.url.endsWith('/approve')) return { body: { success: true, run: { id: 'r' }, steps: [{ id: 's' }] } };
    return { status: 201, body: { success: true, run: { id: 'r' }, step: { id: 's2' } } };
  });
  const a = api(f);
  assert.equal((await a.createRun({ inputType: 'website', websiteUrl: 'x.com', goal: 'sales' })).id, 'new');
  assert.equal((await a.cancelRun('r')).status, 'cancelled');
  assert.equal((await a.approveStep('r', 'brand_analysis')).steps.length, 1);
  assert.equal((await a.editStep('r', 'brand_analysis', { brandName: 'X' })).step.id, 's2');
  assert.equal(f.calls[3].init.method, 'PUT');
  assert.equal(f.calls[3].init.body, JSON.stringify({ output: { brandName: 'X' } }));
});

test('server errors surface the server message and status', async () => {
  const f = fakeFetch(() => ({ status: 409, body: { success: false, error: 'This step already has a result.', message: 'x' } }));
  await assert.rejects(api(f).runStep('r', 'brand_analysis'), (e: any) => e instanceof CampaignApiError && e.status === 409 && e.message === 'This step already has a result.');
});

test('errors: message fallback, non-JSON gateway pages, and network failures', async () => {
  await assert.rejects(api(fakeFetch(() => ({ status: 500, body: {} }))).getRun('r'), (e: any) => e.status === 500 && /went wrong/.test(e.message));
  await assert.rejects(api(fakeFetch(() => ({ status: 504, raw: '<html>timeout</html>' }))).getRun('r'), (e: any) => e.status === 504 && /too long/.test(e.message));
  await assert.rejects(api(fakeFetch(() => new TypeError('Failed to fetch'))).getRun('r'), (e: any) => e.status === 0 && /connection/.test(e.message));
  await assert.rejects(api(fakeFetch(() => ({ status: 200, body: { success: false, error: 'nope' } }))).getMeta(), (e: any) => e.message === 'nope');
});
