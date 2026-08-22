import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env.js';

// Suppress known non-critical Supabase Auth & background network errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorMsg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
    errorMsg.includes('Refresh Token Not Found') || 
    errorMsg.includes('refresh_token_not_found') ||
    errorMsg.includes('Failed to fetch') ||
    errorMsg.includes('TypeError: Failed to fetch')
  ) {
    console.warn('Suppressed background auth/network notice:', errorMsg);
    return; // Ignore harmless auth/network errors
  }
  originalConsoleError.apply(console, args);
};

// Initialize the Supabase client with custom fetch wrapper to safely handle offline/sandbox network drops
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, options).catch((err) => {
        console.warn('Supabase network notice:', err?.message || err);
        throw err;
      });
    }
  }
});
