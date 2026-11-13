import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type CampaignAsset,
  type CreativeOverlay,
  isCreativeEligibleForExport,
  resolveCreativeLifecycleStatus,
} from '../../types.js';
import { classifyCreativeError } from '../errors/creativeErrors.js';
import { generateSingleCreative } from './creatives.js';

test('resolveCreativeLifecycleStatus: correctly partitions all lifecycle states', () => {
  const baseAsset: CampaignAsset = {
    id: 'asset-1',
    run_id: 'run-1',
    user_id: 'user-1',
    creative_index: 1,
    version: 1,
    status: 'generating',
    prompt: 'Clean visual',
    aspect_ratio: '1:1',
    model: 'gemini-2.5-flash-image',
    image_url: null,
    storage_path: null,
    overlay: {},
    credits_charged: 1,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Generating
  assert.equal(resolveCreativeLifecycleStatus(baseAsset), 'Generating');

  // 2. Failed
  assert.equal(
    resolveCreativeLifecycleStatus({
      ...baseAsset,
      status: 'failed',
      error: 'AI service configuration error.',
    }),
    'Failed',
  );

  // 3. QA Incomplete (Deterministic checks only, visual unverified)
  const readyAsset: CampaignAsset = {
    ...baseAsset,
    status: 'ready',
    image_url: 'data:image/png;base64,sample',
    overlay: {
      headline: 'Taste the World',
      cta: 'Shop Now',
      evaluation: {
        creativeId: 'doc-1',
        totalScore: 68,
        status: 'partially_evaluated',
        scores: {
          visualHierarchy: 12,
          productAccuracy: 12,
          brandConsistency: 10,
          typography: 10,
          visualQuality: 10,
          messageClarity: 6,
          technicalCompliance: 4,
        },
        issues: [],
        hardRuleFailures: [],
        passed: false,
        visual: { status: 'unverified', checksRun: false },
        evaluatedAt: new Date().toISOString(),
      },
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(readyAsset), 'QA Incomplete');

  // 4. Critical QA Failure -> Must force Needs Revision even if aggregate score is high!
  const criticalFailedAsset: CampaignAsset = {
    ...readyAsset,
    overlay: {
      ...readyAsset.overlay,
      evaluation: {
        ...readyAsset.overlay.evaluation!,
        totalScore: 78,
        hardRuleFailures: ['Headline extends beyond container margins.'],
      },
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(criticalFailedAsset), 'Needs Revision');

  // 5. Ready for Review (Full QA passed, awaiting human decision)
  const fullyVerifiedAsset: CampaignAsset = {
    ...readyAsset,
    overlay: {
      ...readyAsset.overlay,
      renderedCompositeUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      document: {
        id: 'doc-1',
        conceptId: 'concept-1',
        version: 1,
        advertisingFormat: 'Promotional Product Advertisement',
        designIntensity: 'balanced',
        canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
        layers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      evaluation: {
        ...readyAsset.overlay.evaluation!,
        totalScore: 84,
        status: 'passed',
        passed: true,
        approvalEligible: true,
        documentVersion: 1,
        hardRuleFailures: [],
        visual: { status: 'passed', checksRun: true },
      },
      approvalStatus: 'pending_review',
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(fullyVerifiedAsset), 'Ready for Review');

  // 6. User Revision Requested
  const userRevisionAsset: CampaignAsset = {
    ...fullyVerifiedAsset,
    overlay: {
      ...fullyVerifiedAsset.overlay,
      approvalStatus: 'needs_revision',
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(userRevisionAsset), 'Needs Revision');

  // 7. Approved
  const approvedAsset: CampaignAsset = {
    ...fullyVerifiedAsset,
    overlay: {
      ...fullyVerifiedAsset.overlay,
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(approvedAsset), 'Approved');

  // 8. If an approved asset has a critical QA failure introduced, it MUST block approval
  const compromisedAsset: CampaignAsset = {
    ...approvedAsset,
    overlay: {
      ...approvedAsset.overlay,
      evaluation: {
        ...approvedAsset.overlay.evaluation!,
        hardRuleFailures: ['Missing product packshot.'],
      },
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(compromisedAsset), 'Needs Revision');

  // 9. Document mutated after approval (version mismatch) -> Incomplete QA, cannot stay Approved!
  const staleApprovedAsset: CampaignAsset = {
    ...approvedAsset,
    overlay: {
      ...approvedAsset.overlay,
      document: {
        ...approvedAsset.overlay.document!,
        version: 2, // doc incremented, eval is v1
      },
    },
  };
  assert.equal(resolveCreativeLifecycleStatus(staleApprovedAsset), 'QA Incomplete');
});

test('isCreativeEligibleForExport: strictly enforces explicit approval & critical rules', () => {
  const baseAsset: CampaignAsset = {
    id: 'asset-1',
    run_id: 'run-1',
    user_id: 'user-1',
    creative_index: 1,
    version: 1,
    status: 'ready',
    prompt: 'Prompt',
    aspect_ratio: '1:1',
    model: 'gemini-2.5-flash-image',
    image_url: 'data:image/png;base64,data',
    storage_path: null,
    overlay: {},
    credits_charged: 1,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Unapproved creative is NOT eligible
  assert.equal(isCreativeEligibleForExport(baseAsset), false);

  // Partial QA without approval is NOT eligible
  assert.equal(
    isCreativeEligibleForExport({
      ...baseAsset,
      overlay: {
        approvalStatus: 'pending_review',
        evaluation: {
          creativeId: 'doc-1',
          totalScore: 70,
          status: 'partially_evaluated',
          scores: null,
          issues: [],
          hardRuleFailures: [],
          passed: false,
          visual: { status: 'unverified', checksRun: false },
          evaluatedAt: '',
        },
      },
    }),
    false,
  );

  // Approved creative with zero hard failures, passed visual QA, matching doc version IS eligible
  assert.equal(
    isCreativeEligibleForExport({
      ...baseAsset,
      overlay: {
        approvalStatus: 'approved',
        renderedCompositeUrl: 'data:image/png;base64,sample',
        document: {
          id: 'doc-1',
          conceptId: 'concept-1',
          version: 1,
          advertisingFormat: 'Promotional',
          designIntensity: 'balanced',
          canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
          layers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        evaluation: {
          creativeId: 'doc-1',
          totalScore: 82,
          status: 'passed',
          approvalEligible: true,
          documentVersion: 1,
          scores: null,
          issues: [],
          hardRuleFailures: [],
          passed: true,
          visual: { status: 'passed', checksRun: true },
          evaluatedAt: '',
        },
      },
    }),
    true,
  );

  // Approved creative with hard compliance failure is NOT eligible
  assert.equal(
    isCreativeEligibleForExport({
      ...baseAsset,
      overlay: {
        approvalStatus: 'approved',
        evaluation: {
          creativeId: 'doc-1',
          totalScore: 82,
          status: 'passed',
          approvalEligible: true,
          scores: null,
          issues: [],
          hardRuleFailures: ['Product label clipped.'],
          passed: false,
          visual: { status: 'passed', checksRun: true },
          evaluatedAt: '',
        },
      },
    }),
    false,
  );

  // Approved creative with document version mismatch is NOT eligible
  assert.equal(
    isCreativeEligibleForExport({
      ...baseAsset,
      overlay: {
        approvalStatus: 'approved',
        renderedCompositeUrl: 'data:image/png;base64,sample',
        document: {
          id: 'doc-1',
          conceptId: 'concept-1',
          version: 2,
          advertisingFormat: 'Promotional',
          designIntensity: 'balanced',
          canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
          layers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        evaluation: {
          creativeId: 'doc-1',
          totalScore: 85,
          status: 'passed',
          approvalEligible: true,
          documentVersion: 1, // Stale!
          scores: null,
          issues: [],
          hardRuleFailures: [],
          passed: true,
          visual: { status: 'passed', checksRun: true },
          evaluatedAt: '',
        },
      },
    }),
    false,
  );
});

test('classifyCreativeError: sanitizes raw Google Cloud errors into user-safe badges without stack traces', () => {
  // 1. Google Cloud ADC / default-credentials error (seen in screenshot)
  const adcError = new Error('Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.');
  const classifiedAdc = classifyCreativeError(adcError);
  assert.equal(classifiedAdc.code, 'AUTH_CONFIG');
  assert.equal(classifiedAdc.category, 'authentication');
  assert.equal(classifiedAdc.retryable, false);
  assert.ok(!classifiedAdc.userMessage.includes('https://cloud.google.com'));

  // 2. Vertex AI 404 Publisher model not found (seen in screenshot)
  const model404 = JSON.stringify({
    error: {
      code: 404,
      message: 'Publisher model `projects/zeperai/locations/us-central1/publishers/google/models/gemini-1.5-flash` was not found or your project does not have access to it.',
      status: 'NOT_FOUND',
    },
  });
  const classified404 = classifyCreativeError(model404);
  assert.equal(classified404.code, 'MODEL_UNAVAILABLE');
  assert.equal(classified404.category, 'model_availability');
  assert.equal(classified404.retryable, true);
  assert.ok(!classified404.userMessage.includes('projects/zeperai'));

  // 3. Quota exhausted / 402 Prepayment depleted
  const quota402 = '{"error":{"code":402,"message":"Your prepayment credits are depleted. Please go to AI Studio...","status":"RESOURCE_EXHAUSTED"}}';
  const classifiedQuota = classifyCreativeError(quota402);
  assert.equal(classifiedQuota.code, 'RATE_LIMIT');
  assert.equal(classifiedQuota.retryable, true);

  // 4. Timeout
  const timeoutErr = new Error('504 Gateway Timeout: Deadline exceeded');
  const classifiedTimeout = classifyCreativeError(timeoutErr);
  assert.equal(classifiedTimeout.code, 'TIMEOUT');
  assert.equal(classifiedTimeout.retryable, true);

  // 5. Safety block
  const safetyErr = new Error('Generation blocked by safety filters.');
  const classifiedSafety = classifyCreativeError(safetyErr);
  assert.equal(classifiedSafety.code, 'SAFETY_FILTER');
  assert.equal(classifiedSafety.category, 'content_policy');
});

test('generateSingleCreative: catches GCP failures, categorizes user-safe error, and refunds idempotently', async () => {
  let refundCallCount = 0;
  const assets: any[] = [];
  const fakeClient: any = {
    rpc: async (fn: string, args: any) => {
      if (fn === 'campaign_spend_credits') return { data: 1, error: null };
      if (fn === 'campaign_refund_credits') {
        refundCallCount++;
        return { data: 1, error: null };
      }
      return { data: null, error: null };
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { tier: 'Pro' } }),
            }),
          }),
        };
      }
      return {
        insert: (record: any) => ({
          select: () => ({
            single: async () => ({ data: { id: 'asset-1', ...record }, error: null }),
          }),
        }),
        update: (patch: any) => {
          const updateQuery: any = {
            eq: () => updateQuery,
            in: () => updateQuery,
            lt: () => updateQuery,
            select: () => updateQuery,
            maybeSingle: async () => ({ data: { id: 'asset-1', ...patch }, error: null }),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ id: 'asset-1', ...patch }], error: null }).then(resolve, reject),
          };
          return updateQuery;
        },
        select: () => {
          const query: any = {
            eq: () => query,
            order: () => query,
            limit: () => Promise.resolve({ data: [], error: null }),
          };
          return query;
        },
      };
    },
  };

  // Fake image client that throws the exact GCP publisher model 404 error
  const fakeImageClient: any = {
    models: {
      generateContent: async () => {
        throw new Error('Publisher model `projects/zeperai/locations/us-central1/publishers/google/models/gemini-1.5-flash` was not found.');
      },
    },
  };

  const asset = await generateSingleCreative({
    runId: 'test-run-123',
    userId: 'user-abc',
    creativeIndex: 1,
    prompt: {
      conceptId: 'concept-1',
      pillar: 'Taste',
      headline: 'Authentic Flavors',
      subheadline: 'Crafted with passion',
      cta: 'Order Now',
      imagePrompt: 'Studio lighting food backdrop',
      aspectRatio: '1:1',
      negativePrompt: 'blurry',
      referenceImageUrls: [],
    },
    quality: 'Standard',
    client: fakeClient,
    imageClient: fakeImageClient,
  });

  // Verify asset state is failed
  assert.equal(asset.status, 'failed');
  assert.equal(asset.credits_charged, 0);

  // Verify error message is human-friendly and DOES NOT leak project path
  assert.ok(!asset.error?.includes('projects/zeperai'));
  assert.ok(asset.error?.includes('visual model is unavailable'));

  // Verify overlay contains structured error details
  const overlay = asset.overlay as CreativeOverlay;
  assert.equal(overlay.errorDetail?.code, 'MODEL_UNAVAILABLE');
  assert.equal(overlay.approvalStatus, 'needs_revision');

  // Verify credits were refunded exactly once
  assert.equal(refundCallCount, 1);
});

