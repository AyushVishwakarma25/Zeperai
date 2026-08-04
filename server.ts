import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";
import multer from 'multer';
import axios from 'axios';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// Manual backup parsing of local .env file to populate process.env before checking credentials
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
    console.log('Successfully loaded environment variables from physical .env file.');
  }
} catch (err: any) {
  console.warn('Manual .env file parsing skipped or failed:', err.message);
}

import { analyzeShopify } from './services/shopifyAnalyst.js';
import { getAI } from './config/ai.js';

const multerInstance = (multer as any).default || multer;
const upload = multerInstance({ storage: multerInstance.memoryStorage() });

export const app = express();

// Add headers for COOP/COEP to enable WebAssembly multi-threading (SharedArrayBuffer)
// CRITICAL WEBVIEW COMPATIBILITY FIX: Omit COOP/COEP headers for messenger in-app webviews (LINE, FB, WhatsApp, etc.)
// which would otherwise crash the webview, block scripts, or prevent loading external generated images.
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  const isWebView = /Line|FBAV|Instagram|MicroMessenger|WhatsApp|FB_IAB/i.test(ua);
  
  if (!isWebView) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  }
  next();
});

// --- SECURITY: Rate Limiting ---
// Set trust proxy to true (or the number of upstream proxies) to correctly retrieve the client's actual IP
// under Cloud Run/Vercel reverse proxies, preventing rate-limiting all users under a single balancer IP.
app.set('trust proxy', 1);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  validate: { trustProxy: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  validate: { trustProxy: false },
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
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', message: 'ZeperAI Server is running with Rate Limiting!' });
});

