
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load all env vars, not just those starting with VITE_
  // This allows Vercel environment variables to be picked up.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This is the critical part: it replaces instances of 'process.env.API_KEY'
      // in your code with the actual string value from the environment.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});
