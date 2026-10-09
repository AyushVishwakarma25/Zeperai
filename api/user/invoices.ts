import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_SUPABASE_URL = 'https://kvqzfiezakcbnxbagxjs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';
const SUPPLIER_GSTIN = process.env.COMPANY_GSTIN || '27AAACZ1234F1Z9';
const SUPPLIER_NAME = 'ZeperAI Studio Pvt Ltd';
const SUPPLIER_STATE = 'Maharashtra';
const SUPPLIER_STATE_CODE = '27';
const SAC_CODE = '998313'; // Information technology software consulting and support services

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Fetch user profile for billing & GSTIN details
    let profile: any = null;
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      profile = pData;
    } catch (e) {
      // Continue with auth user data
    }

    const customerName = profile?.company_name || profile?.name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Valued Customer');
    const customerGstin = profile?.gstin || '';
    const customerState = (profile?.billing_state || profile?.location || 'Maharashtra').trim();
    const customerAddress = profile?.billing_address || profile?.location || 'India';
    const customerPincode = profile?.billing_pincode || '';

    // Fetch transactions from payment_transactions
    let transactions: any[] = [];
    try {
      const { data: txData, error: txError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!txError && txData) {
        transactions = txData;
      }
    } catch (txFetchErr) {
      console.warn('Could not query payment_transactions:', txFetchErr);
    }

    // Determine Place of Supply (POS)
    const isIntraState = customerState.toLowerCase().includes('maharashtra') || customerState.toLowerCase().includes('mumbai');

    const invoices = transactions.map((tx) => {
      const totalAmount = Number(tx.amount) || 0;
      // GST is 18% inclusive in SaaS pricing (Taxable Value = Total / 1.18)
      const taxableValue = Math.round((totalAmount / 1.18) * 100) / 100;
      const totalGst = Math.round((totalAmount - taxableValue) * 100) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isIntraState) {
        cgst = Math.round((totalGst / 2) * 100) / 100;
        sgst = Math.round((totalGst - cgst) * 100) / 100;
      } else {
        igst = totalGst;
      }

      const createdDate = new Date(tx.created_at || Date.now());
      const formattedDate = createdDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Format clean sequential invoice number
      const invoiceNumber = tx.invoice_number || tx.razorpay_invoice_id || `ZPR-${createdDate.getFullYear()}-${String(tx.id || '').substring(0, 8).toUpperCase()}`;

      // Resolve human-readable plan description
      let description = 'AI Credits Pack';
      if (tx.plan_id === 'agency') {
        description = 'Agency Plan - 1,000 Credits/mo';
      } else if (tx.plan_id === 'pro') {
        description = 'Pro Subscription - 300 Credits/mo';
      } else if (tx.plan_id === 'payg' || tx.plan_id === 'pay-as-you-go') {
        description = 'Pay As You Go - 120 Credits Pack';
      } else if (tx.plan_id === 'local-seo-10' || tx.plan_id === 'localseo10') {
        description = 'Local SEO Audit Pack (10 Reports)';
      }

      return {
        id: tx.id,
        invoiceNumber,
        date: formattedDate,
        rawDate: tx.created_at,
        description,
        planId: tx.plan_id,
        amount: totalAmount,
        taxableValue,
        cgst,
        sgst,
        igst,
        totalGst,
        gstRate: 18,
        sacCode: SAC_CODE,
        placeOfSupply: `${customerState} (${isIntraState ? 'Intra-State: CGST+SGST' : 'Inter-State: IGST'})`,
        supplierGstin: SUPPLIER_GSTIN,
        supplierName: SUPPLIER_NAME,
        supplierState: SUPPLIER_STATE,
        customerGstin,
        customerName,
        customerAddress,
        customerState,
        customerPincode,
        status: tx.status === 'paid' ? 'Paid' : 'Pending',
        invoiceUrl: tx.invoice_url || null, // Official hosted Razorpay invoice link
        paymentId: tx.razorpay_payment_id || null,
        orderId: tx.razorpay_order_id || null
      };
    });

    return res.status(200).json({
      success: true,
      invoices,
      customer: {
        name: customerName,
        email: user.email,
        companyName: profile?.company_name || '',
        billingAddress: customerAddress,
        billingState: customerState,
        billingPincode: customerPincode,
        gstin: customerGstin
      }
    });
  } catch (err: any) {
    console.error('Serverless user/invoices error:', err);
    return res.status(500).json({ error: 'Failed to retrieve tax invoices.' });
  }
}
