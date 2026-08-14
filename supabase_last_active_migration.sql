-- ====================================================================
-- ZEPERAI STUDIO: PROFILES LAST_ACTIVE_AT MIGRATION
-- Adds last_active_at column to public.profiles.
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now());
