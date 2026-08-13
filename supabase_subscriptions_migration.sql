-- Add cancel_at_period_end column to subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean default false;
