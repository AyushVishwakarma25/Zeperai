/**
 * Centralized, Dynamic Indian GST Tax Calculation Engine (SAC 998313)
 * 
 * Compliant with Indian Goods and Services Tax (GST) Act:
 * - Dynamic 18% GST (or custom configurable rate)
 * - Exact 2-decimal currency rounding with epsilon protection
 * - Dynamic Place of Supply (POS) resolution via 2-digit GSTIN state codes or state name normalization
 * - Intra-State (CGST 50% + SGST 50%) vs Inter-State (IGST 100%) breakdown
 * - Dynamic conversion between Base (Tax-Exclusive) and Gross (Tax-Inclusive) values
 */

export const DEFAULT_GST_RATE_PERCENT = 18;
export const DEFAULT_SAC_CODE = '998313'; // Information Technology Software / SaaS Services
export const DEFAULT_SUPPLIER_STATE = 'Maharashtra';
export const DEFAULT_SUPPLIER_STATE_CODE = '27';
export const DEFAULT_SUPPLIER_GSTIN = '27AAACZ1234F1Z9';

/**
 * Standard Indian GST 2-digit State Code mapping
 */
export const GST_STATE_CODE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
};

/**
 * Financial rounding helper: rounds to 2 decimal places with Number.EPSILON protection
 * against IEEE-754 floating point imprecision.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Convert Rupees to integer Paise (e.g. 1178.82 INR -> 117882 paise)
 */
export function toPaise(rupees: number): number {
  return Math.round(roundCurrency(rupees) * 100);
}

/**
 * Convert Paise to Rupees (e.g. 117882 paise -> 1178.82 INR)
 */
export function toRupees(paise: number): number {
  return roundCurrency(paise / 100);
}

/**
 * Extract 2-digit GST state code from a 15-character Indian GSTIN
 */
export function extractStateCodeFromGstin(gstin?: string): string | null {
  if (!gstin) return null;
  const clean = gstin.trim().toUpperCase();
  if (clean.length >= 2 && /^\d{2}/.test(clean)) {
    return clean.substring(0, 2);
  }
  return null;
}

/**
 * Determine if supply is Intra-State (within same state) or Inter-State under the IGST Act
 */
export function isPlaceOfSupplyIntraState(options: {
  customerState?: string;
  customerGstin?: string;
  supplierState?: string;
  supplierGstin?: string;
}): boolean {
  const supplierGstinCode = extractStateCodeFromGstin(options.supplierGstin || DEFAULT_SUPPLIER_GSTIN) || DEFAULT_SUPPLIER_STATE_CODE;
  const customerGstinCode = extractStateCodeFromGstin(options.customerGstin);

  // 1. If customer provided a GSTIN, state code from GSTIN is legally authoritative
  if (customerGstinCode) {
    return customerGstinCode === supplierGstinCode;
  }

  // 2. Fall back to state name normalization
  const normCustomer = (options.customerState || '').toLowerCase().trim();
  const normSupplier = (options.supplierState || DEFAULT_SUPPLIER_STATE).toLowerCase().trim();

  if (!normCustomer) {
    // Default to intra-state if no customer location info
    return true;
  }

  // Check state code map if name matches
  const supplierStateName = GST_STATE_CODE_MAP[supplierGstinCode]?.toLowerCase() || normSupplier;
  if (normCustomer.includes(supplierStateName) || supplierStateName.includes(normCustomer)) {
    return true;
  }

  // Maharashtra aliases check
  if (supplierGstinCode === '27' || normSupplier.includes('maharashtra')) {
    if (normCustomer.includes('maharashtra') || normCustomer.includes('mumbai') || normCustomer.includes('pune') || normCustomer === 'mh') {
      return true;
    }
  }

  return false;
}

export interface TaxBreakdown {
  taxableAmount: number;    // Net amount in INR (e.g. 999.00)
  totalGst: number;         // 18% GST in INR (e.g. 179.82)
  totalAmount: number;      // Gross amount in INR (e.g. 1178.82)
  gstRatePercent: number;   // 18
  sacCode: string;          // 998313
  isIntraState: boolean;    // true if supply is intra-state
  cgst: number;             // 9% if intra-state, 0 otherwise
  sgst: number;             // 9% if intra-state, 0 otherwise
  igst: number;             // 18% if inter-state, 0 otherwise
  amountPaise: number;      // Total in paise for Razorpay order (e.g. 117882)
  taxablePaise: number;     // Taxable amount in paise (e.g. 99900)
  gstPaise: number;         // GST in paise (e.g. 17982)
  placeOfSupply: string;    // Human readable Place of Supply description
}

/**
 * Calculates tax breakdown from base (tax-exclusive) amount
 * Example: base 999 -> taxable: 999.00, GST: 179.82, total: 1178.82
 */
