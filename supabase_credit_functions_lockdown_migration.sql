-- ====================================================================
-- LOCK DOWN spend_credits / refund_credits (SECURITY DEFINER)
--
-- Problem: these functions were created without any REVOKE. In Supabase,
-- functions in the public schema are executable by the anon and
-- authenticated roles and exposed at /rest/v1/rpc/<name>, so anyone holding
-- the (public) anon key could call:
--   rpc('refund_credits', { p_user_id: <any user>, p_amount: 1000000 })
-- and mint credits, or drain another user's balance with spend_credits.
--
-- Fix: only the server (service_role) may execute them, and pin search_path
-- so a SECURITY DEFINER function cannot be hijacked via a shadowing schema.
-- Safe to re-run.
-- ====================================================================

ALTER FUNCTION public.spend_credits(uuid, numeric, text)  SET search_path = public;
ALTER FUNCTION public.refund_credits(uuid, numeric, text) SET search_path = public;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric, text)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric, text)  TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, numeric, text) TO service_role;
