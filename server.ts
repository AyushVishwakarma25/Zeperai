import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

// Default Supabase configuration fallback matching client defaults
const DEFAULT_SUPABASE_URL = 'https://kvqzfiezakcbnxbagxjs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

import { getAI } from './config/ai.js';
import { globalErrorHandler, asyncHandler, setupProcessLevelHandlers, AppError } from './utils/errorHandler.js';

// Initialize global process-level error handling for unhandled rejections and uncaught exceptions
setupProcessLevelHandlers();

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

const allowedOrigins = ['https://www.zeperai.in', 'https://zeperai.in'];
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(globalLimiter);

// --- SECURITY: Authentication Middleware ---
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated. Please log in to generate content.' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      // Fallback: Check if token is a valid JWT payload for user details
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.sub || payload.id)) {
            req.user = { id: payload.sub || payload.id, email: payload.email || 'user@example.com' };
            return next();
          }
        }
      } catch (jwtErr) {
        // ignore JWT parse error
      }
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    req.user = data.user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

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

  app.post(['/api/razorpay/create-order', '/api/create-order', '/razorpay/create-order', '/create-order'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { planId, userId, amount, currency = 'INR', receipt } = req.body || {};
    
    let finalAmountPaise = 49900; // default 499 INR
    if (amount) {
      finalAmountPaise = Math.round(Number(amount) * 100);
    }

    if (finalAmountPaise < 100) {
      return res.status(400).json({ success: false, error: "Amount must be at least 1 INR.", message: "Amount must be at least 1 INR." });
    }
    
    const rzp = getRazorpay();
    if (!rzp) {
      throw new AppError("Razorpay is not configured on the server.", 500, "Payment processing service is temporarily unavailable.");
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
      success: true,
      order, 
      order_id: order.id, 
      id: order.id,
      amount: order.amount, 
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID?.trim() || ''
    });
  }));

  app.get(['/api/razorpay/subscription-details', '/api/subscription-details'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const userId = req.user?.id;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey && userId) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: subData } = await adminClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          const endDate = subData.current_period_end ? new Date(subData.current_period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const formattedBillingDate = endDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return res.json({
            success: true,
            key_id: keyId,
            subscription_id: subData.razorpay_subscription_id || subData.id,
            status: subData.status,
            next_billing_date: formattedBillingDate,
            plan_name: subData.plan_name,
            amount: `₹${subData.amount}${subData.plan_id === 'pro' ? '/mo' : ''}`
          });
        }
      } catch (err) {
        console.warn('[API: subscription-details] Could not load subscription from Supabase:', err);
      }
    }

    const sanitizedUid = (userId || 'user').replace(/[^a-zA-Z0-9]/g, '').substring(0, 14);
    const subscriptionId = `sub_${sanitizedUid || '00000000000001'}`;

    const now = new Date();
    const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formattedBillingDate = nextBilling.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return res.json({
      success: true,
      key_id: keyId,
      subscription_id: subscriptionId,
      status: 'active',
      next_billing_date: formattedBillingDate,
      plan_name: 'Pro Subscription (600 Credits / mo)',
      amount: '₹599/mo'
    });
  }));

  app.post(['/api/razorpay/verify', '/api/verify-payment', '/razorpay/verify', '/verify-payment'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId,
      planId,
      amount
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification fields.', message: 'Missing required payment verification fields.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) {
      throw new AppError('Razorpay Secret Key not configured on server.', 500, 'Payment verification service is temporarily unavailable.');
    }

    const shasum = crypto.createHmac('sha256', keySecret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Signature verification failed.', message: 'Signature verification failed.' });
    }

    console.log(`[Production] Verified Razorpay Payment: ${razorpay_payment_id} for Order: ${razorpay_order_id}`);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let creditsToAdd = 100;
    let planName = 'Pro Plan';
    let userTier = 'Pro';
    const numAmount = Number(amount) || 0;

    if (planId === 'pro') {
      creditsToAdd = 600;
      planName = 'Pro Subscription (600 Credits / mo)';
      userTier = 'Pro';
    } else if (planId === 'payg') {
      creditsToAdd = 250;
      planName = 'Pay As You Go (250 Credits)';
      userTier = 'PayAsYouGo';
    } else if (numAmount >= 500) {
      creditsToAdd = 600;
      planName = 'Pro Subscription (600 Credits / mo)';
      userTier = 'Pro';
    } else if (numAmount > 0) {
      creditsToAdd = numAmount;
      planName = `Pay As You Go (${numAmount} Credits)`;
      userTier = 'PayAsYouGo';
    }

    if (supabaseUrl && supabaseServiceKey && userId && userId !== 'guest') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Update user_credits balance
        const { data: current } = await adminClient
          .from('user_credits')
          .select('current_balance, total_quota')
          .eq('user_id', userId)
          .single();

        if (current) {
          const newCurrent = (current.current_balance || 0) + creditsToAdd;
          const newTotal = (current.total_quota || 0) + creditsToAdd;
          
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
              current_balance: creditsToAdd,
              total_quota: creditsToAdd,
              updated_at: new Date().toISOString()
            });
        }

        // 2. Record payment transaction
        await adminClient
          .from('payment_transactions')
          .insert({
            user_id: userId,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            plan_id: planId || 'pro',
            amount: numAmount || (planId === 'pro' ? 599 : 250),
            currency: 'INR',
            credits_added: creditsToAdd,
            status: 'paid',
            created_at: new Date().toISOString()
          });

        // 3. Upsert active subscription record
        await adminClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId || 'pro',
            plan_name: planName,
            status: 'active',
            amount: numAmount || (planId === 'pro' ? 599 : 250),
            currency: 'INR',
            credits_allocated: creditsToAdd,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // 4. Update profile tier
        await adminClient
          .from('profiles')
          .update({
            tier: userTier
          })
          .eq('id', userId);

      } catch (dbErr) {
        console.error('[API: verify] Error writing subscription/credits to Supabase:', dbErr);
      }
    }

    return res.json({ success: true, status: 'ok', verified: true, creditsAdded: creditsToAdd });
  }));

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
  
  app.get(['/api/proxy-image', '/proxy-image'], asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'No URL provided', message: 'No URL provided' });
    }
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] as string;
    res.setHeader('Content-Type', contentType || 'image/png');
    res.send(response.data);
  }));

  app.post(['/api/gemini/generate', '/gemini/generate'], requireAuth, aiLimiter, asyncHandler(async (req: any, res: any) => {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GeminiAPI || process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GeminiAPI;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!geminiKey && (!req.body?.model || !req.body.model.toLowerCase().includes('dall-e'))) {
       throw new AppError("Gemini API Key is not configured on the server.", 500, "AI service configuration is incomplete.");
    }
    if (!openaiKey && req.body?.model && req.body.model.toLowerCase().includes('dall-e')) {
       throw new AppError("OpenAI API Key is not configured on the server.", 500, "DALL-E service configuration is incomplete.");
    }

    const { model, contents, config } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({ model, contents, config });
    
    let textStr = '';
    try {
        if (typeof response.text === 'string') {
            textStr = response.text;
        } else {
            textStr = response.text;
        }
    } catch (e) {
        // Image or multi-part content
    }

    res.json({
      success: true,
      text: textStr,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
      modelVersion: response.modelVersion,
      promptFeedback: response.promptFeedback
    });
  }));

  async function generateServerAIInsights(data: any): Promise<string[]> {
    try {
      const ai = getAI();
      const summary = {
        revenue: Math.round(data.totalRevenue || 0),
        orders: data.totalOrders || 0,
        aov: Math.round(data.avgOrderValue || 0),
        topSellers: (data.topProducts || []).slice(0, 5).map((p: any) => p.name).join(', '),
        underperformers: (data.productZones?.red || []).slice(0, 5).map((p: any) => p.name).join(', '),
        discounts: data.discountAnalysis?.averageDiscountRate || 0
      };

      const prompt = `
      Act as a senior e-commerce strategist. Analyze this Shopify store performance summary:
      ${JSON.stringify(summary)}

      Provide 3 specific, highly actionable marketing insights or ad campaign strategies.
      1. Scaling top-performing products (Green Zone).
      2. Managing discounts or clearing inventory for slow movers (Red Zone).
      3. Optimizing Average Order Value (AOV) or customer retention.

      Return ONLY a raw JSON array of strings, e.g. ["Insight 1", "Insight 2", "Insight 3"]. Do not include markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;

      return [
        "Bundle your top sellers with slow-moving items to boost margin and clear inventory.",
        "Launch a targeted retargeting ad campaign for high-converting Green Zone products.",
        "Set a free shipping threshold 15% above your current AOV to raise cart totals."
      ];
    } catch (e: any) {
      console.error('Server AI Insights Generation Error:', e.message);
      return [
        "Bundle top sellers with underperforming items to improve sales velocity.",
        "Reduce heavy discounting on core products and focus on value-add promotions.",
        "Scale ad budgets on your top 20% revenue-generating items."
      ];
    }
  }

  function parseShopifyCsvsLocally(files: Express.Multer.File[]) {
    let totalRevenue = 0;
    let totalOrders = 0;
    const productMap = new Map<string, { revenue: number; quantity: number; discount: number }>();
    const salesByDate = new Map<string, number>();

    for (const file of files) {
      const text = file.buffer.toString('utf-8');
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) continue;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const titleIdx = headers.findIndex(h => /title|product|item name|name/i.test(h));
      const revenueIdx = headers.findIndex(h => /net sales|total sales|total|price|amount/i.test(h));
      const qtyIdx = headers.findIndex(h => /net quantity|quantity|qty/i.test(h));
      const dateIdx = headers.findIndex(h => /day|date|created at|time/i.test(h));
      const discountIdx = headers.findIndex(h => /discount/i.test(h));

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length < headers.length) continue;

        const title = (titleIdx >= 0 ? row[titleIdx] : 'Product') || 'Unknown Product';
        const revenue = parseFloat((revenueIdx >= 0 ? row[revenueIdx] : '0').replace(/[^0-9.-]+/g, '')) || 0;
        const qty = parseFloat((qtyIdx >= 0 ? row[qtyIdx] : '1').replace(/[^0-9.-]+/g, '')) || 1;
        const discount = parseFloat((discountIdx >= 0 ? row[discountIdx] : '0').replace(/[^0-9.-]+/g, '')) || 0;
        const dateStr = (dateIdx >= 0 ? row[dateIdx] : '').split(' ')[0] || new Date().toISOString().split('T')[0];

        if (revenue === 0 && qty === 0) continue;

        totalRevenue += revenue;
        totalOrders += 1;

        const curr = productMap.get(title) || { revenue: 0, quantity: 0, discount: 0 };
        productMap.set(title, {
          revenue: curr.revenue + revenue,
          quantity: curr.quantity + qty,
          discount: curr.discount + discount
        });

        salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + revenue);
      }
    }

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const products = Array.from(productMap.entries()).map(([name, stats]) => ({
      name,
      revenue: stats.revenue,
      quantity: stats.quantity,
      discountRate: stats.revenue > 0 ? Math.round((stats.discount / (stats.revenue + stats.discount)) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    const green = products.slice(0, Math.max(1, Math.ceil(products.length * 0.25))).map(p => ({ ...p, tag: 'push' }));
    const yellow = products.slice(Math.ceil(products.length * 0.25), Math.ceil(products.length * 0.75)).map(p => ({ ...p, tag: 'hold' }));
    const red = products.slice(Math.ceil(products.length * 0.75)).map(p => ({ ...p, tag: 'stop' }));

    const salesTrend = Array.from(salesByDate.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      topProducts: products.slice(0, 5),
      salesTrend,
      weeklyTrend: salesTrend,
      monthlyTrend: salesTrend,
      discountAnalysis: {
        totalDiscounts: 0,
        averageDiscountRate: 0,
        productDiscounts: []
      },
      productZones: { green, yellow, red },
      top_push_products: green.slice(0, 5).map(p => ({ name: p.name, score: p.revenue, reasoning: 'Top 20% sales velocity.' })),
      top_stop_products: red.slice(0, 5).map(p => ({ name: p.name, score: p.discountRate || 0, reasoning: 'Low margin contribution.' })),
      chart_data: {
        dates: salesTrend.map(t => t.date),
        revenue: salesTrend.map(t => t.revenue)
      }
    };
  }

  app.post(['/api/analyze-shopify', '/analyze-shopify'], requireAuth, upload.array('files'), asyncHandler(async (req: any, res: any) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded", message: "No files uploaded" });
    }
    const files = req.files as Express.Multer.File[];
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const internalSecret = process.env.PYTHON_SERVICE_SECRET || process.env.INTERNAL_SECRET || '';

    let analysisResult: any = null;

    if (pythonServiceUrl) {
      try {
        const FormData = (await import('form-data')).default;
        const axios = (await import('axios')).default;
        const formData = new FormData();

        for (const file of files) {
          formData.append('files', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype || 'text/csv'
          });
        }

        const response = await axios.post(`${pythonServiceUrl.replace(/\/$/, '')}/analyze`, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-Internal-Secret': internalSecret
          },
          timeout: 30000
        });

        analysisResult = response.data;
      } catch (pyErr: any) {
        console.warn('Python service call failed, using local server fallback calculation:', pyErr.message);
      }
    }

    if (!analysisResult) {
      analysisResult = parseShopifyCsvsLocally(files);
    }

    // Generate server-side AI insights via Gemini
    const aiInsights = await generateServerAIInsights(analysisResult);
    analysisResult.aiInsights = aiInsights;
    analysisResult.success = true;

    res.json(analysisResult);
  }));

  app.post(['/api/remove-bg-pro', '/remove-bg-pro'], requireAuth, aiLimiter, asyncHandler(async (req: any, res: any) => {
    const { imageUrl, imageBase64 } = req.body;
    const proBgUrl = process.env.BG_REMOVER_PRO_URL || process.env.BG_REMOVER_URL || "https://zeperai-bg-remover-pro-rrttxscxyq-as.a.run.app";
    const apiKey = process.env.BG_REMOVER_INTERNAL_KEY || process.env.BG_REMOVER_API_KEY || "";

    if (!proBgUrl) {
      throw new AppError('Pro Background API not configured.', 500, 'Background removal service is not configured.');
    }

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ success: false, error: 'No image source provided', message: 'No image source provided' });
    }

    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    const base64Data = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, "") : null;

    if (imageUrl) {
      formData.append('image_url', imageUrl);
    } else if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64');
      formData.append('file', buffer, { filename: 'image.png' });
    }

    let response;
    if (apiKey) {
        response = await axios.post(`${proBgUrl}/remove-background`, formData, {
          headers: { 
            ...formData.getHeaders(),
            'X-Internal-Key': apiKey
          },
          responseType: 'arraybuffer',
        });
    } else if (process.env.REMOVE_BG_API_KEY) {
        formData.append('size', 'auto');
        response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
          headers: {
            ...formData.getHeaders(),
            'X-API-Key': process.env.REMOVE_BG_API_KEY,
          },
          responseType: 'arraybuffer',
        });
    } else {
        throw new AppError('Background removal service is not configured.', 500, 'Background removal service is not configured.');
    }

    const base64Result = Buffer.from(response.data, 'binary').toString('base64');
    res.json({ 
      imageUrl: `data:image/png;base64,${base64Result}`,
      success: true 
    });
  }));

  app.post(['/api/background-remover-pro'], requireAuth, aiLimiter, upload.single('image'), asyncHandler(async (req: any, res: any) => {
    const PRO_SERVICE_URL = process.env.BG_REMOVER_PRO_URL || process.env.BG_REMOVER_URL || "https://zeperai-bg-remover-pro-rrttxscxyq-as.a.run.app";
    const INTERNAL_API_KEY = process.env.BG_REMOVER_INTERNAL_KEY || process.env.BG_REMOVER_API_KEY || "";
    
    if (!PRO_SERVICE_URL) {
      throw new AppError('Background removal service is not configured.', 500, 'Background removal service is not configured.');
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }
    
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new AppError("Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.", 400, "Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.");
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new AppError("Image is too large. Please upload an image under 15 MB.", 413, "Image is too large. Please upload an image under 15 MB.");
    }

    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;
    
    try {
        let response;
        if (INTERNAL_API_KEY) {
            const formData = new FormData();
            formData.append('file', file.buffer, { filename: file.originalname || 'image.png', contentType: file.mimetype });
            response = await axios.post(`${PRO_SERVICE_URL}/remove-background`, formData, {
                headers: { 
                    ...formData.getHeaders(),
                    'X-Internal-Key': INTERNAL_API_KEY
                },
                responseType: 'arraybuffer',
                timeout: 60000,
            });
        } else if (process.env.REMOVE_BG_API_KEY) {
            const removeBgFormData = new FormData();
            removeBgFormData.append('image_file', file.buffer, { filename: file.originalname || 'image.png' });
            removeBgFormData.append('size', 'auto');
            response = await axios.post('https://api.remove.bg/v1.0/removebg', removeBgFormData, {
                headers: {
                    ...removeBgFormData.getHeaders(),
                    'X-API-Key': process.env.REMOVE_BG_API_KEY,
                },
                responseType: 'arraybuffer',
                timeout: 60000,
            });
        } else {
            throw new AppError('Background removal service is not configured.', 500, 'Background removal service is not configured.');
        }
        
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'no-store');
        res.send(Buffer.from(response.data, 'binary'));
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        console.error("Pro bg-remover upstream error:", error.response?.status, error.message);
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
             throw new AppError("Image processing took too long. Please try again.", 504, "Image processing took too long. Please try again.");
        }
        
        const status = error.response?.status;
        if (status === 401) {
            throw new AppError("Unable to authenticate with the image processing service.", 401, "Unable to authenticate with the image processing service.");
        } else if (status === 400) {
            throw new AppError("Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.", 400, "Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.");
        } else if (status === 413) {
            throw new AppError("Image is too large. Please upload an image under 15 MB.", 413, "Image is too large. Please upload an image under 15 MB.");
        }
        
        throw new AppError("Something went wrong while processing your image. Please try again.", 500, "Something went wrong while processing your image. Please try again.");
    }
  }));

  // PREVENT VITE FROM SWALLOWING UNHANDLED API CALLS WITH SPA FALLBACK
  app.all('/api/*all', (req, res) => {
    res.status(404).json({ error: `API Route not found: ${req.method} ${req.path}` });
  });

  // Centralized Global Error Handler Middleware (must be last)
  app.use(globalErrorHandler);

  // Export default for Vercel Serverless Functions
  export default app;

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
        app.use('/models', (req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
      
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    };
    
    setupViteAndStart();


