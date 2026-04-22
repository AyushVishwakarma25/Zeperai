import express from 'express';
import cors from 'cors';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- SECURITY: Rate Limiting ---
  // Fix for "trust proxy" validation error in Cloud Run/Proxy environments
  app.set('trust proxy', 1);
  
  // 1. Global Rate Limiter: 100 requests per 15 minutes
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
  });

  // 2. Strict AI Limiter: 20 generations per 10 minutes (to control costs/credits)
  const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Generation quota reached. Please wait a few minutes before creating more visuals.' }
  });

  app.use(cors());
  app.use(globalLimiter);

  // Increase payload limit to handle large base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ZeperAI Server is running with Rate Limiting!' });
  });

  // --- VITE & STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
