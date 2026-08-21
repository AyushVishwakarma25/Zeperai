import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Sanitizer for secrets from environment or input
const sanitize = (val?: string): string => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '').trim();
};

const getAdminSecret = () => sanitize(process.env.ADMIN_SESSION_SECRET);
const getAdminUsername = () => sanitize(process.env.ADMIN_USERNAME);
const getAdminPassword = () => sanitize(process.env.ADMIN_PASSWORD);

const generateAdminToken = (username: string) => {
  const payload = {
    username,
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
  res.setHeader('Access-Control-Allow-Origin', 'https://www.zeperai.in');
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

  // Fail closed: refuse all logins if admin credentials aren't configured,
  // instead of silently falling back to a hardcoded default.
  const configuredUser = getAdminUsername();
  const configuredPass = getAdminPassword();
  const configuredSecret = getAdminSecret();
  if (!configuredUser || !configuredPass || !configuredSecret) {
    console.error('[api/admin/login] ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not fully configured.');
    return res.status(500).json({ success: false, error: 'Admin login is not configured. Contact the site owner.' });
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

    const isValid = safeStringEqual(inputUser, configuredUser) && safeStringEqual(inputPass, configuredPass);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
    }

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
  } catch (error: any) {
    console.error('Admin Login Serverless Handler Error:', error);
    return res.status(500).json({ success: false, error: 'An internal authentication error occurred.' });
  }
}
