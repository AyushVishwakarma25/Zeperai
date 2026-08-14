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
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://*.razorpay.com",
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://checkout.razorpay.com",
        "https://*.rzp.io",
        "https://rzp.io",
        "wss://*.razorpay.com",
        "wss://*.rzp.io",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://generativelanguage.googleapis.com",
        "https://*.run.app"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://*.razorpay.com",
        "https://checkout.razorpay.com",
        "https://api.razorpay.com",
        "https://*.rzp.io",
        "https://rzp.io",
        "https://cdn.tailwindcss.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.tailwindcss.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      frameSrc: [
        "'self'",
        "https://*.razorpay.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://*.rzp.io",
        "https://rzp.io"
      ],
      frameAncestors: ["'self'", "*"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://*.razorpay.com", "https://*.rzp.io"]
    }
  }
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

// --- SECURITY: Authentication & Database Helpers ---
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'zeperai-admin-secret-key-karma-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'karma';

export const generateAdminToken = (username: string) => {
  const payload = {
    username,
    role: 'admin',
    is_admin: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadB64).digest('hex');
  return `zeperai_adm_${payloadB64}.${signature}`;
};

export const verifyAdminToken = (token: string) => {
  if (!token || !token.startsWith('zeperai_adm_')) return null;
  try {
    const raw = token.replace('zeperai_adm_', '');
    const [payloadB64, signature] = raw.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadB64).digest('hex');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
};

export const getAdminSupabaseClient = async (authHeader?: string) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const { createClient } = await import('@supabase/supabase-js');
  
  const options: any = {
    auth: { persistSession: false, autoRefreshToken: false }
  };
  
  // Forward authorization header only if it is a valid Supabase JWT (starts with Bearer eyJ) and service role key is not configured
  if (authHeader && !process.env.SUPABASE_SERVICE_ROLE_KEY && authHeader.startsWith('Bearer eyJ')) {
    options.global = {
      headers: { Authorization: authHeader }
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
};

const isUuid = (str?: string) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const requireAuth = async (req: any, res: any, next: any) => {
  const rawToken = req.headers.authorization || (req.query?.token as string) || '';
  const token = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated. Please log in to continue.' });

  // 1. Check for dedicated decoupled admin token
  const adminPayload = verifyAdminToken(token);
  if (adminPayload) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: `${adminPayload.username}@zeperai.com`,
      name: 'System Admin',
      is_admin: true,
      role: 'admin'
    };
    req.isAdminMaster = true;
    return next();
  }

  // 2. Supabase JWT auth fallback
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    req.user = data.user;
    
    // Background update of last_active_at to track user session activity
    if (data.user?.id) {
      (async () => {
        try {
          const adminClient = await getAdminSupabaseClient();
          await adminClient.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', data.user.id);
        } catch (e) {}
      })();
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

// Increase payload limit to handle large base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Not authenticated.' });

  if (req.isAdminMaster || req.user.is_admin === true) {
    return next();
  }

  try {
    const adminClient = await getAdminSupabaseClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();
    if (error || !data?.is_admin) return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to verify admin status.' });
  }
};

