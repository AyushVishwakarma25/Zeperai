-- ====================================================================
-- CAMPAIGN STUDIO V2: Advertising References Migration (Phase 2)
-- Adds campaign_references table for user-uploaded advertising references
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.campaign_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.campaign_runs(id) ON DELETE SET NULL,
  concept_id text,
  image_url text NOT NULL,
  storage_path text,
  reference_mode text NOT NULL DEFAULT 'inspiration' CHECK (reference_mode IN ('inspiration', 'layout', 'style_transfer')),
  reference_role text NOT NULL DEFAULT 'general' CHECK (reference_role IN ('layout', 'typography', 'color', 'photography', 'general')),
  analysis_status text NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  design_dna jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_references_user
  ON public.campaign_references(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_references_run
  ON public.campaign_references(run_id, created_at ASC);

-- Row Level Security: read-own only. Writes = service role (server) only.
ALTER TABLE public.campaign_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own campaign references" ON public.campaign_references;
CREATE POLICY "Users can view own campaign references"
  ON public.campaign_references FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.campaign_references FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.campaign_references FROM authenticated;

