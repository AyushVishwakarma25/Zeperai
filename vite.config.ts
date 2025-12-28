
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load all env vars, not just those starting with VITE_
  const env = loadEnv(mode, process.cwd(), '');

  // CRITICAL FIX: On Vercel, standard env vars (like API_KEY) are often injected 
  // into the build process.env directly, rather than read from a .env file.
  // We check both `env.API_KEY` (local .env) and `process.env.API_KEY` (system/Vercel).
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This replaces 'process.env.API_KEY' in your client code with the actual string value.
      // JSON.stringify ensures it is wrapped in quotes (e.g., '"AIza..."').
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});
