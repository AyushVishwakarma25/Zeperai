import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiCallError, extractJson, generateStructured, isTransientError, type GenAIClientLike } from './gemini.js';

// ---- helpers -------------------------------------------------------------

type Step = { resolve: any } | { reject: any } | { hang: true };

function fakeClient(steps: Step[]) {
  const calls: any[] = [];
  const client: GenAIClientLike = {
    models: {
      async generateContent(args: any) {
        calls.push(args);
        const step = steps[Math.min(calls.length - 1, steps.length - 1)];
        if ('reject' in step) throw step.reject;
        if ('hang' in step) return new Promise(() => {});
        return step.resolve;
      },
    },
  };
  return { client, calls };
}

const reply = (text: string, extra: Record<string, unknown> = {}) => ({
  text,
  candidates: [{ finishReason: 'STOP', ...(extra.candidate as object) }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 2, totalTokenCount: 17 },
});

const httpError = (status: number, message = 'boom') => Object.assign(new Error(message), { status });

const parseName = (raw: unknown) => {
  const r = raw as { name?: unknown };
  if (typeof r?.name !== 'string') throw new Error('name must be a string');
  return { name: r.name };
};

const base = {
  model: 'test-model',
  systemInstruction: 'You are a test agent.',
  prompt: 'Give me a name.',
  parse: parseName,
  sleep: async () => {},
};

// ---- extractJson ---------------------------------------------------------

test('extractJson handles plain, fenced and prose-wrapped JSON', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Sure! Here it is:\n{"a":{"b":2}}\nHope that helps.'), { a: { b: 2 } });
  assert.deepEqual(extractJson('[1,2,3]'), [1, 2, 3]);
  assert.throws(() => extractJson(''));
  assert.throws(() => extractJson('no json here'));
});

test('isTransientError classifies status codes and messages', () => {
  assert.ok(isTransientError(httpError(429)));
  assert.ok(isTransientError(httpError(503)));
  assert.ok(isTransientError(new Error('fetch failed')));
  assert.ok(isTransientError(new Error('RESOURCE_EXHAUSTED: quota')));
  assert.equal(isTransientError(httpError(400)), false);
  assert.equal(isTransientError(httpError(403)), false);
  assert.equal(isTransientError(new Error('something else')), false);
});

// ---- generateStructured --------------------------------------------------

test('success: JSON mode + schema, usage and no tools', async () => {
  const { client, calls } = fakeClient([{ resolve: reply('{"name":"Acme"}') }]);
  const schema = { type: 'OBJECT', properties: { name: { type: 'STRING' } } };
  const r = await generateStructured({ ...base, client, schema, temperature: 0.4 });

  assert.deepEqual(r.data, { name: 'Acme' });
  assert.equal(r.attempts, 1);
  assert.deepEqual(r.usage, { promptTokens: 10, outputTokens: 5, thinkingTokens: 2, totalTokens: 17 });
  assert.equal(calls[0].config.responseMimeType, 'application/json');
  assert.deepEqual(calls[0].config.responseSchema, schema);
  assert.equal(calls[0].config.tools, undefined);
  assert.equal(calls[0].config.temperature, 0.4);
  assert.ok(calls[0].config.abortSignal instanceof AbortSignal);
});

test('tools on: no schema/mime in config, JSON instruction added, sources returned', async () => {
  const { client, calls } = fakeClient([
    {
      resolve: reply('{"name":"Grounded"}', {
        candidate: {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://a.example', title: 'A' } },
              { web: { uri: 'https://a.example', title: 'A again' } },
              { web: { uri: 'https://b.example' } },
            ],
          },
        },
      }),
    },
  ]);
  const r = await generateStructured({
    ...base,
    client,
    schema: { type: 'OBJECT' },
    tools: { googleSearch: true, urlContext: true },
  });

  assert.deepEqual(r.data, { name: 'Grounded' });
  const cfg = calls[0].config;
  assert.equal(cfg.responseMimeType, undefined);
  assert.equal(cfg.responseSchema, undefined);
  assert.deepEqual(cfg.tools, [{ googleSearch: {} }, { urlContext: {} }]);
  assert.match(cfg.systemInstruction, /ONLY a single valid JSON object/);
  assert.deepEqual(r.sources, [{ uri: 'https://a.example', title: 'A' }, { uri: 'https://b.example', title: undefined }]);
});

