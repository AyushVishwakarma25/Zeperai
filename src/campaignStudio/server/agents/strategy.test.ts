import test from 'node:test';
import assert from 'node:assert/strict';
import { STRATEGY_JSON, BRAND, COMPETITORS, MARKET, RUN, deadline, fakeGemini, okReply, promptOf } from './fixtures.js';
import { parseStrategy, strategyAgent } from './strategy.js';

const upstream = { brand_analysis: BRAND, market_research: MARKET, competitor_research: COMPETITORS };
const ctx = (g: ReturnType<typeof fakeGemini>, extra: Record<string, unknown> = {}) => ({ run: { ...RUN, current_step: 'strategy' as const }, upstream, deadlineAt: deadline(), geminiClient: g.client, ...extra });

test('strategy: Pro model settings, schema mode, all three upstream fences, creative count in the task', async () => {
  const g = fakeGemini([okReply(STRATEGY_JSON)]);
  const res = await strategyAgent.run(ctx(g));
  const cfg = g.calls[0].config;
  assert.equal(g.calls[0].model, 'gemini-3.1-pro-preview');
  assert.equal(cfg.thinkingConfig.thinkingLevel, 'HIGH');
  assert.equal(cfg.tools, undefined);
  assert.equal(cfg.responseMimeType, 'application/json');
  assert.equal(cfg.responseSchema.properties.funnelStage.enum.length, 4);
  const p = promptOf(g.calls[0]);
  for (const tag of ['brand_context', 'market_research', 'competitor_research']) assert.match(p, new RegExp(`<${tag}>\\n\\{`), tag);
  assert.match(p, /Number of static creatives to be produced: 5/);
  assert.match(p, /add up to exactly 5/);
  assert.ok(!p.includes('example.com/a'), 'grounding source URLs are not sent to the strategist');
  assert.equal((res.output as any).bigIdea, STRATEGY_JSON.bigIdea);
  assert.deepEqual((res.output as any).creativeMix, STRATEGY_JSON.creativeMix);
});

test('strategy: redo asks for a genuinely different angle and includes the previous strategy', async () => {
  const g = fakeGemini([okReply(STRATEGY_JSON)]);
  await strategyAgent.run(ctx(g, { feedback: 'I do not like the speed angle. Try festive gifting.', previous: { output: { bigIdea: 'old idea' }, input_snapshot: {} } }));
  const p = promptOf(g.calls[0]);
  assert.match(p, /<previous_output>\n\{"bigIdea":"old idea"\}\n<\/previous_output>/);
  assert.match(p, /I do not like the speed angle\. Try festive gifting\./);
  assert.match(p, /genuinely DIFFERENT big idea/);
});

test('strategy: creativeMix that does not add up triggers a repair call that states the target', async () => {
  const bad = { ...STRATEGY_JSON, creativeMix: [{ pillar: 'Speed', count: 3 }, { pillar: 'Protein proof', count: 1 }] };
  const g = fakeGemini([okReply(bad), okReply(STRATEGY_JSON)]);
  const res = await strategyAgent.run(ctx(g));
  assert.equal(g.calls.length, 2);
  assert.match(promptOf(g.calls[1]), /must add up to exactly 5 \(they add up to 4\)/);
  assert.equal((res.output as any).creativeMix.reduce((n: number, m: any) => n + m.count, 0), 5);
});

test('strategy: respects a non-default creative count from the run settings', async () => {
  const run = { ...RUN, current_step: 'strategy' as const, settings: { ...RUN.settings, creativeCount: 3 } };
  const mix3 = { ...STRATEGY_JSON, creativeMix: [{ pillar: 'Speed', count: 2 }, { pillar: 'Protein proof', count: 1 }] };
  const g = fakeGemini([okReply(mix3)]);
  const res = await strategyAgent.run({ run, upstream, deadlineAt: deadline(), geminiClient: g.client });
  assert.match(promptOf(g.calls[0]), /Number of static creatives to be produced: 3/);
  assert.equal((res.output as any).creativeMix.length, 2);
});

test('strategy: missing approved research is a clear error', async () => {
  const g = fakeGemini([okReply(STRATEGY_JSON)]);
  await assert.rejects(strategyAgent.run(ctx(g, { upstream: { brand_analysis: BRAND } })), /market research is missing/);
  await assert.rejects(strategyAgent.run(ctx(g, { upstream: { brand_analysis: BRAND, market_research: MARKET } })), /competitor research is missing/);
});

test('parseStrategy: valid input is normalised (funnel stage case, pillar name casing, merged duplicates)', () => {
  const out = parseStrategy({
    ...STRATEGY_JSON, funnelStage: 'Conversion',
    creativeMix: [{ pillar: 'speed', count: 2 }, { pillar: 'SPEED', count: 1 }, { pillar: 'protein PROOF', count: 2 }],
  }, 5);
  assert.equal(out.funnelStage, 'conversion');
  assert.deepEqual(out.creativeMix, [{ pillar: 'Speed', count: 3 }, { pillar: 'Protein proof', count: 2 }]);
});

test('parseStrategy: rejects each structural problem with a specific message', () => {
  const bad = (over: Record<string, unknown>, re: RegExp) => assert.throws(() => parseStrategy({ ...STRATEGY_JSON, ...over }, 5), re);
  bad({ bigIdea: '' }, /bigIdea is required/);
  bad({ funnelStage: 'vibes' }, /funnelStage must be one of/);
  bad({ audience: { primary: '' } }, /audience.primary/);
  bad({ keyMessages: [{ message: 'only one', proof: 'x' }] }, /at least 2 keyMessages/);
  bad({ contentPillars: [] }, /at least 1 content pillar/);
  bad({ creativeMix: [{ pillar: 'Unknown pillar', count: 5 }] }, /does not match any contentPillars/);
  bad({ creativeMix: [{ pillar: 'Speed', count: 2.5 }, { pillar: 'Protein proof', count: 2.5 }] }, /whole numbers/);
  bad({ creativeMix: [{ pillar: 'Speed', count: 0 }, { pillar: 'Protein proof', count: 5 }] }, /whole numbers/);
  bad({ creativeMix: [{ pillar: 'Speed', count: 4 }, { pillar: 'Protein proof', count: 2 }] }, /add up to exactly 5 \(they add up to 6\)/);
  bad({ creativeMix: [] }, /add up to exactly 5 \(they add up to 0\)/);
  bad({ creativeFormats: [] }, /at least 1 creative format/);
  assert.throws(() => parseStrategy(null, 5));
});

test('parseStrategy: caps lengths and list sizes', () => {
  const out = parseStrategy({
    ...STRATEGY_JSON, bigIdea: 'x'.repeat(1000), tone: Array.from({ length: 12 }, (_, i) => `t${i}`), guardrails: Array.from({ length: 12 }, (_, i) => `g${i}`),
    contentPillars: Array.from({ length: 6 }, (_, i) => ({ name: `Pillar ${i}`, description: 'd', exampleAd: 'e' })),
    creativeMix: [{ pillar: 'Pillar 0', count: 5 }],
  }, 5);
  assert.equal(out.bigIdea.length, 300);
  assert.equal(out.tone.length, 6);
  assert.equal(out.guardrails.length, 6);
  assert.equal(out.contentPillars.length, 4);
});

test('strategy is not hand-editable in this release', () => {
  assert.equal(strategyAgent.parseEdited, undefined);
});
