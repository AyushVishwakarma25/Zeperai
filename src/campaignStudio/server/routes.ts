/**
 * CAMPAIGN STUDIO - HTTP routes.
 *
 * Registered from server.ts with the app's own auth/limiter/admin-client passed
 * in as dependencies (importing them from server.ts would create a circular
 * import).
 */

import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, asyncHandler } from '../../../utils/errorHandler.js';
import {
  countProductImages,
  createProductImage,
  createReference,
  createRun,
  deleteProductImage,
  deleteReference,
  getReference,
  getRun,
  getRunDetail,
  listAssets,
  listProductImages,
  listReferences,
  listRuns,
  refundCampaignCredits,
  spendCampaignCredits,
  updateAsset,
  updateReference,
  updateRunKnownFacts,
} from './db.js';
import { approveGate, cancelRun, editAgentOutput, regenerateAgentStep, regenerateSingleCreativeStep, runAgentStep, type EngineContext } from './engine.js';
import type { GenAIClientLike } from './gemini.js';
import type { SafeFetcher } from './safeFetch.js';
import {
  checkModelConfigurationHealth,
  getCampaignStudioAllowedEmails,
  isCampaignStudioEnabled,
} from './config.js';
import { resolveModelForTask } from './models/modelRegistry.js';
import {
  ALLOWED_ASPECT_RATIOS,
  ALLOWED_PLATFORMS,
  CAMPAIGN_GOALS,
  isUuid,
  parseAgentParam,
  validateAddProductImageInput,
  validateAddReferenceInput,
  validateCreateRunInput,
  validateFeedback,
  validateKnownFacts,
} from './validation.js';
import {
  DEFAULT_CAMPAIGN_SETTINGS,
  MAX_CREATIVES_PER_RUN,
  MAX_PRODUCT_IMAGES_PER_RUN,
  isCreativeEligibleForExport,
  resolveCreativeLifecycleStatus,
  type BrandContext,
  type StandardAspectRatio,
} from '../types.js';
import { listAdvertisingFormats } from './formatLibrary.js';
import { analyzeReferenceImage } from './agents/referenceAnalyst.js';
import { renderCreativeDocumentToSvg, svgToDataUri } from './composition/svgRenderer.js';
import { buildCreativeDocument, updateLayerInDocument } from './composition/compositor.js';
import { evaluateCreative } from './evaluation/qualityEvaluator.js';
import {
  targetedRegenerateCreative,
  executeTargetedRegeneration,
  revertCreativeToVersion,
} from './evaluation/targetedRegenerator.js';
import { adaptCreativeDocument } from './adaptation/creativeAdapter.js';
import { buildReferenceImageParts, callImageModel } from './agents/creatives.js';
import { classifyCreativeError } from './errors/creativeErrors.js';
import { buildMetaCampaignPackage } from './export/metaPackageGenerator.js';
import { buildMetaAdPackageZip } from './export/exportArchive.js';

export interface CampaignStudioDeps {
  /** server.ts requireAuth: sets req.user (Supabase user, or the master-admin stub). */
  requireAuth: RequestHandler;
  /** server.ts aiLimiter. Unused until the agent-running routes in chunk 3. */
  aiLimiter: RequestHandler;
  /** server.ts getAdminSupabaseClient: service-role client, fails closed if the key is missing. */
  getAdminSupabaseClient: () => Promise<SupabaseClient>;
  getAdminAllowedEmails: () => string[];
  /** TEST HOOK ONLY (never passed by server.ts): inject a fake Gemini client / fetcher. */
  overrides?: { geminiClient?: GenAIClientLike; fetcher?: SafeFetcher };
}

const BASE = '/api/campaign-studio';

