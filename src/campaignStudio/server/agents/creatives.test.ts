import test from 'node:test';
import assert from 'node:assert/strict';
import { MASTER_PROMPTS_JSON, RUN, deadline } from './fixtures.js';
import { creativesAgent, generateSingleCreative, normalizeAspectRatio } from './creatives.js';
import type { MasterPrompts } from '../../types.js';
import type { GenAIClientLike } from '../gemini.js';

const MASTER_PROMPTS: MasterPrompts = {
  prompts: MASTER_PROMPTS_JSON.prompts.map((p) => ({
    ...p,
    pillar: 'Speed',
    aspectRatio: '1:1',
  })),
};

function okImageReply(base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') {
  return {
    candidates: [
      {
        finishReason: 'STOP',
        content: {
          parts: [{ inlineData: { mimeType: 'image/png', data: base64Data } }],
        },
      },
    ],
  };
}

function safetyBlockReply() {
  return {
    candidates: [
      {
        finishReason: 'SAFETY',
        content: {
          parts: [],
        },
      },
    ],
  };
}

function createMockSupabase() {
  const assets: any[] = [];
  const creditSpends: any[] = [];
  const creditRefunds: any[] = [];
  let userBalance = 100;

  const client: any = {
    _assets: assets,
    _creditSpends: creditSpends,
    _creditRefunds: creditRefunds,
    rpc: async (fn: string, args: any) => {
      if (fn === 'campaign_spend_credits') {
        if (userBalance < args.p_amount) {
          return { data: null, error: { message: 'insufficient_credits' } };
        }
        userBalance -= args.p_amount;
        creditSpends.push(args);
        return { data: userBalance, error: null };
      }
      if (fn === 'campaign_refund_credits') {
        creditRefunds.push(args);
        userBalance += 1;
        return { data: userBalance, error: null };
      }
      return { data: null, error: new Error(`Unknown RPC ${fn}`) };
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { tier: 'Free' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_assets') {
        return {
          insert: (record: any) => {
            const inserted = { id: `asset-${assets.length + 1}`, ...record, created_at: new Date().toISOString() };
            assets.push(inserted);
            return {
              select: () => ({
                single: async () => ({ data: inserted, error: null }),
              }),
            };
          },
          select: (_cols?: string) => {
            const filters: ((item: any) => boolean)[] = [];
            let sortCol: string | null = null;
            let sortAsc = true;
            const query: any = {
              eq: (col: string, val: any) => {
                filters.push((item) => item[col] === val);
                return query;
              },
              order: (col: string, opts?: any) => {
                sortCol = col;
                sortAsc = opts?.ascending !== false;
                return query;
              },
              limit: (n: number) => {
                let res = assets.filter((item) => filters.every((f) => f(item)));
                if (sortCol) {
                  res = [...res].sort((a, b) => (sortAsc ? (a[sortCol!] > b[sortCol!] ? 1 : -1) : (a[sortCol!] < b[sortCol!] ? 1 : -1)));
                }
                return Promise.resolve({ data: res.slice(0, n), error: null });
              },
              then: (resolve: any, reject: any) => {
                const res = assets.filter((item) => filters.every((f) => f(item)));
                return Promise.resolve({ data: res, error: null }).then(resolve, reject);
              },
            };
            return query;
          },
          update: (patch: any) => {
            const filters: ((item: any) => boolean)[] = [];
            const query: any = {
              eq: (col: string, val: any) => {
                filters.push((item) => item[col] === val);
                return query;
              },
              in: (col: string, vals: any[]) => {
                filters.push((item) => vals.includes(item[col]));
                return query;
              },
              lt: (col: string, val: any) => {
                filters.push((item) => item[col] < val);
                return query;
              },
              select: async () => {
                const matched = assets.filter((item) => filters.every((f) => f(item)));
                matched.forEach((m) => Object.assign(m, patch));
                return { data: matched, error: null };
              },
              then: (resolve: any, reject: any) => {
                const matched = assets.filter((item) => filters.every((f) => f(item)));
                matched.forEach((m) => Object.assign(m, patch));
                return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
              },
            };
            return query;
          },
        };
      }
      return {};
    },
  };

  return client;
}

test('creatives agent: rejects if approved master prompts are missing', async () => {
  const run = { ...RUN, current_step: 'creatives' as const };
  await assert.rejects(
    creativesAgent.run({
      run,
      upstream: {},
      deadlineAt: deadline(),
    }),
    /Master prompts missing/,
  );
});

test('creatives agent: rejects if master prompts count does not match run.settings.creativeCount', async () => {
  const run = { ...RUN, current_step: 'creatives' as const, settings: { ...RUN.settings, creativeCount: 3 } };
  await assert.rejects(
    creativesAgent.run({
      run,
      upstream: { master_prompts: MASTER_PROMPTS }, // has 5 prompts
      deadlineAt: deadline(),
    }),
    /Prompt count mismatch/,
  );
});

