import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveTaxBreakdown, isPlaceOfSupplyIntraState, DEFAULT_GST_RATE_PERCENT, DEFAULT_SAC_CODE, DEFAULT_SUPPLIER_STATE, DEFAULT_SUPPLIER_GSTIN } from '../../utils/taxCalculator.js';
import { findPlanById } from '../../config/pricingCatalog.js';

const DEFAULT_SUPABASE_URL = 'https://kvqzfiezakcbnxbagxjs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6JMJwxQ-176l71T_ULVl2A_82Z0u_rb';
const SUPPLIER_GSTIN = process.env.COMPANY_GSTIN || DEFAULT_SUPPLIER_GSTIN;
const SUPPLIER_NAME = 'ZeperAI Studio Pvt Ltd';
const SUPPLIER_STATE = process.env.COMPANY_STATE || DEFAULT_SUPPLIER_STATE;
const SAC_CODE = DEFAULT_SAC_CODE;

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
    const isIntraState = isPlaceOfSupplyIntraState({
      customerState,
      customerGstin,
      supplierGstin: SUPPLIER_GSTIN
    });

    const invoices = transactions.map((tx) => {
      const totalAmount = Number(tx.amount) || 0;

      const taxBreakdown = resolveTaxBreakdown({
        amount: totalAmount,
        isTaxInclusive: true,
        planBasePrice: tx.taxable_amount ? Number(tx.taxable_amount) : undefined,
        customerState,
        customerGstin,
        supplierGstin: SUPPLIER_GSTIN
      });

      const taxableValue = tx.taxable_amount != null && Number(tx.taxable_amount) > 0
        ? Number(tx.taxable_amount)
        : taxBreakdown.taxableAmount;
      const totalGst = tx.tax_amount != null && Number(tx.tax_amount) > 0
        ? Number(tx.tax_amount)
        : taxBreakdown.totalGst;

      const cgst = isIntraState ? taxBreakdown.cgst : 0;
      const sgst = isIntraState ? taxBreakdown.sgst : 0;
      const igst = !isIntraState ? totalGst : 0;

      const createdDate = new Date(tx.created_at || Date.now());
      const formattedDate = createdDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Format clean sequential invoice number
      const invoiceNumber = tx.invoice_number || tx.razorpay_invoice_id || `ZPR-${createdDate.getFullYear()}-${String(tx.id || '').substring(0, 8).toUpperCase()}`;

      // Resolve human-readable plan description dynamically from catalog
      const matchedPlan = findPlanById(tx.plan_id);
      const description = matchedPlan 
        ? `${matchedPlan.name} (${matchedPlan.credits} Credits${matchedPlan.period === 'month' ? '/mo' : ''})`
        : 'AI Credits Pack';

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
        gstRate: taxBreakdown.gstRatePercent,
        sacCode: SAC_CODE,
        placeOfSupply: taxBreakdown.placeOfSupply,
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
