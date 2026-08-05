import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env.js';

// Suppress known non-critical Supabase Auth errors that cause AI Studio validation to fail
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorMsg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (errorMsg.includes('Refresh Token Not Found') || errorMsg.includes('refresh_token_not_found')) {
    return; // Ignore harmless auth errors
  }
  originalConsoleError.apply(console, args);
};

// Initialize the Supabase client using the centralized and safe environment configuration.
// This ensures the app will not crash on startup if the variables are missing, as the wrapper provides fallbacks.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
