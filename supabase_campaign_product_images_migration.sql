-- ====================================================================
-- CAMPAIGN STUDIO: Product Reference Images Migration
-- Adds campaign_product_images table for real product photos
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.campaign_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.campaign_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  image_url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_product_images_run
  ON public.campaign_product_images(run_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_campaign_product_images_user
  ON public.campaign_product_images(user_id, created_at DESC);

-- Row Level Security: read-own only. Writes = service role (server) only.
ALTER TABLE public.campaign_product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own campaign product images" ON public.campaign_product_images;
CREATE POLICY "Users can view own campaign product images"
  ON public.campaign_product_images FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.campaign_product_images FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.campaign_product_images FROM authenticated;
