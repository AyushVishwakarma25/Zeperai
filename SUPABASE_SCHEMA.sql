-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR ZEPERAI STUDIO
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ====================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text default 'Creator',
  bio text,
  location text,
  avatar_url text,
  tier text default 'Free', -- 'Free', 'PayAsYouGo', 'Pro'
  is_admin boolean default false,
  banned_at timestamp with time zone,
  banned_reason text,
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER CREDITS TABLE
create table if not exists public.user_credits (
  user_id uuid references public.profiles(id) on delete cascade not null primary key,
  current_balance integer default 50,
  total_quota integer default 50,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. SUBSCRIPTIONS TABLE (Tracks Active & Past Subscriptions)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id text not null, -- 'free', 'payg', 'pro'
  plan_name text not null, -- 'Free Trial', 'Pay As You Go', 'Pro'
  status text not null default 'active', -- 'active', 'cancelled', 'expired', 'past_due'
  amount integer not null default 0, -- Amount in INR/subunit
  currency text default 'INR',
  credits_allocated integer default 0,
  razorpay_subscription_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  current_period_start timestamp with time zone default timezone('utc'::text, now()),
  current_period_end timestamp with time zone default timezone('utc'::text, now() + interval '30 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PAYMENT TRANSACTIONS TABLE (Audit Log for Purchases & Top-Ups)
create table if not exists public.payment_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  plan_id text not null,
  amount integer not null,
  currency text default 'INR',
  credits_added integer not null default 0,
  status text not null default 'paid',
  refund_id text,
  refund_amount integer,
  refund_reason text,
  refunded_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. DESIGNS TABLE
create table if not exists public.designs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  caption text,
  hashtags text,
  aspect_ratio text,
  params jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. BRAND KITS TABLE
create table if not exists public.brand_kits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  brand_name text,
  primary_color text,
  secondary_color text,
  accent_color text,
  fonts text,
  voice text,
  description text,
  negative_constraints text,
  logo_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. SAVED MODELS TABLE
create table if not exists public.saved_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. FEEDBACK TABLE
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  user_email text,
  rating text,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. ANALYSIS REPORTS TABLE
create table if not exists public.analysis_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  report_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. INSPIRATION GALLERY TABLE
create table if not exists public.inspiration_gallery (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  title text,
  category text,
  app_mode text,
  remix_params jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.designs enable row level security;
alter table public.brand_kits enable row level security;
alter table public.saved_models enable row level security;
alter table public.feedback enable row level security;
alter table public.analysis_reports enable row level security;
alter table public.inspiration_gallery enable row level security;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES (IDEMPOTENT WITH DROP IF EXISTS)
-- ====================================================================

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Credits
drop policy if exists "Users can view own credits" on public.user_credits;
create policy "Users can view own credits" on public.user_credits for select using (auth.uid() = user_id);

-- Subscriptions
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- Payment Transactions
drop policy if exists "Users can view own transactions" on public.payment_transactions;
create policy "Users can view own transactions" on public.payment_transactions for select using (auth.uid() = user_id);

-- Designs
drop policy if exists "Users can view own designs" on public.designs;
create policy "Users can view own designs" on public.designs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own designs" on public.designs;
create policy "Users can insert own designs" on public.designs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own designs" on public.designs;
create policy "Users can delete own designs" on public.designs for delete using (auth.uid() = user_id);

-- Brand Kits
drop policy if exists "Users can view own brand kit" on public.brand_kits;
create policy "Users can view own brand kit" on public.brand_kits for select using (auth.uid() = user_id);

drop policy if exists "Users can upsert own brand kit" on public.brand_kits;
create policy "Users can upsert own brand kit" on public.brand_kits for all using (auth.uid() = user_id);

-- Saved Models
drop policy if exists "Users can view own saved models" on public.saved_models;
create policy "Users can view own saved models" on public.saved_models for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved models" on public.saved_models;
create policy "Users can insert own saved models" on public.saved_models for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved models" on public.saved_models;
create policy "Users can delete own saved models" on public.saved_models for delete using (auth.uid() = user_id);

-- Feedback
drop policy if exists "Anyone can insert feedback" on public.feedback;
create policy "Anyone can insert feedback" on public.feedback for insert with check (true);

-- Analysis Reports
drop policy if exists "Users can view own reports" on public.analysis_reports;
create policy "Users can view own reports" on public.analysis_reports for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.analysis_reports;
create policy "Users can insert own reports" on public.analysis_reports for insert with check (auth.uid() = user_id);

-- Inspiration Gallery
drop policy if exists "Anyone can view inspiration" on public.inspiration_gallery;
create policy "Anyone can view inspiration" on public.inspiration_gallery for select using (true);

drop policy if exists "Users can insert inspiration" on public.inspiration_gallery;
create policy "Users can insert inspiration" on public.inspiration_gallery for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own inspiration" on public.inspiration_gallery;
create policy "Users can delete own inspiration" on public.inspiration_gallery for delete using (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC NEW USER HANDLER (TRIGGER)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, tier)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url', 'Free')
  on conflict (id) do nothing;
  
  insert into public.user_credits (user_id, current_balance, total_quota)
  values (new.id, 50, 50)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan_id, plan_name, status, amount, credits_allocated)
  values (new.id, 'free', 'Free Trial', 'active', 0, 50);
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_created_at on public.subscriptions(created_at desc);
create index if not exists idx_payment_transactions_user_id on public.payment_transactions(user_id);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status);
create index if not exists idx_payment_transactions_created_at on public.payment_transactions(created_at desc);
create index if not exists idx_designs_user_id on public.designs(user_id);
create index if not exists idx_designs_created_at on public.designs(created_at desc);
create index if not exists idx_profiles_tier on public.profiles(tier);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- ====================================================================
-- STORAGE BUCKETS SETUP
-- ====================================================================
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true), ('landing-assets', 'landing-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Designs" on storage.objects;
create policy "Public Access Designs"
  on storage.objects for select
  using ( bucket_id = 'designs' );

drop policy if exists "Public Access Landing Assets" on storage.objects;
create policy "Public Access Landing Assets"
  on storage.objects for select
  using ( bucket_id = 'landing-assets' );

drop policy if exists "Authenticated Users can Upload Designs" on storage.objects;
create policy "Authenticated Users can Upload Designs"
  on storage.objects for insert
  with check ( bucket_id = 'designs' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated Users can Upload Landing Assets" on storage.objects;
create policy "Authenticated Users can Upload Landing Assets"
  on storage.objects for insert
  with check ( bucket_id = 'landing-assets' and auth.role() = 'authenticated' );
