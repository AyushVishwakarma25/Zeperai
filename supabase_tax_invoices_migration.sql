-- ====================================================================
-- ZEPERAI STUDIO - GST TAX INVOICES & BILLING METADATA MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- 1. Add GST and Billing fields to user profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_state text,
  ADD COLUMN IF NOT EXISTS billing_pincode text,
  ADD COLUMN IF NOT EXISTS gstin text;

-- 2. Add Invoice Tracking & Tax columns to payment_transactions
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS razorpay_invoice_id text,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS taxable_amount numeric,
  ADD COLUMN IF NOT EXISTS tax_amount numeric;

-- 3. Create index for fast user invoice queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_paid 
  ON public.payment_transactions(user_id, status, created_at DESC);

COMMENT ON COLUMN public.profiles.gstin IS '15-digit Goods and Services Tax Identification Number for Indian B2B customers';
COMMENT ON COLUMN public.payment_transactions.invoice_url IS 'Hosted official Razorpay GST Tax Invoice download URL';
