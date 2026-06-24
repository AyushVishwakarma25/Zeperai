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
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  next();
});

// --- SECURITY: Rate Limiting ---
app.set('trust proxy', 1);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

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

// --- RAZORPAY PAYMENT GATEWAY ---
let razorpayInstance: any = null;

function getRazorpay() {

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log(`[Razorpay Init Check] keyId present: ${!!keyId}, keySecret present: ${!!keySecret}`);
    if (keyId) {
      console.log(`[Razorpay Init Check] keyId: ${keyId.substring(0, 8)}... (${keyId.length} chars)`);
    }

    if (!razorpayInstance) {
      if (!keyId || !keySecret) {
        console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are missing from process.env. Using sandbox fallback.');
        return null;
      }
      try {
        const RazorpayClass = (Razorpay as any).default || Razorpay;
        console.log('[Razorpay Init] Creating instance with Razorpay SDK...');
        razorpayInstance = new (RazorpayClass as any)({
          key_id: keyId.trim(),
          key_secret: keySecret.trim()
        });
        console.log('[Razorpay Init] Razorpay instance created successfully.');
      } catch (err: any) {
        console.error('Failed to initialize Razorpay SDK:', err.message, err.stack);
      }
    }
    return razorpayInstance;
  }

  app.post(['/api/razorpay/create-order', '/api/create-order'], async (req, res) => {
    try {
      console.log('=== [API: create-order] START ===');
      console.log('[API: create-order] Raw req.body exists:', !!req.body);
      if (req.body) {
         console.log('[API: create-order] Payload parsed keys:', Object.keys(req.body));
      }
      
      const planId = req.body?.planId;
      const userId = req.body?.userId;
      const amount = req.body?.amount;
      const currency = req.body?.currency;
      const receipt = req.body?.receipt;
      
      let finalAmountPaise = 29900; // default 299 INR
      
      if (amount !== undefined && amount !== null) {
        if (req.path.endsWith('/create-order') && !req.path.includes('razorpay')) {
          finalAmountPaise = Math.round(Number(amount));
        } else {
          finalAmountPaise = Math.round(Number(amount) < 10000 ? Number(amount) * 100 : Number(amount));
        }
      }

      console.log(`[API: create-order] Calculated amount in paise: ${finalAmountPaise}`);

      if (finalAmountPaise < 100) {
        console.warn('[API: create-order] Refusing request: amount is less than 100 paise.');
        return res.status(400).json({ error: "Amount must be at least 100 paise." });
      }
      
      console.log('[API: create-order] Getting Razorpay instance...');
      const rzp = getRazorpay();
      
      if (!rzp) {
        console.log('[API: create-order] No real Razorpay instance. Falling back to Sandbox Mode.');
        const mockOrder = {
          id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
          amount: finalAmountPaise,
          currency: currency || 'INR',
          receipt: receipt || `receipt_mock_${Date.now()}`,
          status: 'created',
          notes: { planId, userId, isMock: true }
        };
        return res.json({ 
          order: mockOrder, 
          order_id: mockOrder.id, 
          id: mockOrder.id,
          amount: mockOrder.amount, 
          currency: mockOrder.currency,
          isSandbox: true 
        });
      }

      const shortUserId = ((userId as string) || 'anon').substring(0, 10);
      const generatedReceipt = `rcpt_${shortUserId}_${Date.now()}`.substring(0, 40);
      const options = {
        amount: finalAmountPaise, // paise
        currency: (currency as string) || 'INR',
        receipt: ((receipt as string) || generatedReceipt).substring(0, 40),
        notes: {
          planId: ((planId as string) || 'pay-as-you-go').substring(0, 50),
          userId: ((userId as string) || '').substring(0, 50)
        }
      };

      console.log('[API: create-order] Options prepared:', opcionesStringified(options));
      let order: any;

      try {
        console.log('[API: create-order] Calling rzp.orders.create(options)...');
        order = await rzp.orders.create(options);
        console.log('[API: create-order] Razorpay Order successfully created!', order?.id);
      } catch(rzpError: any) {
        console.error('[API: create-order] RZP SDK ERROR:', rzpError);
        const errorDetails = rzpError?.error ? (rzpError.error.description || rzpError.error.reason || rzpError.error.code) : (rzpError?.message || JSON.stringify(rzpError));
        console.warn(`[API: create-order] Parsed RZP Error: ${errorDetails}`);
        
        return res.status(500).json({ error: `Razorpay API Error: ${errorDetails}. Please verify your Razorpay API Keys.` });
      }

      console.log('[API: create-order] Sending success response...');
      return res.json({ 
        order, 
        order_id: order.id, 
        id: order.id,
        amount: order.amount, 
        currency: order.currency,
        isSandbox: false,
        key_id: process.env.RAZORPAY_KEY_ID?.trim() || ''
      });
    } catch (unhandledError: any) {
      console.error('=== [API: create-order] FATAL UNHANDLED ERROR ===', unhandledError, unhandledError?.stack);
      let errMsg = unhandledError?.message || 'Unknown fatal error in create-order';
      return res.status(500).json({ error: errMsg });
    }
  });

  // Helper stringifier to avoid recursive logging issues
  function opcionesStringified(obj: any) {
    try {
      return JSON.stringify(obj);
    } catch {
      return '[Unstringifiable Object]';
    }
  }

  app.post(['/api/razorpay/verify', '/api/verify-payment'], async (req, res) => {
    try {
      console.log('=== [API: verify] START ===');
      console.log('[API: verify] body exists?', !!req.body);
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        userId, 
        isSandbox,
        order_id,
        payment_id,
        signature
      } = req.body || {};

      const orderId = razorpay_order_id || order_id;
      const paymentId = razorpay_payment_id || payment_id;
      const sig = razorpay_signature || signature;

      // Input Validation: Missing fields return 400
      if (!orderId || !paymentId || !sig) {
        console.warn(`[API: verify] Missing fields. orderId=${orderId}, paymentId=${paymentId}, sig=${sig ? 'PRESENT' : 'MISSING'}`);
        return res.status(400).json({ error: 'Missing required query or payload fields (order_id, payment_id, signature).' });
      }

      if (isSandbox) {
        console.log(`[Sandbox] Simulating successful payment verification for user: ${userId}`);
        return res.json({ status: 'ok', verified: true, message: 'Payment simulated successfully in Sandbox!' });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({ error: 'Razorpay Secret Key not configured on server.' });
      }

      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${orderId}|${paymentId}`);
      const digest = shasum.digest('hex');

      // Signature Verification check: return 400 on mismatch (do NOT mark as paid / credit)
      if (digest !== sig) {
        console.warn(`[Verification Failed] Expected signature: ${digest}, received: ${sig}`);
        return res.status(400).json({ error: 'Signature verification failed. Potential tampering.' });
      }

      console.log(`[Production] Verified Razorpay Payment: ${paymentId} for Order: ${orderId}`);

      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey && userId) {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: current, error: fetchErr } = await adminClient
          .from('user_credits')
          .select('current, total')
          .eq('user_id', userId)
          .single();

        if (!fetchErr && current) {
          const newCurrent = (current.current || 0) + 100;
          const newTotal = (current.total || 0) + 100;
          
          const { error: updateErr } = await adminClient
            .from('user_credits')
            .update({ current: newCurrent, total: newTotal, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
            
          if (updateErr) {
             console.error('Failed to credit user balance inside DB:', updateErr.message);
          } else {
             console.log(`Successfully credited 100 credits to user ${userId}`);
          }
        }
      }

      return res.json({ status: 'ok', verified: true });
    } catch (unhandledError: any) {
      console.error('=== [API: verify] FATAL UNHANDLED ERROR ===', unhandledError, unhandledError?.stack);
      return res.status(500).json({ error: unhandledError?.message || 'Signature verification failed.' });
    }
  });
  
  app.get('/api/proxy-image', async (req, res) => {
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

  app.post('/api/gemini/generate', aiLimiter, async (req, res) => {
    try {
      console.log('API call received, API key present:', !!process.env.GEMINI_API_KEY);
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

  app.post('/api/analyze-shopify', upload.array('files'), async (req, res) => {
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
    const PORT = process.env.PORT || 3000;
    
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


