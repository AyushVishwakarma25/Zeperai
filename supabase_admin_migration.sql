-- 1. Add is_admin, banned_at, banned_reason, last_active_at to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean not null default false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_reason text,
ADD COLUMN IF NOT EXISTS last_active_at timestamptz default now();

-- Ensure profiles are viewable by everyone/admin backend
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- 2. Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- 3. Enable RLS and add policy for admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin_actions" ON public.admin_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 4. Essential Performance Indexes for Admin Filtering, Sorting, and Pagination
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON public.admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
