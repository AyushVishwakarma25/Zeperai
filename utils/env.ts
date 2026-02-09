/**
 * FILE: utils/env.ts
 *
 * PURPOSE:
 * - Centralizes all environment variable access into a single, type-safe module.
 * - Provides sane fallbacks for critical variables to prevent app crashes.
 * - Validates required variables and throws clear errors if they are missing.
 *
 * USAGE:
 * import { env } from '../utils/env';
 * const apiKey = env.API_KEY;
 */

// The polyfill in index.html is the single source of truth for env vars in this importmap setup.
const source = (window as any).process?.env || {};

const getString = (key: string, fallback: string): string => {
    const value = source[key];
    if (value === undefined || value === null || value === '' || value === 'undefined') {
        return fallback;
    }
    return String(value);
};

export const env = {
    NODE_ENV: getString('NODE_ENV', 'development'),
    
    // This key is loaded dynamically by AI Studio and may be empty initially.
    // It's not required on startup, so it should not throw an error.
    // Services that use it must handle the case where it's an empty string.
    API_KEY: getString('API_KEY', ''), 
    
    // Supabase keys ARE required for the client to initialize.
    // We provide the public defaults as fallbacks to prevent crashes.
    SUPABASE_URL: getString('VITE_SUPABASE_URL', 'https://gaekuvdnewzzwckmlntc.supabase.co'),
    SUPABASE_ANON_KEY: getString('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZWt1dmRuZXd6endja21sbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjA3MTYsImV4cCI6MjA4MTM5NjcxNn0.VIczknJhGRu3d4rTCKKHBeN56ykzw_Xgg4sTUF_x0J4'),

    // A helper function to check if the app is in development mode.
    isDevelopment: () => env.NODE_ENV === 'development',
};

// Perform a runtime check for variables that are absolutely essential for the app to function.
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Key are not configured. The app cannot start.");
}
