-- ====================================================================
-- ZEPERAI STUDIO: CAMPAIGN STUDIO KNOWN FACTS MIGRATION
--
-- Adds nullable known_facts column to campaign_runs so users can
-- supply business-internal metrics and facts (CAC, ROAS, recent changes)
-- that Google Search cannot find.
--
-- Safe to re-run (idempotent).
-- ====================================================================

ALTER TABLE public.campaign_runs
  ADD COLUMN IF NOT EXISTS known_facts text
  CHECK (known_facts IS NULL OR char_length(known_facts) <= 4000);
