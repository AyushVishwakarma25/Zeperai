const fs = require('fs');

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

const adminSubscriptionsCode = `
  // --- ADMIN SUBSCRIPTIONS ROUTES ---
  app.get('/api/admin/subscriptions', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);
    
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    const statusFilter = req.query.status || ''; // active, cancelled, expired, past_due

    let query = adminClient.from('subscriptions').select('*, profiles!inner(email, name)', { count: 'exact' });
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    const { data, error, count } = await query.range(offset, offset + limit - 1).order('current_period_end', { ascending: true });
    
    if (error) throw new AppError(error.message, 500);
    
    const subscriptions = data.map((s: any) => ({
      ...s,
      email: s.profiles?.email,
      name: s.profiles?.name,
    }));
    
    res.json({ success: true, subscriptions, total: count });
  }));

  app.get('/api/admin/subscriptions/:id', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    const targetSubId = req.params.id;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    const { data: sub, error: subErr } = await adminClient.from('subscriptions').select('*, profiles!inner(email, name)').eq('id', targetSubId).single();
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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

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
      } else {
         // Some versions of our DB might not have cancel_at_period_end column, but we added it via migration
         updatePayload.cancel_at_period_end = true;
         // Status remains active until webhook confirms end, or we manually set it to cancelled depending on standard practice
         // The prompt says: "update the local subscriptions row status to 'cancelled' (or leave 'active' with a cancel_at_period_end flag if immediate=false"
      }
      
      const { error: updateErr } = await adminClient.from('subscriptions').update(updatePayload).eq('id', targetSubId);
      if (updateErr) throw new AppError(\`Failed to update local DB: \${updateErr.message}\`, 500);
      
      // 4. Log to admin actions
      await adminClient.from('admin_actions').insert({
        admin_id: req.user.id,
        action: 'cancel_subscription',
        target_user_id: sub.user_id,
        details: { subscription_id: sub.id, razorpay_id: sub.razorpay_subscription_id, reason, immediate, cancel_response: rzpCancelResponse }
      });
      
      res.json({ success: true, message: immediate ? 'Subscription cancelled immediately.' : 'Subscription will be cancelled at end of billing cycle.' });
    } catch (rzpErr: any) {
      console.error("Razorpay Cancel Error:", JSON.stringify(rzpErr));
      throw new AppError(rzpErr.error?.description || rzpErr.message || "Failed to cancel subscription in Razorpay", 500);
    }
  }));

  app.get('/api/admin/subscriptions-reconcile', requireAuth, requireAdmin, asyncHandler(async (req: any, res: any) => {
    // Note: URL modified to subscriptions-reconcile to avoid conflict with /:id
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);
    
    // Get all subscriptions with a razorpay_id
    const { data: subs, error: subErr } = await adminClient.from('subscriptions').select('*').not('razorpay_subscription_id', 'is', null);
    if (subErr) throw new AppError(subErr.message, 500);
    
    const rzp = getRazorpay();
    const mismatches = [];
    
    for (const sub of subs) {
       try {
         const rzpSub = await rzp.subscriptions.fetch(sub.razorpay_subscription_id);
         let normalizedRzpStatus = rzpSub.status; // active, authenticated, pending, halted, cancelled, completed, expired
         
         // Mapping Razorpay status to our local status
         // if rzp is cancelled, but local is active -> mismatch
         // Note: We might be tracking 'active' locally when rzp is 'authenticated' as well
         let isMismatch = false;
         
         if ((normalizedRzpStatus === 'cancelled' || normalizedRzpStatus === 'completed' || normalizedRzpStatus === 'expired') && sub.status === 'active') {
             isMismatch = true;
         }
         if (normalizedRzpStatus === 'active' && sub.status === 'cancelled') {
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
`;

code = code.replace("app.get('/api/admin/check'", adminSubscriptionsCode + "\n  app.get('/api/admin/check'");

fs.writeFileSync(serverFile, code);
console.log('patched');
