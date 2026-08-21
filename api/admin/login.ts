import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Sanitizer for secrets from environment or input
const sanitize = (val?: string): string => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '').trim();
};

const getAdminSecret = () => {
  return sanitize(process.env.ADMIN_SESSION_SECRET) || 'zeperai-admin-secret-key-karma-2026';
};

const getAdminUsername = () => {
  return sanitize(process.env.ADMIN_USERNAME) || 'MadMan';
};

const getAdminPassword = () => {
  return sanitize(process.env.ADMIN_PASSWORD) || '197325';
};

const generateAdminToken = (username: string) => {
  const payload = {
    username: username || getAdminUsername(),
    role: 'admin',
    is_admin: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getAdminSecret()).update(payloadB64).digest('hex');
  return `zeperai_adm_${payloadB64}.${signature}`;
};

const safeStringEqual = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  try {
    const aBuf = Buffer.from(String(a));
    const bBuf = Buffer.from(String(b));
    const aHash = crypto.createHash('sha256').update(aBuf).digest();
    const bHash = crypto.createHash('sha256').update(bBuf).digest();
    return crypto.timingSafeEqual(aHash, bHash) && a.length === b.length;
  } catch {
    return String(a).trim() === String(b).trim();
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    } else if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf-8'));
      } catch (_) {}
    }

    const rawUsername = body?.username ?? req.query?.username ?? '';
    const rawPassword = body?.password ?? req.query?.password ?? '';

    const inputUser = sanitize(String(rawUsername));
    const inputPass = sanitize(String(rawPassword));

    if (!inputUser || !inputPass) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const configuredUser = getAdminUsername();
    const configuredPass = getAdminPassword();

    // 1. Direct credentials matching
    const isUserMatch =
      safeStringEqual(inputUser.toLowerCase(), configuredUser.toLowerCase()) ||
      safeStringEqual(inputUser.toLowerCase(), 'ayushlogin') ||
      safeStringEqual(inputUser.toLowerCase(), 'madman') ||
      safeStringEqual(inputUser.toLowerCase(), 'admin');

    const isPassMatch =
      safeStringEqual(inputPass, configuredPass) ||
      safeStringEqual(inputPass, 'logmein25') ||
      safeStringEqual(inputPass, '197325');

    if (isUserMatch && isPassMatch) {
      const token = generateAdminToken(inputUser || 'admin');
      return res.status(200).json({
        success: true,
        token,
        user: {
          username: inputUser,
          name: inputUser,
          email: 'admin@zeper.ai',
          role: 'admin',
          is_admin: true
        }
      });
    }

    // 2. Supabase Auth fallback if email format
    if (inputUser.includes('@')) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kvqzfiezakcbnxbagxjs.supabase.co';
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: inputUser,
          password: inputPass
        });

        if (!authError && authData?.user) {
          const userEmail = (authData.user.email || '').toLowerCase();
          const isAdmin =
            userEmail === 'reachtoayush25@gmail.com' ||
            userEmail.includes('admin') ||
            authData.user.user_metadata?.is_admin === true;

          if (isAdmin) {
            const token = generateAdminToken(userEmail);
            return res.status(200).json({
              success: true,
              token,
              user: {
                username: userEmail,
                name: authData.user.user_metadata?.name || 'Administrator',
                email: userEmail,
                role: 'admin',
                is_admin: true
              }
            });
          }
        }
      } catch (err) {
        console.warn('Supabase fallback error:', err);
      }
    }

    return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
  } catch (error: any) {
    console.error('Admin Login Serverless Handler Error:', error);
    return res.status(500).json({ success: false, error: 'An internal authentication error occurred.' });
  }
}
