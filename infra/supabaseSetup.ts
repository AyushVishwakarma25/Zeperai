export const SUPABASE_SETUP_SQL = `-- Database & Storage setup for ZepperAI
-- Run once in Supabase SQL Editor

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text default 'Creator',
  bio text,
  location text,
  avatar_url text,
  tier text default 'Free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Credits Table
create table if not exists public.user_credits (
  user_id uuid references public.profiles(id) on delete cascade not null primary key,
  current_balance integer default 10,
  total_quota integer default 10,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Designs Table
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

-- 4. Create Brand Kits Table
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

-- 5. Create Saved Models Table
create table if not exists public.saved_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Feedback Table
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  user_email text,
  rating text,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Create Analysis Reports Table
create table if not exists public.analysis_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  report_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create Inspiration Gallery Table (Community)
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

-- 9. Enable RLS
alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.designs enable row level security;
alter table public.brand_kits enable row level security;
alter table public.saved_models enable row level security;
alter table public.feedback enable row level security;
alter table public.analysis_reports enable row level security;
alter table public.inspiration_gallery enable row level security;

-- 10. Policies
-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Credits
create policy "Users can view own credits" on public.user_credits for select using (auth.uid() = user_id);

-- Designs
create policy "Users can view own designs" on public.designs for select using (auth.uid() = user_id);
create policy "Users can insert own designs" on public.designs for insert with check (auth.uid() = user_id);
create policy "Users can delete own designs" on public.designs for delete using (auth.uid() = user_id);

-- Brand Kits
create policy "Users can view own brand kit" on public.brand_kits for select using (auth.uid() = user_id);
create policy "Users can upsert own brand kit" on public.brand_kits for all using (auth.uid() = user_id);

-- Saved Models
create policy "Users can view own saved models" on public.saved_models for select using (auth.uid() = user_id);
create policy "Users can insert own saved models" on public.saved_models for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved models" on public.saved_models for delete using (auth.uid() = user_id);

-- Feedback
create policy "Anyone can insert feedback" on public.feedback for insert with check (true);

-- Analysis Reports
create policy "Users can view own reports" on public.analysis_reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on public.analysis_reports for insert with check (auth.uid() = user_id);

-- Inspiration Gallery
create policy "Anyone can view inspiration" on public.inspiration_gallery for select using (true);
create policy "Users can insert inspiration" on public.inspiration_gallery for insert with check (auth.uid() = user_id);
create policy "Users can delete own inspiration" on public.inspiration_gallery for delete using (auth.uid() = user_id);

-- 11. Trigger for New Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  
  insert into public.user_credits (user_id, current_balance, total_quota)
  values (new.id, 25, 25);
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 12. STORAGE SETUP
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true), ('landing-assets', 'landing-assets', true)
on conflict (id) do nothing;

create policy "Public Access Designs"
  on storage.objects for select
  using ( bucket_id = 'designs' );

create policy "Public Access Landing Assets"
  on storage.objects for select
  using ( bucket_id = 'landing-assets' );

create policy "Authenticated Users can Upload Designs"
  on storage.objects for insert
  with check ( bucket_id = 'designs' and auth.role() = 'authenticated' );

create policy "Authenticated Users can Upload Landing Assets"
  on storage.objects for insert
  with check ( bucket_id = 'landing-assets' and auth.role() = 'authenticated' );

create policy "Users can update own images Designs"
  on storage.objects for update
  using ( bucket_id = 'designs' and auth.uid() = owner );

create policy "Users can update own images Landing Assets"
  on storage.objects for update
  using ( bucket_id = 'landing-assets' and auth.uid() = owner );

create policy "Users can delete own images Designs"
  on storage.objects for delete
  using ( bucket_id = 'designs' and auth.uid() = owner );

create policy "Users can delete own images Landing Assets"
  on storage.objects for delete
  using ( bucket_id = 'landing-assets' and auth.uid() = owner );

-- 13. BACKFILL EXISTING USERS
insert into public.profiles (id, email, name, avatar_url)
select id, email, raw_user_meta_data->>'name', raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select id from public.profiles);

insert into public.user_credits (user_id, current_balance, total_quota)
select id, 25, 25
from public.profiles
where id not in (select user_id from public.user_credits);
`;