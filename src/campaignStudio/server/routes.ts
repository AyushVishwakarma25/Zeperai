/**
 * CAMPAIGN STUDIO - HTTP routes.
 *
 * Registered from server.ts with the app's own auth/limiter/admin-client passed
 * in as dependencies (importing them from server.ts would create a circular
 * import). Agent-running routes (run / approve / regenerate) arrive in chunk 3.
 */

import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, asyncHandler } from '../../../utils/errorHandler.js';
import { createRun, getRunDetail, listRuns } from './db.js';
import { getCampaignStudioAllowedEmails, isCampaignStudioEnabled } from './config.js';
import { ALLOWED_ASPECT_RATIOS, CAMPAIGN_GOALS, isUuid, validateCreateRunInput } from './validation.js';
import { DEFAULT_CAMPAIGN_SETTINGS, MAX_CREATIVES_PER_RUN } from '../types.js';

export interface CampaignStudioDeps {
  /** server.ts requireAuth: sets req.user (Supabase user, or the master-admin stub). */
  requireAuth: RequestHandler;
  /** server.ts aiLimiter. Unused until the agent-running routes in chunk 3. */
  aiLimiter: RequestHandler;
  /** server.ts getAdminSupabaseClient: service-role client, fails closed if the key is missing. */
  getAdminSupabaseClient: () => Promise<SupabaseClient>;
  getAdminAllowedEmails: () => string[];
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
}
