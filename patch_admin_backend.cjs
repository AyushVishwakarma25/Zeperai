const fs = require('fs');

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

const requireAdminCode = `
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Not authenticated.' });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    // If no service key in dev, we could log and fail, or allow if it's the specific test user.
    // For safety, let's fail unless they have the key.
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY for admin check");
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
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
`;

code = code.replace('// --- API ROUTES ---', requireAdminCode + '\n// --- API ROUTES ---');

const adminRoutesCode = `
  // --- ADMIN ROUTES ---
  app.get('/api/admin/check', requireAuth, requireAdmin, (req, res) => {
    res.json({ success: true, is_admin: true });
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);
    
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    const search = req.query.search || '';

    let query = adminClient.from('profiles').select('id, email, name, tier, banned_at, is_admin, created_at, user_credits(current_balance, total_quota)', { count: 'exact' });
    
    if (search) {
      query = query.ilike('email', \`%\${search}%\`);
    }
    
    const { data, error, count } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    if (error) throw new AppError(error.message, 500);
    
    const users = data.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tier: u.tier,
      banned_at: u.banned_at,
      is_admin: u.is_admin,
      created_at: u.created_at,
      current_balance: u.user_credits?.[0]?.current_balance || 0,
      total_quota: u.user_credits?.[0]?.total_quota || 0,
    }));
    
    res.json({ success: true, users, total: count });
  }));

  app.get('/api/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    const { data: profile, error: profileErr } = await adminClient.from('profiles').select('*, user_credits(*)').eq('id', targetUserId).single();
    if (profileErr || !profile) throw new AppError('User not found', 404);

    const { data: subs } = await adminClient.from('subscriptions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
    const { data: payments } = await adminClient.from('payment_transactions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(10);
    const { count: designsCount } = await adminClient.from('designs').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId);

    res.json({
      success: true,
      user: {
        ...profile,
        credits: profile.user_credits?.[0] || { current_balance: 0, total_quota: 0 },
        subscriptions: subs || [],
        payments: payments || [],
        designs_count: designsCount || 0
      }
    });
  }));

  app.post('/api/admin/users/:id/adjust-credits', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { amount, reason } = req.body;
    if (typeof amount !== 'number' || !reason) throw new AppError('Amount and reason are required', 400);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

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

    await adminClient.from('admin_actions').insert({
      admin_id: req.user.id,
      action: 'adjust_credits',
      target_user_id: targetUserId,
      details: { amount, reason, old_balance: currentBalance, new_balance: newBalance }
    });

    res.json({ success: true, new_balance: newBalance });
  }));

  app.post('/api/admin/users/:id/ban', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { reason } = req.body;
    if (!reason) throw new AppError('Reason is required', 400);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    const { error } = await adminClient.from('profiles').update({
      banned_at: new Date().toISOString(),
      banned_reason: reason
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    await adminClient.from('admin_actions').insert({
      admin_id: req.user.id,
      action: 'ban_user',
      target_user_id: targetUserId,
      details: { reason }
    });

    res.json({ success: true });
  }));

  app.post('/api/admin/users/:id/unban', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    const { error } = await adminClient.from('profiles').update({
      banned_at: null,
      banned_reason: null
    }).eq('id', targetUserId);
    if (error) throw new AppError(error.message, 500);

    await adminClient.from('admin_actions').insert({
      admin_id: req.user.id,
      action: 'unban_user',
      target_user_id: targetUserId,
      details: {}
    });

    res.json({ success: true });
  }));

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetUserId = req.params.id;
    const { confirmationEmail } = req.body;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    const { data: profile } = await adminClient.from('profiles').select('email').eq('id', targetUserId).single();
    if (!profile) throw new AppError('User not found', 404);
    
    if (profile.email !== confirmationEmail) {
      throw new AppError('Confirmation email does not match', 400);
    }

    // 1. Log to admin actions BEFORE deletion
    await adminClient.from('admin_actions').insert({
      admin_id: req.user.id,
      action: 'delete_user',
      target_user_id: targetUserId,
      details: { email: profile.email }
    });

    // 2. Delete files from storage
    try {
      // e.g. path format is users/{user_id}/...
      const { data: objects } = await adminClient.storage.from('designs').list(\`users/\${targetUserId}\`);
      if (objects && objects.length > 0) {
        const filesToRemove = objects.map(x => \`users/\${targetUserId}/\${x.name}\`);
        await adminClient.storage.from('designs').remove(filesToRemove);
      }
      
      const { data: thumbnails } = await adminClient.storage.from('designs').list(\`users/\${targetUserId}/thumbnails\`);
      if (thumbnails && thumbnails.length > 0) {
          const thumbsToRemove = thumbnails.map(x => \`users/\${targetUserId}/thumbnails/\${x.name}\`);
          await adminClient.storage.from('designs').remove(thumbsToRemove);
      }
      const { data: designFiles } = await adminClient.storage.from('designs').list(\`users/\${targetUserId}/designs\`);
      if (designFiles && designFiles.length > 0) {
          const designsToRemove = designFiles.map(x => \`users/\${targetUserId}/designs/\${x.name}\`);
          await adminClient.storage.from('designs').remove(designsToRemove);
      }
    } catch (storageErr) {
      console.warn('Failed to clean up storage for deleted user', storageErr);
    }

    // 3. Hard delete from Auth (cascades to profiles and related tables)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteErr) throw new AppError(deleteErr.message, 500);

    res.json({ success: true });
  }));

`;

code = code.replace("app.get(['/api/health', '/health'], (req, res) => {", adminRoutesCode + "\n  app.get(['/api/health', '/health'], (req, res) => {");

fs.writeFileSync(serverFile, code);
console.log('patched');
