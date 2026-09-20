-- ====================================================================
-- ZEPERAI STUDIO: CAMPAIGN STUDIO MIGRATION (multi-agent brand visuals)
--
-- Adds:
--   1. campaign_runs    - one row per workflow run (brand input + goal + settings)
--   2. campaign_steps   - one row per agent output VERSION (redo = new version)
--   3. campaign_assets  - generated creatives (one row per creative version)
--   4. spend_credits()  - atomic, idempotent credit spend + ledger entry
--   5. refund_credits() - refunds exactly what a reference was charged, once
--
-- Security model:
--   * Users can only SELECT their own rows (RLS). There are NO insert/update/
--     delete policies, so all writes must go through the server using the
--     service-role key. Users cannot tamper with step status or credits.
--   * spend_credits / refund_credits are SECURITY DEFINER and executable by
--     service_role ONLY (revoked from public/anon/authenticated).
--
-- Safe to re-run (idempotent). Only creates new objects, plus one additive
-- index on credit_transactions.
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. Shared updated_at trigger function
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.campaign_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------
-- 1. campaign_runs
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  input_type text NOT NULL CHECK (input_type IN ('website', 'details')),
  website_url text CHECK (website_url IS NULL OR char_length(website_url) <= 2048),
  brand_details text CHECK (brand_details IS NULL OR char_length(brand_details) <= 8000),
  goal text NOT NULL,                       -- sales | awareness | engagement | leads | launch | retention | custom
  goal_notes text CHECK (goal_notes IS NULL OR char_length(goal_notes) <= 2000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_step text NOT NULL DEFAULT 'brand_analysis',
  brand_context jsonb NOT NULL DEFAULT '{}'::jsonb,   -- approved Brand Context (single source of truth)
  settings jsonb NOT NULL DEFAULT '{"creativeCount":5,"quality":"Standard","aspectRatio":"1:1"}'::jsonb,
  credits_spent numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_runs_user_created
  ON public.campaign_runs(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_campaign_runs_updated_at ON public.campaign_runs;
CREATE TRIGGER trg_campaign_runs_updated_at
  BEFORE UPDATE ON public.campaign_runs
  FOR EACH ROW EXECUTE FUNCTION public.campaign_touch_updated_at();

-- --------------------------------------------------------------------
-- 2. campaign_steps  (every regenerate creates version N+1)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.campaign_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- denormalised for simple RLS
  agent text NOT NULL CHECK (agent IN (
    'brand_analysis', 'market_research', 'competitor_research',
    'strategy', 'creative_direction', 'master_prompts', 'creatives'
  )),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'awaiting_review', 'approved', 'superseded', 'failed'
  )),
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,   -- exactly what the agent was given (debuggable, reproducible)
  output jsonb,                                        -- structured agent output (null until it succeeds)
  user_feedback text CHECK (user_feedback IS NULL OR char_length(user_feedback) <= 4000),
  model text,
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,            -- token counts etc.
  error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_at timestamptz,
  UNIQUE (run_id, agent, version)
);

-- At most ONE approved version per agent per run.
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_steps_one_approved
  ON public.campaign_steps(run_id, agent) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_campaign_steps_run_agent
  ON public.campaign_steps(run_id, agent, version DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_user
  ON public.campaign_steps(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_campaign_steps_updated_at ON public.campaign_steps;
CREATE TRIGGER trg_campaign_steps_updated_at
  BEFORE UPDATE ON public.campaign_steps
  FOR EACH ROW EXECUTE FUNCTION public.campaign_touch_updated_at();

-- --------------------------------------------------------------------
-- 3. campaign_assets  (generated creatives)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.campaign_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creative_index smallint NOT NULL CHECK (creative_index BETWEEN 1 AND 10),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'generating', 'ready', 'failed', 'superseded'
  )),
  prompt text,
  aspect_ratio text,
  model text,
  image_url text,
  storage_path text,
  overlay jsonb NOT NULL DEFAULT '{}'::jsonb,          -- headline / CTA / logo placement (applied client-side)
  credits_charged numeric(10,2) NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (run_id, creative_index, version)
);