export function registerCampaignStudioRoutes(app: Express, deps: CampaignStudioDeps): void {
  /**
   * Feature gate. Runs AFTER requireAuth.
   *  - Disabled unless CAMPAIGN_STUDIO_ENABLED=true  (fail closed, answers 404 so the feature is not advertised)
   *  - Optional beta allowlist CAMPAIGN_STUDIO_ALLOWED_EMAILS (admins always pass)
   *  - The master-admin token maps to a stub user that has no profile row, so it cannot own runs.
   */
  const campaignGate = (req: Request, res: Response, next: NextFunction) => {
    if (!isCampaignStudioEnabled()) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const user = (req as any).user;
    if ((req as any).isAdminMaster) {
      return res.status(403).json({
        success: false,
        error: 'Please sign in with a user account to use Campaign Studio (the master admin token has no workspace).',
      });
    }
    if (!user?.id || !isUuid(user.id)) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    const allowed = getCampaignStudioAllowedEmails();
    if (allowed) {
      const email = String(user.email || '').toLowerCase().trim();
      const isAdmin = !!user.is_admin || deps.getAdminAllowedEmails().includes(email);
      if (!isAdmin && !allowed.includes(email)) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
    }
    return next();
  };

  const userId = (req: Request): string => (req as any).user.id as string;

  // --- Static options the frontend needs to render the "new campaign" form ---
  app.get(
    `${BASE}/meta`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (_req: Request, res: Response) => {
      res.json({
        success: true,
        goals: CAMPAIGN_GOALS,
        platforms: ALLOWED_PLATFORMS,
        aspectRatios: ALLOWED_ASPECT_RATIOS,
        maxCreatives: MAX_CREATIVES_PER_RUN,
        defaults: DEFAULT_CAMPAIGN_SETTINGS,
      });
    }),
  );

  // --- Create a run ---
  app.post(
    `${BASE}/runs`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = validateCreateRunInput(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: parsed.error });
      }
      const client = await deps.getAdminSupabaseClient();
      const run = await createRun(client, userId(req), parsed.value);
      return res.status(201).json({ success: true, run });
    }),
  );

  // --- List the user's runs ---
  app.get(
    `${BASE}/runs`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const client = await deps.getAdminSupabaseClient();
      const runs = await listRuns(client, userId(req));
      res.json({ success: true, runs });
    }),
  );

  // --- One run with every step version and asset ---
  app.get(
    `${BASE}/runs/:runId`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const runId = String(req.params.runId || '');
      if (!isUuid(runId)) {
        throw new AppError('Invalid run id', 400, 'Invalid campaign id.');
      }
      const client = await deps.getAdminSupabaseClient();
      const detail = await getRunDetail(client, userId(req), runId);
      // Same answer for "does not exist" and "belongs to someone else": no id probing.
      if (!detail) {
        return res.status(404).json({ success: false, error: 'Campaign not found.' });
      }
      return res.json({ success: true, ...detail });
    }),
  );

  const runIdOf = (req: Request): string => {
    const id = String(req.params.runId || '');
    if (!isUuid(id)) throw new AppError('Invalid run id', 400, 'Invalid campaign id.');
    return id;
  };

  // --- Update known facts for a run without restarting ---
  app.post(
    `${BASE}/runs/:runId/known-facts`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = validateKnownFacts(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: parsed.error });
      }
      const client = await deps.getAdminSupabaseClient();
      const run = await updateRunKnownFacts(client, userId(req), runIdOf(req), parsed.value);
      return res.json({ success: true, run });
    }),
  );

  // --- Product reference images routes ---
  app.post(
    `${BASE}/runs/:runId/product-images`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const runId = runIdOf(req);
      const parsed = validateAddProductImageInput(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: parsed.error });
      }
      const client = await deps.getAdminSupabaseClient();
      const run = await getRun(client, userId(req), runId);
      if (!run) {
        throw new AppError('Run not found', 404, 'Campaign not found.');
      }
      const currentCount = await countProductImages(client, userId(req), runId);
      if (currentCount >= MAX_PRODUCT_IMAGES_PER_RUN) {
        return res.status(400).json({
          success: false,
          error: `You can upload at most ${MAX_PRODUCT_IMAGES_PER_RUN} product photos per campaign.`,
        });
      }
      const image = await createProductImage(client, userId(req), runId, parsed.value);
      return res.status(201).json({ success: true, image });
    }),
  );

  app.get(
    `${BASE}/runs/:runId/product-images`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const runId = runIdOf(req);
      const client = await deps.getAdminSupabaseClient();
      const run = await getRun(client, userId(req), runId);
      if (!run) {
        throw new AppError('Run not found', 404, 'Campaign not found.');
      }
      const images = await listProductImages(client, userId(req), runId);
      return res.json({ success: true, images });
    }),
  );

  app.delete(
    `${BASE}/runs/:runId/product-images/:imageId`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const runId = runIdOf(req);
      const imageId = String(req.params.imageId || '');
      if (!isUuid(imageId)) {
        throw new AppError('Invalid image id', 400, 'Invalid image id.');
      }
      const client = await deps.getAdminSupabaseClient();
      const run = await getRun(client, userId(req), runId);
      if (!run) {
        throw new AppError('Run not found', 404, 'Campaign not found.');
      }
      await deleteProductImage(client, userId(req), runId, imageId);
      return res.json({ success: true });
    }),
  );

  // ---------------------------------------------------------------------------
  // Advertising Formats & References routes (Phase 2)
  // ---------------------------------------------------------------------------

  app.get(
    `${BASE}/formats`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (_req: Request, res: Response) => {
      res.json({ success: true, formats: listAdvertisingFormats() });
    }),
  );

  app.post(
    `${BASE}/references`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = validateAddReferenceInput(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: parsed.error });
      }
      const client = await deps.getAdminSupabaseClient();
      if (parsed.value.runId) {
        const run = await getRun(client, userId(req), parsed.value.runId);
        if (!run) {
          throw new AppError('Run not found', 404, 'Campaign not found.');
        }
      }
      const reference = await createReference(client, userId(req), parsed.value);
      return res.status(201).json({ success: true, reference });
    }),
  );

  app.get(
    `${BASE}/references`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const runId = typeof req.query.runId === 'string' && isUuid(req.query.runId) ? req.query.runId : undefined;
      const client = await deps.getAdminSupabaseClient();
      const references = await listReferences(client, userId(req), runId);
      return res.json({ success: true, references });
    }),
  );

  app.get(
    `${BASE}/references/:refId`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const refId = String(req.params.refId || '');
      if (!isUuid(refId)) {
        throw new AppError('Invalid reference id', 400, 'Invalid reference id.');
      }
      const client = await deps.getAdminSupabaseClient();
      const reference = await getReference(client, userId(req), refId);
      if (!reference) {
        return res.status(404).json({ success: false, error: 'Reference not found.' });
      }
      return res.json({ success: true, reference });
    }),
  );

  app.delete(
    `${BASE}/references/:refId`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const refId = String(req.params.refId || '');
      if (!isUuid(refId)) {
        throw new AppError('Invalid reference id', 400, 'Invalid reference id.');
      }
      const client = await deps.getAdminSupabaseClient();
      const existing = await getReference(client, userId(req), refId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Reference not found.' });
      }
      await deleteReference(client, userId(req), refId);
      return res.json({ success: true });
    }),
  );

  // Model Configuration Health Check
  app.get(
    `${BASE}/models/health`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (_req: Request, res: Response) => {
      const health = await checkModelConfigurationHealth();
      return res.json({ success: true, health });
    }),
  );

  app.post(
    `${BASE}/references/:refId/analyze`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const refId = String(req.params.refId || '');
      if (!isUuid(refId)) {
        throw new AppError('Invalid reference id', 400, 'Invalid reference id.');
      }
      const client = await deps.getAdminSupabaseClient();
      const existing = await getReference(client, userId(req), refId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Reference not found.' });
      }

      await updateReference(client, userId(req), refId, { analysis_status: 'analyzing' });

      try {
        const dna = await analyzeReferenceImage({
          imageUrl: existing.image_url,
          referenceRole: existing.reference_role,
          client: deps.overrides?.geminiClient,
          fetcher: deps.overrides?.fetcher,
        });

        const updated = await updateReference(client, userId(req), refId, {
          analysis_status: 'completed',
          design_dna: dna,
        });

        return res.json({ success: true, reference: updated });
      } catch (err: any) {
        await updateReference(client, userId(req), refId, { analysis_status: 'failed' });
        throw new AppError('Analysis failed', 500, err?.message || 'Could not analyze reference image.');
      }
    }),
  );

  // ---------------------------------------------------------------------------
  // Step engine routes (chunk 3)
  // ---------------------------------------------------------------------------

  const engineCtx = async (req: Request): Promise<EngineContext> => ({
    client: await deps.getAdminSupabaseClient(),
    userId: userId(req),
    geminiClient: deps.overrides?.geminiClient,
    fetcher: deps.overrides?.fetcher,
  });
  const agentOf = (req: Request) => {
    const agent = parseAgentParam(req.params.agent);
    if (!agent) throw new AppError('Unknown agent', 400, 'Unknown step.');
    return agent;
  };

  // First generation of a step's output.
  app.post(
    `${BASE}/runs/:runId/steps/:agent/run`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await runAgentStep(await engineCtx(req), runIdOf(req), agentOf(req));
      res.status(201).json({ success: true, ...result });
    }),
  );

  // Redo with written feedback ("try a different angle").
  app.post(
    `${BASE}/runs/:runId/steps/:agent/regenerate`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const feedback = validateFeedback(req.body);
      if (!feedback.ok) return res.status(400).json({ success: false, error: feedback.error });
      const result = await regenerateAgentStep(await engineCtx(req), runIdOf(req), agentOf(req), feedback.value as string);
      return res.status(201).json({ success: true, ...result });
    }),
  );

  // Redo one creative concept individually ("regenerate this one").
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/regenerate`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const feedback = typeof req.body?.feedback === 'string' && req.body.feedback.trim().length > 0
        ? req.body.feedback.trim().slice(0, 2000)
        : null;
      const asset = await regenerateSingleCreativeStep(await engineCtx(req), runIdOf(req), creativeIndex, feedback);
      return res.status(201).json({ success: true, asset });
    }),
  );

  // ---------------------------------------------------------------------------
  // Creative Document & Layer Manipulation routes (Phase 3)
  // ---------------------------------------------------------------------------

  app.get(
    `${BASE}/runs/:runId/creatives/:creativeIndex/document`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }
      const overlay = (latest.overlay || {}) as Record<string, any>;
      const document = overlay.document;
      if (!document) {
        return res.status(404).json({ success: false, error: 'Layer document not available for this creative.' });
      }
      return res.json({ success: true, document, renderedCompositeUrl: overlay.renderedCompositeUrl });
    }),
  );

  app.put(
    `${BASE}/runs/:runId/creatives/:creativeIndex/document`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      let doc = overlay.document;
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Layer document not available for this creative.' });
      }

      if (req.body?.layerId && req.body?.patch) {
        doc = updateLayerInDocument(doc, req.body.layerId, req.body.patch);
      } else if (req.body?.document && typeof req.body.document === 'object') {
        doc = { ...req.body.document, updatedAt: new Date().toISOString() };
      } else {
        return res.status(400).json({ success: false, error: 'Send either document or layerId + patch.' });
      }

      const svg = renderCreativeDocumentToSvg(doc);
      const compositeUrl = svgToDataUri(svg);
      const updatedOverlay = {
        ...overlay,
        document: doc,
        renderedCompositeUrl: compositeUrl,
      };

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({ success: true, document: doc, compositeUrl });
    }),
  );

  // ---------------------------------------------------------------------------
  // Quality Evaluation & Targeted Regeneration routes (Phase 4)
  // ---------------------------------------------------------------------------

  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/evaluate`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const doc = overlay.document;
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Layer document not available for evaluation.' });
      }

      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      const masterPromptsStep = runDetail?.steps?.find((s) => s.agent === 'master_prompts' && s.status === 'approved');
      const prompts = (masterPromptsStep?.output as any)?.prompts || [];
      const promptObj = prompts[creativeIndex - 1];
      const creativeDirStep = runDetail?.steps?.find((s) => s.agent === 'creative_direction' && s.status === 'approved');
      const blueprints = (creativeDirStep?.output as any)?.blueprints || [];
      const blueprint = blueprints[creativeIndex - 1] || overlay.blueprint;

      const evaluation = await evaluateCreative({
        doc,
        blueprint,
        brand: runDetail?.run?.brand_context as BrandContext | undefined,
        client: deps.overrides?.geminiClient,
        compositeUrl: overlay.renderedCompositeUrl || latest.image_url,
        referenceImageUrls: promptObj?.referenceImageUrls || (runDetail?.run?.brand_context as any)?.products?.flatMap((p: any) => p.imageUrls || []),
        fetcher: deps.overrides?.fetcher,
      });

      const updatedOverlay = {
        ...overlay,
        evaluation,
      };

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({ success: true, evaluation });
    }),
  );

  app.get(
    `${BASE}/runs/:runId/creatives/:creativeIndex/evaluation`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const evaluation = overlay.evaluation;
      if (!evaluation) {
        return res.status(404).json({ success: false, error: 'Evaluation not found for this creative.' });
      }

      return res.json({ success: true, evaluation });
    }),
  );

  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/targeted-regenerate`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const component = String(req.body?.component || '');
      const instructions = typeof req.body?.instructions === 'string' ? req.body.instructions : undefined;
      const validComponents = ['headline', 'background', 'product', 'badge', 'cta', 'subheadline', 'layout', 'typography', 'styling', 'composition'];
      if (!instructions && (!component || !validComponents.includes(component))) {
        throw new AppError('Invalid component', 400, 'Valid component required (headline, background, product, badge, cta, subheadline, layout, typography, styling, composition) or natural-language instructions.');
      }

      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const doc = overlay.document;
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Layer document not available for targeted regeneration.' });
      }

      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      const regenResult = await executeTargetedRegeneration({
        doc,
        blueprint: overlay.blueprint || doc.blueprint,
        component: component as any,
        instructions,
        newAssetUrl: typeof req.body?.newAssetUrl === 'string' ? req.body.newAssetUrl : undefined,
        patchStyles: typeof req.body?.patchStyles === 'object' ? req.body.patchStyles : undefined,
        newContent: typeof req.body?.newContent === 'string' ? req.body.newContent : undefined,
        brand: runDetail?.run?.brand_context as BrandContext | undefined,
        client: deps.overrides?.geminiClient,
      });

      const updatedOverlay: Record<string, any> = {
        ...overlay,
        document: regenResult.document,
        renderedCompositeUrl: regenResult.compositeUrl,
        evaluation: regenResult.evaluation,
        approvalStatus: 'pending_review',
        approvalHistory: [
          ...(Array.isArray(overlay.approvalHistory) ? overlay.approvalHistory : []),
          {
            approvedByUserId: userId(req),
            approvedAt: new Date().toISOString(),
            creativeVersion: latest.version,
            documentVersion: regenResult.document.version,
            evaluationId: regenResult.evaluation?.creativeId,
            approvalNotes: `Approval invalidated by targeted regeneration of ${component}`,
            action: 'reset' as const,
          },
        ],
      };
      delete updatedOverlay.approvedAt;
      delete updatedOverlay.approvedByUserId;
      delete updatedOverlay.documentVersionAtApproval;

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({
        success: true,
        document: regenResult.document,
        compositeUrl: regenResult.compositeUrl,
        evaluation: regenResult.evaluation,
        actionTaken: regenResult.actionTaken,
        changePlan: regenResult.changePlan,
      });
    }),
  );

  // Revert Creative to Specified Earlier Version
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/revert`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const targetVersion = parseInt(String(req.body?.targetVersion || ''), 10);
      if (isNaN(targetVersion) || targetVersion < 1) {
        throw new AppError('Invalid target version', 400, 'Valid targetVersion integer required.');
      }

      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const doc = overlay.document;
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Layer document not available for revert.' });
      }

      const revertResult = revertCreativeToVersion(doc, targetVersion);
      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));

      const updatedOverlay: Record<string, any> = {
        ...overlay,
        document: revertResult.document,
        renderedCompositeUrl: revertResult.compositeUrl,
        evaluation: revertResult.evaluation,
        approvalStatus: 'pending_review',
        approvalHistory: [
          ...(Array.isArray(overlay.approvalHistory) ? overlay.approvalHistory : []),
          {
            approvedByUserId: userId(req),
            approvedAt: new Date().toISOString(),
            creativeVersion: latest.version,
            documentVersion: revertResult.document.version,
            evaluationId: revertResult.evaluation?.creativeId,
            approvalNotes: `Approval invalidated by reverting creative to version ${targetVersion}`,
            action: 'reset' as const,
          },
        ],
      };
      delete updatedOverlay.approvedAt;
      delete updatedOverlay.approvedByUserId;
      delete updatedOverlay.documentVersionAtApproval;

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({
        success: true,
        document: revertResult.document,
        compositeUrl: revertResult.compositeUrl,
        evaluation: revertResult.evaluation,
        actionTaken: revertResult.actionTaken,
      });
    }),
  );

  // Phase 5: Multi-Aspect Ratio Creative Adaptation (1:1, 4:5, 9:16, 1.91:1)
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/adapt`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const targetRatio = String(req.body?.targetRatio || '') as StandardAspectRatio;
      if (!['1:1', '4:5', '9:16', '1.91:1'].includes(targetRatio)) {
        throw new AppError('Invalid aspect ratio', 400, 'Valid targetRatio required (1:1, 4:5, 9:16, 1.91:1).');
      }

      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      let doc = overlay.document;
      if (!doc) {
        // Construct fallback document on the fly so adaptation succeeds seamlessly on any creative
        const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
        const brand = runDetail?.run?.brand_context;
        const creativeDirStep = runDetail?.steps?.find((s) => s.agent === 'creative_direction' && s.status === 'approved');
        const direction = (creativeDirStep?.output as any)?.blueprints?.[creativeIndex - 1];

        const headline = overlay.headline || direction?.copy?.headline || (brand?.brandName ? `${brand.brandName} Essential` : 'Featured Product');
        const subheadline = overlay.subheading || direction?.copy?.subheadline || '';
        const cta = overlay.cta || direction?.copy?.cta || 'Shop Now';
        const brandName = brand?.brandName || 'Brand';
        const brandColors = brand?.visualIdentity?.colors?.map((c: any) => c.hex) || ['#0F172A', '#F59E0B'];
        const productImageUrl = runDetail?.productImages?.[0]?.image_url || '';

        doc = buildCreativeDocument({
          blueprint: direction || {
            id: `bp-${runIdOf(req)}-${creativeIndex}`,
            conceptId: `concept-${creativeIndex}`,
            version: 1,
            status: 'draft',
            marketingAngle: 'General',
            advertisingFormat: 'Promotional Retail Poster',
            canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
            visualHierarchy: ['main_headline', 'product', 'cta'],
            colorPalette: {
              background: brandColors[0] || '#0F172A',
              foreground: '#FFFFFF',
              text: '#FFFFFF',
              accent: brandColors[1] || '#F59E0B',
            },
            backgroundPrompt: latest.prompt || 'Studio commercial background',
            style: { mood: ['bold'], lighting: 'studio', colorHarmony: 'high-contrast' },
            layout: { composition: 'Center', safeZones: [] },
            typography: { headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, color: '#FFFFFF' } },
            copy: { headline, subheadline, cta },
            graphicElements: [],
            assets: { productAssetIds: [], referenceIds: [] },
            constraints: {
              preserveProductPackaging: true,
              preserveLogo: true,
              exactCopyRequired: true,
              prohibitInventedClaims: true,
            },
          },
          backgroundUrl: latest.image_url || '',
          productImageUrl,
          brandName,
          brandColors,
        });
        overlay.document = doc;
      }

      const adapted = adaptCreativeDocument(doc, targetRatio);
      const existingAdaptations = overlay.adaptations || {};
      const updatedOverlay = {
        ...overlay,
        adaptations: {
          ...existingAdaptations,
          [targetRatio]: adapted,
        },
      };

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({
        success: true,
        document: adapted.document,
        compositeUrl: adapted.compositeUrl,
        aspectRatio: targetRatio,
      });
    }),
  );

  // Explicit Creative Approval & Review State Management
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/approve`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const action = String(req.body?.action || 'approve'); // 'approve' | 'request_revision' | 'reset'
      const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined;

      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      if (latest.status === 'failed') {
        throw new AppError('Cannot approve failed creative', 400, 'This creative failed generation. Please retry before approving.');
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const evaluation = overlay.evaluation;
      const hardFailures = evaluation?.hardRuleFailures ?? [];

      if (action === 'approve') {
        if (latest.status !== 'ready') {
          throw new AppError('Generation Incomplete', 400, 'Image generation must complete successfully before approving.');
        }
        if (!overlay.renderedCompositeUrl && !latest.image_url) {
          throw new AppError('Missing Rendered Creative', 400, 'Final rendered creative image is missing.');
        }
        if (!evaluation) {
          throw new AppError('Missing Quality Evaluation', 400, 'Autonomous quality evaluation has not been conducted for this creative.');
        }
        if (evaluation.status !== 'passed' || !evaluation.approvalEligible) {
          throw new AppError('QA Not Passed', 400, `Cannot approve creative: evaluation status is "${evaluation.status}". QA must pass first.`);
        }
        if (!evaluation.visual?.checksRun || evaluation.visual.status !== 'passed') {
          throw new AppError('Visual QA Incomplete', 400, 'Multimodal visual quality checks must be completed and passed before approval.');
        }
        if (hardFailures.length > 0) {
          throw new AppError(
            'Critical QA Failures',
            400,
            `Cannot approve creative with critical QA failures (${hardFailures.join('; ')}). Please resolve issues first.`,
          );
        }
        const hasCriticalIssue = evaluation.issues?.some((i: any) => i.severity === 'critical');
        if (hasCriticalIssue) {
          throw new AppError('Critical Diagnostic Issues', 400, 'Cannot approve creative with unresolved critical issues.');
        }
        if (overlay.document?.version && evaluation.documentVersion !== overlay.document.version) {
          throw new AppError('Stale Evaluation', 400, `Evaluation was performed on document version ${evaluation.documentVersion}, but current document is version ${overlay.document.version}. Re-evaluate before approval.`);
        }

        const approvalRecord = {
          approvedByUserId: userId(req),
          approvedAt: new Date().toISOString(),
          creativeVersion: latest.version,
          documentVersion: overlay.document?.version ?? 1,
          evaluationId: evaluation.creativeId || evaluation.evaluatorVersion || 'eval-v2',
          approvalNotes: notes,
          action: 'approved' as const,
        };

        overlay.approvalStatus = 'approved';
        overlay.approvedAt = approvalRecord.approvedAt;
        overlay.approvedByUserId = approvalRecord.approvedByUserId;
        overlay.documentVersionAtApproval = approvalRecord.documentVersion;
        if (notes) overlay.userNotes = notes;

        const history = Array.isArray(overlay.approvalHistory) ? overlay.approvalHistory : [];
        overlay.approvalHistory = [...history, approvalRecord];
      } else if (action === 'request_revision') {
        const revisionRecord = {
          approvedByUserId: userId(req),
          approvedAt: new Date().toISOString(),
          creativeVersion: latest.version,
          documentVersion: overlay.document?.version ?? 1,
          approvalNotes: notes,
          action: 'revision_requested' as const,
        };
        overlay.approvalStatus = 'needs_revision';
        if (notes) overlay.userNotes = notes;
        const history = Array.isArray(overlay.approvalHistory) ? overlay.approvalHistory : [];
        overlay.approvalHistory = [...history, revisionRecord];
      } else {
        const resetRecord = {
          approvedByUserId: userId(req),
          approvedAt: new Date().toISOString(),
          creativeVersion: latest.version,
          documentVersion: overlay.document?.version ?? 1,
          approvalNotes: notes,
          action: 'reset' as const,
        };
        overlay.approvalStatus = 'pending_review';
        delete overlay.approvedAt;
        delete overlay.approvedByUserId;
        delete overlay.documentVersionAtApproval;
        const history = Array.isArray(overlay.approvalHistory) ? overlay.approvalHistory : [];
        overlay.approvalHistory = [...history, resetRecord];
      }

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay,
      });

      return res.json({
        success: true,
        creativeIndex,
        approvalStatus: overlay.approvalStatus,
        approvedAt: overlay.approvedAt,
        userNotes: overlay.userNotes,
      });
    }),
  );

  // AI-Driven Format Resizing & Native Placement Generation with Full Credits & QA Lifecycle
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/format-generate`,
    deps.requireAuth,
    campaignGate,
    deps.aiLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const targetRatio = String(req.body?.targetRatio || '') as StandardAspectRatio;
      if (!['1:1', '4:5', '9:16', '1.91:1'].includes(targetRatio)) {
        throw new AppError('Invalid aspect ratio', 400, 'Valid targetRatio required (1:1, 4:5, 9:16, 1.91:1).');
      }

      const client = await deps.getAdminSupabaseClient();
      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      if (!runDetail?.run) {
        throw new AppError('Campaign not found', 404, 'Campaign run not found.');
      }

      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      if (req.body?.expectedVersion && latest.version !== req.body.expectedVersion) {
        throw new AppError(
          'Document version mismatch',
          409,
          `Conflict: Creative version has moved to ${latest.version}. Please refresh before generating new formats.`,
        );
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const masterPromptsStep = runDetail?.steps?.find((s) => s.agent === 'master_prompts' && s.status === 'approved');
      const prompts = (masterPromptsStep?.output as any)?.prompts || [];
      const promptObj = prompts[creativeIndex - 1];

      // If user requests 1:1 and it already has a visual, return existing
      if (targetRatio === '1:1' && (overlay.renderedCompositeUrl || latest.image_url)) {
        return res.json({
          success: true,
          aspectRatio: '1:1',
          compositeUrl: overlay.renderedCompositeUrl || latest.image_url,
          formatStatus: overlay.formatStatus,
        });
      }

      // 1. Resolve image model & pricing from central registry based on user tier
      const userTier = overlay.tier === 'pro' || latest.model?.includes('pro') ? 'pro' : 'standard';
      const resolvedModelInfo = resolveModelForTask(
        userTier === 'pro' ? 'image_generation_pro' : 'image_generation_standard',
        { userTier },
      );
      const modelToUse = resolvedModelInfo.model;
      const creditCost = userTier === 'pro' ? 3 : 1;

      // 2. Compute idempotency key for credit deduction
      const idempotencyKey = req.headers['idempotency-key']
        ? String(req.headers['idempotency-key'])
        : `format_gen:${runIdOf(req)}:${creativeIndex}:${targetRatio}:v${latest.version}`;

      let creditsCharged = false;
      let creditsRefunded = false;

      // 3. Atomically deduct credits before provider execution
      try {
        await spendCampaignCredits(client, userId(req), creditCost, idempotencyKey, modelToUse, {
          runId: runIdOf(req),
          creativeIndex,
          targetRatio,
          action: 'format_generate',
        });
        creditsCharged = true;
      } catch (spendErr: any) {
        if (spendErr instanceof AppError && spendErr.statusCode === 402) {
          throw spendErr;
        }
        throw new AppError('Credit deduction failed', 402, spendErr?.message || 'Could not deduct credits for format generation.');
      }

      try {
        const referenceParts = await buildReferenceImageParts(promptObj?.referenceImageUrls, deps.overrides?.fetcher);
        const aiResizedImageUrl = await callImageModel({
          prompt: latest.prompt || promptObj?.imagePrompt || 'Commercial advertising backdrop',
          negativePrompt: promptObj?.negativePrompt,
          aspectRatio: targetRatio,
          model: modelToUse,
          client: deps.overrides?.geminiClient,
          referenceParts,
        });

        let doc = overlay.document;
        if (!doc) {
          const brand = runDetail?.run?.brand_context;
          const brandColors = brand?.visualIdentity?.colors?.map((c: any) => c.hex) || ['#0F172A', '#F59E0B'];
          doc = buildCreativeDocument({
            blueprint: {
              id: `bp-${runIdOf(req)}-${creativeIndex}`,
              conceptId: `concept-${creativeIndex}`,
              version: 1,
              status: 'draft',
              marketingAngle: 'General',
              advertisingFormat: 'Promotional Product Advertisement',
              designIntensity: 'balanced',
              designConcept: overlay.headline || 'Featured Product',
              visualNarrative: overlay.subheading || '',
              canvas: { width: 1080, height: 1080, aspectRatio: '1:1' },
              artDirection: {
                visualStyle: 'Commercial advertising',
                mood: 'bold, clean',
                background: latest.prompt || 'Studio commercial background',
                colorPalette: brandColors || ['#0F172A', '#F59E0B'],
                photographyStyle: 'Clean commercial strobe photography',
                lighting: 'Balanced studio lighting',
              },
              layout: {
                composition: 'Balanced commercial composition',
                readingOrder: ['main_headline', 'product', 'cta'],
                productPlacement: 'Center anchor with ground shadow',
                productScale: 0.6,
                safeZones: [],
                elements: [
                  { element: 'main_headline', x: 0.08, y: 0.12, width: 0.84, height: 0.18 },
                  { element: 'product', x: 0.15, y: 0.35, width: 0.70, height: 0.45 },
                  { element: 'cta', x: 0.08, y: 0.86, width: 0.45, height: 0.07 },
                ],
              },
              typography: {
                headlineStyle: { fontFamily: 'Poppins', fontWeight: 800, fontSizeHint: 'hero', color: '#FFFFFF' },
                hierarchy: [],
              },
              copy: {
                headline: overlay.headline || 'Featured Product',
                subheadline: overlay.subheading || '',
                cta: overlay.cta || 'Shop Now',
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
            backgroundUrl: aiResizedImageUrl,
            productImageUrl: runDetail?.productImages?.[0]?.image_url || '',
            brandName: brand?.brandName || 'Brand',
            brandColors,
          });
        }

        const adapted = adaptCreativeDocument(doc, targetRatio, { aiBackgroundUrl: aiResizedImageUrl });
        
        // 4. Run deterministic validation & genuine image QA on adapted format
        let placementEval: any = null;
        try {
          placementEval = await evaluateCreative({
            doc: adapted.document,
            compositeUrl: adapted.compositeUrl,
            referenceImageUrls: promptObj?.referenceImageUrls,
            client: deps.overrides?.geminiClient,
            fetcher: deps.overrides?.fetcher,
          });
        } catch (evalErr: any) {
          console.warn(`[campaign-studio] Visual QA for adapted format ${targetRatio} was inconclusive:`, evalErr?.message);
        }

        const passesQA =
          placementEval &&
          placementEval.status === 'passed' &&
          placementEval.passed === true &&
          (!placementEval.issues || !placementEval.issues.some((i: any) => i.severity === 'critical'));

        const existingAdaptations = overlay.adaptations || {};
        const existingFormatStatus = overlay.formatStatus || {};

        const updatedOverlay = {
          ...overlay,
          adaptations: {
            ...existingAdaptations,
            [targetRatio]: adapted,
          },
          formatStatus: {
            ...existingFormatStatus,
            [targetRatio]: {
              status: passesQA ? 'ready_for_review' : 'needs_revision',
              compositeUrl: adapted.compositeUrl,
              adaptedAt: new Date().toISOString(),
              evaluation: placementEval,
              modelUsed: modelToUse,
              creditsCharged: creditCost,
            },
          },
        };

        await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
          overlay: updatedOverlay,
        });

        return res.json({
          success: true,
          aspectRatio: targetRatio,
          document: adapted.document,
          compositeUrl: adapted.compositeUrl,
          formatStatus: updatedOverlay.formatStatus,
          evaluation: placementEval,
        });
      } catch (genErr: any) {
        // Idempotent refund on failure
        if (creditsCharged && !creditsRefunded) {
          creditsRefunded = true;
          try {
            await refundCampaignCredits(client, userId(req), idempotencyKey);
          } catch (refundErr: any) {
            console.error('[campaign-studio] Failed to refund credits for failed format generation:', refundErr?.message);
          }
        }

        const classified = classifyCreativeError(genErr);
        // Record failed attempt without destroying master creative
        const existingFormatStatus = overlay.formatStatus || {};
        const updatedOverlay = {
          ...overlay,
          formatStatus: {
            ...existingFormatStatus,
            [targetRatio]: {
              status: 'failed',
              error: classified.userMessage,
              failedAt: new Date().toISOString(),
            },
          },
        };
        await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
          overlay: updatedOverlay,
        }).catch(() => {});

        throw new AppError(classified.code, 500, classified.userMessage);
      }
    }),
  );

  // Explicit Human Approval for an Adapted Format Placement
  app.post(
    `${BASE}/runs/:runId/creatives/:creativeIndex/format-approve`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const creativeIndex = parseInt(String(req.params.creativeIndex || ''), 10);
      if (isNaN(creativeIndex) || creativeIndex < 1 || creativeIndex > MAX_CREATIVES_PER_RUN) {
        throw new AppError('Invalid creative index', 400, 'Invalid creative index.');
      }
      const targetRatio = String(req.body?.targetRatio || '') as StandardAspectRatio;
      if (!['1:1', '4:5', '9:16', '1.91:1'].includes(targetRatio)) {
        throw new AppError('Invalid aspect ratio', 400, 'Valid targetRatio required (1:1, 4:5, 9:16, 1.91:1).');
      }

      const client = await deps.getAdminSupabaseClient();
      const assets = await listAssets(client, userId(req), runIdOf(req));
      const latest = assets
        .filter((a) => a.creative_index === creativeIndex && a.status !== 'superseded')
        .sort((a, b) => b.version - a.version)[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: 'Creative asset not found.' });
      }

      const overlay = (latest.overlay || {}) as Record<string, any>;
      const formatRecord = overlay.formatStatus?.[targetRatio];
      if (!formatRecord || !formatRecord.compositeUrl) {
        return res.status(400).json({ error: `Placement ${targetRatio} has not been generated yet.` });
      }

      if (formatRecord.evaluation?.status !== 'passed' || formatRecord.status === 'failed') {
        return res.status(400).json({
          error: `Placement ${targetRatio} does not satisfy quality standards required for approval.`,
        });
      }

      const approvalHistory = Array.isArray(overlay.approvalHistory) ? [...overlay.approvalHistory] : [];
      approvalHistory.push({
        action: 'approved',
        userId: userId(req),
        timestamp: new Date().toISOString(),
        documentVersion: latest.version,
        evaluationScore: formatRecord.evaluation?.totalScore ?? null,
        reason: `Format ${targetRatio} approved by user.`,
      });

      const updatedOverlay = {
        ...overlay,
        formatStatus: {
          ...overlay.formatStatus,
          [targetRatio]: {
            ...formatRecord,
            status: 'approved',
            approvedAt: new Date().toISOString(),
          },
        },
        approvalHistory,
      };

      await updateAsset(client, userId(req), runIdOf(req), creativeIndex, latest.version, {
        overlay: updatedOverlay,
      });

      return res.json({
        success: true,
        aspectRatio: targetRatio,
        formatStatus: updatedOverlay.formatStatus,
      });
    }),
  );

  // Phase 5: Generate Meta Ad Package (Ad copy variations & campaign metadata)
  app.post(
    `${BASE}/runs/:runId/meta-package`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const client = await deps.getAdminSupabaseClient();
      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      if (!runDetail?.run) {
        return res.status(404).json({ success: false, error: 'Run not found.' });
      }

      const brand = runDetail.run.brand_context;
      if (!brand) {
        return res.status(400).json({ success: false, error: 'Approved brand context is required.' });
      }

      const assets = await listAssets(client, userId(req), runIdOf(req));
      const masterPromptsStep = runDetail.steps.find((s) => s.agent === 'master_prompts' && s.status === 'approved');
      const creativeDirectionStep = runDetail.steps.find((s) => s.agent === 'creative_direction' && s.status === 'approved');
      const strategyStep = runDetail.steps.find((s) => s.agent === 'strategy' && s.status === 'approved');

      const pkg = buildMetaCampaignPackage({
        run: runDetail.run,
        brand: brand as BrandContext,
        strategy: strategyStep?.output as any,
        prompts: (masterPromptsStep?.output as any)?.prompts || [],
        blueprints: (creativeDirectionStep?.output as any)?.blueprints || [],
        assets,
      });

      return res.json({ success: true, package: pkg });
    }),
  );

  // Phase 5: Download Complete Meta Ad Package as ZIP Archive
  app.get(
    `${BASE}/runs/:runId/export-zip`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const client = await deps.getAdminSupabaseClient();
      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      if (!runDetail?.run) {
        return res.status(404).json({ success: false, error: 'Run not found.' });
      }

      const brand = runDetail.run.brand_context;
      if (!brand) {
        return res.status(400).json({ success: false, error: 'Approved brand context is required.' });
      }

      const assets = await listAssets(client, userId(req), runIdOf(req));
      const masterPromptsStep = runDetail.steps.find((s) => s.agent === 'master_prompts' && s.status === 'approved');
      const creativeDirectionStep = runDetail.steps.find((s) => s.agent === 'creative_direction' && s.status === 'approved');
      const strategyStep = runDetail.steps.find((s) => s.agent === 'strategy' && s.status === 'approved');

      // Export Eligibility Rule: Must have at least 1 approved & valid creative
      // Notice: allowUnverified and force query params are completely removed from user export.
      const eligibleAssets = assets.filter((a) => a.status !== 'superseded' && isCreativeEligibleForExport(a, false));
      if (eligibleAssets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No approved creatives are ready for export. Every creative must have passed multimodal visual QA and received explicit human approval before downloading the Meta Ad Package.',
        });
      }

      const pkg = buildMetaCampaignPackage({
        run: runDetail.run,
        brand: brand as BrandContext,
        strategy: strategyStep?.output as any,
        prompts: (masterPromptsStep?.output as any)?.prompts || [],
        blueprints: (creativeDirectionStep?.output as any)?.blueprints || [],
        assets,
      });

      const zipBuffer = await buildMetaAdPackageZip(pkg, { allowUnverified: false });
      const filename = `campaign-${runIdOf(req).slice(0, 8)}-meta-package.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length.toString());
      return res.send(zipBuffer);
    }),
  );

  // Privileged Administrative Export Override (Strictly for platform administrators, with audit logging)
  app.get(
    `${BASE}/runs/:runId/admin-export-override`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      const isAdmin = user && (user.is_admin === true || user.role === 'admin' || user.user_metadata?.is_admin === true);
      if (!isAdmin) {
        throw new AppError('Forbidden', 403, 'Administrative export override requires verified platform administrator privileges.');
      }

      console.warn(`[AUDIT] Administrative export override executed by admin ${userId(req)} on run ${runIdOf(req)} at ${new Date().toISOString()}`);

      const client = await deps.getAdminSupabaseClient();
      const runDetail = await getRunDetail(client, userId(req), runIdOf(req));
      if (!runDetail?.run) {
        return res.status(404).json({ success: false, error: 'Run not found.' });
      }

      const brand = runDetail.run.brand_context;
      if (!brand) {
        return res.status(400).json({ success: false, error: 'Approved brand context is required.' });
      }

      const assets = await listAssets(client, userId(req), runIdOf(req));
      const masterPromptsStep = runDetail.steps.find((s) => s.agent === 'master_prompts' && s.status === 'approved');
      const creativeDirectionStep = runDetail.steps.find((s) => s.agent === 'creative_direction' && s.status === 'approved');
      const strategyStep = runDetail.steps.find((s) => s.agent === 'strategy' && s.status === 'approved');

      const pkg = buildMetaCampaignPackage({
        run: runDetail.run,
        brand: brand as BrandContext,
        strategy: strategyStep?.output as any,
        prompts: (masterPromptsStep?.output as any)?.prompts || [],
        blueprints: (creativeDirectionStep?.output as any)?.blueprints || [],
        assets,
      });

      const zipBuffer = await buildMetaAdPackageZip(pkg, { allowUnverified: true });
      const filename = `campaign-${runIdOf(req).slice(0, 8)}-admin-override-meta-package.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length.toString());
      return res.send(zipBuffer);
    }),
  );

  // Hand-edit a result while it is waiting for review (no AI call, no credits).
  app.put(
    `${BASE}/runs/:runId/steps/:agent/output`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const output = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>).output : undefined;
      if (!output || typeof output !== 'object') return res.status(400).json({ success: false, error: 'Send the edited result as "output".' });
      const result = await editAgentOutput(await engineCtx(req), runIdOf(req), agentOf(req), output);
      return res.status(201).json({ success: true, ...result });
    }),
  );

  // Approve a whole review gate and move to the next.
  app.post(
    `${BASE}/runs/:runId/steps/:agent/approve`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await approveGate(await engineCtx(req), runIdOf(req), agentOf(req));
      res.json({ success: true, ...result });
    }),
  );

  // Cancel a campaign (frees one of the user's active slots).
  app.post(
    `${BASE}/runs/:runId/cancel`,
    deps.requireAuth,
    campaignGate,
    asyncHandler(async (req: Request, res: Response) => {
      const run = await cancelRun(await engineCtx(req), runIdOf(req));
      res.json({ success: true, run });
    }),
  );
}
