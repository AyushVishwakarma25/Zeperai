import express from 'express';
import cors from 'cors';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";
import multer from 'multer';
import axios from 'axios';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add headers for COOP/COEP to enable WebAssembly multi-threading (SharedArrayBuffer)
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    next();
  });

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

  app.post('/api/analyze-shopify', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        const { analyzeShopify } = await import('./services/shopifyAnalyst.js');
        const files = req.files as Express.Multer.File[];
        const result = await analyzeShopify(files as any);
        
        res.json(result);
    } catch (error: any) {
        console.error('Data Analyst Error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to analyze data.' });
    }
  });

  app.post('/api/remove-bg-pro', aiLimiter, async (req, res) => {
    const { imageUrl, imageBase64 } = req.body;
    const proBgUrl = process.env.PRO_BG_API_URL;
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!proBgUrl && !apiKey) {
      return res.status(500).json({ error: 'Pro Background API not configured. Set PRO_BG_API_URL or REMOVE_BG_API_KEY.' });
    }

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'No image source provided' });
    }

    try {
      const FormData = (await import('form-data')).default;
      const axios = (await import('axios')).default;

      const formData = new FormData();
      
      const base64Data = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, "") : null;

      let response;
      if (proBgUrl) {
          // Sovereign Custom Background Removal Server
          if (imageUrl) {
            formData.append('image_url', imageUrl); // Depending on custom server capabilities
          } else if (base64Data) {
            formData.append('image_file_b64', base64Data);
          }
          response = await axios.post(proBgUrl, formData, {
            headers: { ...formData.getHeaders() },
            responseType: 'arraybuffer',
          });
      } else {
          // Fallback to remove.bg API
          formData.append('size', 'auto');
          if (imageUrl) {
            formData.append('image_url', imageUrl);
          } else if (base64Data) {
            formData.append('image_file_b64', base64Data);
          }
          response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
            headers: {
              ...formData.getHeaders(),
              'X-API-Key': apiKey,
            },
            responseType: 'arraybuffer',
          });
      }

      const base64Result = Buffer.from(response.data, 'binary').toString('base64');
      res.json({ 
        imageUrl: `data:image/png;base64,${base64Result}`,
        success: true 
      });
    } catch (error: any) {
      console.error('Pro BG Error:', error.response?.data?.toString() || error.message);
      const errorMessage = error.response?.data?.toString() || 'Failed to remove background';
      res.status(500).json({ error: errorMessage });
    }
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