// --- RAZORPAY PAYMENT GATEWAY ---
  let razorpayInstance: any = null;

  function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    
    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured.');
      return null;
    }

    if (!razorpayInstance) {
      try {
        const RazorpayClass = (Razorpay as any).default || Razorpay;
        razorpayInstance = new (RazorpayClass as any)({
          key_id: keyId,
          key_secret: keySecret
        });
        console.log('[Razorpay Init] Razorpay instance created successfully.');
      } catch (err: any) {
        console.error('Failed to initialize Razorpay SDK:', err.message);
      }
    }
    return razorpayInstance;
  }

  app.post(['/api/razorpay/create-order', '/api/create-order', '/razorpay/create-order', '/create-order'], async (req, res) => {
    try {
      const { planId, userId, amount, currency = 'INR', receipt } = req.body || {};
      
      let finalAmountPaise = 49900; // default 499 INR
      if (amount) {
        finalAmountPaise = Math.round(Number(amount) * 100);
      }

      if (finalAmountPaise < 100) {
        return res.status(400).json({ error: "Amount must be at least 1 INR." });
      }
      
      const rzp = getRazorpay();
      if (!rzp) {
        return res.status(500).json({ error: "Razorpay is not configured on the server." });
      }

      const generatedReceipt = `rcpt_${(userId || 'anon').substring(0, 10)}_${Date.now()}`.substring(0, 40);
      const options = {
        amount: finalAmountPaise, // paise
        currency: currency,
        receipt: (receipt || generatedReceipt).substring(0, 40),
        notes: {
          planId: (planId || 'pay-as-you-go').substring(0, 50),
          userId: (userId || '').substring(0, 50)
        }
      };

      const order = await rzp.orders.create(options);

      return res.json({ 
        order, 
        order_id: order.id, 
        id: order.id,
        amount: order.amount, 
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID?.trim() || ''
      });
    } catch (error: any) {
      console.error('Razorpay Create Order Error:', error);
      return res.status(500).json({ error: error?.error?.description || error.message || 'Failed to create order' });
    }
  });

  app.post(['/api/razorpay/verify', '/api/verify-payment', '/razorpay/verify', '/verify-payment'], async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        userId
      } = req.body || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required payment verification fields.' });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!keySecret) {
        return res.status(500).json({ error: 'Razorpay Secret Key not configured on server.' });
      }

      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpay_signature) {
        return res.status(400).json({ error: 'Signature verification failed. Potential tampering.' });
      }

      console.log(`[Production] Verified Razorpay Payment: ${razorpay_payment_id} for Order: ${razorpay_order_id}`);

      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey && userId && userId !== 'guest') {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: current, error: fetchErr } = await adminClient
          .from('user_credits')
          .select('current_balance, total_quota')
          .eq('user_id', userId)
          .single();

        if (fetchErr && fetchErr.code !== 'PGRST116') {
          console.error('[API: verify] Error fetching user_credits:', fetchErr.message);
        }

        if (current) {
          const newCurrent = (current.current_balance || 0) + 100;
          const newTotal = (current.total_quota || 0) + 100;
          
          await adminClient
            .from('user_credits')
            .update({ 
              current_balance: newCurrent, 
              total_quota: newTotal, 
              updated_at: new Date().toISOString() 
            })
            .eq('user_id', userId);
        } else {
          await adminClient
            .from('user_credits')
            .insert({
              user_id: userId,
              current_balance: 100,
              total_quota: 100,
              updated_at: new Date().toISOString()
            });
        }
      }

      return res.json({ status: 'ok', verified: true });
    } catch (error: any) {
      console.error('Razorpay Verify Error:', error);
      return res.status(500).json({ error: error.message || 'Signature verification failed.' });
    }
  });

  app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(req.body);
      const digest = shasum.digest('hex');

      if (digest !== req.headers['x-razorpay-signature']) {
        console.warn('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = JSON.parse(req.body.toString());
      console.log('Razorpay Webhook Event:', event.event);

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const userId = payment.notes?.userId;
        
        if (userId && userId !== 'guest') {
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          
          if (supabaseUrl && supabaseServiceKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const adminClient = createClient(supabaseUrl, supabaseServiceKey);
            
            // Basic webhook credit logic
            console.log(`Payment captured via webhook for user: ${userId}`);
            const { data: current, error: fetchErr } = await adminClient
              .from('user_credits')
              .select('current_balance, total_quota')
              .eq('user_id', userId)
              .single();

            if (current) {
              const newCurrent = (current.current_balance || 0) + 100;
              const newTotal = (current.total_quota || 0) + 100;
              await adminClient
                .from('user_credits')
                .update({ current_balance: newCurrent, total_quota: newTotal, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
            } else {
              await adminClient
                .from('user_credits')
                .insert({ user_id: userId, current_balance: 100, total_quota: 100, updated_at: new Date().toISOString() });
            }
          }
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (error: any) {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });
  
  app.get(['/api/proxy-image', '/proxy-image'], async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'No URL provided' });
    
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'] as string;
      res.setHeader('Content-Type', contentType || 'image/png');
      res.send(response.data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  app.post(['/api/gemini/generate', '/gemini/generate'], aiLimiter, async (req, res) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GeminiAPI || process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GeminiAPI;
      const openaiKey = process.env.OPENAI_API_KEY;
      
      console.log('--- [API: generate] Verification ---');
      console.log('Gemini API Key defined:', !!geminiKey);
      console.log('OpenAI API Key defined (for DALL-E 3):', !!openaiKey);
      console.log('Selected Model:', req.body?.model);
      console.log('------------------------------------');
      
      if (!geminiKey && (!req.body?.model || !req.body.model.toLowerCase().includes('dall-e'))) {
         console.warn("[SECURITY WARNING] No Gemini API Key found in process.env! Requests will fail.");
      }
      if (!openaiKey && req.body?.model && req.body.model.toLowerCase().includes('dall-e')) {
         console.warn("[SECURITY WARNING] No OpenAI API Key found in process.env! DALL-E 3 request will fail.");
      }

      const { model, contents, config } = req.body;
      const ai = getAI();
      const response = await ai.models.generateContent({ model, contents, config });
      
      let textStr = '';
      try {
          if (typeof response.text === 'string') {
              textStr = response.text;
          } else {
              textStr = response.text; // might throw getter error if no text
          }
      } catch (e) {
          // It's an image or something else without text parts
      }

      res.json({
        text: textStr,
        candidates: response.candidates,
        usageMetadata: response.usageMetadata,
        modelVersion: response.modelVersion,
        promptFeedback: response.promptFeedback
      });
    } catch (error: any) {
      console.error('Gemini Proxy Error:', error);
      res.status(500).json({ 
          error: error.message || 'Failed to generate content.',
          details: error.statusText || error.name || 'Unknown API Error',
          status: error.status || 500
      });
    }
  });

  app.post(['/api/analyze-shopify', '/analyze-shopify'], upload.array('files'), async (req, res) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        const files = req.files as Express.Multer.File[];
        const result = await analyzeShopify(files as any);
        
        res.json(result);
    } catch (error: any) {
        console.error('Data Analyst Error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to analyze data.' });
    }
  });

  app.post(['/api/remove-bg-pro', '/remove-bg-pro'], aiLimiter, async (req, res) => {
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

      if (imageUrl) {
        formData.append('image_url', imageUrl);
      } else if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        formData.append('image_file', buffer, { filename: 'image.png' });
      }

      let response;
      if (proBgUrl) {
          // Sovereign Custom Background Removal Server
          response = await axios.post(proBgUrl, formData, {
            headers: { ...formData.getHeaders() },
            responseType: 'arraybuffer',
          });
      } else {
          // Fallback to remove.bg API
          formData.append('size', 'auto');
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

  // PREVENT VITE FROM SWALLOWING UNHANDLED API CALLS WITH SPA FALLBACK
  app.all('/api/*all', (req, res) => {
    res.status(404).json({ error: `API Route not found: ${req.method} ${req.path}` });
  });

  // Default Error Handler (must be last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    if (req.path.startsWith('/api/')) {
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
        next(err);
    }
  });

  // Export default for Vercel Serverless Functions
  export default app;

  // Only start server locally (not when processed by Vercel's serverless builder)
  if (!process.env.VERCEL) {
    const PORT = 3000;
    
    // --- VITE & STATIC SERVING ---
    const setupViteAndStart = async () => {
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
      
      app.listen(PORT, () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    };
    
    setupViteAndStart();
  }


