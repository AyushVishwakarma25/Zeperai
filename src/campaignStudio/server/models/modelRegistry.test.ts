/**
 * CAMPAIGN STUDIO V2 - Unit Tests for AI Model Configuration Registry.
 *
 * Verifies official Google Gemini / Vertex AI model lifecycles, task separation,
 * explicit fallback chains without silent downgrades, rate-limit resilience,
 * and pre-flight configuration health validation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MODEL_REGISTRY,
  TASK_TIMEOUT_MS,
  checkModelConfigurationHealth,
  checkProviderHealth,
  clearFallbackHistory,
  clearUnavailableModels,
  getFallbackHistory,
  getFallbackModelFor,
  isModelMarkedUnavailable,
  markModelUnavailable,
  recordModelFallback,
  resolveModelForTask,
  type CampaignTask,
} from './modelRegistry.js';

test.beforeEach(() => {
  clearUnavailableModels();
  clearFallbackHistory();
  delete process.env.CAMPAIGN_MODEL_STRATEGY;
  delete process.env.CAMPAIGN_MODEL_COPY;
  delete process.env.CAMPAIGN_MODEL_IMAGE_STANDARD;
  delete process.env.CAMPAIGN_MODEL_VISION_QA;
  delete process.env.VERTEX_PRO_MODEL;
});

// ---------------------------------------------------------------------------
// 1. Registry Integrity & Official Documentation Grounding
// ---------------------------------------------------------------------------

test('modelRegistry: all registered models have documented lifecycle and official verification source', () => {
  const modelIds = Object.keys(MODEL_REGISTRY);
  assert.ok(modelIds.length >= 7, 'Must register standard Google Gemini & Nano Banana models');

  for (const id of modelIds) {
    const m = MODEL_REGISTRY[id];
    assert.equal(m.id, id);
    assert.ok(m.displayName, `Model ${id} must have displayName`);
    assert.ok(m.provider === 'google-ai-studio' || m.provider === 'google-vertex-ai');
    assert.ok(m.tasks.length > 0, `Model ${id} must support at least one task`);
    assert.ok(m.inputTypes.length > 0, `Model ${id} must declare supported input types`);
    assert.ok(m.outputTypes.length > 0, `Model ${id} must declare supported output types`);
    assert.ok(m.lifecycle.verifiedAt, `Model ${id} must specify verification date`);
    assert.ok(m.lifecycle.verificationSource, `Model ${id} must cite official documentation source`);
  }
});

test('modelRegistry: officially verifies Imagen 3 is marked as shut down', () => {
  const imagen = MODEL_REGISTRY['imagen-3.0-generate-002'];
  assert.ok(imagen, 'Imagen 3 must be registered in deprecation index');
  assert.equal(imagen.lifecycle.status, 'shutdown');
  assert.equal(imagen.defaultFallbackModelId, 'gemini-nano-banana-2.1');
  assert.ok(imagen.lifecycle.verificationSource.includes('Shutdown'));
});

// ---------------------------------------------------------------------------
// 2. Strict Separation of Models Across Tasks
// ---------------------------------------------------------------------------

test('modelRegistry: separates models by task capability', () => {
  // Strategy reasoning model
  const strategyRes = resolveModelForTask('reasoning_strategy');
  assert.equal(strategyRes.task, 'reasoning_strategy');
  assert.equal(strategyRes.model, 'gemini-3.1-pro-preview');
  assert.ok(strategyRes.capabilities.supportsThinking, 'Strategy model must support Thinking');

  // Vision QA model
  const visionQaRes = resolveModelForTask('vision_qa');
  assert.equal(visionQaRes.task, 'vision_qa');
  assert.ok(visionQaRes.capabilities.supportsVisionInput, 'Vision QA model must support vision input');

  // Reference Analysis model
  const refRes = resolveModelForTask('reference_analysis');
  assert.equal(refRes.task, 'reference_analysis');
  assert.ok(refRes.capabilities.supportsVisionInput, 'Reference analysis model must support vision input');

  // Image Generation Standard
  const imgRes = resolveModelForTask('image_generation_standard');
  assert.equal(imgRes.task, 'image_generation_standard');
  assert.equal(imgRes.model, 'gemini-nano-banana-2.1');

  // Image Generation Pro
  const imgProRes = resolveModelForTask('image_generation_pro');
  assert.equal(imgProRes.task, 'image_generation_pro');
  assert.equal(imgProRes.model, 'gemini-3-pro-image');
  assert.ok(imgProRes.capabilities.supportsThinking, 'Pro image model must support Thinking for compositions');
});

// ---------------------------------------------------------------------------
// 3. Explicit Fallbacks & No Silent Downgrades
// ---------------------------------------------------------------------------

test('modelRegistry: intercepts discontinued Imagen requests with explicit recorded fallback', () => {
  process.env.CAMPAIGN_MODEL_IMAGE_STANDARD = 'imagen-3.0-generate-002';
  const res = resolveModelForTask('image_generation_standard');

  assert.equal(res.requestedModel, 'imagen-3.0-generate-002');
  assert.equal(res.model, 'gemini-nano-banana-2.1', 'Must upgrade Imagen 3 to Nano Banana 2.1');
  assert.equal(res.fallbackApplied, true);
  assert.ok(res.fallbackReason?.includes('shut down'));

  const history = getFallbackHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].requestedModel, 'imagen-3.0-generate-002');
  assert.equal(history[0].resolvedModel, 'gemini-nano-banana-2.1');
});

test('modelRegistry: routes to fallback when primary model is marked unavailable', () => {
  markModelUnavailable('gemini-3.1-pro-preview', 'Simulated 404/quota outage');
  assert.equal(isModelMarkedUnavailable('gemini-3.1-pro-preview'), true);

  const res = resolveModelForTask('reasoning_strategy');
  assert.equal(res.requestedModel, 'gemini-3.1-pro-preview');
  assert.equal(res.model, 'gemini-flash-latest');
  assert.equal(res.fallbackApplied, true);
  assert.ok(res.fallbackReason?.includes('marked unavailable'));

  const history = getFallbackHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].resolvedModel, 'gemini-flash-latest');
});

test('modelRegistry: Vertex AI Pro routing automatically falls back to gemini-2.5-flash unless explicitly enabled', () => {
  const vertexRes = resolveModelForTask('reasoning_strategy', { provider: 'google-vertex-ai' });
  assert.equal(vertexRes.provider, 'google-vertex-ai');
  assert.equal(vertexRes.requestedModel, 'gemini-2.5-pro');
  assert.equal(vertexRes.model, 'gemini-2.5-flash');
  assert.equal(vertexRes.fallbackApplied, true);
  assert.ok(vertexRes.fallbackReason?.includes('restricted'));
});

// ---------------------------------------------------------------------------
// 4. Environment-Driven Configuration
// ---------------------------------------------------------------------------

test('modelRegistry: respects valid environment variable overrides', () => {
  process.env.CAMPAIGN_MODEL_STRATEGY = 'gemini-3.8-flash';
  process.env.CAMPAIGN_MODEL_COPY = 'gemini-3.8-flash';
  process.env.CAMPAIGN_MODEL_VISION_QA = 'gemini-3.8-flash';

  assert.equal(resolveModelForTask('reasoning_strategy').model, 'gemini-3.8-flash');
  assert.equal(resolveModelForTask('copy_generation').model, 'gemini-3.8-flash');
  assert.equal(resolveModelForTask('vision_qa').model, 'gemini-3.8-flash');
});

// ---------------------------------------------------------------------------
// 5. Pre-Flight Health Check Validation
// ---------------------------------------------------------------------------

test('modelRegistry: checkModelConfigurationHealth verifies healthy configuration for all tasks', async () => {
  const health = await checkModelConfigurationHealth();
  assert.equal(health.healthy, true);
  assert.equal(health.errors.length, 0);

  const tasks: CampaignTask[] = [
    'reasoning_strategy',
    'creative_direction',
    'copy_generation',
    'reference_analysis',
    'vision_qa',
    'research_grounding',
    'image_generation_standard',
    'image_generation_pro',
    'image_generation_lite',
    'targeted_regeneration',
  ];

  for (const t of tasks) {
    const taskStatus = health.tasks[t];
    assert.ok(taskStatus, `Task ${t} must be evaluated in health check`);
    assert.ok(taskStatus.primaryModel, `Task ${t} must have primary model`);
    assert.ok(taskStatus.fallbackModel, `Task ${t} must have fallback model`);
    assert.notEqual(taskStatus.status, 'misconfigured');
  }
});

// ---------------------------------------------------------------------------
// 6. Task Timeouts
// ---------------------------------------------------------------------------

test('modelRegistry: defines safe, realistic timeouts for all tasks', () => {
  assert.equal(TASK_TIMEOUT_MS.reasoning_strategy, 60_000);
  assert.equal(TASK_TIMEOUT_MS.creative_direction, 60_000);
  assert.equal(TASK_TIMEOUT_MS.copy_generation, 45_000);
  assert.equal(TASK_TIMEOUT_MS.vision_qa, 45_000);
  assert.equal(TASK_TIMEOUT_MS.image_generation_standard, 90_000);
  assert.equal(TASK_TIMEOUT_MS.image_generation_pro, 120_000);
});

// ---------------------------------------------------------------------------
// 7. Standard vs Pro Tier Routing & Pricing
// ---------------------------------------------------------------------------

test('modelRegistry: distinct Standard and Pro image routing with accurate pricing and credit cost', () => {
  const std = resolveModelForTask('image_generation_standard', { userTier: 'standard', provider: 'google-vertex-ai' });
  assert.equal(std.model, 'gemini-2.5-flash-image');
  const stdEntry = MODEL_REGISTRY[std.model];
  assert.equal(stdEntry.pricing.internalCreditCost, 1);
  assert.equal(stdEntry.pricing.imageOutputUsd, 0.039);
  assert.ok(stdEntry.regionConstraints?.includes('us-central1'));

  const pro = resolveModelForTask('image_generation_standard', { userTier: 'pro', provider: 'google-vertex-ai' });
  assert.equal(pro.model, 'gemini-3-pro-image');
  const proEntry = MODEL_REGISTRY[pro.model];
  assert.equal(proEntry.pricing.internalCreditCost, 3);
  assert.equal(proEntry.pricing.imageOutputUsd, 0.134);
  assert.ok(proEntry.capabilities.supportsThinking);
});

test('modelRegistry: getFallbackModelFor preserves image modality and flags quality tier shift', () => {
  // Pro image fallback to Standard image
  const proFallback = getFallbackModelFor('gemini-3-pro-image', 'image_generation_pro');
  assert.ok(proFallback);
  assert.equal(proFallback.fallbackModel, 'gemini-2.5-flash-image');
  assert.equal(proFallback.tierShift, true);
  assert.ok(proFallback.reason.includes('Quality tier shift active'));

  // Standard image fallback
  const stdFallback = getFallbackModelFor('gemini-2.5-flash-image', 'image_generation_standard');
  assert.ok(stdFallback);
  assert.equal(stdFallback.fallbackModel, 'gemini-2.5-flash-image');
  assert.equal(stdFallback.tierShift, false);
});

test('modelRegistry: checkProviderHealth probes model access without consuming generation credits', async () => {
  let countTokensCalled = false;
  const mockClient = {
    models: {
      countTokens: async (args: any) => {
        countTokensCalled = true;
        assert.ok(args.model);
        return { totalTokens: 1 };
      },
    },
  };

  const health = await checkProviderHealth({ client: mockClient, testModel: 'gemini-2.5-flash' });
  assert.equal(countTokensCalled, true);
  assert.equal(health.healthy, true);
  assert.ok(health.latencyMs >= 0);
});

