import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Sanitizer for secrets from environment or input
const sanitize = (val?: string): string => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '').trim();
};

const getAdminSecret = (): string => {
  return sanitize(process.env.ADMIN_SESSION_SECRET);
};

const getAdminUsername = (): string => {
  return sanitize(process.env.ADMIN_USERNAME);
};

const getAdminPassword = (): string => {
  return sanitize(process.env.ADMIN_PASSWORD);
};

const getAdminAllowedEmails = (): string[] => {
  const raw = sanitize(process.env.ADMIN_ALLOWED_EMAILS);
  if (!raw) return [];
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
};

const generateAdminToken = (username: string): string | null => {
  const secret = getAdminSecret();
  if (!secret) return null;
  const payload = {
    username: username || getAdminUsername() || 'admin',
    role: 'admin',
    is_admin: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `zeperai_adm_${payloadB64}.${signature}`;
};

const safeStringEqual = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  try {
    const aBuf = Buffer.from(String(a));
    const bBuf = Buffer.from(String(b));
    if (aBuf.length !== bBuf.length) {
      const aHash = crypto.createHash('sha256').update(aBuf).digest();
      const bHash = crypto.createHash('sha256').update(bBuf).digest();
      crypto.timingSafeEqual(aHash, bHash);
      return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
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
    const configuredSecret = getAdminSecret();

    // 1. Direct credentials matching strictly against configured environment variables (fail closed if not configured)
    if (configuredUser && configuredPass && configuredSecret) {
      const isUserMatch = safeStringEqual(inputUser, configuredUser);
      const isPassMatch = safeStringEqual(inputPass, configuredPass);

      if (isUserMatch && isPassMatch) {
        const token = generateAdminToken(inputUser);
        if (!token) {
          return res.status(500).json({ success: false, error: 'Admin session secret is not configured.' });
        }
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
    }

    // 2. Supabase Auth fallback if email format
    if (inputUser.includes('@')) {
      try {
        const supabaseUrl = sanitize(process.env.SUPABASE_URL) || sanitize(process.env.VITE_SUPABASE_URL) || 'https://kvqzfiezakcbnxbagxjs.supabase.co';
        const supabaseAnonKey = sanitize(process.env.SUPABASE_ANON_KEY) || sanitize(process.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: inputUser,
          password: inputPass
        });

        if (!authError && authData?.user) {
          const userEmail = (authData.user.email || '').toLowerCase().trim();
          const allowedEmails = getAdminAllowedEmails();
          const isAdmin =
            (allowedEmails.length > 0 && allowedEmails.includes(userEmail)) ||
            authData.user.user_metadata?.is_admin === true;

          if (isAdmin) {
            const token = generateAdminToken(userEmail);
            if (!token) {
              return res.status(500).json({ success: false, error: 'Admin session secret is not configured.' });
            }
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