test('transient errors are retried with growing backoff, then succeed', async () => {
  const { client, calls } = fakeClient([{ reject: httpError(503) }, { reject: httpError(429) }, { resolve: reply('{"name":"ok"}') }]);
  const waits: number[] = [];
  const r = await generateStructured({ ...base, client, sleep: async (ms) => void waits.push(ms) });

  assert.deepEqual(r.data, { name: 'ok' });
  assert.equal(calls.length, 3);
  assert.equal(r.attempts, 3);
  assert.equal(waits.length, 2);
  assert.ok(waits[1] > waits[0], `backoff should grow: ${waits}`);
});

test('transient errors exhausted -> GeminiCallError(transient)', async () => {
  const { client, calls } = fakeClient([{ reject: httpError(503) }]);
  await assert.rejects(
    generateStructured({ ...base, client, maxAttempts: 2 }),
    (e: any) => e instanceof GeminiCallError && e.kind === 'transient' && e.status === 503,
  );
  assert.equal(calls.length, 2);
});

test('400 is NOT retried and maps to bad_request', async () => {
  const { client, calls } = fakeClient([{ reject: httpError(400, 'INVALID_ARGUMENT') }]);
  await assert.rejects(generateStructured({ ...base, client }), (e: any) => e.kind === 'bad_request' && e.status === 400);
  assert.equal(calls.length, 1);
});

test('invalid JSON triggers exactly one repair call, which can succeed', async () => {
  const { client, calls } = fakeClient([{ resolve: reply('{"nope": 1}') }, { resolve: reply('{"name":"fixed"}') }]);
  const r = await generateStructured({ ...base, client, tools: { googleSearch: true }, schema: { type: 'OBJECT' } });

  assert.deepEqual(r.data, { name: 'fixed' });
  assert.equal(calls.length, 2);
  assert.equal(r.attempts, 2);
  // repair call: no tools, JSON mode + schema on
  assert.equal(calls[1].config.tools, undefined);
  assert.equal(calls[1].config.responseMimeType, 'application/json');
  assert.match(calls[1].contents[0].parts[0].text, /could not be used/);
  assert.match(calls[1].contents[0].parts[0].text, /name must be a string/);
  // usage accumulates across both calls
  assert.equal(r.usage.totalTokens, 34);
});

test('invalid JSON twice -> invalid_output (no third call)', async () => {
  const { client, calls } = fakeClient([{ resolve: reply('garbage') }]);
  await assert.rejects(generateStructured({ ...base, client }), (e: any) => e.kind === 'invalid_output');
  assert.equal(calls.length, 2);
});

test('safety block is surfaced as blocked and not retried', async () => {
  const { client, calls } = fakeClient([{ resolve: { text: '', candidates: [{ finishReason: 'SAFETY' }] } }]);
  await assert.rejects(generateStructured({ ...base, client }), (e: any) => e.kind === 'blocked');
  assert.equal(calls.length, 1);

  const { client: c2 } = fakeClient([{ resolve: { text: '', promptFeedback: { blockReason: 'PROHIBITED_CONTENT' }, candidates: [] } }]);
  await assert.rejects(generateStructured({ ...base, client: c2 }), (e: any) => e.kind === 'blocked');
});

test('hung call times out with kind=timeout and is not retried', async () => {
  const { client, calls } = fakeClient([{ hang: true }]);
  const started = Date.now();
  await assert.rejects(generateStructured({ ...base, client, timeoutMs: 80 }), (e: any) => e.kind === 'timeout');
  assert.ok(Date.now() - started < 1500, 'should fail fast');
  assert.equal(calls.length, 1);
});

test('thinking level is mapped into thinkingConfig; extra parts are sent', async () => {
  const { client, calls } = fakeClient([{ resolve: reply('{"name":"x"}') }]);
  await generateStructured({
    ...base,
    client,
    thinkingLevel: 'high',
    extraParts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }],
  });
  assert.equal(calls[0].config.thinkingConfig.thinkingLevel, 'HIGH');
  assert.equal(calls[0].contents[0].parts.length, 2);
  assert.equal(calls[0].contents[0].parts[1].inlineData.mimeType, 'image/png');
});
