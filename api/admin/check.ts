import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const sanitize = (val?: string): string => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '').trim();
};

const getAdminSecret = () => {
  return sanitize(process.env.ADMIN_SESSION_SECRET);
};

const verifyAdminToken = (token: string) => {
  const secret = getAdminSecret();
  if (!secret || !token || !token.startsWith('zeperai_adm_')) return null;
  try {
    const raw = token.replace('zeperai_adm_', '');
    const [payloadB64, signature] = raw.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ is_admin: false, error: 'No authorization header provided.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Verify dedicated admin token
  const adminPayload = verifyAdminToken(token);
  if (adminPayload) {
    return res.status(200).json({
      is_admin: true,
      user: {
        username: adminPayload.username,
        role: 'admin',
        is_admin: true
      }
    });
  }

  // 2. Verify Supabase JWT token
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kvqzfiezakcbnxbagxjs.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      const email = (data.user.email || '').toLowerCase();
      const allowedEmails = sanitize(process.env.ADMIN_ALLOWED_EMAILS)
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      const isAdmin =
        (allowedEmails.length > 0 && allowedEmails.includes(email)) ||
        data.user.user_metadata?.is_admin === true;

      if (isAdmin) {
        return res.status(200).json({
          is_admin: true,
          user: {
            username: email,
            email: email,
            role: 'admin',
            is_admin: true
          }
        });
      }
    }
  } catch (e) {
    console.error('Supabase check error:', e);
  }

  return res.status(401).json({ is_admin: false, error: 'Invalid or expired token.' });
}
