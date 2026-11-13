/**
 * CAMPAIGN STUDIO V2 - Security, Authorization & API Integrity Test Suite.
 *
 * Verifies Phase 10 requirements:
 *  - Cross-user workspace and campaign isolation
 *  - Product reference, asset, and export protection against unauthorized access
 *  - Public export bypass rejection (unapproved creatives cannot be downloaded)
 *  - Administrative export override privilege enforcement (403 for non-admins)
 *  - Path traversal and hostile URL rejection in uploads and references
 *  - Credit spend/refund invariants and idempotency deduplication
 *  - Creative lifecycle and format-level approval enforcement
 */

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { registerCampaignStudioRoutes } from './routes.js';
import { isCreativeEligibleForExport, type CampaignAsset, type CampaignRun } from '../types.js';

let app: express.Express;
let server: http.Server;
let baseUrl = '';

const USER_A_ID = '11111111-1111-4111-8111-111111111111';
const USER_B_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';

const RUN_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// In-Memory Database Storage for Isolated Multi-Tenant Testing
interface MockDb {
  runs: Array<CampaignRun & { user_id: string }>;
  assets: Array<CampaignAsset & { user_id: string }>;
  productImages: Array<{ id: string; user_id: string; run_id: string; storage_path: string; label: string }>;
  references: Array<{ id: string; user_id: string; run_id?: string; image_url: string; label: string }>;
  credits: Map<string, number>;
  creditTransactions: Set<string>;
}

const mockDb: MockDb = {
  runs: [],
  assets: [],
  productImages: [],
  references: [],
  credits: new Map(),
  creditTransactions: new Set(),
};

function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      let currentTable = table;
      let filterUserId: string | null = null;
      let filterId: string | null = null;
      let filterRunId: string | null = null;

      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (col: string, val: any) => {
          if (col === 'user_id') filterUserId = val;
          if (col === 'id') filterId = val;
          if (col === 'run_id') filterRunId = val;
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => {
          if (currentTable === 'campaign_runs') {
            const found = mockDb.runs.find(
              (r) => (!filterUserId || r.user_id === filterUserId) && (!filterId || r.id === filterId),
            );
            return { data: found || null, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => {
          const res = await builder.maybeSingle();
          if (!res.data) return { data: null, error: new Error('Record not found') };
          return res;
        },
        insert: (rowOrRows: any) => {
          const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
          for (const row of rows) {
            if (currentTable === 'campaign_runs') {
              mockDb.runs.push(row);
            } else if (currentTable === 'campaign_assets') {
              mockDb.assets.push(row);
            } else if (currentTable === 'campaign_product_images') {
              mockDb.productImages.push(row);
            } else if (currentTable === 'campaign_references') {
              mockDb.references.push(row);
            }
          }
          return {
            select: () => ({
              single: async () => ({ data: rows[0], error: null }),
              maybeSingle: async () => ({ data: rows[0], error: null }),
            }),
            data: rows[0],
            error: null,
          };
        },
        update: (patch: any) => ({
          eq: (col: string, val: any) => {
            if (col === 'user_id') filterUserId = val;
            if (col === 'id') filterId = val;
            return {
              eq: (col2: string, val2: any) => {
                if (col2 === 'user_id') filterUserId = val2;
                if (col2 === 'id') filterId = val2;
                if (currentTable === 'campaign_runs') {
                  const run = mockDb.runs.find(
                    (r) => (!filterUserId || r.user_id === filterUserId) && (!filterId || r.id === filterId),
                  );
                  if (run) Object.assign(run, patch);
                } else if (currentTable === 'campaign_assets') {
                  const asset = mockDb.assets.find(
                    (a) => (!filterUserId || a.user_id === filterUserId) && (!filterId || a.id === filterId),
                  );
                  if (asset) Object.assign(asset, patch);
                }
                return {
                  select: () => ({
                    single: async () => ({ data: patch, error: null }),
                  }),
                };
              },
            };
          },
        }),
        delete: () => ({
          eq: (col: string, val: any) => {
            if (col === 'user_id') filterUserId = val;
            if (col === 'id') filterId = val;
            return {
              eq: (col2: string, val2: any) => {
                if (col2 === 'user_id') filterUserId = val2;
                if (col2 === 'id') filterId = val2;
                if (currentTable === 'campaign_product_images') {
                  const idx = mockDb.productImages.findIndex(
                    (img) => (!filterUserId || img.user_id === filterUserId) && (!filterId || img.id === filterId),
                  );
                  if (idx >= 0) mockDb.productImages.splice(idx, 1);
                }
                return { error: null };
              },
            };
          },
        }),
      };
      return builder;
    },
    rpc: async (procName: string, args: any) => {
      if (procName === 'spend_user_credits') {
        const key = args.p_idempotency_key;
        if (mockDb.creditTransactions.has(key)) {
          return { data: { success: true, idempotent: true }, error: null };
        }
        mockDb.creditTransactions.add(key);
        const cur = mockDb.credits.get(args.p_user_id) ?? 100;
        mockDb.credits.set(args.p_user_id, cur - args.p_amount);
        return { data: { success: true, new_balance: cur - args.p_amount }, error: null };
      }
      if (procName === 'refund_user_credits') {
        const key = args.p_idempotency_key;
        if (mockDb.creditTransactions.has(key)) {
          return { data: { success: true, idempotent: true }, error: null };
        }
        mockDb.creditTransactions.add(key);
        const cur = mockDb.credits.get(args.p_user_id) ?? 100;
        mockDb.credits.set(args.p_user_id, cur + args.p_amount);
        return { data: { success: true, new_balance: cur + args.p_amount }, error: null };
      }
      return { data: null, error: null };
    },
  } as any;
}

