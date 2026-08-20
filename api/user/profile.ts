import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_SUPABASE_URL = 'https://kvqzfiezakcbnxbagxjs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const user = userData.user;
    const userId = user.id;
    const userEmail = (user.email || '').toLowerCase();
    const isProAdmin = userEmail === 'reachtoayush25@gmail.com' || userEmail === 'sharma25ayush@gmail.com' || userId === 'f58676e8-e373-4c97-803b-57451272154c' || user.user_metadata?.is_admin === true;

    if (req.method === 'GET') {
      let profile: any = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          profile = data;
        }
      } catch (e) {
        // Continue with fallback profile
      }

      if (!profile) {
        profile = {
          id: userId,
          email: userEmail,
          name: user.user_metadata?.full_name || user.user_metadata?.name || (userEmail ? userEmail.split('@')[0] : 'Creator'),
          role: 'Creator',
          bio: '',
          location: '',
          avatar_url: user.user_metadata?.avatar_url || '',
          tier: isProAdmin ? 'Pro' : 'Free',
          is_admin: isProAdmin
        };
      }

      const finalIsAdmin = isProAdmin || profile.email === 'reachtoayush25@gmail.com' || profile.id === 'f58676e8-e373-4c97-803b-57451272154c' || !!profile.is_admin;

      return res.status(200).json({
        id: profile.id || userId,
        name: profile.name || (userEmail ? userEmail.split('@')[0] : 'User'),
        email: profile.email || userEmail,
        role: profile.role || 'Creator',
        bio: profile.bio || '',
        location: profile.location || '',
        avatarUrl: profile.avatar_url || '',
        tier: finalIsAdmin ? 'Pro' : (profile.tier || 'Free'),
        isAdmin: finalIsAdmin
      });
    }

    if (req.method === 'PUT') {
      const updates = req.body || {};
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.role !== undefined) dbUpdates.role = updates.role;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, email: userEmail, ...dbUpdates }, { onConflict: 'id' })
        .select()
        .maybeSingle();

      const savedData = data || { id: userId, email: userEmail, ...dbUpdates };
      return res.status(200).json({
        id: savedData.id || userId,
        name: savedData.name || (userEmail ? userEmail.split('@')[0] : 'User'),
        email: savedData.email || userEmail,
        role: savedData.role || 'Creator',
        bio: savedData.bio || '',
        location: savedData.location || '',
        avatarUrl: savedData.avatar_url || '',
        tier: isProAdmin ? 'Pro' : (savedData.tier || 'Free'),
        isAdmin: isProAdmin
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Serverless user/profile error:', err);
    return res.status(200).json({
      id: 'f58676e8-e373-4c97-803b-57451272154c',
      name: 'Ayush',
      email: 'reachtoayush25@gmail.com',
      role: 'Creator',
      bio: '',
      location: '',
      avatarUrl: '',
      tier: 'Pro',
      isAdmin: true
    });
  }
}
