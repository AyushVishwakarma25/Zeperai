-- ====================================================================
-- ZEPERAI STUDIO: CAMPAIGN LOCKS MIGRATION
--
-- Adds:
--   1. campaign_locks - atomic, distributed mutual exclusion across instances
--
-- Security model:
--   * Internal synchronization: table is accessed only by the service-role client.
--   * RLS enabled with default-deny for client access.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.campaign_locks (
  lock_key text PRIMARY KEY,
  owner text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_locks_expires
  ON public.campaign_locks(expires_at);

ALTER TABLE public.campaign_locks ENABLE ROW LEVEL SECURITY;
