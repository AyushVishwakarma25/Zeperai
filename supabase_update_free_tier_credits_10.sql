-- ====================================================================
-- ZEPER AI - SUPABASE FREE TIER CREDIT UPDATE (10 CREDITS)
-- ====================================================================
-- Run this in your Supabase SQL Editor if you have existing accounts that
-- received 50 credits instead of 10 on the Free tier.

-- 1. Update the default columns on user_credits table
ALTER TABLE public.user_credits 
  ALTER COLUMN current_balance SET DEFAULT 10,
  ALTER COLUMN total_quota SET DEFAULT 10;

-- 2. Update existing Free tier users who have not used credits (or currently have 50)
UPDATE public.user_credits uc
SET 
  current_balance = 10,
  total_quota = 10,
  updated_at = NOW()
FROM public.profiles p
WHERE uc.user_id = p.id
  AND (p.tier = 'Free' OR p.tier IS NULL)
  AND uc.total_quota = 50
  AND uc.current_balance = 50;

-- 3. Update the handle_new_user() trigger to ensure all new signups get 10 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, tier)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url', 'Free')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_credits (user_id, current_balance, total_quota)
  VALUES (new.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan_id, plan_name, status, amount, credits_allocated)
  VALUES (new.id, 'free', 'Free Trial', 'active', 0, 10);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
