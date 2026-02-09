import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

// Initialize the Supabase client using the centralized and safe environment configuration.
// This ensures the app will not crash on startup if the variables are missing, as the wrapper provides fallbacks.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
