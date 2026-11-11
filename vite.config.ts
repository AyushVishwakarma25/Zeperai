import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    plugins: [
      react(),
      {
        name: 'configure-response-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/models/')) {
              res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
              res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            }
            next();
          });
        }
      }
    ],
    server: {
      warmup: {
        clientFiles: [
          './index.html',
          './index.tsx',
          './App.tsx',
          './components/AppMainView.tsx',
          './components/ProfilePage.tsx',
          './components/LoginPage.tsx',
          './components/SignupPage.tsx',
          './components/Dashboard.tsx',
          './components/MainContent.tsx',
          './components/AnalyticsDashboard.tsx',
          './components/ShopifyDashboard.tsx',
          './components/admin/AdminLoginPage.tsx',
          './components/admin/AdminDashboard.tsx',
        ],
      },
    },
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router',
        'react-router-dom',
      ],
      alias: {
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react-router': path.resolve(__dirname, 'node_modules/react-router'),
        'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      },
    },
    optimizeDeps: {
      entries: [
        'index.html',
        'index.tsx',
        'App.tsx',
        'components/**/*.{ts,tsx,js,jsx}',
        'src/**/*.{ts,tsx,js,jsx}',
      ],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router',
        'react-router-dom',
        'react-helmet-async',
        'framer-motion',
        'lucide-react',
        'axios',
        '@supabase/supabase-js',
        'chart.js',
        'react-chartjs-2',
        'react-dropzone',
        'html-to-image',
        'recharts',
        '@google/genai',
        '@imgly/background-removal',
        '@react-three/fiber',
        '@react-three/drei',
        'three',
        'papaparse',
      ],
      holdUntilCrawlEnd: true,
    },
    define: {
      // FIX: Expose Supabase variables to the client via process.env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.RAZORPAY_KEY_ID': JSON.stringify(env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ''),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});