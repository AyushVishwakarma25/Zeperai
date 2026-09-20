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
  SELECT their own rows (RLS). The server module must FAIL CLOSED if
  `SUPABASE_SERVICE_ROLE_KEY` is missing (do not reuse
  `getAdminSupabaseClient`, which falls back to the anon key).
- **Credits are spent server-side** via `spend_credits()` / `refund_credits()`
  (atomic, idempotent per reference, service_role only). Do not use the
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

## Repo invariants (from AGENTS.md)

- Every relative import ends in `.js`.
- Surgical edits to existing files; no rewrites. Preserve auth/admin controls.
- No hardcoded secrets or fallback credentials.
- Any server-side URL fetch (brand website) must be SSRF-safe: block private /
  link-local / loopback ranges, cap redirects and response size.

## Chunk roadmap

- [x] 1. DB migration + shared types
- [ ] 2. Server module skeleton (fail-closed service client, Gemini wrapper with
      structured output + retries, routes: create/get run), one-line hook in `server.ts`
- [ ] 3. Brand Analyst agent + SSRF-safe fetcher + step engine (run / approve / regenerate / versions)
- [ ] 4. Frontend shell: route, stepper, review card (approve / regenerate with note / edit)
- [ ] 5. Market + competitor research (parallel, one gate) and Strategy
- [ ] 6. Creative Direction and Master Prompts
- [ ] 7. Bulk creative generation, overlay, per-creative redo, save to My Designs
- [ ] 8. Credit pricing, redo caps, admin monitoring, QA agent
