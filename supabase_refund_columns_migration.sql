-- ====================================================================
-- ZEPERAI STUDIO: PAYMENT TRANSACTIONS REFUND COLUMNS MIGRATION
-- Adds refund metadata and updated_at columns to payment_transactions.
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS refund_id text,
ADD COLUMN IF NOT EXISTS refund_amount integer,
ADD COLUMN IF NOT EXISTS refund_reason text,
ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