// --- API ROUTES ---

  // --- DEDICATED ADMIN LOGIN ROUTE ---
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const isValidUser = (username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase());
    const isValidPass = (password === ADMIN_PASSWORD);

    if (!isValidUser || !isValidPass) {
      return res.status(401).json({ error: 'Invalid admin username or password.' });
    }

    const token = generateAdminToken(username.trim());
    return res.json({
      success: true,
      token,
      user: {
        username: username.trim(),
        name: 'System Admin',
        role: 'admin',
        is_admin: true
      }
    });
  });

  // --- USER PROFILE ROUTES (Service Role Protected) ---
  app.get('/api/user/profile', requireAuth, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const userId = req.user.id;
    const userEmail = req.user.email || '';

    // 1. Fetch profile from DB using service client (bypasses RLS recursion)
    let { data: profile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. If profile doesn't exist yet, automatically create it
    if (!profile) {
      const isProAdmin = userEmail === 'reachtoayush25@gmail.com' || userEmail === 'sharma25ayush@gmail.com' || userId === 'f58676e8-e373-4c97-803b-57451272154c';
      const initialProfile = {
        id: userId,
        email: userEmail,
        name: req.user.user_metadata?.full_name || req.user.name || userEmail.split('@')[0] || 'Creator',
        role: 'Creator',
        bio: '',
        location: '',
        avatar_url: req.user.user_metadata?.avatar_url || '',
        tier: isProAdmin ? 'Pro' : 'Free',
        is_admin: isProAdmin
      };

      const { data: newProfile, error: insertErr } = await adminClient
        .from('profiles')
        .upsert(initialProfile, { onConflict: 'id' })
        .select()
        .single();

      if (!insertErr && newProfile) {
        profile = newProfile;
      } else {
        profile = initialProfile;
      }
    }

    const isProAdmin = profile.email === 'reachtoayush25@gmail.com' || profile.email === 'sharma25ayush@gmail.com' || profile.id === 'f58676e8-e373-4c97-803b-57451272154c' || !!profile.is_admin;

    return res.json({
      id: profile.id,
      name: profile.name || userEmail.split('@')[0] || 'User',
      email: profile.email || userEmail,
      role: profile.role || 'Creator',
      bio: profile.bio || '',
      location: profile.location || '',
      avatarUrl: profile.avatar_url || '',
      tier: isProAdmin ? 'Pro' : (profile.tier || 'Free'),
      isAdmin: isProAdmin
    });
  }));

  app.put('/api/user/profile', requireAuth, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const userId = req.user.id;
    const updates = req.body || {};

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    const { data, error } = await adminClient
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to update profile' });
    }

    const isProAdmin = data.email === 'reachtoayush25@gmail.com' || data.email === 'sharma25ayush@gmail.com' || data.id === 'f58676e8-e373-4c97-803b-57451272154c' || !!data.is_admin;

    return res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role || 'Creator',
      bio: data.bio || '',
      location: data.location || '',
      avatarUrl: data.avatar_url || '',
      tier: isProAdmin ? 'Pro' : (data.tier || 'Free'),
      isAdmin: isProAdmin
    });
  }));

  // --- ADMIN ROUTES ---
  
  // --- ADMIN SUBSCRIPTIONS ROUTES ---
  app.get('/api/admin/subscriptions', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    
    const limit = parseInt(req.query.limit || '20');
    const offset = parseInt(req.query.offset || '0');
    const search = (req.query.search || '').trim();
    const statusFilter = req.query.status || ''; // active, cancelled, expired, past_due
    const planFilter = req.query.plan || ''; // pro, payg, agency, etc.
    const paymentStatusFilter = req.query.paymentStatus || ''; // paid, success, failed, refunded
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc';

    let query = adminClient.from('subscriptions').select('*, profiles(id, email, name, avatar_url, tier)', { count: 'exact' });
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (planFilter) {
      query = query.ilike('plan_name', `%${planFilter}%`);
    }

    if (search) {
      // Search by subscription id, razorpay id, or plan name
      query = query.or(`razorpay_subscription_id.ilike.%${search}%,razorpay_order_id.ilike.%${search}%,razorpay_payment_id.ilike.%${search}%,plan_name.ilike.%${search}%,id.eq.${search.length === 36 ? search : '00000000-0000-0000-0000-000000000000'}`);
    }

    // Determine sort column
    const validSortCols = ['created_at', 'current_period_end', 'current_period_start', 'amount', 'status'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';
    
    const hasPostFilter = !!paymentStatusFilter;
    let data: any[] = [];
    let dbCount = 0;

    if (hasPostFilter) {
      const { data: allSubs, error } = await query
        .order(orderCol, { ascending: sortOrder })
        .limit(2000);
      if (error) {
        console.warn('Error querying subscriptions:', error.message);
        return res.json({ success: true, subscriptions: [], total: 0 });
      }
      data = allSubs || [];
    } else {
      const { data: pageSubs, count, error } = await query
        .order(orderCol, { ascending: sortOrder })
        .range(offset, offset + limit - 1);
      if (error) {
        console.warn('Error querying subscriptions:', error.message);
        return res.json({ success: true, subscriptions: [], total: 0 });
      }
      data = pageSubs || [];
      dbCount = count || data.length;
    }

    // Fetch related payment transactions for payment status correlation
    const userIds = Array.from(new Set((data || []).map((s: any) => s.user_id).filter(Boolean)));
    const paymentsMap: Record<string, any[]> = {};
    if (userIds.length > 0) {
      try {
        const { data: payData } = await adminClient
          .from('payment_transactions')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });
        if (payData) {
          payData.forEach((p: any) => {
            if (!paymentsMap[p.user_id]) paymentsMap[p.user_id] = [];
            paymentsMap[p.user_id].push(p);
          });
        }
      } catch (pErr) {
        console.warn('Could not enrich payment info for subscriptions:', pErr);
      }
    }
    
    let subscriptions = (data || []).map((s: any) => {
      const userPayments = paymentsMap[s.user_id] || [];
      // Match transaction by razorpay payment ID or latest payment
      const matchedPayment = s.razorpay_payment_id 
        ? userPayments.find(p => p.razorpay_payment_id === s.razorpay_payment_id)
        : (s.razorpay_order_id ? userPayments.find(p => p.razorpay_order_id === s.razorpay_order_id) : userPayments[0]);

      const paymentStatus = matchedPayment?.status || (s.status === 'active' ? 'paid' : (s.status === 'past_due' ? 'failed' : 'paid'));

      return {
        ...s,
        email: s.profiles?.email || 'Unknown User',
        name: s.profiles?.name || s.profiles?.email?.split('@')[0] || 'User',
        avatar_url: s.profiles?.avatar_url,
        user_tier: s.profiles?.tier || 'Free',
        payment_status: paymentStatus,
        payment_method: matchedPayment?.payment_method || 'Razorpay Online',
        payment_id: matchedPayment?.razorpay_payment_id || s.razorpay_payment_id,
        order_id: matchedPayment?.razorpay_order_id || s.razorpay_order_id,
        latest_transaction_at: matchedPayment?.created_at || s.created_at,
        start_date: s.current_period_start || s.created_at,
        renewal_date: s.current_period_end || s.updated_at
      };
    });

    // If payment status filter is specified in memory (since payment_status is derived from transactions)
    if (paymentStatusFilter) {
      subscriptions = subscriptions.filter((s: any) => s.payment_status?.toLowerCase() === paymentStatusFilter.toLowerCase());
    }
    
    const totalCount = hasPostFilter ? subscriptions.length : dbCount;
    const paginatedSubscriptions = hasPostFilter ? subscriptions.slice(offset, offset + limit) : subscriptions;

    res.json({ success: true, subscriptions: paginatedSubscriptions, total: totalCount });
  }));

  // --- ADMIN PAYMENTS & REVENUE ROUTES ---
  app.get('/api/admin/payments', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    
    const limit = Math.min(parseInt(req.query.limit || '20'), 100);
    const offset = parseInt(req.query.offset || '0');
    const search = (req.query.search || '').trim();
    const statusFilter = (req.query.status || '').trim(); // paid, success, failed, refunded
    const planFilter = (req.query.plan || '').trim(); // pro, payg, etc.
    const userIdFilter = (req.query.userId || '').trim();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc';

    let query = adminClient
      .from('payment_transactions')
      .select('*, profiles(id, email, name, avatar_url, tier)', { count: 'exact' });

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    if (statusFilter) {
      if (statusFilter === 'paid') {
        query = query.in('status', ['paid', 'success']);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    if (planFilter) {
      query = query.ilike('plan_id', `%${planFilter}%`);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    if (search) {
      query = query.or(`razorpay_payment_id.ilike.%${search}%,razorpay_order_id.ilike.%${search}%,plan_id.ilike.%${search}%,id.eq.${search.length === 36 ? search : '00000000-0000-0000-0000-000000000000'}`);
    }

    const validSortCols = ['created_at', 'amount', 'status', 'plan_id'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order(orderCol, { ascending: sortOrder });

    if (error) {
      console.warn('Error querying payment transactions:', error.message);
    }

    // Format transaction items
    const transactions = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      user_name: t.profiles?.name || t.profiles?.email?.split('@')[0] || 'User',
      user_email: t.profiles?.email || 'Unknown',
      user_avatar: t.profiles?.avatar_url,
      user_tier: t.profiles?.tier || 'Free',
      amount: t.amount,
      currency: t.currency || 'INR',
      plan_id: t.plan_id || 'payg',
      credits_added: t.credits_added || 0,
      payment_method: t.payment_method || 'Razorpay Gateway',
      payment_status: t.status,
      razorpay_order_id: t.razorpay_order_id,
      razorpay_payment_id: t.razorpay_payment_id,
      refund_status: t.status === 'refunded' ? 'refunded' : (t.refund_id ? 'processed' : 'none'),
      refund_id: t.refund_id || null,
      refunded_at: t.refunded_at || null,
      refund_reason: t.refund_reason || null,
      refund_amount: t.refund_amount || (t.status === 'refunded' ? t.amount : 0),
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    res.json({
      success: true,
      transactions,
      total: count || transactions.length
    });
  }));

  // Revenue analytics & KPI summary
  app.get('/api/admin/payments/summary', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalRevenue = 0;
    let revenueThisMonth = 0;
    let revenueThisWeek = 0;
    let totalTransactions = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let refundedTransactions = 0;
    let totalRefundedAmount = 0;
    const planBreakdown: Record<string, { count: number; revenue: number }> = {};
    const dailyTrendMap: Record<string, { date: string; revenue: number; transactions: number }> = {};

    // 14 days trend
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyTrendMap[key] = { date: key.slice(5), revenue: 0, transactions: 0 };
    }

    try {
      const { data: allTx } = await adminClient
        .from('payment_transactions')
        .select('amount, status, created_at, plan_id, refund_amount');

      (allTx || []).forEach((tx: any) => {
        totalTransactions++;
        const amt = Number(tx.amount) || 0;
        const txDate = new Date(tx.created_at);
        const dayKey = txDate.toISOString().split('T')[0];
        const plan = tx.plan_id || 'other';

        if (!planBreakdown[plan]) {
          planBreakdown[plan] = { count: 0, revenue: 0 };
        }

        if (tx.status === 'paid' || tx.status === 'success') {
          totalRevenue += amt;
          successfulTransactions++;
          planBreakdown[plan].count++;
          planBreakdown[plan].revenue += amt;

          if (txDate >= thirtyDaysAgo) revenueThisMonth += amt;
          if (txDate >= sevenDaysAgo) revenueThisWeek += amt;

          if (dailyTrendMap[dayKey]) {
            dailyTrendMap[dayKey].revenue += amt;
            dailyTrendMap[dayKey].transactions += 1;
          }
        } else if (tx.status === 'refunded') {
          refundedTransactions++;
          totalRefundedAmount += (Number(tx.refund_amount) || amt);
        } else if (tx.status === 'failed') {
          failedTransactions++;
        }
      });
    } catch (err) {
      console.warn('Error computing payments summary:', err);
    }

    const netRevenue = Math.max(0, totalRevenue - totalRefundedAmount);
    const avgOrderValue = successfulTransactions > 0 ? Math.round(totalRevenue / successfulTransactions) : 0;
    const successRate = totalTransactions > 0 ? Math.round((successfulTransactions / totalTransactions) * 100) : 100;

    res.json({
      success: true,
      summary: {
        totalRevenue,
        netRevenue,
        revenueThisMonth,
        revenueThisWeek,
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        refundedTransactions,
        totalRefundedAmount,
        avgOrderValue,
        successRate,
        planBreakdown,
        revenueTrend: Object.values(dailyTrendMap)
      }
    });
  }));

  // Process a secure backend refund via Razorpay API and sync DB
  app.post('/api/admin/payments/:id/refund', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const transactionId = req.params.id;
    const { amount, reason, reverseCredits = true } = req.body || {};

    if (!reason || !reason.trim()) {
      throw new AppError('A valid reason is required for processing a refund.', 400);
    }

    const adminClient = await getAdminSupabaseClient();

    // 1. Fetch transaction record
    const { data: tx, error: txErr } = await adminClient
      .from('payment_transactions')
      .select('*, profiles(email, name, tier)')
      .eq('id', transactionId)
      .single();

    if (txErr || !tx) {
      throw new AppError('Payment transaction record not found.', 404);
    }

    if (tx.status === 'refunded') {
      throw new AppError('This transaction has already been refunded.', 400);
    }

    if (!tx.razorpay_payment_id) {
      throw new AppError('No Razorpay Payment ID found for this transaction to process a gateway refund.', 400);
    }

    const originalAmount = Number(tx.amount) || 0;
    const refundAmount = amount ? Number(amount) : originalAmount;

    if (refundAmount <= 0 || refundAmount > originalAmount) {
      throw new AppError(`Refund amount must be between 1 and ₹${originalAmount}.`, 400);
    }

    // 2. Execute refund via Razorpay SDK
    const rzp = getRazorpay();
    if (!rzp) {
      throw new AppError('Razorpay gateway service is not configured on the server.', 500);
    }

    let rzpRefundResponse: any = null;
    try {
      const refundPaise = Math.round(refundAmount * 100);
      rzpRefundResponse = await rzp.payments.refund(tx.razorpay_payment_id, {
        amount: refundPaise,
        notes: {
          reason: reason.trim().substring(0, 250),
          admin_id: req.user?.id || 'admin',
          admin_email: req.user?.email || 'admin@zeperai.com',
          transaction_id: tx.id
        }
      });
      console.log(`[Razorpay Refund] Processed refund ${rzpRefundResponse.id} for payment ${tx.razorpay_payment_id}`);
    } catch (rzpErr: any) {
      console.error('Razorpay Refund API error:', JSON.stringify(rzpErr));
      const errMsg = rzpErr.error?.description || rzpErr.message || 'Failed to process refund via Razorpay API.';
      throw new AppError(errMsg, 500);
    }

    // 3. Update database transaction status
    const refundId = rzpRefundResponse?.id || `rfnd_${Date.now()}`;
    const { error: updateErr } = await adminClient
      .from('payment_transactions')
      .update({
        status: 'refunded',
        refund_id: refundId,
        refund_amount: refundAmount,
        refund_reason: reason.trim(),
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateErr) {
      console.warn('Failed to update payment_transactions refund status:', updateErr.message);
    }

    // 4. Optionally reverse credits allocated
    let creditsDeducted = 0;
    if (reverseCredits && tx.user_id && tx.credits_added > 0) {
      try {
        const { data: userCredits } = await adminClient
          .from('user_credits')
          .select('current_balance')
          .eq('user_id', tx.user_id)
          .single();

        if (userCredits) {
          const currentBal = userCredits.current_balance || 0;
          const toDeduct = Math.min(currentBal, tx.credits_added);
          creditsDeducted = toDeduct;
          await adminClient
            .from('user_credits')
            .update({
              current_balance: Math.max(0, currentBal - toDeduct),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', tx.user_id);
        }
      } catch (credErr) {
        console.warn('Could not reverse user credits:', credErr);
      }
    }

    // 5. If it was a subscription payment, update subscription state
    if (tx.user_id) {
      try {
        await adminClient
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', tx.user_id)
          .eq('razorpay_payment_id', tx.razorpay_payment_id);
      } catch (subErr) {
        console.warn('Could not update subscription on refund:', subErr);
      }
    }

    // 6. Log admin audit action
    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'refund_payment',
        target_user_id: isUuid(tx.user_id) ? tx.user_id : null,
        details: {
          transaction_id: tx.id,
          razorpay_payment_id: tx.razorpay_payment_id,
          refund_id: refundId,
          refund_amount: refundAmount,
          reason: reason.trim(),
          credits_deducted: creditsDeducted,
          admin_email: req.user.email,
          gateway_response: rzpRefundResponse
        }
      });
    } catch (logErr) {
      console.warn('Failed to log admin refund action:', logErr);
    }

    res.json({
      success: true,
      message: `Successfully refunded ₹${refundAmount} through Razorpay.`,
      refund_id: refundId,
      refund_amount: refundAmount,
      credits_deducted: creditsDeducted
    });
  }));

  // --- ADMIN CREDITS / USAGE ROUTES ---
  app.get('/api/admin/credits/overview', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();

    const limit = Math.min(parseInt(req.query.limit || '20'), 100);
    const offset = parseInt(req.query.offset || '0');
    const search = (req.query.search || '').trim();
    const tierFilter = (req.query.tier || '').trim();
    const sortBy = req.query.sortBy || 'current_balance';
    const sortOrder = req.query.sortOrder === 'asc';

    // 1. Fetch profiles matching search/tier
    let profilesQuery = adminClient.from('profiles').select('id, email, name, avatar_url, tier, created_at', { count: 'exact' });
    if (search) {
      profilesQuery = profilesQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%,id.eq.${search.length === 36 ? search : '00000000-0000-0000-0000-000000000000'}`);
    }
    if (tierFilter) {
      profilesQuery = profilesQuery.eq('tier', tierFilter);
    }

    const { data: profiles, count, error: profErr } = await profilesQuery.range(offset, offset + limit - 1);
    if (profErr) {
      console.warn('Error querying profiles for credits overview:', profErr.message);
    }

    const userIds = (profiles || []).map((p: any) => p.id).filter(Boolean);

    // 2. Fetch credits, payments (purchases), and design generation counts
    const creditsMap: Record<string, any> = {};
    const purchasesMap: Record<string, { totalPurchasedCredits: number; paymentsCount: number }> = {};
    const generationCountMap: Record<string, number> = {};

    if (userIds.length > 0) {
      try {
        const [creditsRes, paymentsRes, designsRes] = await Promise.all([
          adminClient.from('user_credits').select('*').in('user_id', userIds),
          adminClient.from('payment_transactions').select('user_id, credits_added, status').in('user_id', userIds).in('status', ['paid', 'success']),
          adminClient.from('designs').select('user_id').in('user_id', userIds)
        ]);

        (creditsRes.data || []).forEach((c: any) => {
          creditsMap[c.user_id] = c;
        });

        (paymentsRes.data || []).forEach((p: any) => {
          if (!purchasesMap[p.user_id]) {
            purchasesMap[p.user_id] = { totalPurchasedCredits: 0, paymentsCount: 0 };
          }
          purchasesMap[p.user_id].totalPurchasedCredits += (p.credits_added || 0);
          purchasesMap[p.user_id].paymentsCount += 1;
        });

        (designsRes.data || []).forEach((d: any) => {
          generationCountMap[d.user_id] = (generationCountMap[d.user_id] || 0) + 1;
        });
      } catch (err) {
        console.warn('Error fetching auxiliary credit data:', err);
      }
    }

    const userCreditsList = (profiles || []).map((p: any) => {
      const c = creditsMap[p.id];
      const pur = purchasesMap[p.id] || { totalPurchasedCredits: 0, paymentsCount: 0 };
      const currentBalance = c ? (c.current_balance || 0) : 0;
      const totalQuota = c ? (c.total_quota || 0) : 0;
      const genCount = generationCountMap[p.id] || 0;
      // Consumed calculation based on quota - balance or generation count
      const consumedCredits = Math.max(0, totalQuota - currentBalance);

      return {
        user_id: p.id,
        user_name: p.name || p.email?.split('@')[0] || 'User',
        user_email: p.email || 'Unknown',
        user_avatar: p.avatar_url,
        user_tier: p.tier || 'Free',
        current_balance: currentBalance,
        total_quota: totalQuota,
        credits_purchased: pur.totalPurchasedCredits,
        credits_consumed: consumedCredits,
        generation_count: genCount,
        last_updated: c?.updated_at || p.created_at
      };
    });

    // Sorting
    userCreditsList.sort((a, b) => {
      let valA = a[sortBy as keyof typeof a] ?? 0;
      let valB = b[sortBy as keyof typeof b] ?? 0;
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder ? -1 : 1;
      if (valA > valB) return sortOrder ? 1 : -1;
      return 0;
    });

    res.json({
      success: true,
      users: userCreditsList,
      total: count || userCreditsList.length
    });
  }));

  // Fetch detailed credit transaction history / admin adjustments for a user or platform
  app.get('/api/admin/credits/history', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const userId = req.query.userId || '';
    const limit = Math.min(parseInt(req.query.limit || '30'), 100);

    let query = adminClient
      .from('admin_actions')
      .select('*')
      .in('action', ['adjust_credits', 'refund_payment', 'grant_credits'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('target_user_id', userId);
    }

    const { data: actions, error } = await query;
    if (error) {
      console.warn('Error fetching credit history actions:', error.message);
    }

    // Fetch user profiles for actions
    const targetUserIds = Array.from(new Set((actions || []).map((a: any) => a.target_user_id).filter(Boolean)));
    const userMap: Record<string, any> = {};
    if (targetUserIds.length > 0) {
      const { data: profs } = await adminClient.from('profiles').select('id, email, name').in('id', targetUserIds);
      (profs || []).forEach((p: any) => {
        userMap[p.id] = p;
      });
    }

    const history = (actions || []).map((a: any) => {
      const targetUser = a.target_user_id ? userMap[a.target_user_id] : null;
      return {
        id: a.id,
        action: a.action,
        user_id: a.target_user_id,
        user_name: targetUser?.name || targetUser?.email?.split('@')[0] || 'User',
        user_email: targetUser?.email || 'N/A',
        admin_email: a.details?.admin_email || 'admin@zeperai.com',
        amount: a.details?.amount ?? (a.details?.refund_amount ? -a.details?.refund_amount : 0),
        reason: a.details?.reason || 'Administrative adjustment',
        old_balance: a.details?.old_balance,
        new_balance: a.details?.new_balance,
        created_at: a.created_at
      };
    });

    res.json({
      success: true,
      history
    });
  }));

  // Direct safe credit adjustment (Add / Deduct) with validation and audit logging
  app.post('/api/admin/credits/adjust', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const { userId, amount, reason } = req.body || {};

    if (!userId) throw new AppError('Target userId is required.', 400);
    if (typeof amount !== 'number' || amount === 0) throw new AppError('A non-zero numeric amount is required.', 400);
    if (!reason || !reason.trim()) throw new AppError('A valid operational reason is required.', 400);

    const adminClient = await getAdminSupabaseClient();

    // 1. Verify user profile exists
    const { data: profile, error: profErr } = await adminClient
      .from('profiles')
      .select('id, email, name, tier')
      .eq('id', userId)
      .single();

    if (profErr || !profile) {
      throw new AppError('Target user profile not found.', 404);
    }

    // 2. Fetch current balance
    const { data: creditRecord } = await adminClient
      .from('user_credits')
      .select('current_balance, total_quota')
      .eq('user_id', userId)
      .single();

    const oldBalance = creditRecord?.current_balance || 0;
    const oldQuota = creditRecord?.total_quota || 0;
    const newBalance = Math.max(0, oldBalance + amount);
    const newQuota = amount > 0 ? (oldQuota + amount) : oldQuota;

    // 3. Upsert new credit balance
    const { error: upsertErr } = await adminClient
      .from('user_credits')
      .upsert({
        user_id: userId,
        current_balance: newBalance,
        total_quota: newQuota,
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      throw new AppError(`Failed to update credit balance: ${upsertErr.message}`, 500);
    }

    // 4. Log admin audit action
    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'adjust_credits',
        target_user_id: isUuid(userId) ? userId : null,
        details: {
          amount,
          operation: amount > 0 ? 'add' : 'deduct',
          reason: reason.trim(),
          old_balance: oldBalance,
          new_balance: newBalance,
          admin_email: req.user.email,
          user_email: profile.email
        }
      });
    } catch (logErr) {
      console.warn('Failed to record credit adjustment admin action:', logErr);
    }

    res.json({
      success: true,
      message: `Successfully ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits for ${profile.email}.`,
      old_balance: oldBalance,
      new_balance: newBalance
    });
  }));

  // --- ADMIN AI USAGE & GENERATION ANALYTICS ---
  app.get('/api/admin/analytics/generations', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const now = new Date();

    // Query designs database (selective fields with reasonable upper limit)
    const { data: designs, error: dErr } = await adminClient
      .from('designs')
      .select('id, user_id, params, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (dErr) {
      console.warn('Error querying designs for analytics:', dErr.message);
    }

    const allDesigns = designs || [];
    const totalGenerations = allDesigns.length;

    let imageCount = 0;
    let videoCount = 0;
    let productStudioCount = 0;
    let fashionStudioCount = 0;
    let influencerStudioCount = 0;
    let cgiStudioCount = 0;
    let catalogBatchCount = 0;
    let festivalStudioCount = 0;
    let otherStudioCount = 0;

    const studioBreakdown: Record<string, { count: number; creditsConsumed: number }> = {
      'Product Studio': { count: 0, creditsConsumed: 0 },
      'Fashion Studio': { count: 0, creditsConsumed: 0 },
      'Influencer Studio': { count: 0, creditsConsumed: 0 },
      'CGI / 3D Render': { count: 0, creditsConsumed: 0 },
      'Catalog Mode': { count: 0, creditsConsumed: 0 },
      'Festival / Creative': { count: 0, creditsConsumed: 0 },
      'Other / General': { count: 0, creditsConsumed: 0 }
    };

    const presetCounts: Record<string, number> = {};
    const userGenCounts: Record<string, { count: number; lastGen: string }> = {};
    const dailyGenMap: Record<string, { date: string; images: number; videos: number; total: number }> = {};

    // 14 days timeline map
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyGenMap[key] = { date: key.slice(5), images: 0, videos: 0, total: 0 };
    }

    allDesigns.forEach((d: any) => {
      const params = d.params || {};
      const mode = (params.appMode || params.mode || params.app_mode || '').toLowerCase();
      const isVideo = params.isVideo === true || mode === 'video' || !!params.video_url;
      const isCatalog = params.catalogMode === true || (params.fashionPose && Array.isArray(params.fashionPose) && params.fashionPose.length > 1);

      if (isVideo) {
        videoCount++;
      } else {
        imageCount++;
      }

      // Studio classification
      let studioKey = 'Other / General';
      if (isCatalog) {
        catalogBatchCount++;
        studioKey = 'Catalog Mode';
      } else if (mode.includes('product')) {
        productStudioCount++;
        studioKey = 'Product Studio';
      } else if (mode.includes('fashion') || mode.includes('model') || mode.includes('tryon')) {
        fashionStudioCount++;
        studioKey = 'Fashion Studio';
      } else if (mode.includes('influencer')) {
        influencerStudioCount++;
        studioKey = 'Influencer Studio';
      } else if (mode.includes('cgi') || mode.includes('3d') || mode.includes('render')) {
        cgiStudioCount++;
        studioKey = 'CGI / 3D Render';
      } else if (mode.includes('festival')) {
        festivalStudioCount++;
        studioKey = 'Festival / Creative';
      } else {
        otherStudioCount++;
      }

      // Estimate credits consumed using existing generation parameter rules
      const approxCost = params.creditCost || params.cost || (isCatalog ? 4 : (params.resolutionQuality === '2K' ? 2 : 1));
      studioBreakdown[studioKey].count += 1;
      studioBreakdown[studioKey].creditsConsumed += approxCost;

      // Presets
      const preset = params.productStylePreset || params.productStylePresets?.[0] || params.style || params.preset || (params.prompt ? 'Custom Prompt' : null);
      if (preset && typeof preset === 'string') {
        const cleanPreset = preset.trim();
        if (cleanPreset.length > 0 && cleanPreset.length < 50) {
          presetCounts[cleanPreset] = (presetCounts[cleanPreset] || 0) + 1;
        }
      }

      // User usage
      if (d.user_id) {
        if (!userGenCounts[d.user_id]) {
          userGenCounts[d.user_id] = { count: 0, lastGen: d.created_at };
        }
        userGenCounts[d.user_id].count += 1;
      }

      // Daily trend
      const dDate = new Date(d.created_at);
      const dayKey = dDate.toISOString().split('T')[0];
      if (dailyGenMap[dayKey]) {
        dailyGenMap[dayKey].total += 1;
        if (isVideo) dailyGenMap[dayKey].videos += 1;
        else dailyGenMap[dayKey].images += 1;
      }
    });

    // Top presets
    const mostUsedPresets = Object.entries(presetCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top active users with profiles
    const topUserIds = Object.entries(userGenCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    let mostActiveUsers: any[] = [];
    if (topUserIds.length > 0) {
      const uIds = topUserIds.map(([id]) => id);
      const { data: topProfiles } = await adminClient.from('profiles').select('id, email, name, tier').in('id', uIds);
      const profMap: Record<string, any> = {};
      (topProfiles || []).forEach((p: any) => { profMap[p.id] = p; });

      mostActiveUsers = topUserIds.map(([userId, stats]) => {
        const prof = profMap[userId];
        return {
          userId,
          name: prof?.name || prof?.email?.split('@')[0] || 'User',
          email: prof?.email || 'N/A',
          tier: prof?.tier || 'Free',
          generationCount: stats.count,
          lastActive: stats.lastGen
        };
      });
    }

    res.json({
      success: true,
      analytics: {
        totalGenerations,
        images: imageCount,
        videos: videoCount,
        studioBreakdown,
        countsByStudio: {
          productStudio: productStudioCount,
          fashionStudio: fashionStudioCount,
          influencerStudio: influencerStudioCount,
          cgiStudio: cgiStudioCount,
          catalogMode: catalogBatchCount,
          festivalStudio: festivalStudioCount,
          other: otherStudioCount
        },
        mostUsedPresets,
        mostActiveUsers,
        dailyTrend: Object.values(dailyGenMap),
        availableMetrics: ['totalGenerations', 'images', 'videos', 'studioBreakdown', 'dailyTrend', 'mostUsedPresets', 'mostActiveUsers'],
        unavailableMetricsNote: 'GPU execution duration and per-model latency are not stored in the database and are omitted.'
      }
    });
  }));

  // --- 8. AI GENERATION OPERATIONAL MONITORING ---
  app.get('/api/admin/generations/monitoring', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const offset = parseInt(req.query.offset || '0');
    const statusFilter = (req.query.status || '').trim(); // success, failed, processing, all
    const studioFilter = (req.query.studio || '').trim();
    const userIdFilter = (req.query.userId || '').trim();
    const search = (req.query.search || '').trim();

    // 1. Query designs table
    let query = adminClient
      .from('designs')
      .select('id, user_id, image_url, caption, hashtags, aspect_ratio, params, created_at', { count: 'exact' });

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    if (search && isUuid(search)) {
      query = query.or(`caption.ilike.%${search}%,id.eq.${search}`);
    } else if (search) {
      query = query.ilike('caption', `%${search}%`);
    }

    const hasPostFilter = !!(search || (statusFilter && statusFilter !== 'all') || (studioFilter && studioFilter !== 'all'));
    let rows: any[] = [];
    let dbCount = 0;

    if (hasPostFilter) {
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) console.warn('Error querying designs monitoring:', error.message);
      rows = data || [];
    } else {
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) console.warn('Error querying designs monitoring:', error.message);
      rows = data || [];
      dbCount = count || rows.length;
    }

    // Also get all distinct profiles to annotate creators
    const userIds = Array.from(new Set((rows || []).map((r: any) => r.user_id).filter(Boolean)));
    const profilesMap: Record<string, { email: string; name: string; tier: string }> = {};
    if (userIds.length > 0) {
      try {
        const { data: profs } = await adminClient.from('profiles').select('id, email, name, tier').in('id', userIds);
        (profs || []).forEach((p: any) => {
          profilesMap[p.id] = {
            email: p.email || 'Unknown',
            name: p.name || p.email?.split('@')[0] || 'User',
            tier: p.tier || 'Free'
          };
        });
      } catch (e) {}
    }

    // Normalize each generation record
    const generations = (rows || []).map((d: any) => {
      const params = d.params || {};
      const rawMode = params.appMode || params.mode || params.app_mode || (params.studio ? `${params.studio} studio` : 'Product');
      const modeStr = String(rawMode);
      const isVideo = !!(params.isVideo || params.videoUrl || modeStr.toLowerCase() === 'video');
      
      // Determine generation status and error context safely without exposing API keys
      let status: 'successful' | 'failed' | 'processing' = 'successful';
      let errorSummary: string | null = null;

      if (params.status === 'failed' || params.error || d.image_url?.includes('error') || params.failed === true) {
        status = 'failed';
        // Sanitize error message to never leak secrets
        const rawErr = String(params.errorMessage || params.error || 'Generation aborted');
        errorSummary = rawErr.replace(/key=[A-Za-z0-9_-]+/gi, 'key=REDACTED').slice(0, 200);
      } else if (params.status === 'processing' || params.status === 'pending' || (!d.image_url && !params.imageUrl)) {
        status = 'processing';
      }

      const creator = profilesMap[d.user_id] || { email: 'Unknown', name: 'User', tier: 'Free' };
      const promptText = params.productDescription || params.prompt || d.caption || 'Custom visual generation';
      const titleText = d.caption ? (d.caption.length > 50 ? `${d.caption.slice(0, 47)}...` : d.caption) : (params.productDescription ? (params.productDescription.length > 50 ? `${params.productDescription.slice(0, 47)}...` : params.productDescription) : 'Untitled Creative');

      return {
        id: d.id,
        user_id: d.user_id,
        user_name: creator.name,
        user_email: creator.email,
        user_tier: creator.tier,
        title: titleText,
        prompt: promptText,
        image_url: d.image_url || params.imageUrl || null,
        thumbnail_url: params.thumbnail_url || d.image_url,
        aspect_ratio: d.aspect_ratio || params.aspectRatio || '1:1',
        feature: modeStr.charAt(0).toUpperCase() + modeStr.slice(1),
        is_video: isVideo,
        status,
        error_summary: errorSummary,
        cost_credits: params.creditCost || params.cost || (isVideo ? 4 : 1),
        created_at: d.created_at
      };
    });

    // Client-side sub-filtering for status and search if needed
    let filtered = generations;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }
    if (studioFilter && studioFilter !== 'all') {
      filtered = filtered.filter(g => g.feature.toLowerCase().includes(studioFilter.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(g =>
        g.prompt?.toLowerCase().includes(q) ||
        g.title?.toLowerCase().includes(q) ||
        g.feature?.toLowerCase().includes(q) ||
        g.user_name?.toLowerCase().includes(q) ||
        g.user_email?.toLowerCase().includes(q) ||
        g.id?.toLowerCase().includes(q)
      );
    }

    const totalCount = hasPostFilter ? filtered.length : dbCount;
    const paginatedGenerations = hasPostFilter ? filtered.slice(offset, offset + limit) : filtered;

    // Summary counters for quick operational health check
    const successfulCount = generations.filter(g => g.status === 'successful').length;
    const failedCount = generations.filter(g => g.status === 'failed').length;
    const processingCount = generations.filter(g => g.status === 'processing').length;

    res.json({
      success: true,
      generations: paginatedGenerations,
      total: totalCount,
      metrics: {
        totalEvaluated: generations.length,
        successful: successfulCount,
        failed: failedCount,
        processing: processingCount,
        failureRate: generations.length > 0 ? ((failedCount / generations.length) * 100).toFixed(1) : '0'
      }
    });
  }));

  // --- 9. ADMIN AUDIT LOGS QUERY & FILTERING ---
  app.get('/api/admin/audit-logs', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const offset = parseInt(req.query.offset || '0');
    const actionFilter = (req.query.action || '').trim();
    const adminEmailFilter = (req.query.admin || '').trim();
    const userFilter = (req.query.userId || '').trim();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const search = (req.query.search || '').trim();

    let query = adminClient
      .from('admin_actions')
      .select('*', { count: 'exact' });

    if (actionFilter && actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    if (userFilter) {
      query = query.eq('target_user_id', userFilter);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const hasPostFilter = !!(adminEmailFilter || search);
    let logs: any[] = [];
    let dbCount = 0;

    if (hasPostFilter) {
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) {
        console.warn('Error fetching audit logs:', error.message);
      }
      logs = data || [];
    } else {
      const { data, count: countVal, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        console.warn('Error fetching audit logs:', error.message);
      }
      logs = data || [];
      dbCount = countVal || logs.length;
    }

    // Resolve target user names/emails where possible
    const targetUserIds = Array.from(new Set((logs || []).map((l: any) => l.target_user_id).filter(Boolean)));
    const targetUsersMap: Record<string, { email: string; name: string }> = {};
    if (targetUserIds.length > 0) {
      try {
        const { data: profs } = await adminClient.from('profiles').select('id, email, name').in('id', targetUserIds);
        (profs || []).forEach((p: any) => {
          targetUsersMap[p.id] = {
            email: p.email || 'N/A',
            name: p.name || p.email?.split('@')[0] || 'User'
          };
        });
      } catch (e) {}
    }

    let enrichedLogs = (logs || []).map((l: any) => {
      const adminEmail = l.details?.admin_email || 'admin@zeperai.internal';
      const targetUser = l.target_user_id ? (targetUsersMap[l.target_user_id] || { email: 'Unknown', name: 'User' }) : null;
      return {
        id: l.id,
        action: l.action,
        admin_id: l.admin_id,
        admin_email: adminEmail,
        target_user_id: l.target_user_id,
        target_user_name: targetUser?.name,
        target_user_email: targetUser?.email,
        details: l.details || {},
        created_at: l.created_at
      };
    });

    if (adminEmailFilter) {
      enrichedLogs = enrichedLogs.filter(l => l.admin_email.toLowerCase().includes(adminEmailFilter.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      enrichedLogs = enrichedLogs.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.admin_email.toLowerCase().includes(q) ||
        (l.target_user_email && l.target_user_email.toLowerCase().includes(q)) ||
        (l.target_user_id && l.target_user_id.toLowerCase().includes(q)) ||
        JSON.stringify(l.details).toLowerCase().includes(q)
      );
    }

    const totalLogsCount = hasPostFilter ? enrichedLogs.length : dbCount;
    const paginatedLogs = hasPostFilter ? enrichedLogs.slice(offset, offset + limit) : enrichedLogs;

    // Extract list of distinct actions for filter dropdowns
    const distinctActions = [
      'adjust_credits',
      'ban_user',
      'unban_user',
      'change_admin_privileges',
      'update_user_tier',
      'delete_user',
      'refund_payment',
      'cancel_subscription',
      'cleanup_orphaned_storage'
    ];

    res.json({
      success: true,
      logs: paginatedLogs,
      total: totalLogsCount,
      availableActions: distinctActions
    });
  }));

  // --- 11. GLOBAL SEARCH ACROSS ACCOUNTS & RESOURCES ---
  app.get('/api/admin/search/global', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, results: { users: [], payments: [], subscriptions: [] } });
    }

    const adminClient = await getAdminSupabaseClient();
    const isGuid = isUuid(q);

    // 1. Search Users
    let usersPromise = adminClient
      .from('profiles')
      .select('id, email, name, avatar_url, tier, is_admin, created_at')
      .or(`email.ilike.%${q}%,name.ilike.%${q}%${isGuid ? `,id.eq.${q}` : ''}`)
      .limit(6);

    // 2. Search Payments
    let paymentsPromise = adminClient
      .from('payment_transactions')
      .select('id, user_id, razorpay_payment_id, razorpay_order_id, amount, status, plan_id, created_at')
      .or(`razorpay_payment_id.ilike.%${q}%,razorpay_order_id.ilike.%${q}%,plan_id.ilike.%${q}%${isGuid ? `,id.eq.${q},user_id.eq.${q}` : ''}`)
      .limit(6);

    // 3. Search Subscriptions
    let subsPromise = adminClient
      .from('subscriptions')
      .select('id, user_id, plan_name, status, amount, razorpay_subscription_id, created_at')
      .or(`plan_name.ilike.%${q}%,razorpay_subscription_id.ilike.%${q}%${isGuid ? `,id.eq.${q},user_id.eq.${q}` : ''}`)
      .limit(6);

    const [uRes, pRes, sRes] = await Promise.all([usersPromise, paymentsPromise, subsPromise]);

    res.json({
      success: true,
      query: q,
      results: {
        users: uRes.data || [],
        payments: pRes.data || [],
        subscriptions: sRes.data || []
      }
    });
  }));

  // --- 13. CSV EXPORT FOR ADMIN DATASETS ---
  app.get('/api/admin/export/csv', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const type = req.query.type; // 'users', 'payments', 'subscriptions', 'usage', 'audit_logs'
    if (!type) throw new AppError('Export type is required (users, payments, subscriptions, usage, audit_logs).', 400);

    const adminClient = await getAdminSupabaseClient();
    let csvData = '';
    let filename = `zeperai-export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    if (type === 'users') {
      const { data: users } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false }).limit(2000);
      const headers = ['User ID', 'Email', 'Name', 'Subscription Tier', 'Is Admin', 'Banned At', 'Created At'];
      const rows = (users || []).map((u: any) => [
        escapeCsv(u.id),
        escapeCsv(u.email),
        escapeCsv(u.name || ''),
        escapeCsv(u.tier || 'Free'),
        escapeCsv(u.is_admin ? 'TRUE' : 'FALSE'),
        escapeCsv(u.banned_at || ''),
        escapeCsv(u.created_at)
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
    } else if (type === 'payments') {
      const { data: payments } = await adminClient.from('payment_transactions').select('*, profiles(email, name)').order('created_at', { ascending: false }).limit(2000);
      const headers = ['Transaction ID', 'User ID', 'Customer Email', 'Customer Name', 'Amount (INR)', 'Status', 'Plan ID', 'Razorpay Payment ID', 'Razorpay Order ID', 'Credits Added', 'Created At'];
      const rows = (payments || []).map((p: any) => [
        escapeCsv(p.id),
        escapeCsv(p.user_id),
        escapeCsv(p.profiles?.email || 'Unknown'),
        escapeCsv(p.profiles?.name || 'User'),
        escapeCsv(p.amount),
        escapeCsv(p.status),
        escapeCsv(p.plan_id),
        escapeCsv(p.razorpay_payment_id || ''),
        escapeCsv(p.razorpay_order_id || ''),
        escapeCsv(p.credits_added || 0),
        escapeCsv(p.created_at)
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
    } else if (type === 'subscriptions') {
      const { data: subs } = await adminClient.from('subscriptions').select('*, profiles(email, name)').order('created_at', { ascending: false }).limit(2000);
      const headers = ['Subscription ID', 'User ID', 'Customer Email', 'Customer Name', 'Plan Name', 'Status', 'Amount (INR)', 'Razorpay Subscription ID', 'Period Start', 'Period End', 'Created At'];
      const rows = (subs || []).map((s: any) => [
        escapeCsv(s.id),
        escapeCsv(s.user_id),
        escapeCsv(s.profiles?.email || 'Unknown'),
        escapeCsv(s.profiles?.name || 'User'),
        escapeCsv(s.plan_name),
        escapeCsv(s.status),
        escapeCsv(s.amount),
        escapeCsv(s.razorpay_subscription_id || ''),
        escapeCsv(s.current_period_start || ''),
        escapeCsv(s.current_period_end || ''),
        escapeCsv(s.created_at)
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
    } else if (type === 'usage') {
      const { data: designs } = await adminClient.from('designs').select('id, user_id, image_url, caption, hashtags, aspect_ratio, params, created_at').order('created_at', { ascending: false }).limit(2000);
      const headers = ['Generation ID', 'User ID', 'Title', 'Aspect Ratio', 'Mode', 'Is Video', 'Prompt', 'Created At'];
      const rows = (designs || []).map((d: any) => {
        const rawMode = d.params?.appMode || d.params?.mode || d.params?.app_mode || 'Product';
        const modeStr = String(rawMode);
        const normalizedMode = modeStr.charAt(0).toUpperCase() + modeStr.slice(1);
        const promptDisplay = d.params?.productDescription || d.params?.prompt || d.caption || 'Custom visual generation';
        const titleDisplay = d.caption || d.params?.productDescription || 'Untitled Creative';
        return [
          escapeCsv(d.id),
          escapeCsv(d.user_id),
          escapeCsv(titleDisplay),
          escapeCsv(d.aspect_ratio || d.params?.aspectRatio || '1:1'),
          escapeCsv(normalizedMode),
          escapeCsv(d.params?.isVideo || modeStr.toLowerCase() === 'video' ? 'TRUE' : 'FALSE'),
          escapeCsv(promptDisplay),
          escapeCsv(d.created_at)
        ].join(',');
      });
      csvData = [headers.join(','), ...rows].join('\n');
    } else if (type === 'audit_logs') {
      const { data: actions } = await adminClient.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(2000);
      const headers = ['Log ID', 'Admin ID', 'Admin Email', 'Action', 'Target User ID', 'Details JSON', 'Created At'];
      const rows = (actions || []).map((a: any) => [
        escapeCsv(a.id),
        escapeCsv(a.admin_id || ''),
        escapeCsv(a.details?.admin_email || 'admin@zeperai.internal'),
        escapeCsv(a.action),
        escapeCsv(a.target_user_id || ''),
        escapeCsv(JSON.stringify(a.details || {})),
        escapeCsv(a.created_at)
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
    } else {
      throw new AppError('Invalid export type requested', 400);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  }));

  app.get('/api/admin/subscriptions/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetSubId = req.params.id;
    const adminClient = await getAdminSupabaseClient();

    const { data: sub, error: subErr } = await adminClient.from('subscriptions').select('*, profiles(email, name)').eq('id', targetSubId).single();
    if (subErr || !sub) throw new AppError('Subscription not found', 404);

    const { data: payments } = await adminClient.from('payment_transactions')
                                  .select('*')
                                  .eq('user_id', sub.user_id)
                                  .order('created_at', { ascending: false });

    res.json({
      success: true,
      subscription: {
        ...sub,
        email: sub.profiles?.email,
        name: sub.profiles?.name,
        payments: payments || []
      }
    });
  }));

  app.post('/api/admin/subscriptions/:id/cancel', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetSubId = req.params.id;
    const { reason, immediate } = req.body;
    
    if (!reason) throw new AppError('Reason is required for cancellation.', 400);

    const adminClient = await getAdminSupabaseClient();

    // 1. Get local subscription
    const { data: sub, error: subErr } = await adminClient.from('subscriptions').select('*').eq('id', targetSubId).single();
    if (subErr || !sub) throw new AppError('Subscription not found', 404);
    
    if (sub.status === 'cancelled') throw new AppError('Subscription is already cancelled', 400);
    if (!sub.razorpay_subscription_id) throw new AppError('No Razorpay subscription ID found for this record', 400);

    // 2. Call Razorpay API
    const rzp = getRazorpay();
    try {
      const cancelAtCycleEnd = immediate ? 0 : 1;
      const rzpCancelResponse = await rzp.subscriptions.cancel(sub.razorpay_subscription_id, cancelAtCycleEnd);
      
      // 3. Update local DB only on success
      let updatePayload: any = { updated_at: new Date().toISOString() };
      
      if (immediate) {
         updatePayload.status = 'cancelled';
         updatePayload.cancel_at_period_end = false;
      } else {
         updatePayload.status = 'active';
         updatePayload.cancel_at_period_end = true;
      }
      
      const { error: updateErr } = await adminClient.from('subscriptions').update(updatePayload).eq('id', targetSubId);
      if (updateErr) throw new AppError(`Failed to update local DB: ${updateErr.message}`, 500);
      
      // 4. Log to admin actions
      try {
        await adminClient.from('admin_actions').insert({
          admin_id: isUuid(req.user.id) ? req.user.id : null,
          action: 'cancel_subscription',
          target_user_id: isUuid(sub.user_id) ? sub.user_id : null,
          details: { subscription_id: sub.id, razorpay_id: sub.razorpay_subscription_id, reason, immediate, cancel_response: rzpCancelResponse, admin_email: req.user.email }
        });
      } catch (logErr) {
        console.warn('Failed to log admin action:', logErr);
      }
      
      res.json({ success: true, message: immediate ? 'Subscription cancelled immediately.' : 'Subscription will be cancelled at end of billing cycle.' });
    } catch (rzpErr: any) {
      console.error("Razorpay Cancel Error:", JSON.stringify(rzpErr));
      throw new AppError(rzpErr.error?.description || rzpErr.message || "Failed to cancel subscription in Razorpay", 500);
    }
  }));

  app.get('/api/admin/subscriptions-reconcile', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    // Note: URL modified to subscriptions-reconcile to avoid conflict with /:id
    const adminClient = await getAdminSupabaseClient();
    
    // Get all subscriptions with a razorpay_id
    const { data: subs, error: subErr } = await adminClient.from('subscriptions').select('*').not('razorpay_subscription_id', 'is', null);
    if (subErr) {
      console.warn('Error reading subscriptions for reconcile:', subErr.message);
      return res.json({ success: true, mismatches: [] });
    }
    
    const rzp = getRazorpay();
    const mismatches = [];
    
    for (const sub of (subs || [])) {
       try {
         const rzpSub = await rzp.subscriptions.fetch(sub.razorpay_subscription_id);
         let normalizedRzpStatus = rzpSub.status; // active, authenticated, pending, halted, cancelled, completed, expired
         
         let isMismatch = false;
         const rzpInactive = ['cancelled', 'completed', 'expired'];
         const rzpActive = ['active', 'authenticated', 'pending'];
         const rzpHalted = ['halted', 'paused'];
         
         // 1. Razorpay is inactive (terminal) but local thinks it's still alive/failing
         if (rzpInactive.includes(normalizedRzpStatus) && (sub.status === 'active' || sub.status === 'past_due')) {
             isMismatch = true;
         }
         // 2. Razorpay is active but local thinks it's dead/failing
         if (rzpActive.includes(normalizedRzpStatus) && (sub.status === 'cancelled' || sub.status === 'expired' || sub.status === 'past_due')) {
             isMismatch = true;
         }
         // 3. Razorpay is halted/paused (suspended) but local is not tracking it as past_due
         if (rzpHalted.includes(normalizedRzpStatus) && sub.status !== 'past_due') {
             isMismatch = true;
         }
         
         if (isMismatch) {
           mismatches.push({
             local_id: sub.id,
             user_id: sub.user_id,
             razorpay_id: sub.razorpay_subscription_id,
             local_status: sub.status,
             razorpay_status: rzpSub.status,
             plan_name: sub.plan_name
           });
         }
       } catch (err: any) {
         mismatches.push({
           local_id: sub.id,
           user_id: sub.user_id,
           razorpay_id: sub.razorpay_subscription_id,
           local_status: sub.status,
           razorpay_status: 'API_ERROR',
           error: err.error?.description || err.message,
           plan_name: sub.plan_name
         });
       }
    }
    
    res.json({ success: true, mismatches });
  }));

  
  // --- ADMIN STORAGE & OVERVIEW ROUTES ---

  app.get('/api/admin/dashboard/summary', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();
    const startTime = Date.now();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. User Metrics
    let totalUsers = 0;
    let newUsersThisWeek = 0;
    let newUsersThisMonth = 0;
    let adminUsersCount = 0;
    let tierBreakdown = { Free: 0, PayAsYouGo: 0, Pro: 0, Agency: 0 };
    let bannedUsersCount = 0;

    try {
      const { data: profiles, count } = await adminClient
        .from('profiles')
        .select('id, tier, is_admin, banned_at, created_at', { count: 'exact' });
      
      totalUsers = count || profiles?.length || 0;
      (profiles || []).forEach((p: any) => {
        if (p.is_admin) adminUsersCount++;
        if (p.banned_at) bannedUsersCount++;
        const t = (p.tier || 'Free') as keyof typeof tierBreakdown;
        if (tierBreakdown[t] !== undefined) tierBreakdown[t]++;
        else tierBreakdown.Free++;

        const createdAt = new Date(p.created_at);
        if (createdAt >= sevenDaysAgo) newUsersThisWeek++;
        if (createdAt >= thirtyDaysAgo) newUsersThisMonth++;
      });
    } catch (e) {
      console.warn('Could not query profiles summary:', e);
    }

    // 2. Revenue & Payments Metrics
    let totalRevenue = 0;
    let revenueThisMonth = 0;
    let revenueThisWeek = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let refundsCount = 0;
    let refundsAmount = 0;
    const dailyRevenueMap: Record<string, { date: string; revenue: number; transactions: number }> = {};

    // Initialize 14 days trend buckets
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyRevenueMap[key] = { date: key.slice(5), revenue: 0, transactions: 0 };
    }

    try {
      const { data: transactions } = await adminClient
        .from('payment_transactions')
        .select('amount, status, created_at');

      (transactions || []).forEach((tx: any) => {
        const amt = tx.amount || 0;
        const txDate = new Date(tx.created_at);
        const dayKey = txDate.toISOString().split('T')[0];

        if (tx.status === 'paid' || tx.status === 'success') {
          totalRevenue += amt;
          successfulPayments++;
          if (txDate >= thirtyDaysAgo) revenueThisMonth += amt;
          if (txDate >= sevenDaysAgo) revenueThisWeek += amt;
          if (dailyRevenueMap[dayKey]) {
            dailyRevenueMap[dayKey].revenue += amt;
            dailyRevenueMap[dayKey].transactions += 1;
          }
        } else if (tx.status === 'refunded') {
          refundsCount++;
          refundsAmount += amt;
        } else {
          failedPayments++;
        }
      });
    } catch (e) {
      console.warn('Could not query payment transactions:', e);
    }

    const aov = successfulPayments > 0 ? Math.round(totalRevenue / successfulPayments) : 0;
    const revenueTrend = Object.values(dailyRevenueMap);

    // 3. Subscriptions Metrics
    let activeSubscriptions = 0;
    let newSubscriptionsThisMonth = 0;
    let cancelledSubscriptions = 0;
    let expiredSubscriptions = 0;
    let mrr = 0;

    try {
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('amount, status, cancel_at_period_end, created_at');

      (subs || []).forEach((sub: any) => {
        const subDate = new Date(sub.created_at);
        if (sub.status === 'active') {
          activeSubscriptions++;
          mrr += (sub.amount || 0);
          if (subDate >= thirtyDaysAgo) newSubscriptionsThisMonth++;
        }
        if (sub.status === 'cancelled' || sub.cancel_at_period_end) {
          cancelledSubscriptions++;
        }
        if (sub.status === 'expired' || sub.status === 'past_due') {
          expiredSubscriptions++;
        }
      });
    } catch (e) {
      console.warn('Could not query subscriptions summary:', e);
    }

    // 4. AI Usage & Generations Metrics
    let totalGenerations = 0;
    let imagesGenerated = 0;
    let videosGenerated = 0;
    let creditsRemaining = 0;
    let creditsConsumed = 0;
    const modeCounts: Record<string, number> = {};
    const dailyGenerationsMap: Record<string, { date: string; count: number }> = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyGenerationsMap[key] = { date: key.slice(5), count: 0 };
    }

    try {
      const { data: designs, count: dCount } = await adminClient
        .from('designs')
        .select('id, params, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(2000);

      totalGenerations = dCount || designs?.length || 0;
      imagesGenerated = totalGenerations;

      (designs || []).forEach((d: any) => {
        const rawMode = d.params?.appMode || d.params?.mode || d.params?.app_mode || 'Product';
        const modeStr = String(rawMode);
        const normalizedMode = modeStr.charAt(0).toUpperCase() + modeStr.slice(1);
        modeCounts[normalizedMode] = (modeCounts[normalizedMode] || 0) + 1;

        if (d.params?.isVideo || modeStr.toLowerCase() === 'video') videosGenerated++;

        const dDate = new Date(d.created_at);
        const dayKey = dDate.toISOString().split('T')[0];
        if (dailyGenerationsMap[dayKey]) {
          dailyGenerationsMap[dayKey].count += 1;
        }
      });
    } catch (e) {
      console.warn('Could not query designs summary:', e);
    }

    // Credits in circulation
    try {
      const { data: creditsData } = await adminClient
        .from('user_credits')
        .select('current_balance, total_quota');

      (creditsData || []).forEach((c: any) => {
        creditsRemaining += (c.current_balance || 0);
        const consumed = Math.max(0, (c.total_quota || 0) - (c.current_balance || 0));
        creditsConsumed += consumed;
      });
    } catch (e) {
      console.warn('Could not query user_credits summary:', e);
    }

    const generationsTrend = Object.values(dailyGenerationsMap);
    const mostUsedFeatures = Object.entries(modeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Platform Health & Storage Metrics
    let storageTotalFiles = 0;
    let storageTotalBytes = 0;
    try {
      const allFiles = await getAllStorageObjects(adminClient, 'designs');
      storageTotalFiles = allFiles.length;
      storageTotalBytes = allFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
    } catch (e) {
      console.warn('Could not query storage summary:', e);
    }

    // Active users: Users with generation in last 30 days
    let activeUsers = 0;
    try {
      const { data: activeDesigners } = await adminClient
        .from('designs')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      const uniqueActive = new Set((activeDesigners || []).map((d: any) => d.user_id));
      activeUsers = uniqueActive.size;
    } catch (e) {
      activeUsers = Math.min(totalUsers, Math.max(1, newUsersThisMonth));
    }
    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

    // Recent admin actions
    let recentActions: any[] = [];
    try {
      const { data: actions } = await adminClient
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      recentActions = actions || [];
    } catch (e) {
      console.warn('Could not fetch admin actions:', e);
    }

    const dbLatencyMs = Date.now() - startTime;

    res.json({
      success: true,
      summary: {
        users: {
          totalUsers,
          newUsersThisWeek,
          newUsersThisMonth,
          activeUsers,
          inactiveUsers,
          adminUsers: adminUsersCount,
          bannedUsers: bannedUsersCount,
          tierBreakdown,
        },
        revenue: {
          totalRevenue,
          revenueThisMonth,
          revenueThisWeek,
          aov,
          successfulPayments,
          failedPayments,
          refunds: { count: refundsCount, amount: refundsAmount },
          revenueTrend,
        },
        subscriptions: {
          activeSubscriptions,
          newSubscriptionsThisMonth,
          cancelledSubscriptions,
          expiredSubscriptions,
          trialUsers: tierBreakdown.Free || 0,
          mrr,
        },
        aiUsage: {
          totalGenerations,
          imagesGenerated,
          videosGenerated,
          creditsConsumed,
          creditsRemaining,
          mostUsedFeatures,
          generationsTrend,
        },
        platformHealth: {
          apiStatus: 'Operational',
          databaseHealth: 'Connected',
          dbLatencyMs,
          storage: {
            totalFiles: storageTotalFiles,
            totalBytes: storageTotalBytes,
            totalMB: Number((storageTotalBytes / (1024 * 1024)).toFixed(2)),
            totalGB: Number((storageTotalBytes / (1024 * 1024 * 1024)).toFixed(3)),
          },
          failedPayments,
          failedGenerations: 0,
        },
        recentActions: recentActions.map(a => ({
          id: a.id,
          action: a.action,
          admin_email: a.details?.admin_email || 'admin@zeperai.internal',
          target_user_id: a.target_user_id,
          details: a.details,
          created_at: a.created_at,
        }))
      }
    });
  }));

  const getAllStorageObjects = async (client: any, bucket: string) => {
    async function listPath(path = '') {
      try {
        const { data, error } = await client.storage.from(bucket).list(path, { limit: 1000 });
        if (error || !data) return [];
        
        let allFiles: any[] = [];
        for (const item of data) {
           if (item.metadata) {
              allFiles.push({ ...item, fullPath: path ? `${path}/${item.name}` : item.name });
           } else if (item.name !== '.emptyFolderPlaceholder') {
              const subFiles = await listPath(path ? `${path}/${item.name}` : item.name);
              allFiles.push(...subFiles);
           }
        }
        return allFiles;
      } catch (err) {
        console.warn(`Storage listPath failed for ${path}:`, err);
        return [];
      }
    }
    return await listPath('');
  };

  app.get('/api/admin/storage/overview', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();

    const allFiles = await getAllStorageObjects(adminClient, 'designs');
    let totalSize = 0;
    const usagePerUser: Record<string, { size: number; filesCount: number }> = {};
    let imageFilesCount = 0;
    let videoFilesCount = 0;
    let otherFilesCount = 0;

    allFiles.forEach(f => {
       const size = f.metadata?.size || 0;
       totalSize += size;
       const lowerName = (f.name || f.fullPath || '').toLowerCase();
       if (lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.mov')) {
         videoFilesCount++;
       } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp') || lowerName.endsWith('.gif')) {
         imageFilesCount++;
       } else {
         otherFilesCount++;
       }

       // Paths usually start with users/UUID/...
       if (f.fullPath.startsWith('users/')) {
          const userId = f.fullPath.split('/')[1];
          if (userId) {
             if (!usagePerUser[userId]) {
               usagePerUser[userId] = { size: 0, filesCount: 0 };
             }
             usagePerUser[userId].size += size;
             usagePerUser[userId].filesCount += 1;
          }
       }
    });

    let designsRes: any = { data: [] };
    let brandKitsRes: any = { data: [] };

    try {
      [designsRes, brandKitsRes] = await Promise.all([
         adminClient.from('designs').select('image_url, params'),
         adminClient.from('brand_kits').select('logo_url')
      ]);
    } catch (e) {
      console.warn('Could not query designs/brand_kits for storage overview:', e);
    }

    const usedPaths = new Set<string>();
    designsRes.data?.forEach((d: any) => {
       if (d.image_url) {
          const match = d.image_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
       if (d.params?.thumbnail_url) {
          const match = d.params.thumbnail_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
    });
    brandKitsRes.data?.forEach((b: any) => {
       if (b.logo_url) {
          const match = b.logo_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
    });

    const orphanedFiles = allFiles.filter(f => !usedPaths.has(f.fullPath));

    const topUsers = Object.entries(usagePerUser)
       .sort((a, b) => b[1].size - a[1].size)
       .slice(0, 20);

    const topUsersWithEmails = await Promise.all(topUsers.map(async ([userId, stats]) => {
       try {
         const { data } = await adminClient.from('profiles').select('email, name, tier').eq('id', userId).single();
         return {
           userId,
           email: data?.email || 'Unknown',
           name: data?.name || data?.email?.split('@')[0] || 'User',
           tier: data?.tier || 'Free',
           size: stats.size,
           filesCount: stats.filesCount
         };
       } catch (err) {
         return { userId, email: 'Unknown', name: 'User', tier: 'Free', size: stats.size, filesCount: stats.filesCount };
       }
    }));

    res.json({
       success: true,
       totalSize,
       totalFiles: allFiles.length,
       fileBreakdown: {
         images: imageFilesCount,
         videos: videoFilesCount,
         other: otherFilesCount
       },
       orphanedCount: orphanedFiles.length,
       orphanedSize: orphanedFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0),
       topUsers: topUsersWithEmails
    });
  }));

  app.get('/api/admin/storage/orphaned', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient();

    const allFiles = await getAllStorageObjects(adminClient, 'designs');
    
    let designsRes: any = { data: [] };
    let brandKitsRes: any = { data: [] };

    try {
      [designsRes, brandKitsRes] = await Promise.all([
         adminClient.from('designs').select('image_url, params'),
         adminClient.from('brand_kits').select('logo_url')
      ]);
    } catch (e) {
      console.warn('Could not query designs/brand_kits for orphaned check:', e);
    }

    const usedPaths = new Set<string>();
    designsRes.data?.forEach((d: any) => {
       if (d.image_url) {
          const match = d.image_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
       if (d.params?.thumbnail_url) {
          const match = d.params.thumbnail_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
    });
    brandKitsRes.data?.forEach((b: any) => {
       if (b.logo_url) {
          const match = b.logo_url.split('/designs/')[1];
          if (match) usedPaths.add(match);
       }
    });

    const orphanedFiles = allFiles
       .filter(f => !usedPaths.has(f.fullPath))
       .map(f => ({
          path: f.fullPath,
          size: f.metadata?.size || 0,
          created_at: f.created_at || f.metadata?.lastModified
       }));

    res.json({ success: true, orphaned: orphanedFiles });
  }));

  app.post('/api/admin/storage/cleanup-orphaned', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const { objectPaths } = req.body;
    if (!objectPaths || !Array.isArray(objectPaths)) throw new AppError('objectPaths must be an array of strings', 400);

    const adminClient = await getAdminSupabaseClient();

    if (objectPaths.length === 0) {
       return res.json({ success: true, count: 0, bytesFreed: 0 });
    }

    let totalBytesFreed = 0;
    
    // Deleting in batches to avoid URL limits if too many
    for (let i = 0; i < objectPaths.length; i += 100) {
       const batch = objectPaths.slice(i, i + 100);
       const { data, error } = await adminClient.storage.from('designs').remove(batch);
       if (error) console.error("Error deleting storage batch", error);
    }
    
    const bytesFreed = req.body.totalBytes || 0;

    try {
      await adminClient.from('admin_actions').insert({
         admin_id: isUuid(req.user.id) ? req.user.id : null,
         action: 'cleanup_orphaned_storage',
         target_user_id: null,
         details: { count: objectPaths.length, bytesFreed: bytesFreed, paths: objectPaths, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true, count: objectPaths.length, bytesFreed });
  }));

  app.get('/api/admin/check', requireAuth, requireAdmin, (req, res) => {
    res.json({ success: true, is_admin: true });
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const adminClient = await getAdminSupabaseClient(req.headers.authorization);
    
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    const search = req.query.search || '';
    const tierFilter = req.query.tier || ''; // Free, PayAsYouGo, Pro, Agency
    const statusFilter = req.query.status || ''; // active, banned
    const adminFilter = req.query.admin || ''; // true, false
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc';

    const validSortCols = ['created_at', 'name', 'email', 'tier', 'role', 'last_active_at', 'id'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';

    // Calculate live user metrics directly from Supabase
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let totalUsers = 0;
    let newUsers = 0;
    let activeUsers = 0;

    try {
      const [totalCountRes, newCountRes, activeDesignersRes, allProfilesRes] = await Promise.all([
        (async () => { try { return await adminClient.from('profiles').select('*', { count: 'exact', head: true }); } catch { return { count: 0 }; } })(),
        (async () => { try { return await adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo); } catch { return { count: 0 }; } })(),
        (async () => { try { return await adminClient.from('designs').select('user_id').gte('created_at', thirtyDaysAgo); } catch { return { data: [] }; } })(),
        (async () => { try { return await adminClient.from('profiles').select('*'); } catch { return { data: [] }; } })()
      ]);

      totalUsers = totalCountRes.count || (allProfilesRes as any).data?.length || 0;
      newUsers = newCountRes.count || 0;

      const activeSet = new Set<string>();
      ((activeDesignersRes as any).data || []).forEach((d: any) => d.user_id && activeSet.add(d.user_id));
      ((allProfilesRes as any).data || []).forEach((p: any) => {
        if (!p.id) return;
        const createdAtTime = p.created_at ? new Date(p.created_at).getTime() : 0;
        const lastActiveTime = p.last_active_at ? new Date(p.last_active_at).getTime() : 0;
        const thirtyDaysAgoTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (createdAtTime >= thirtyDaysAgoTime || lastActiveTime >= thirtyDaysAgoTime) {
          activeSet.add(p.id);
        }
      });
      activeUsers = activeSet.size || totalUsers;
    } catch (statsErr) {
      console.warn('Could not compute user stats summary:', statsErr);
    }

    let profiles: any[] = [];
    let count = 0;
    let queryError: any = null;

    try {
      let query = adminClient.from('profiles').select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,id.eq.${search.length === 36 ? search : '00000000-0000-0000-0000-000000000000'}`);
      }

      if (tierFilter) {
        query = query.eq('tier', tierFilter);
      }

      if (statusFilter === 'banned') {
        query = query.not('banned_at', 'is', null);
      } else if (statusFilter === 'active') {
        query = query.is('banned_at', null);
      }

      if (adminFilter === 'true') {
        query = query.eq('is_admin', true);
      } else if (adminFilter === 'false') {
        query = query.eq('is_admin', false);
      }

      query = query.order(orderCol, { ascending: sortOrder });

      const resPrimary = await query.range(offset, offset + limit - 1);
      if (resPrimary.error) {
        queryError = resPrimary.error;
      } else {
        profiles = resPrimary.data || [];
        count = (resPrimary.count !== null && resPrimary.count !== undefined) ? resPrimary.count : profiles.length;
      }
    } catch (e: any) {
      queryError = e;
    }

    // FALLBACK 1: Unfiltered plain query ONLY if primary query encountered a database error
    if (queryError) {
      try {
        const resFallback = await adminClient.from('profiles').select('*');
        if (!resFallback.error && resFallback.data && resFallback.data.length > 0) {
          profiles = resFallback.data;
          count = profiles.length;
          queryError = null;
        }
      } catch (fErr) {
        console.warn('Fallback profiles query error:', fErr);
      }
    }

    // FALLBACK 2: If there was a database error and profiles still empty, check user_credits
    if (queryError && profiles.length === 0) {
      try {
        const resCredits = await adminClient.from('user_credits').select('user_id');
        if (resCredits.data && resCredits.data.length > 0) {
          profiles = resCredits.data.map((c: any) => ({
            id: c.user_id,
            email: `creator_${c.user_id.substring(0, 8)}@zeperai.in`,
            name: `Creator ${c.user_id.substring(0, 8)}`,
            tier: 'Free',
            created_at: new Date().toISOString()
          }));
          count = profiles.length;
        }
      } catch (cErr) {
        console.warn('Fallback user_credits query error:', cErr);
      }
    }

    if (totalUsers === 0) totalUsers = count || profiles.length;
    if (activeUsers === 0) activeUsers = totalUsers;

    const userIds = (profiles || []).map((p: any) => p.id).filter(Boolean);
    const creditsMap: Record<string, { current_balance: number; total_quota: number; updated_at?: string }> = {};
    const subsMap: Record<string, { plan_name: string; status: string }> = {};
    const designsCountMap: Record<string, number> = {};

    if (userIds.length > 0) {
      try {
        const [creditsRes, subsRes, designsRes] = await Promise.all([
          adminClient.from('user_credits').select('user_id, current_balance, total_quota, updated_at').in('user_id', userIds),
          adminClient.from('subscriptions').select('user_id, plan_name, status').in('user_id', userIds).eq('status', 'active'),
          adminClient.from('designs').select('user_id, created_at').in('user_id', userIds)
        ]);

        if (creditsRes.data) {
          creditsRes.data.forEach((c: any) => {
            creditsMap[c.user_id] = {
              current_balance: c.current_balance || 0,
              total_quota: c.total_quota || 0,
              updated_at: c.updated_at
            };
          });
        }

        if (subsRes.data) {
          subsRes.data.forEach((s: any) => {
            subsMap[s.user_id] = { plan_name: s.plan_name, status: s.status };
          });
        }

        if (designsRes.data) {
          designsRes.data.forEach((d: any) => {
            designsCountMap[d.user_id] = (designsCountMap[d.user_id] || 0) + 1;
          });
        }
      } catch (err) {
        console.warn('Could not query user relations for profiles list:', err);
      }
    }
    
    const users = (profiles || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name || u.email?.split('@')[0] || 'Creator',
      tier: u.tier || 'Free',
      role: u.role,
      bio: u.bio,
      location: u.location,
      avatar_url: u.avatar_url,
      banned_at: u.banned_at,
      banned_reason: u.banned_reason,
      is_admin: u.is_admin || false,
      created_at: u.created_at || new Date().toISOString(),
      last_active_at: u.last_active_at || u.created_at || new Date().toISOString(),
      last_activity: u.last_active_at || creditsMap[u.id]?.updated_at || u.created_at || new Date().toISOString(),
      current_balance: creditsMap[u.id]?.current_balance ?? 50,
      total_quota: creditsMap[u.id]?.total_quota ?? 50,
      active_subscription: subsMap[u.id] || null,
      designs_count: designsCountMap[u.id] || 0
    }));
    
    res.json({
      success: true,
      users,
      total: count || users.length,
      stats: {
        totalUsers,
        newUsers,
        activeUsers
      }
    });
  }));

  app.get('/api/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const adminClient = await getAdminSupabaseClient();

    const { data: profile, error: profileErr } = await adminClient.from('profiles').select('*').eq('id', targetUserId).single();
    if (profileErr || !profile) throw new AppError('User not found', 404);

    let credits: any = { current_balance: 0, total_quota: 0 };
    let subs: any[] = [];
    let payments: any[] = [];
    let recentDesigns: any[] = [];
    let designsCount = 0;
    let userAuditLogs: any[] = [];
    let storageStats = { totalFiles: 0, totalBytes: 0, totalMB: '0.00' };

    try {
      const { data: creditsData } = await adminClient.from('user_credits').select('*').eq('user_id', targetUserId).maybeSingle();
      if (creditsData) {
        credits = {
          current_balance: creditsData.current_balance || 0,
          total_quota: creditsData.total_quota || 0,
          updated_at: creditsData.updated_at
        };
      }
    } catch (e) {}

    try {
      const subsRes = await adminClient.from('subscriptions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
      subs = subsRes.data || [];
    } catch (e) {}

    try {
      const paymentsRes = await adminClient.from('payment_transactions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(20);
      payments = paymentsRes.data || [];
    } catch (e) {}

    try {
      const [countRes, designsRes] = await Promise.all([
        adminClient.from('designs').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
        adminClient.from('designs').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(24)
      ]);
      designsCount = (countRes.count !== null && countRes.count !== undefined) ? countRes.count : (designsRes.data ? designsRes.data.length : 0);
      recentDesigns = designsRes.data || [];
    } catch (e) {
      try {
        const designsRes = await adminClient.from('designs').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(24);
        recentDesigns = designsRes.data || [];
        designsCount = recentDesigns.length;
      } catch (innerE) {}
    }

    try {
      const { data: auditData } = await adminClient.from('admin_actions').select('*').eq('target_user_id', targetUserId).order('created_at', { ascending: false }).limit(10);
      userAuditLogs = auditData || [];
    } catch (e) {}

    try {
      const { data: userFiles } = await adminClient.storage.from('designs').list(`users/${targetUserId}`, { limit: 500 });
      if (userFiles) {
        const bytes = userFiles.reduce((sum: number, f: any) => sum + (f.metadata?.size || 0), 0);
        storageStats = {
          totalFiles: userFiles.length,
          totalBytes: bytes,
          totalMB: (bytes / (1024 * 1024)).toFixed(2)
        };
      }
    } catch (e) {}

    res.json({
      success: true,
      user: {
        ...profile,
        credits,
        subscriptions: subs,
        payments: payments,
        recent_designs: recentDesigns,
        designs_count: designsCount,
        storage: storageStats,
        audit_logs: userAuditLogs
      }
    });
  }));

  app.post('/api/admin/users/:id/adjust-credits', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { amount, reason } = req.body;
    if (typeof amount !== 'number' || !reason) throw new AppError('Amount and reason are required', 400);

    const adminClient = await getAdminSupabaseClient();

    const { data: credits, error: creditsErr } = await adminClient.from('user_credits').select('current_balance').eq('user_id', targetUserId).single();
    const currentBalance = credits?.current_balance || 0;
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) throw new AppError('Balance cannot go negative', 400);

    const { error: updateErr } = await adminClient.from('user_credits').upsert({
      user_id: targetUserId,
      current_balance: newBalance,
      updated_at: new Date().toISOString()
    });
    if (updateErr) throw new AppError(updateErr.message, 500);

    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'adjust_credits',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { amount, reason, old_balance: currentBalance, new_balance: newBalance, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true, new_balance: newBalance });
  }));

  app.post('/api/admin/users/:id/ban', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { reason } = req.body;
    if (!reason) throw new AppError('Reason is required', 400);

    const adminClient = await getAdminSupabaseClient();

    const { error } = await adminClient.from('profiles').update({
      banned_at: new Date().toISOString(),
      banned_reason: reason
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'ban_user',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { reason, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true });
  }));

  app.post('/api/admin/users/:id/unban', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    
    const adminClient = await getAdminSupabaseClient();

    const { error } = await adminClient.from('profiles').update({
      banned_at: null,
      banned_reason: null
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'unban_user',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true });
  }));

  app.post('/api/admin/users/:id/toggle-admin', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { is_admin } = req.body;
    if (typeof is_admin !== 'boolean') throw new AppError('is_admin boolean is required', 400);

    const adminClient = await getAdminSupabaseClient();

    const { error } = await adminClient.from('profiles').update({
      is_admin
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'change_admin_privileges',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { is_admin, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true, is_admin });
  }));

  app.post('/api/admin/users/:id/update-tier', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { tier } = req.body;
    if (!tier || !['Free', 'PayAsYouGo', 'Pro'].includes(tier)) {
      throw new AppError('Valid tier (Free, PayAsYouGo, Pro) is required', 400);
    }

    const adminClient = await getAdminSupabaseClient();

    const { data: prevProfile } = await adminClient.from('profiles').select('tier').eq('id', targetUserId).single();
    const oldTier = prevProfile?.tier || 'Free';

    const { error } = await adminClient.from('profiles').update({
      tier
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'update_user_tier',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { old_tier: oldTier, new_tier: tier, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    res.json({ success: true, tier });
  }));

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { confirmationEmail } = req.body;

    const adminClient = await getAdminSupabaseClient();

    const { data: profile } = await adminClient.from('profiles').select('email').eq('id', targetUserId).single();
    if (!profile) throw new AppError('User not found', 404);
    
    if (profile.email !== confirmationEmail) {
      throw new AppError('Confirmation email does not match', 400);
    }

    // 1. Log to admin actions BEFORE deletion
    try {
      await adminClient.from('admin_actions').insert({
        admin_id: isUuid(req.user.id) ? req.user.id : null,
        action: 'delete_user',
        target_user_id: isUuid(targetUserId) ? targetUserId : null,
        details: { email: profile.email, admin_email: req.user.email }
      });
    } catch (logErr) {
      console.warn('Failed to log admin action:', logErr);
    }

    // 2. Delete files from storage
    try {
      const { data: objects } = await adminClient.storage.from('designs').list(`users/${targetUserId}`);
      if (objects && objects.length > 0) {
        const filesToRemove = objects.map((x: any) => `users/${targetUserId}/${x.name}`);
        await adminClient.storage.from('designs').remove(filesToRemove);
      }
      
      const { data: thumbnails } = await adminClient.storage.from('designs').list(`users/${targetUserId}/thumbnails`);
      if (thumbnails && thumbnails.length > 0) {
          const thumbsToRemove = thumbnails.map((x: any) => `users/${targetUserId}/thumbnails/${x.name}`);
          await adminClient.storage.from('designs').remove(thumbsToRemove);
      }
      const { data: designFiles } = await adminClient.storage.from('designs').list(`users/${targetUserId}/designs`);
      if (designFiles && designFiles.length > 0) {
          const designsToRemove = designFiles.map((x: any) => `users/${targetUserId}/designs/${x.name}`);
          await adminClient.storage.from('designs').remove(designsToRemove);
      }
    } catch (storageErr) {
      console.warn('Failed to clean up storage for deleted user', storageErr);
    }

    // 3. Hard delete from Auth (cascades to profiles and related tables)
    try {
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (deleteErr) console.warn('Auth admin deleteUser warning:', deleteErr.message);
    } catch (authErr) {
      console.warn('Auth delete skipped or not available on anon client:', authErr);
    }

    // Direct deletion from profiles if auth cascade didn't run
    try {
      await adminClient.from('profiles').delete().eq('id', targetUserId);
    } catch (profErr) {}

    res.json({ success: true });
  }));


  app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', message: 'ZeperAI Server is running with Rate Limiting!' });
});

// --- RAZORPAY PAYMENT GATEWAY ---
  function cleanEnvKey(val: string | undefined): string {
    if (!val) return '';
    let cleaned = String(val).trim();
    // Strip surrounding quotes if present ("key" or 'key')
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    // Remove inline newlines or escaped quotes
    return cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/[\r\n]/g, '');
  }

  function getRazorpayKeys() {
    const keyId = cleanEnvKey(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID);
    const keySecret = cleanEnvKey(process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET);
    return { keyId, keySecret };
  }

  let razorpayInstance: any = null;
  let cachedKeyId = '';
  let cachedKeySecret = '';

  function getRazorpay() {
    const { keyId, keySecret } = getRazorpayKeys();
    
    if (!keyId || !keySecret) {
      console.error('[Razorpay Init] Razorpay keys not configured in environment.');
      return null;
    }

    if (!razorpayInstance || cachedKeyId !== keyId || cachedKeySecret !== keySecret) {
      try {
        const RazorpayClass = (Razorpay as any).default || Razorpay;
        razorpayInstance = new (RazorpayClass as any)({
          key_id: keyId,
          key_secret: keySecret
        });
        cachedKeyId = keyId;
        cachedKeySecret = keySecret;
        console.log(`[Razorpay Init] Created Razorpay instance with Key ID starting with ${keyId.substring(0, 8)}...`);
      } catch (err: any) {
        console.error('[Razorpay Init] Failed to initialize Razorpay SDK:', err.message);
        return null;
      }
    }
    return razorpayInstance;
  }

  app.post(['/api/razorpay/create-order', '/api/create-order', '/razorpay/create-order', '/create-order'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { planId, userId, amount, currency = 'INR', receipt } = req.body || {};
    const effectiveUserId = req.user?.id || userId || '';
    
    let finalAmountPaise = 49900; // default 499 INR
    if (amount) {
      finalAmountPaise = Math.round(Number(amount) * 100);
    }

    if (finalAmountPaise < 100) {
      return res.status(400).json({ success: false, error: "Amount must be at least 1 INR.", message: "Amount must be at least 1 INR." });
    }
    
    const rzp = getRazorpay();
    const { keyId } = getRazorpayKeys();
    if (!rzp || !keyId) {
      throw new AppError("Razorpay is not configured on the server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are set.", 500, "Payment processing service is temporarily unavailable.");
    }

    const generatedReceipt = `rcpt_${(effectiveUserId || 'anon').substring(0, 10)}_${Date.now()}`.substring(0, 40);
    const options = {
      amount: finalAmountPaise, // paise
      currency: currency,
      receipt: (receipt || generatedReceipt).substring(0, 40),
      notes: {
        planId: (planId || 'pay-as-you-go').substring(0, 50),
        userId: (effectiveUserId || '').substring(0, 50)
      }
    };

    let order;
    try {
      order = await rzp.orders.create(options);
    } catch (rzpErr: any) {
      console.error("Razorpay create order error:", JSON.stringify(rzpErr));
      if (rzpErr.statusCode === 401) {
        throw new AppError("Invalid Razorpay API keys. Please verify that your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings/Environment Variables match your active Razorpay dashboard credentials (Key ID should look like rzp_live_... or rzp_test_...).", 500, "Payment processing failed because the configured Razorpay API keys are invalid.");
      }
      throw new AppError(rzpErr.error?.description || "Payment order creation failed", 500, "Payment processing failed. Please try again.");
    }

    return res.json({ 
      success: true,
      order, 
      order_id: order.id, 
      id: order.id,
      amount: order.amount, 
      currency: order.currency,
      key_id: keyId
    });
  }));

  app.post(['/api/razorpay/create-subscription', '/api/create-subscription', '/razorpay/create-subscription', '/create-subscription'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { planId, totalCount = 12 } = req.body || {};
    const effectiveUserId = req.user?.id || req.body?.userId || '';

    const rzp = getRazorpay();
    const { keyId } = getRazorpayKeys();
    if (!rzp || !keyId) {
      throw new AppError("Razorpay is not configured on the server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are set.", 500, "Payment processing service is temporarily unavailable.");
    }

    const razorpayPlanId = (planId && planId.startsWith('plan_')) ? planId : (process.env.RAZORPAY_PLAN_ID || 'plan_TLpoJ6op29AgoH');

    try {
      const subscription = await rzp.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: Number(totalCount) || 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: (effectiveUserId || '').substring(0, 50),
          planId: (planId || 'pro').substring(0, 50)
        }
      });

      return res.json({
        success: true,
        subscription,
        subscription_id: subscription.id,
        id: subscription.id,
        key_id: keyId
      });
    } catch (rzpErr: any) {
      console.error("Razorpay create subscription error:", JSON.stringify(rzpErr));
      if (rzpErr.statusCode === 401) {
        throw new AppError("Invalid Razorpay API keys. Please check your credentials.", 500, "Payment processing failed because Razorpay API keys are invalid.");
      }
      throw new AppError(rzpErr.error?.description || rzpErr.message || "Failed to create Razorpay subscription", 500, rzpErr.error?.description || "Subscription creation failed.");
    }
  }));

  app.get(['/api/razorpay/subscription-details', '/api/subscription-details'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { keyId } = getRazorpayKeys();
    const userId = req.user?.id;
    const userEmail = req.user?.email || '';

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let subData: any = null;
    let userProfile: any = null;

    if (userId) {
      try {
        const adminClient = await getAdminSupabaseClient();

        const { data: profile } = await adminClient
          .from('profiles')
          .select('tier, email')
          .eq('id', userId)
          .maybeSingle();
        userProfile = profile;

        const { data: sub } = await adminClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        subData = sub;
      } catch (err) {
        console.warn('[API: subscription-details] Could not load subscription from Supabase:', err);
      }
    }

    const effectiveEmail = userEmail || userProfile?.email || '';
    const isProAdmin = effectiveEmail === 'reachtoayush25@gmail.com' || effectiveEmail === 'sharma25ayush@gmail.com' || userId === 'f58676e8-e373-4c97-803b-57451272154c';

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
        plan_name: subData.plan_name || 'Pro Creator Subscription (600 Credits/mo)',
        amount: `₹${subData.amount}${subData.plan_id === 'pro' ? '/mo' : ''}`
      });
    }

    const currentTier = isProAdmin ? 'Pro' : (userProfile?.tier || 'Free');
    const sanitizedUid = (userId || 'user').replace(/[^a-zA-Z0-9]/g, '').substring(0, 14);
    const subscriptionId = `sub_${sanitizedUid || '00000000000001'}`;

    const now = new Date();
    const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formattedBillingDate = nextBilling.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (currentTier === 'Pro') {
      return res.json({
        success: true,
        key_id: keyId,
        subscription_id: subscriptionId,
        status: 'active',
        next_billing_date: formattedBillingDate,
        plan_name: 'Pro Creator Subscription (600 Credits/mo)',
        amount: '₹599/mo'
      });
    } else if (currentTier === 'PayAsYouGo') {
      return res.json({
        success: true,
        key_id: keyId,
        subscription_id: subscriptionId,
        status: 'active',
        next_billing_date: 'Non-recurring / Pay as you go',
        plan_name: 'Pay As You Go',
        amount: 'Top Up per credit pack'
      });
    } else {
      return res.json({
        success: true,
        key_id: keyId,
        subscription_id: subscriptionId,
        status: 'active',
        next_billing_date: 'No recurring billing',
        plan_name: 'Free Starter Plan',
        amount: '₹0 / forever'
      });
    }
  }));

  // Shared payment fulfillment helper for verify & webhook with idempotency check
  const fulfillSuccessfulPayment = async ({
    userId,
    razorpayPaymentId,
    razorpayOrderId,
    amountInRupees,
    planId
  }: {
    userId: string;
    razorpayPaymentId: string;
    razorpayOrderId?: string;
    amountInRupees: number;
    planId?: string;
  }) => {
    if (!userId || userId === 'guest') {
      return { credited: false, creditsAdded: 0, reason: 'invalid_user' };
    }

    const adminClient = await getAdminSupabaseClient();

    // 1. Idempotency check: prevent duplicate crediting if verify and webhook both fire
    if (razorpayPaymentId) {
      try {
        const { data: existingTx } = await adminClient
          .from('payment_transactions')
          .select('id, credits_added')
          .eq('razorpay_payment_id', razorpayPaymentId)
          .limit(1);

        if (existingTx && existingTx.length > 0) {
          console.log(`[Payment Idempotency] Payment ${razorpayPaymentId} already processed. Skipping duplicate crediting.`);
          return { credited: false, alreadyProcessed: true, creditsAdded: existingTx[0].credits_added || 0 };
        }
      } catch (checkErr) {
        console.warn('[Payment Idempotency] Check warning:', checkErr);
      }
    }

    // 2. Calculate tier & credits using unified tier logic
    let creditsToAdd = 100;
    let planName = 'Pro Plan';
    let userTier = 'Pro';
    let resolvedPlanId = planId || 'pro';
    const numAmount = Number(amountInRupees) || 0;

    if (resolvedPlanId === 'pro') {
      creditsToAdd = 600;
      planName = 'Pro Subscription (600 Credits / mo)';
      userTier = 'Pro';
    } else if (resolvedPlanId === 'payg') {
      creditsToAdd = 250;
      planName = 'Pay As You Go (250 Credits)';
      userTier = 'PayAsYouGo';
    } else if (numAmount >= 500) {
      creditsToAdd = 600;
      planName = 'Pro Subscription (600 Credits / mo)';
      userTier = 'Pro';
      resolvedPlanId = 'pro';
    } else if (numAmount > 0) {
      creditsToAdd = numAmount;
      planName = `Pay As You Go (${numAmount} Credits)`;
      userTier = 'PayAsYouGo';
      resolvedPlanId = 'payg';
    }

    try {
      // 3. Update user_credits balance
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

      // 4. Record payment transaction (status: 'paid')
      await adminClient
        .from('payment_transactions')
        .insert({
          user_id: userId,
          razorpay_order_id: razorpayOrderId || null,
          razorpay_payment_id: razorpayPaymentId,
          plan_id: resolvedPlanId,
          amount: numAmount || (resolvedPlanId === 'pro' ? 599 : 250),
          currency: 'INR',
          credits_added: creditsToAdd,
          status: 'paid',
          created_at: new Date().toISOString()
        });

      // 5. Upsert active subscription record
      await adminClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: resolvedPlanId,
          plan_name: planName,
          status: 'active',
          amount: numAmount || (resolvedPlanId === 'pro' ? 599 : 250),
          currency: 'INR',
          credits_allocated: creditsToAdd,
          razorpay_order_id: razorpayOrderId || null,
          razorpay_payment_id: razorpayPaymentId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // 6. Update profile tier
      await adminClient
        .from('profiles')
        .update({
          tier: userTier
        })
        .eq('id', userId);

      return { credited: true, creditsAdded: creditsToAdd, planName, userTier };
    } catch (dbErr) {
      console.error('[fulfillSuccessfulPayment] Error writing subscription/credits to Supabase:', dbErr);
      return { credited: false, error: dbErr, creditsAdded: creditsToAdd };
    }
  };

  app.post(['/api/razorpay/verify', '/api/verify-payment', '/razorpay/verify', '/verify-payment'], requireAuth, asyncHandler(async (req: any, res: any) => {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId,
      planId,
      amount
    } = req.body || {};
    const effectiveUserId = req.user?.id || userId || '';

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification fields.', message: 'Missing required payment verification fields.' });
    }

    const keySecret = cleanEnvKey(process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET);
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

    const numAmount = Number(amount) || 0;
    const fulfillment = await fulfillSuccessfulPayment({
      userId: effectiveUserId,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      amountInRupees: numAmount,
      planId: planId
    });

    return res.json({ 
      success: true, 
      status: 'ok', 
      verified: true, 
      creditsAdded: fulfillment.creditsAdded || 0,
      alreadyProcessed: (fulfillment as any).alreadyProcessed || false
    });
  }));

  app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const secret = cleanEnvKey(process.env.RAZORPAY_WEBHOOK_SECRET);
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
        const payment = event.payload?.payment?.entity;
        if (payment) {
          const userId = payment.notes?.userId || payment.notes?.user_id;
          const planId = payment.notes?.planId || payment.notes?.plan_id;
          const amountInRupees = (payment.amount || 0) / 100; // Razorpay payload amount is in paise
          const razorpayPaymentId = payment.id;
          const razorpayOrderId = payment.order_id;

          if (userId && userId !== 'guest') {
            console.log(`Payment captured via webhook for user: ${userId}, payment: ${razorpayPaymentId}, amount: ₹${amountInRupees}`);
            await fulfillSuccessfulPayment({
              userId,
              razorpayPaymentId,
              razorpayOrderId,
              amountInRupees,
              planId
            });
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
    if (proBgUrl) {
        const headers: Record<string, string> = { ...formData.getHeaders() };
        if (apiKey) {
          headers['X-Internal-Key'] = apiKey;
        }
        response = await axios.post(`${proBgUrl}/remove-background`, formData, {
          headers,
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
        if (PRO_SERVICE_URL) {
            const formData = new FormData();
            formData.append('file', file.buffer, { filename: file.originalname || 'image.png', contentType: file.mimetype });
            const headers: Record<string, string> = { ...formData.getHeaders() };
            if (INTERNAL_API_KEY) {
                headers['X-Internal-Key'] = INTERNAL_API_KEY;
            }
            response = await axios.post(`${PRO_SERVICE_URL}/remove-background`, formData, {
                headers,
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
        
        const upstreamContentType = String(response.headers['content-type'] || response.headers['Content-Type'] || '');
        if (upstreamContentType && !upstreamContentType.startsWith('image/')) {
            let errorText = 'Service returned an invalid non-image response.';
            try {
                const rawText = Buffer.from(response.data).toString('utf-8');
                const json = JSON.parse(rawText);
                errorText = json.error || json.message || json.detail || rawText.substring(0, 300);
            } catch {
                const rawText = Buffer.from(response.data).toString('utf-8');
                if (rawText) errorText = rawText.substring(0, 300);
            }
            throw new AppError(errorText, 500, errorText);
        }
        
        res.set('Content-Type', upstreamContentType || 'image/png');
        res.set('Cache-Control', 'no-store');
        res.send(Buffer.from(response.data, 'binary'));
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        console.error("Pro bg-remover upstream error:", error.response?.status, error.message);
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
             throw new AppError("Image processing took too long. Please try again.", 504, "Image processing took too long. Please try again.");
        }
        
        let upstreamDetail = "";
        if (error.response?.data) {
            try {
                const text = Buffer.isBuffer(error.response.data) 
                  ? error.response.data.toString('utf-8')
                  : typeof error.response.data === 'string'
                  ? error.response.data
                  : JSON.stringify(error.response.data);
                const parsed = JSON.parse(text);
                upstreamDetail = parsed.error || parsed.message || parsed.detail || text;
            } catch {
                upstreamDetail = typeof error.response.data === 'string'
                  ? error.response.data
                  : Buffer.isBuffer(error.response.data)
                  ? error.response.data.toString('utf-8')
                  : '';
            }
        }

        const status = error.response?.status;
        if (status === 401) {
            throw new AppError(upstreamDetail || "Unable to authenticate with the image processing service.", 401, upstreamDetail || "Unable to authenticate with the image processing service.");
        } else if (status === 400) {
            throw new AppError(upstreamDetail || "Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.", 400, upstreamDetail || "Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.");
        } else if (status === 413) {
            throw new AppError("Image is too large. Please upload an image under 15 MB.", 413, "Image is too large. Please upload an image under 15 MB.");
        }
        
        throw new AppError(upstreamDetail || "Something went wrong while processing your image. Please try again.", status || 500, upstreamDetail || "Something went wrong while processing your image. Please try again.");
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
      const httpServer = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });

      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: { server: httpServer }
          },
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
        app.use(express.static(distPath, {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            } else if (filePath.includes('/assets/')) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          }
        }));
        app.get('*all', (req, res) => {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    };
    
    setupViteAndStart();