CREATE INDEX IF NOT EXISTS idx_campaign_assets_run
  ON public.campaign_assets(run_id, creative_index, version DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_user
  ON public.campaign_assets(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_campaign_assets_updated_at ON public.campaign_assets;
CREATE TRIGGER trg_campaign_assets_updated_at
  BEFORE UPDATE ON public.campaign_assets
  FOR EACH ROW EXECUTE FUNCTION public.campaign_touch_updated_at();

-- --------------------------------------------------------------------
-- 4. Row Level Security: read-own only. Writes = service role (server) only.
-- --------------------------------------------------------------------
ALTER TABLE public.campaign_runs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own campaign runs" ON public.campaign_runs;
CREATE POLICY "Users can view own campaign runs"
  ON public.campaign_runs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own campaign steps" ON public.campaign_steps;
CREATE POLICY "Users can view own campaign steps"
  ON public.campaign_steps FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own campaign assets" ON public.campaign_assets;
CREATE POLICY "Users can view own campaign assets"
  ON public.campaign_assets FOR SELECT USING (auth.uid() = user_id);

-- Defense in depth: even if a permissive policy is added by mistake later,
-- client roles still hold no write privileges on these tables.
REVOKE ALL ON public.campaign_runs, public.campaign_steps, public.campaign_assets FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.campaign_runs, public.campaign_steps, public.campaign_assets FROM authenticated;

-- --------------------------------------------------------------------
-- 5. Credits: atomic + idempotent spend, and one-shot refund
--    Ledger sign convention for these functions: spend = negative amount,
--    refund = positive amount (balance_before/balance_after are always set).
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference
  ON public.credit_transactions(user_id, reference_type, reference_id);

CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount numeric,
  p_reference_type text,
  p_reference_id text,
  p_model text DEFAULT NULL,
  p_studio text DEFAULT 'campaign_studio',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric;
  v_after  numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF p_reference_type IS NULL OR p_reference_id IS NULL THEN
    RAISE EXCEPTION 'reference_required';
  END IF;

  -- Row lock serialises concurrent spends for the same user.
  SELECT current_balance INTO v_before
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'no_credit_record';
  END IF;

  -- Idempotency: if this reference was already charged, do not charge again.
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'generation'
      AND reference_type = p_reference_type
      AND reference_id = p_reference_id
  ) THEN
    RETURN v_before;
  END IF;

  IF v_before < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  v_after := v_before - p_amount;

  UPDATE public.user_credits
  SET current_balance = v_after,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, transaction_type, amount, balance_before, balance_after,
    reference_type, reference_id, model, studio, metadata
  ) VALUES (
    p_user_id, 'generation', -p_amount, v_before, v_after,
    p_reference_type, p_reference_id, p_model, p_studio, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_reference_type text,
  p_reference_id text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before  numeric;
  v_after   numeric;
  v_spent   numeric;
  v_model   text;
  v_studio  text;
BEGIN
  SELECT current_balance INTO v_before
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'no_credit_record';
  END IF;

  -- Refund only what this exact reference was charged.
  SELECT -amount, model, studio INTO v_spent, v_model, v_studio
  FROM public.credit_transactions
  WHERE user_id = p_user_id
    AND transaction_type = 'generation'
    AND reference_type = p_reference_type
    AND reference_id = p_reference_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_spent IS NULL OR v_spent <= 0 THEN
    RETURN v_before;   -- nothing was charged for this reference
  END IF;

  -- Idempotency: never refund the same reference twice.
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'generation_refund'
      AND reference_type = p_reference_type
      AND reference_id = p_reference_id
  ) THEN
    RETURN v_before;
  END IF;

  v_after := v_before + v_spent;

  UPDATE public.user_credits
  SET current_balance = v_after,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, transaction_type, amount, balance_before, balance_after,
    reference_type, reference_id, model, studio, metadata
  ) VALUES (
    p_user_id, 'generation_refund', v_spent, v_before, v_after,
    p_reference_type, p_reference_id, v_model, v_studio, '{}'::jsonb
  );

  RETURN v_after;
END;
$$;

-- Lock both functions down: service role (server) only.
REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, text) TO service_role;
