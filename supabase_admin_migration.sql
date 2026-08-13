-- 1. Add is_admin, banned_at, banned_reason to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean not null default false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_reason text;

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