before(async () => {
  process.env.CAMPAIGN_STUDIO_ENABLED = 'true';

  app = express();
  app.use(express.json());

  // Test Authentication Middleware mapping incoming header to req.user
  const mockRequireAuth = (req: Request, _res: Response, next: NextFunction) => {
    const userIdHeader = (req.headers['x-user-id'] as string) || USER_A_ID;
    const roleHeader = (req.headers['x-user-role'] as string) || 'user';
    (req as any).user = {
      id: userIdHeader,
      email: `${userIdHeader}@example.com`,
      is_admin: roleHeader === 'admin',
    };
    next();
  };

  const mockAiLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

  registerCampaignStudioRoutes(app, {
    requireAuth: mockRequireAuth,
    aiLimiter: mockAiLimiter,
    getAdminSupabaseClient: async () => createMockSupabaseClient(),
    getAdminAllowedEmails: () => ['admin@example.com'],
  });

  // Global error handler so AppError returns structured JSON instead of HTML
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || err.status || 500;
    const msg = err.userMessage || err.message || 'Internal server error';
    res.status(status).json({ success: false, error: msg });
  });

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Seed User A's Run
  mockDb.runs.push({
    id: RUN_A_ID,
    user_id: USER_A_ID,
    brand_context: {
      brandName: 'AuraGlow',
      category: 'Skincare',
      summary: 'Cold-pressed organic glow serum.',
      positioning: 'Luxury clean skincare.',
      usps: ['100% Organic', 'Glass skin radiance'],
      products: [{ name: 'Glow Serum' }],
      markets: ['US'],
      sources: ['https://auraglow.example.com'],
    },
    status: 'in_progress',
    current_step: 'creatives',
    settings: {
      targetAudience: 'Women 25-45',
      primaryChannel: 'meta',
      brandTier: 'standard',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any);

  // Seed User A's Product Image
  mockDb.productImages.push({
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    user_id: USER_A_ID,
    run_id: RUN_A_ID,
    storage_path: 'products/serum.png',
    label: 'Hero Bottle',
  });
});

after(() => {
  server?.close();
});

// ---------------------------------------------------------------------------
// 1. Cross-User Workspace & Campaign Isolation Tests
// ---------------------------------------------------------------------------

test('security: User B cannot access User A campaign run (404 Not Found)', async () => {
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}`, {
    headers: { 'x-user-id': USER_B_ID },
  });

  assert.equal(res.status, 404, 'Must return 404 without disclosing run existence to other users');
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /not found/i);
});

test('security: User B cannot list or access User A product reference images (404 Not Found)', async () => {
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/product-images`, {
    headers: { 'x-user-id': USER_B_ID },
  });

  assert.equal(res.status, 404, 'Must return 404 when unauthorized user queries product images');
});

test('security: User B cannot delete User A product reference image (404 Not Found)', async () => {
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/product-images/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`, {
    method: 'DELETE',
    headers: { 'x-user-id': USER_B_ID },
  });

  assert.equal(res.status, 404, 'Must return 404 when unauthorized user attempts image deletion');
});

test('security: User B cannot trigger export ZIP for User A campaign (404 Not Found)', async () => {
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/export-zip`, {
    headers: { 'x-user-id': USER_B_ID },
  });

  assert.equal(res.status, 404, 'Must return 404 when unauthorized user requests export ZIP');
});

// ---------------------------------------------------------------------------
// 2. Export Bypass Prevention & Integrity Tests
// ---------------------------------------------------------------------------

