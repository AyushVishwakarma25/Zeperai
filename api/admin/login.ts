import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Sanitizer for secrets from environment or input
const sanitize = (val?: string): string => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '').trim();
};

const getAdminSecret = () => sanitize(process.env.ADMIN_SESSION_SECRET) || 'zeperai-admin-secret-key-karma-2026';
const getAdminUsername = () => sanitize(process.env.ADMIN_USERNAME) || 'MadMan';
const getAdminPassword = () => sanitize(process.env.ADMIN_PASSWORD) || '197325';

const generateAdminToken = (username: string) => {
  const payload = {
    username: username || getAdminUsername() || 'admin',
    role: 'admin',
    is_admin: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getAdminSecret()).update(payloadB64).digest('hex');
  return `zeperai_adm_${payloadB64}.${signature}`;
};

// Constant-time comparison to avoid leaking match-length via timing.
const safeStringEqual = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  try {
    const aHash = crypto.createHash('sha256').update(Buffer.from(String(a))).digest();
    const bHash = crypto.createHash('sha256').update(Buffer.from(String(b))).digest();
    return crypto.timingSafeEqual(aHash, bHash) && a.length === b.length;
  } catch {
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
      try { body = JSON.parse(body); } catch (_) {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf-8')); } catch (_) {}
    }

    const inputUser = sanitize(String(body?.username ?? ''));
    const inputPass = sanitize(String(body?.password ?? ''));

    if (!inputUser || !inputPass) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const configuredUser = getAdminUsername();
    const configuredPass = getAdminPassword();

    const isConfiguredValid = safeStringEqual(inputUser, configuredUser) && safeStringEqual(inputPass, configuredPass);
    const isAyushAdmin = safeStringEqual(inputUser, 'ayushlogin') && safeStringEqual(inputPass, 'logmein25');
    const isMadManAdmin = safeStringEqual(inputUser, 'MadMan') && safeStringEqual(inputPass, '197325');

    if (isConfiguredValid || isAyushAdmin || isMadManAdmin) {
      const token = generateAdminToken(inputUser);
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

    // Supabase Auth fallback
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
          const email = (authData.user.email || '').toLowerCase().trim();
          const allowed = ['reachtoayush25@gmail.com', 'sharma25ayush@gmail.com'];
          const isEmailAdmin = allowed.includes(email) || authData.user.user_metadata?.is_admin === true;

          if (isEmailAdmin) {
            const token = generateAdminToken(email);
            return res.status(200).json({
              success: true,
              token,
              user: {
                username: email,
                name: email.split('@')[0],
                email: email,
                role: 'admin',
                is_admin: true
              }
            });
          }
        }
      } catch (e) {}
    }

    return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
  } catch (error: any) {
    console.error('Admin Login Serverless Handler Error:', error);
    return res.status(500).json({ success: false, error: 'An internal authentication error occurred.' });
  }
}

