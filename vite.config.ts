import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Priority: 
  // 1. env.GEMINI_API_KEY (System Default)
  // 2. process.env.GEMINI_API_KEY
  // 3. env.API_KEY (Local .env file)
  // 4. process.env.API_KEY (Vercel System Env)
  // 5. env.VITE_API_KEY (Vercel Public Env Convention)
  // 6. process.env.VITE_API_KEY (Fallback)
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY;

  return {
    plugins: [react()],
    define: {
      // This replaces 'process.env.API_KEY' in your client code with the actual string value.
      // We default to '' to avoid inserting the literal string "undefined" into the bundle.
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
      // FIX: Expose Supabase variables to the client via process.env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});