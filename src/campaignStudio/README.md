# Campaign Studio (multi-agent brand visuals)

Human-in-the-loop workflow: brand input -> analysis -> research -> strategy ->
creative direction -> master prompts -> 5 static creatives. Every gate needs
user approval; any step can be regenerated with written feedback.

## Design decisions

- **State lives in Postgres**, not in memory. Tables: `campaign_runs`,
  `campaign_steps` (one row per agent output *version*), `campaign_assets`.
  See `supabase_campaign_studio_migration.sql`.
- **One agent = one request.** Every step ends at a human gate, so no
  background worker is needed. Image generation = one request per creative.
- **Redo = new version.** Feedback + previous output go back to the same agent;
  the old row becomes `superseded`. Redoing an upstream gate marks downstream
  steps `superseded`.
- **Only approved outputs flow downstream.** Agents never see rejected drafts
  or raw chat history.
- **All writes are server-side with the service-role key.** Clients only
  SELECT their own rows (RLS). The service-role client bypasses RLS, so every
  query in `server/db.ts` filters by `user_id` explicitly. The module reuses
  `getAdminSupabaseClient`, which is now fail-closed (no anon-key fallback).
- **Credits are spent server-side** via `campaign_spend_credits()` / `campaign_refund_credits()`
  (atomic, idempotent per reference, service_role only). Named `campaign_*` so they never collide with the app-wide `spend_credits`/`refund_credits`. Do not use the
  client-side `userService.deductCredits` for this feature.
- **Review gates** are defined once in `types.ts` (`REVIEW_GATES`); market and
  competitor research share one gate.

## Reuse map (existing code)

| Need | Reuse |
|---|---|
| Auth, rate limit, error handling | `requireAuth`, `aiLimiter`, `asyncHandler`, `AppError` from `server.ts` (passed into the module, not re-implemented) |
| Gemini client | `getAI()` from `config/ai.ts` |
| Image model + credit cost | `resolveModelForGeneration` in `src/config/modelConfig.ts` |
| Brand data | `brand_kits` table, `brandService`, `BrandKitModal` |
| Credit ledger | `credit_transactions` (`studio = 'campaign_studio'`) |
| Save finished creatives | `designs` table / `designService` |
| Text overlay | `components/ui/AdTextOverlay.tsx`, `html-to-image` |
| UI kit | `components/ui/*` |
| "Add a feature" template | Local SEO Audit (`components/tools`, `services`, routes in `server.ts`, `App.tsx`) |

## Server module layout (`src/campaignStudio/server/`)

| File | Purpose |
|---|---|
| `config.ts` | Per-agent model/tool config, env-overridable model IDs, feature gate helpers |
| `validation.ts` | Pure input validation (URL shape checks are NOT a substitute for DNS/IP checks at fetch time) |
| `gemini.ts` | `generateStructured()`: JSON output, transient retry, one repair pass, timeouts, safety blocks |
| `db.ts` | Service-role data access, always scoped by `user_id` |
| `routes.ts` | Express routes + `campaignGate` (404 unless `CAMPAIGN_STUDIO_ENABLED=true`) |
| `engine.ts` | Step state machine: run / regenerate / edit / approve / cancel |
| `safeFetch.ts`, `ipRanges.ts` | SSRF-safe fetcher: DNS + IP checks, connection pinned to the validated IP, redirects re-validated |
| `siteReader.ts` | Reads a brand site (home + 2 pages) into brand signals; no HTML-parser dependency |
| `agents/` | One file per agent + registry: `brandAnalysis`, `marketResearch`, `competitorResearch`, `strategy`. Shared: `normalize.ts` (cleaning/caps/URL rules), `promptUtils.ts` (fences + defuse), `context.ts` (approved upstream outputs) |

### Step API (all under `/api/campaign-studio`, auth + feature gate required)

| Route | Purpose |
|---|---|
| `POST /runs/:id/steps/:agent/run` | First generation (AI-rate-limited) |
| `POST /runs/:id/steps/:agent/regenerate` `{feedback}` | Redo with the user's note (max 5 per step) |
| `PUT  /runs/:id/steps/:agent/output` `{output}` | Hand edit while awaiting review (new version, no AI) |
| `POST /runs/:id/steps/:agent/approve` | Approve the whole gate, advance the run (idempotent) |
| `POST /runs/:id/cancel` | Cancel the campaign |

