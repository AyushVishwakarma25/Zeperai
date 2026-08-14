-- ====================================================================
-- ZEPERAI STUDIO: PAYMENT IDEMPOTENCY MIGRATION
-- Adds a unique constraint on payment_transactions.razorpay_payment_id
-- Prevents double-crediting if both /verify and webhook fire for the same payment.
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_razorpay_payment_id_key'
  ) THEN
    -- In case there are null values, only non-null values will be constrained if using unique index,
    -- but ALTER TABLE ADD CONSTRAINT UNIQUE permits multiple NULLs standardly in PostgreSQL.
    ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_razorpay_payment_id_key UNIQUE (razorpay_payment_id);
  END IF;
END $$;
