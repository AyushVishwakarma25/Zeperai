
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { FormInput } from './ui/Form';
import { authService, AuthSession } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

const DB_SETUP_SQL = `-- Run this in your Supabase SQL Editor to fix Database & Storage errors

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

-- 4. Create Feedback Table
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  user_email text,
  rating text,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Enable RLS
alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.designs enable row level security;
alter table public.feedback enable row level security;

-- 6. Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can view own credits" on public.user_credits for select using (auth.uid() = user_id);
create policy "Users can view own designs" on public.designs for select using (auth.uid() = user_id);
create policy "Users can insert own designs" on public.designs for insert with check (auth.uid() = user_id);
create policy "Users can delete own designs" on public.designs for delete using (auth.uid() = user_id);
create policy "Anyone can insert feedback" on public.feedback for insert with check (true);

-- 7. Trigger for New Users
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

-- 8. STORAGE SETUP (Essential for saving designs)
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'designs' );

create policy "Authenticated Users can Upload"
  on storage.objects for insert
  with check ( bucket_id = 'designs' and auth.role() = 'authenticated' );

create policy "Users can update own images"
  on storage.objects for update
  using ( bucket_id = 'designs' and auth.uid() = owner );

create policy "Users can delete own images"
  on storage.objects for delete
  using ( bucket_id = 'designs' and auth.uid() = owner );
`;

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('Copy SQL');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowSql(false);

    try {
      let session;
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required");
        session = await authService.signUpWithPassword(name, email, password);
      } else {
        session = await authService.signInWithPassword(email, password);
      }
      onLoginSuccess(session);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      
      // Check for common database setup errors
      if (msg.includes("Database error saving new user") || msg.includes("relation") || msg.includes("trigger")) {
          setShowSql(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySql = () => {
      navigator.clipboard.writeText(DB_SETUP_SQL);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback('Copy SQL'), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-main flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Brand / Info */}
        <div className="w-full md:w-1/2 bg-primary p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                    <Icon name="logo" className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">KrackXai Studio</h1>
                <p className="text-white/80 text-lg">Create stunning, studio-quality product ads in seconds with the power of AI.</p>
            </div>
            
            <div className="relative z-10 mt-12">
                <div className="flex items-center space-x-2 text-sm text-white/70">
                    <Icon name="check-circle" className="w-5 h-5 text-accent-green" />
                    <span>AI Product Photography</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70 mt-2">
                    <Icon name="check-circle" className="w-5 h-5 text-accent-green" />
                    <span>Instant Copywriting</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70 mt-2">
                    <Icon name="check-circle" className="w-5 h-5 text-accent-green" />
                    <span>Commercial License</span>
                </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center overflow-y-auto max-h-[90vh]">
            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    {isSignUp ? 'Start your creative journey today.' : 'Please enter your details to sign in.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <FormInput 
                        label="Full Name" 
                        id="login-name" 
                        type="text" 
                        placeholder="John Doe" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                )}
                <FormInput 
                    label="Email Address" 
                    id="login-email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <FormInput 
                    label="Password" 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                {error && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex flex-col items-start">
                        <div className="flex items-center">
                            <Icon name="close" className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                        {showSql && (
                            <div className="mt-3 w-full">
                                <p className="text-xs text-slate-600 mb-2">
                                    It looks like the database tables aren't set up yet. 
                                    <br/>Run this SQL in your Supabase Dashboard:
                                </p>
                                <div className="relative">
                                    <pre className="bg-slate-800 text-slate-200 p-2 rounded text-[10px] overflow-x-auto h-32 whitespace-pre-wrap">
                                        {DB_SETUP_SQL}
                                    </pre>
                                    <button 
                                        type="button" 
                                        onClick={handleCopySql}
                                        className="absolute top-2 right-2 bg-white text-slate-800 text-[10px] px-2 py-1 rounded shadow hover:bg-slate-100"
                                    >
                                        {copyFeedback}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Button 
                    type="submit" 
                    fullWidth 
                    isLoading={isLoading} 
                    className="!py-3 !text-base mt-4"
                >
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-sm text-slate-600">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button 
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setShowSql(false);
                            }}
                            className="ml-1 text-primary font-semibold hover:underline"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
