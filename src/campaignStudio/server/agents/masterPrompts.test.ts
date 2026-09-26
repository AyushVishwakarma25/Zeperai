import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATIVE_DIRECTION_JSON, MASTER_PROMPTS_JSON, BRAND, RUN, STRATEGY, deadline, fakeGemini, okReply, promptOf } from './fixtures.js';
import { masterPromptsAgent, parseMasterPrompts } from './masterPrompts.js';
import { parseCreativeDirection } from './creativeDirection.js';

const DIRECTION = parseCreativeDirection(CREATIVE_DIRECTION_JSON, STRATEGY.creativeMix);
const upstream = { brand_analysis: BRAND, strategy: STRATEGY, creative_direction: DIRECTION };
const ctx = (g: ReturnType<typeof fakeGemini>, extra: Record<string, unknown> = {}) =>
  ({ run: { ...RUN, current_step: 'master_prompts' as const }, upstream, deadlineAt: deadline(), geminiClient: g.client, ...extra });

test('master prompts: Flash model, JSON-schema mode, no tools; brand/strategy/direction all reach the prompt', async () => {
  const g = fakeGemini([okReply(MASTER_PROMPTS_JSON)]);
  const res = await masterPromptsAgent.run(ctx(g));
  assert.equal(g.calls[0].model, 'gemini-flash-latest');
  const cfg = g.calls[0].config;
  assert.equal(cfg.tools, undefined);
  assert.equal(cfg.responseMimeType, 'application/json');
  const p = promptOf(g.calls[0]);
  assert.match(p, /<brand_context>/);
  assert.match(p, /<strategy_inputs>/);
  assert.match(p, /speed-1/);
  assert.match(p, /5 concepts/);
  assert.match(g.calls[0].config.systemInstruction, /must never contain words, letters, numbers, logos/);
  const out = (res.output as any).prompts;
  assert.equal(out.length, 5);
});

test('pillar and aspectRatio are server-set from the concept/run settings, never trusted from the model', async () => {
  const spoofed = { prompts: MASTER_PROMPTS_JSON.prompts.map((p: any) => ({ ...p, pillar: 'HACKED', aspectRatio: '16:9' })) };
  const g = fakeGemini([okReply(spoofed)]);
  const run = { ...RUN, current_step: 'master_prompts' as const, settings: { ...RUN.settings, aspectRatio: '4:3' } };
  const out = (await masterPromptsAgent.run({ run, upstream, deadlineAt: deadline(), geminiClient: g.client })).output as any;
  assert.ok(out.prompts.every((p: any) => p.aspectRatio === '4:3'));
  assert.equal(out.prompts.find((p: any) => p.conceptId === 'speed-1').pillar, 'Speed');
});

test('missing a concept id triggers a repair call naming exactly which one', async () => {
  const missing = { prompts: MASTER_PROMPTS_JSON.prompts.filter((p: any) => p.conceptId !== 'protein-proof-2') };
  const g = fakeGemini([okReply(missing), okReply(MASTER_PROMPTS_JSON)]);
  const res = await masterPromptsAgent.run(ctx(g));
  assert.equal(g.calls.length, 2);
  assert.match(promptOf(g.calls[1]), /Missing prompts for concept id\(s\): protein-proof-2/);
  assert.equal((res.output as any).prompts.length, 5);
});

test('an unknown or duplicated conceptId is rejected', async () => {
  const unknown = { prompts: [{ ...MASTER_PROMPTS_JSON.prompts[0], conceptId: 'made-up-1' }] };
  const g = fakeGemini([okReply(unknown), okReply(MASTER_PROMPTS_JSON)]);
  await masterPromptsAgent.run(ctx(g));
  assert.match(promptOf(g.calls[1]), /"made-up-1" does not match any of the given concepts/);

  const dup = { prompts: [MASTER_PROMPTS_JSON.prompts[0], MASTER_PROMPTS_JSON.prompts[0]] };
  assert.throws(() => parseMasterPrompts(dup, DIRECTION.concepts, '1:1'), /appears more than once/);
});

test('missing headline/imagePrompt is rejected with the concept id named', () => {
  assert.throws(() => parseMasterPrompts({ prompts: [{ conceptId: 'speed-1', cta: 'go', imagePrompt: 'x' }] }, DIRECTION.concepts, '1:1'), /"speed-1" is missing a headline/);
  assert.throws(() => parseMasterPrompts({ prompts: [{ conceptId: 'speed-1', headline: 'h', cta: 'go' }] }, DIRECTION.concepts, '1:1'), /"speed-1" is missing an imagePrompt/);
});

test('cta falls back to the concept cta when the model omits it', () => {
  const out = parseMasterPrompts({ prompts: [{ conceptId: 'speed-1', headline: 'h', imagePrompt: 'i' }] }, DIRECTION.concepts.slice(0, 1), '1:1');
  assert.equal(out.prompts[0].cta, DIRECTION.concepts[0].cta);
});

test('redo: feedback + previous prompts reach the model', async () => {
  const g = fakeGemini([okReply(MASTER_PROMPTS_JSON)]);
  await masterPromptsAgent.run(ctx(g, { feedback: 'Make the headlines punchier', previous: { output: { prompts: [] }, input_snapshot: {} } }));
  const p = promptOf(g.calls[0]);
  assert.match(p, /<previous_output>/);
  assert.match(p, /Make the headlines punchier/);
});

test('missing approved creative direction is a clear error; not hand-editable', async () => {
  const g = fakeGemini([okReply(MASTER_PROMPTS_JSON)]);
  await assert.rejects(masterPromptsAgent.run({ run: RUN, upstream: { brand_analysis: BRAND, strategy: STRATEGY }, deadlineAt: deadline(), geminiClient: g.client }), /creative direction is missing/);
  assert.equal(masterPromptsAgent.parseEdited, undefined);
});

test('fixture sanity: parseCreativeDirection(CREATIVE_DIRECTION_JSON) matches the concept ids MASTER_PROMPTS_JSON expects', () => {
  assert.deepEqual(DIRECTION.concepts.map((c) => c.id).sort(), MASTER_PROMPTS_JSON.prompts.map((p) => p.conceptId).sort());
});