Redoing an already-approved step rewinds the run to that gate and supersedes every later step.
A failed regeneration never replaces the last good version. `input_snapshot` (site text, prompt inputs) is
stored per version and reused on redo so the website is fetched once.

Each agent request must finish within `CAMPAIGN_STEP_DEADLINE_MS` (default 55s; `vercel.json` sets `maxDuration` 60).

Dependencies (`requireAuth`, `aiLimiter`, admin client) are injected by `server.ts`
to avoid a circular import. The route registration in `server.ts` must stay above
the `/api/*all` 404 catch-all.

## Frontend (chunk 4)

Mirrors the Shopify Analyzer pattern: a `View` in the dashboard shell, not a new route.

| Where | What |
|---|---|
| `types.ts` | `View.CampaignStudio` |
| `components/DashboardSidebar.tsx` | "Campaign Studio" nav item |
| `components/Dashboard.tsx` | "Campaign Studio" card (new optional prop `onOpenCampaignStudio`) |
| `components/AppMainView.tsx` | lazy-loads `components/campaign/CampaignStudio.tsx` |
| `components/campaign/` | `CampaignStudio` (shell), `CampaignList`, `NewCampaignForm`, `CampaignRunView`, `Stepper`, `StepReviewCard`, `BrandContextView`, `BrandContextEditor`, `shared` |
| `src/campaignStudio/client/` | `api.ts` (typed client), `defaultApi.ts` (Supabase token), `useCampaignStudioAccess.ts`, `viewModel.ts` (gate states, redo counts), `brandDraft.ts` (editor draft + validation) |

Both entry points show ONLY when `GET /api/campaign-studio/meta` succeeds (the server's feature gate is the source of truth).
When a step is generating server-side (page refreshed mid-run) the run view polls every 3s until it settles.
Stages without an agent show "coming soon" until they are registered in `server/agents/index.ts` and added to
`IMPLEMENTED_AGENTS` in `client/viewModel.ts` (a unit test fails if the two lists drift apart).

### Research and strategy (chunk 5)

- Research is ONE review gate with TWO agents. The UI starts both in parallel (two requests) and offers a single
  "Approve research and continue" once both are ready. Redoing either report after approval reopens the gate,
  supersedes the strategy and rewinds the run.
- Both research agents are grounded with Google Search (billed per query on Gemini 3). `sources` and `grounded`
  come from grounding metadata, never from the model; the UI warns when `grounded` is false.
- Strategy uses the Pro model. Its `creativeMix` must add up to the run's `creativeCount` (validated, then repaired once).
- Research and strategy have no hand editor (`EDITABLE_AGENTS`); users change them with Regenerate + a note.

## Repo invariants (from AGENTS.md)

- Every relative import ends in `.js`.
- Surgical edits to existing files; no rewrites. Preserve auth/admin controls.
- The repo tsconfig is NOT strict: discriminated-union narrowing on `ok: boolean` does not work,
  so shared result types expose `.error` / `.value` on both variants. Check with `npm run lint`.
- No hardcoded secrets or fallback credentials.
- Any server-side URL fetch (brand website) must be SSRF-safe: block private /
  link-local / loopback ranges, cap redirects and response size.

## Chunk roadmap

- [x] 1. DB migration + shared types
- [x] 2. Server module skeleton: Gemini wrapper (structured output, retry, repair, timeout),
      validation, data layer, routes (meta / create / list / get run), feature gate,
      5-line hook in `server.ts` (`npm run test:campaign`)
- [x] 3. Brand Analyst agent + SSRF-safe fetcher + step engine (run / regenerate / edit / approve / cancel, versions)
- [x] 4. Frontend: dashboard entry, campaign list, new-campaign form, stepper, review card (approve / regenerate with note / edit / version browsing)
- [x] 5. Market + competitor research (parallel, one gate) and Strategy
- [ ] 6. Creative Direction and Master Prompts
- [ ] 7. Bulk creative generation, overlay, per-creative redo, save to My Designs
- [ ] 8. Credit pricing, redo caps, admin monitoring, QA agent