test('creatives agent: bulk generates 5 images, charges credits before generation, stores in campaign_assets', async () => {
  const db = createMockSupabase();
  const calls: any[] = [];
  const fakeImageClient: GenAIClientLike = {
    models: {
      async generateContent(args: any) {
        calls.push(args);
        return okImageReply();
      },
    },
  };

  const run = { ...RUN, current_step: 'creatives' as const, settings: { ...RUN.settings, creativeCount: 5 } };
  const res = await creativesAgent.run({
    run,
    upstream: { master_prompts: MASTER_PROMPTS },
    deadlineAt: deadline(),
    client: db,
    userId: 'u1',
    imageClient: fakeImageClient,
  });

  // Verify output summary
  const output = res.output as any;
  assert.equal(output.totalCount, 5);
  assert.equal(output.readyCount, 5);
  assert.equal(output.failedCount, 0);

  // 5 image calls were made
  assert.equal(calls.length, 5);

  // Invariant: Prompt strictly excludes text-in-image instructions
  for (const call of calls) {
    const promptText = call.contents.parts[0].text;
    assert.match(promptText, /Clean background visual only/);
    assert.match(promptText, /Do not render any typography, text, letters, numbers, watermarks, or logos/);
  }

  // 5 atomic credit spends via campaign_spend_credits occurred
  assert.equal(db._creditSpends.length, 5);
  assert.equal(db._creditRefunds.length, 0);

  // 5 rows in campaign_assets with overlay and image_url
  assert.equal(db._assets.length, 5);
  for (let i = 0; i < 5; i++) {
    const asset = db._assets[i];
    assert.equal(asset.status, 'ready');
    assert.equal(asset.creative_index, i + 1);
    assert.ok(asset.image_url.startsWith('data:image/png;base64,'));
    assert.equal(asset.overlay.headline, MASTER_PROMPTS.prompts[i].headline);
    assert.equal(asset.overlay.cta, MASTER_PROMPTS.prompts[i].cta);
    assert.equal(asset.credits_charged, 1);
  }
});

test('creatives agent: partial success refunds failed images and marks them failed', async () => {
  const db = createMockSupabase();
  let callCount = 0;
  const fakeImageClient: GenAIClientLike = {
    models: {
      async generateContent() {
        callCount++;
        // Concept 2 triggers a safety block
        if (callCount === 2) {
          return safetyBlockReply();
        }
        // Concept 4 throws a generation error
        if (callCount === 4) {
          throw new Error('Overloaded server');
        }
        return okImageReply();
      },
    },
  };

  const run = { ...RUN, current_step: 'creatives' as const, settings: { ...RUN.settings, creativeCount: 5 } };
  const res = await creativesAgent.run({
    run,
    upstream: { master_prompts: MASTER_PROMPTS },
    deadlineAt: deadline(),
    client: db,
    userId: 'u1',
    imageClient: fakeImageClient,
  });

  const output = res.output as any;
  assert.equal(output.totalCount, 5);
  assert.equal(output.readyCount, 3);
  assert.equal(output.failedCount, 2);

  // 5 spends, but 2 refunds for the 2 failed images
  assert.equal(db._creditSpends.length, 5);
  assert.equal(db._creditRefunds.length, 2);

  // Concept 2 and 4 should be marked failed with credits_charged = 0
  assert.equal(db._assets[1].status, 'failed');
  assert.equal(db._assets[1].credits_charged, 0);
  assert.match(db._assets[1].error, /safety filters/);

  assert.equal(db._assets[3].status, 'failed');
  assert.equal(db._assets[3].credits_charged, 0);
  assert.match(db._assets[3].error, /Overloaded server/);

  // Concept 1, 3, 5 are ready with 1 credit charged
  assert.equal(db._assets[0].status, 'ready');
  assert.equal(db._assets[2].status, 'ready');
  assert.equal(db._assets[4].status, 'ready');
});

test('generateSingleCreative: retries just one concept without touching others', async () => {
  const db = createMockSupabase();
  const fakeImageClient: GenAIClientLike = {
    models: {
      async generateContent() {
        return okImageReply('RETRIEDIMAGE');
      },
    },
  };

  const asset = await generateSingleCreative({
    runId: 'r1',
    userId: 'u1',
    creativeIndex: 2,
    prompt: MASTER_PROMPTS.prompts[1],
    quality: 'Standard',
    client: db,
    imageClient: fakeImageClient,
    feedback: 'Make it warmer with morning sun',
  });

  assert.equal(asset.status, 'ready');
  assert.equal(asset.creative_index, 2);
  assert.equal(asset.version, 1);
  assert.equal(asset.credits_charged, 1);
  assert.match(asset.prompt, /Make it warmer with morning sun/);
  assert.equal(db._creditSpends.length, 1);
});

test('normalizeAspectRatio handles standard formats cleanly', () => {
  assert.equal(normalizeAspectRatio('1:1'), '1:1');
  assert.equal(normalizeAspectRatio('9:16'), '9:16');
  assert.equal(normalizeAspectRatio('16:9'), '16:9');
  assert.equal(normalizeAspectRatio('4:5'), '3:4');
  assert.equal(normalizeAspectRatio('unknown'), '1:1');
  assert.equal(normalizeAspectRatio(null), '1:1');
});