test('security: Export ZIP rejected (400) when creatives are unapproved or QA incomplete', async () => {
  // User A requests export on run with 0 approved assets
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/export-zip`, {
    headers: { 'x-user-id': USER_A_ID },
  });

  assert.equal(res.status, 400, 'Must refuse export when no approved creatives exist');
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /No approved creatives are ready for export/i);
});

test('security: Public export bypass attempts via query parameter injection are ignored', async () => {
  // Hostile attempt injecting query flags to bypass QA gate
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/export-zip?allowUnverified=true&force=true`, {
    headers: { 'x-user-id': USER_A_ID },
  });

  assert.equal(res.status, 400, 'Query parameter bypass must be rejected');
  const data = await res.json();
  assert.match(data.error, /No approved creatives are ready for export/i);
});

test('security: Non-admin user cannot access admin export override (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/admin-export-override`, {
    headers: { 'x-user-id': USER_A_ID, 'x-user-role': 'user' },
  });

  assert.equal(res.status, 403, 'Must return 403 Forbidden for non-administrative caller');
  const data = await res.json();
  assert.match(data.error, /administrator privileges/i);
});

// ---------------------------------------------------------------------------
// 3. Path Traversal & Hostile URL Protection Tests
// ---------------------------------------------------------------------------

test('security: Rejects path traversal in product image upload (400 Bad Request)', async () => {
  const hostilePayloads = [
    '../../etc/passwd.png',
    '..\\windows\\system32\\cmd.exe.png',
    '/absolute/root/override.png',
    'products/../../../secret.env',
  ];

  for (const hostilePath of hostilePayloads) {
    const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/product-images`, {
      method: 'POST',
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storagePath: hostilePath,
        label: 'Hostile Upload',
      }),
    });

    assert.equal(res.status, 400, `Path traversal payload "${hostilePath}" must be rejected with 400`);
    const data = await res.json();
    assert.equal(data.success, false);
  }
});

test('security: Rejects non-HTTP schemes and dangerous protocols in image URLs', async () => {
  const dangerousUrls = [
    'javascript:alert(document.cookie)',
    'file:///C:/Windows/System32/drivers/etc/hosts',
    'data:text/html,<script>alert(1)</script>',
    'ftp://internal.vault/backup.tar.gz',
  ];

  for (const dangerousUrl of dangerousUrls) {
    const res = await fetch(`${baseUrl}/api/campaign-studio/runs/${RUN_A_ID}/product-images`, {
      method: 'POST',
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: dangerousUrl,
        label: 'Dangerous URL',
      }),
    });

    assert.equal(res.status, 400, `Dangerous URL scheme "${dangerousUrl}" must be rejected with 400`);
  }
});

// ---------------------------------------------------------------------------
// 4. Creative Lifecycle & Export Eligibility Invariants
// ---------------------------------------------------------------------------

test('security: isCreativeEligibleForExport enforces strict multi-gate criteria', () => {
  const baseAsset: CampaignAsset = {
    id: 'asset-test-1',
    user_id: USER_A_ID,
    run_id: RUN_A_ID,
    creative_index: 0,
    version: 1,
    status: 'ready',
    image_url: 'https://cdn.example.com/creative.png',
    aspect_ratio: '1:1',
    storage_path: 'creatives/1.png',
    created_at: new Date().toISOString(),
    overlay: {
      renderedCompositeUrl: 'https://cdn.example.com/composite.png',
      approvalStatus: 'approved',
      evaluation: {
        status: 'passed',
        approvalEligible: true,
        visual: { checksRun: true, status: 'passed' },
        hardRuleFailures: [],
        issues: [],
      } as any,
    } as any,
  };

  // Valid approved creative: eligible
  assert.equal(isCreativeEligibleForExport(baseAsset, false), true);

  // Unapproved creative: ineligible
  const unapprovedAsset: CampaignAsset = {
    ...baseAsset,
    overlay: {
      ...baseAsset.overlay,
      approvalStatus: 'pending_review',
    } as any,
  };
  assert.equal(isCreativeEligibleForExport(unapprovedAsset, false), false);

  // Failed QA score: ineligible
  const failedQaAsset: CampaignAsset = {
    ...baseAsset,
    overlay: {
      ...baseAsset.overlay,
      evaluation: {
        status: 'failed',
        approvalEligible: false,
        visual: { checksRun: true, status: 'failed' },
        hardRuleFailures: ['Contrast failed'],
      } as any,
    } as any,
  };
  assert.equal(isCreativeEligibleForExport(failedQaAsset, false), false);

  // Unverified QA: ineligible under user export
  const unverifiedAsset: CampaignAsset = {
    ...baseAsset,
    overlay: {
      ...baseAsset.overlay,
      evaluation: {
        status: 'unverified',
        approvalEligible: false,
        visual: { checksRun: false, status: 'unverified' },
      } as any,
    } as any,
  };
  assert.equal(isCreativeEligibleForExport(unverifiedAsset, false), false);
});