test('adaptCreativeDocument: AI native background expansion preserves typography & safe zones', async () => {
  const { adaptCreativeDocument } = await import('../adaptation/creativeAdapter.js');
  const { buildCreativeDocument } = await import('../composition/compositor.js');

  const doc = buildCreativeDocument({
    blueprint: {
      id: 'bp-test',
      conceptId: 'concept-1',
      version: 1,
      status: 'draft',
      marketingAngle: 'Organic Health',
      advertisingFormat: 'Promotional Product Advertisement',
      designIntensity: 'balanced',
      designConcept: 'Pure Organic Matcha',
      visualNarrative: 'Direct from Kyoto hills',
      canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
      artDirection: {
        visualStyle: 'Studio minimalism',
        mood: 'calm, premium',
        background: 'Minimal bamboo tabletop',
        colorPalette: ['#1B4332', '#D8F3DC'],
        photographyStyle: 'Diffused morning light',
        lighting: 'Soft directional studio',
      },
      layout: {
        composition: 'Balanced commercial composition',
        readingOrder: ['main_headline', 'product', 'cta'],
        productPlacement: 'Center anchor with ground shadow',
        productScale: 0.6,
        safeZones: [],
        elements: [
          { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
          { element: 'product', x: 0.15, y: 0.35, width: 0.7, height: 0.45 },
          { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07 },
        ],
      },
      typography: {
        headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFFFFF' },
        hierarchy: [],
      },
      copy: {
        headline: 'Pure Organic Matcha',
        subheadline: 'Direct from Kyoto',
        cta: 'Taste The Difference',
      },
      graphicElements: [],
      assets: { productAssetIds: [], referenceIds: [] },
      constraints: {
        preserveProductPackaging: true,
        preserveLogo: true,
        exactCopyRequired: true,
        prohibitInventedClaims: true,
      },
    },
    backgroundUrl: 'data:image/png;base64,original1x1',
    brandName: 'ZenMatcha',
    brandColors: ['#1B4332', '#D8F3DC'],
  });

  // Adapt to 9:16 Stories with AI-resized background
  const aiExpandedBg = 'data:image/png;base64,aiExpanded9x16';
  const adapted9x16 = adaptCreativeDocument(doc, '9:16', { aiBackgroundUrl: aiExpandedBg });

  assert.equal(adapted9x16.document.canvas.aspectRatio, '9:16');
  assert.equal(adapted9x16.document.canvas.width, 1080);
  assert.equal(adapted9x16.document.canvas.height, 1920);

  // Background layer must reflect the native AI background
  const bgLayer = adapted9x16.document.layers.find((l) => l.type === 'background');
  assert.equal(bgLayer?.assetId, aiExpandedBg);

  // Metadata tracks AI expansion
  assert.equal(adapted9x16.document.metadata?.isAiExpanded, true);

  // Composite URL must be generated
  assert.ok(adapted9x16.compositeUrl.startsWith('data:image/svg+xml'));
});