export function calculateTaxExclusive(
  baseAmount: number,
  options?: {
    gstRatePercent?: number;
    isIntraState?: boolean;
    customerState?: string;
  }
): TaxBreakdown {
  const rate = options?.gstRatePercent ?? DEFAULT_GST_RATE_PERCENT;
  const isIntra = options?.isIntraState ?? true;
  const stateDesc = options?.customerState || DEFAULT_SUPPLIER_STATE;

  const taxableAmount = roundCurrency(Math.max(0, baseAmount));
  const totalGst = roundCurrency(taxableAmount * (rate / 100));
  const totalAmount = roundCurrency(taxableAmount + totalGst);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntra) {
    cgst = roundCurrency(totalGst / 2);
    sgst = roundCurrency(totalGst - cgst);
  } else {
    igst = totalGst;
  }

  return {
    taxableAmount,
    totalGst,
    totalAmount,
    gstRatePercent: rate,
    sacCode: DEFAULT_SAC_CODE,
    isIntraState: isIntra,
    cgst,
    sgst,
    igst,
    amountPaise: toPaise(totalAmount),
    taxablePaise: toPaise(taxableAmount),
    gstPaise: toPaise(totalGst),
    placeOfSupply: `${stateDesc} (${isIntra ? 'Intra-State: CGST+SGST' : 'Inter-State: IGST'})`
  };
}

/**
 * Calculates tax breakdown from gross (tax-inclusive) total amount
 * Example: total 1178.82 -> taxable: 999.00, GST: 179.82, total: 1178.82
 */
export function calculateTaxInclusive(
  grossAmount: number,
  options?: {
    gstRatePercent?: number;
    isIntraState?: boolean;
    customerState?: string;
  }
): TaxBreakdown {
  const rate = options?.gstRatePercent ?? DEFAULT_GST_RATE_PERCENT;
  const isIntra = options?.isIntraState ?? true;
  const stateDesc = options?.customerState || DEFAULT_SUPPLIER_STATE;

  const totalAmount = roundCurrency(Math.max(0, grossAmount));
  const taxableAmount = roundCurrency(totalAmount / (1 + rate / 100));
  const totalGst = roundCurrency(totalAmount - taxableAmount);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntra) {
    cgst = roundCurrency(totalGst / 2);
    sgst = roundCurrency(totalGst - cgst);
  } else {
    igst = totalGst;
  }

  return {
    taxableAmount,
    totalGst,
    totalAmount,
    gstRatePercent: rate,
    sacCode: DEFAULT_SAC_CODE,
    isIntraState: isIntra,
    cgst,
    sgst,
    igst,
    amountPaise: toPaise(totalAmount),
    taxablePaise: toPaise(taxableAmount),
    gstPaise: toPaise(totalGst),
    placeOfSupply: `${stateDesc} (${isIntra ? 'Intra-State: CGST+SGST' : 'Inter-State: IGST'})`
  };
}

/**
 * Dynamically resolves tax breakdown without any hardcoded arrays.
 * Handles:
 * - base price inputs (computes 18% GST and gross total)
 * - gross total inputs (extracts taxable base and tax)
 * - explicit isTaxInclusive flags
 * - customer and supplier Place of Supply matching
 */
export function resolveTaxBreakdown(params: {
  amount: number;
  isTaxInclusive?: boolean;
  planBasePrice?: number;
  gstRatePercent?: number;
  customerState?: string;
  customerGstin?: string;
  supplierState?: string;
  supplierGstin?: string;
}): TaxBreakdown {
  const rate = params.gstRatePercent ?? DEFAULT_GST_RATE_PERCENT;
  const isIntra = isPlaceOfSupplyIntraState({
    customerState: params.customerState,
    customerGstin: params.customerGstin,
    supplierState: params.supplierState,
    supplierGstin: params.supplierGstin
  });

  const rawAmount = roundCurrency(Number(params.amount) || 0);
  const planBase = params.planBasePrice != null ? roundCurrency(Number(params.planBasePrice)) : undefined;

  // Decision logic for inclusive vs exclusive:
  let isInclusive: boolean;

  if (params.isTaxInclusive !== undefined) {
    // 1. Explicit flag provided by caller
    isInclusive = Boolean(params.isTaxInclusive);
  } else if (planBase != null && planBase > 0) {
    // 2. We have a known catalog base price:
    const expectedGross = roundCurrency(planBase * (1 + rate / 100));
    // If input matches base price, it's tax-exclusive
    if (Math.abs(rawAmount - planBase) < 0.1) {
      isInclusive = false;
    } 
    // If input matches expected gross, it's tax-inclusive
    else if (Math.abs(rawAmount - expectedGross) < 0.1) {
      isInclusive = true;
    }
    // If input is greater than base price, it likely already includes tax
    else if (rawAmount > planBase) {
      isInclusive = true;
    } else {
      isInclusive = false;
    }
  } else {
    // 3. Fallback for SaaS order creation: amounts entered/sent for products are base prices
    isInclusive = false;
  }

  if (isInclusive) {
    return calculateTaxInclusive(rawAmount, {
      gstRatePercent: rate,
      isIntraState: isIntra,
      customerState: params.customerState
    });
  } else {
    return calculateTaxExclusive(rawAmount, {
      gstRatePercent: rate,
      isIntraState: isIntra,
      customerState: params.customerState
    });
  }
}
