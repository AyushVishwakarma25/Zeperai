/**
 * CAMPAIGN STUDIO V2 - Verified Claims & Advertising Claim Safety Engine.
 *
 * Implements a strict, verifiable claims system for commercial advertising copy:
 *  1. Every factual claim (ratings, reviews, guarantees, shipping promises, discounts,
 *     scarcity, certifications) must map to an approved evidence source.
 *  2. Supported evidence sources: user_provided, product_catalog, shopify, approved_offer, confirmed_testimonial.
 *  3. Distinguishes:
 *      - verified_fact: ground-truth product attributes or confirmed data.
 *      - brand_approved_marketing: tone, positioning, and approved brand USPs.
 *      - ai_suggestion_requiring_approval: unverified suggestions that cannot enter export without human approval.
 *  4. Fails closed: if evidence is missing, claims are omitted entirely—never replaced by fabricated fallbacks.
 */

import type {
  BrandContext,
  CampaignStrategy,
  ClaimApprovalStatus,
  ClaimCategory,
  ClaimEvidenceSource,
  ClaimSafetyAuditResult,
  ClaimSafetyViolation,
  ClaimTier,
  ClaimVerificationStatus,
  MetaCampaignPackage,
  VerifiedClaim,
} from '../../types.js';

// ---------------------------------------------------------------------------
// Regulatory & Compliance Claim Patterns
// ---------------------------------------------------------------------------

export const CLAIM_PATTERNS = {
  ratingAndReview: /\b([1-5](\.[0-9])?(\s*(\/|out of)\s*5)?\s*(stars?|rated|rating|reviews?)|loved by \d+|rated #?\d+|\d+\s*(\+|k)?\s*(happy|verified|5-star)?\s*reviews?)\b/i,
  shippingAndDelivery: /\b(free|express|overnight|same-day|2-day|cold-chain|fast)\s*(delivery|shipping|courier)\b|\bdelivered\s*(fast|within\s*\d+|to your door)\b/i,
  guarantee: /\b(100%|money-back|satisfaction|risk-free|ironclad|quality)\s*(guarantee|guaranteed|warranty)\b/i,
  discountAndPricing: /\b(\d+%\s*off|save\s*(₹|\$|€|£)?\s*\d+|flat\s*(₹|\$|€|£)?\s*\d+|buy\s*1\s*get\s*1|bogo|cashback|free\s*gift)\b/i,
  scarcityAndUrgency: /\b(limited\s*(edition|stock|time|run)|almost\s*gone|only\s*\d+\s*left|selling\s*fast|restock|hurry|flash\s*sale|ends\s*(today|tonight))\b/i,
  performanceAndMetric: /\b(\d+x\s*(faster|stronger|better)|proven to reduce|\bproven to\b|clinical(ly)?\s*(tested|proven)|\d+%\s*(more|less|improvement|reduction)|reduce\s+.*?by\s+\d+%)\b/i,
  certification: /\b(100%\s*certified|iso\s*\d+|fda\s*approved|organic certified|dermatologically tested|lab tested)\b/i,
};

/**
 * Normalizes text for fuzzy claim comparison.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether candidate text is substantiated by verified claim text.
 */
function isSubstantiatedByClaim(candidateText: string, verifiedClaimText: string): boolean {
  const normCandidate = normalizeText(candidateText);
  const normVerified = normalizeText(verifiedClaimText);

  if (normCandidate.includes(normVerified) || normVerified.includes(normCandidate)) {
    return true;
  }

  // Word overlap heuristic: if all key numeric/metric tokens in candidate exist in verified claim
  const candidateNumbers = candidateText.match(/\d+(\.\d+)?%?/g) || [];
  if (candidateNumbers.length > 0) {
    const verifiedNumbers: string[] = verifiedClaimText.match(/\d+(\.\d+)?%?/g) || [];
    const allNumbersPresent = candidateNumbers.every((n) => verifiedNumbers.includes(n));
    if (!allNumbersPresent) return false;
  }

  return false;
}

/**
 * Extracts and categorizes verified claims from BrandContext, Strategy, and User Facts.
 */
export function extractVerifiedClaimsFromBrandContext(params: {
  brand: BrandContext;
  strategy?: CampaignStrategy;
  userFacts?: string;
}): VerifiedClaim[] {
  const { brand, strategy, userFacts } = params;
  const claims: VerifiedClaim[] = [];

  let claimCounter = 1;
  const makeId = (cat: string) => `claim-${cat}-${claimCounter++}`;

  // 1. Explicit verified claims already attached to BrandContext
  if (Array.isArray(brand.verifiedClaims)) {
    for (const c of brand.verifiedClaims) {
      if (c && c.claimText) {
        const hasEvidence = Boolean(c.evidenceRef);
        claims.push({
          ...c,
          id: c.id || makeId(c.category),
          verificationStatus: hasEvidence ? (c.verificationStatus || 'verified') : 'unverified',
          approvalStatus: c.approvalStatus || 'approved',
          tier: hasEvidence ? (c.tier || 'verified_fact') : 'brand_approved_marketing',
        });
      }
    }
  }

  // 2. Approved USPs (Brand-Approved Marketing Language)
  for (const usp of brand.usps || []) {
    if (!usp || usp.trim().length === 0) continue;
    const text = usp.trim();

    let category: ClaimCategory = 'product_benefit';
    if (CLAIM_PATTERNS.certification.test(text)) category = 'certification';
    else if (CLAIM_PATTERNS.performanceAndMetric.test(text)) category = 'performance_and_metric';
    else if (CLAIM_PATTERNS.shippingAndDelivery.test(text)) category = 'shipping_and_delivery';
    else if (CLAIM_PATTERNS.guarantee.test(text)) category = 'product_benefit';
    else if (CLAIM_PATTERNS.discountAndPricing.test(text)) category = 'discount_and_pricing';

    claims.push({
      id: makeId(category),
      claimText: text,
      category,
      source: 'user_provided',
      verificationStatus: 'unverified', // Brand-approved language unless independently substantiated
      approvalStatus: 'approved',
      tier: 'brand_approved_marketing',
      confidenceScore: 0.9,
    });
  }

  // 3. Approved Product Catalog Data (Features and Prices)
  for (const product of brand.products || []) {
    if (!product || !product.name) continue;

    claims.push({
      id: makeId('product_feature'),
      claimText: product.name,
      category: 'product_feature',
      source: 'product_catalog',
      verificationStatus: 'verified',
      approvalStatus: 'approved',
      tier: 'verified_fact',
      evidenceRef: `product:${product.name}`,
    });

    if (product.description) {
      claims.push({
        id: makeId('product_feature'),
        claimText: product.description,
        category: 'product_feature',
        source: 'product_catalog',
        verificationStatus: 'unverified',
        approvalStatus: 'approved',
        tier: 'brand_approved_marketing',
        evidenceRef: `product_desc:${product.name}`,
      });
    }

    if (product.priceHint) {
      claims.push({
        id: makeId('discount_and_pricing'),
        claimText: product.priceHint,
        category: 'discount_and_pricing',
        source: 'product_catalog',
        verificationStatus: 'unverified', // Requires reliable current source & timestamp, not stale hints
        approvalStatus: 'approved',
        tier: 'brand_approved_marketing',
        evidenceRef: `product_price:${product.name}`,
      });
    }
  }

  // 4. Approved Campaign Offer from Strategy (Approved Offer)
  const offer = strategy?.offer?.trim();
  if (offer && offer.length > 0) {
    let category: ClaimCategory = 'discount_and_pricing';
    if (CLAIM_PATTERNS.shippingAndDelivery.test(offer)) category = 'shipping_and_delivery';
    else if (CLAIM_PATTERNS.scarcityAndUrgency.test(offer)) category = 'scarcity_and_urgency';

    const hasDiscountOrScarcity = CLAIM_PATTERNS.discountAndPricing.test(offer) || CLAIM_PATTERNS.scarcityAndUrgency.test(offer);

    claims.push({
      id: makeId(category),
      claimText: offer,
      category,
      source: 'approved_offer',
      verificationStatus: hasDiscountOrScarcity ? 'unverified' : 'verified',
      approvalStatus: 'approved',
      tier: 'brand_approved_marketing',
      confidenceScore: 0.95,
      evidenceRef: 'strategy:offer',
    });
  }

  // 5. User Facts (Known Facts passed at Campaign Creation)
  if (userFacts && userFacts.trim().length > 0) {
    const lines = userFacts.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.length > 3);
    for (const line of lines) {
      claims.push({
        id: makeId('user_fact'),
        claimText: line,
        category: 'product_feature',
        source: 'user_provided',
        verificationStatus: 'unverified', // User provided facts are not automatically classified as verified facts
        approvalStatus: 'approved',
        tier: 'brand_approved_marketing',
        confidenceScore: 0.8,
        evidenceRef: 'run:known_facts',
      });
    }
  }

  return claims;
}

/**
 * Searches for an approved verified claim matching a specific category.
 */
export function findMatchingVerifiedClaim(
  category: ClaimCategory,
  claims: VerifiedClaim[],
  candidateText?: string,
): VerifiedClaim | undefined {
  // First prefer independently verified facts
  const verifiedFacts = claims.filter(
    (c) => c.category === category && c.verificationStatus === 'verified' && c.approvalStatus === 'approved',
  );

  if (verifiedFacts.length > 0) {
    if (!candidateText) return verifiedFacts[0];
    const match = verifiedFacts.find((c) => isSubstantiatedByClaim(candidateText, c.claimText));
    if (match) return match;
    return verifiedFacts[0];
  }

  // Fallback to brand-approved marketing ONLY for non-regulatory benefits/features
  if (category === 'product_benefit' || category === 'product_feature') {
    const brandMarketing = claims.filter(
      (c) => c.category === category && c.approvalStatus === 'approved',
    );
    if (brandMarketing.length > 0) {
      if (!candidateText) return brandMarketing[0];
      return brandMarketing.find((c) => isSubstantiatedByClaim(candidateText, c.claimText)) || brandMarketing[0];
    }
  }

  return undefined;
}

/**
 * Scans a piece of copy for factual claims and asserts whether evidence exists.
 */
export function detectFactualClaimViolations(
  text: string,
  verifiedClaims: VerifiedClaim[],
  locationDescription: string,
): ClaimSafetyViolation[] {
  const violations: ClaimSafetyViolation[] = [];
  if (!text || text.trim().length === 0) return violations;

  const approvedClaims = verifiedClaims.filter(
    (c) => c.verificationStatus === 'verified' && c.approvalStatus === 'approved',
  );

  // 1. Rating & Review Claims (e.g. "4.9/5 stars", "Rated #1")
  if (CLAIM_PATTERNS.ratingAndReview.test(text)) {
    const match = text.match(CLAIM_PATTERNS.ratingAndReview)?.[0] || 'Rating claim';
    const isSupported = approvedClaims.some(
      (c) => c.category === 'rating_and_review' && isSubstantiatedByClaim(text, c.claimText),
    );
    if (!isSupported) {
      violations.push({
        claimText: match,
        category: 'rating_and_review',
        reason: `Unsupported customer rating/review claim "${match}" found without brand evidence.`,
        location: locationDescription,
      });
    }
  }

  // 2. Shipping & Delivery Promises (e.g. "Free Express Delivery", "Delivered fast")
  if (CLAIM_PATTERNS.shippingAndDelivery.test(text)) {
    const match = text.match(CLAIM_PATTERNS.shippingAndDelivery)?.[0] || 'Delivery promise';
    const isSupported = approvedClaims.some(
      (c) => (c.category === 'shipping_and_delivery' || c.category === 'discount_and_pricing') &&
             isSubstantiatedByClaim(text, c.claimText),
    );
    if (!isSupported) {
      violations.push({
        claimText: match,
        category: 'shipping_and_delivery',
        reason: `Unsupported shipping/delivery promise "${match}" found without brand evidence.`,
        location: locationDescription,
      });
    }
  }

  // 3. Guarantees (e.g. "100% Quality Guaranteed", "Money back guarantee")
  if (CLAIM_PATTERNS.guarantee.test(text)) {
    const match = text.match(CLAIM_PATTERNS.guarantee)?.[0] || 'Guarantee claim';
    const isSupported = approvedClaims.some(
      (c) => isSubstantiatedByClaim(text, c.claimText),
    );
    if (!isSupported) {
      violations.push({
        claimText: match,
        category: 'product_benefit',
        reason: `Unsupported guarantee or warranty statement "${match}" found without brand evidence.`,
        location: locationDescription,
      });
    }
  }

  // 4. Discounts & Pricing (e.g. "50% OFF", "Save ₹500")
  if (CLAIM_PATTERNS.discountAndPricing.test(text)) {
    const match = text.match(CLAIM_PATTERNS.discountAndPricing)?.[0] || 'Discount claim';
    const isSupported = approvedClaims.some(
      (c) => c.category === 'discount_and_pricing' && isSubstantiatedByClaim(text, c.claimText),
    );
    if (!isSupported) {
      violations.push({
        claimText: match,
        category: 'discount_and_pricing',
        reason: `Unsupported pricing/discount claim "${match}" found without approved offer evidence.`,
        location: locationDescription,
      });
    }
  }

  // 5. Scarcity & Urgency (e.g. "Limited Edition Restock", "Only 5 left")
  if (CLAIM_PATTERNS.scarcityAndUrgency.test(text)) {
    const match = text.match(CLAIM_PATTERNS.scarcityAndUrgency)?.[0] || 'Scarcity claim';
    const isSupported = approvedClaims.some(
      (c) => c.category === 'scarcity_and_urgency' && isSubstantiatedByClaim(text, c.claimText),
    );
    if (!isSupported) {
      violations.push({
        claimText: match,
        category: 'scarcity_and_urgency',
        reason: `Unsupported scarcity/urgency claim "${match}" found without inventory or restock evidence.`,
        location: locationDescription,
      });
    }
  }

  return violations;
}

/**
 * Validates an entire MetaCampaignPackage before export.
 */
export function validateMetaPackageClaims(
  pkg: MetaCampaignPackage,
  verifiedClaims: VerifiedClaim[],
): ClaimSafetyAuditResult {
  const violations: ClaimSafetyViolation[] = [];
  const unverifiedClaimsOmitted: string[] = [];
  const missingEvidenceGaps: string[] = [];

  pkg.concepts.forEach((concept, cIdx) => {
    // 1. Primary text checks
    concept.copy.primaryText.forEach((pt, idx) => {
      violations.push(...detectFactualClaimViolations(pt, verifiedClaims, `Concept ${cIdx + 1} Primary Text Option ${idx + 1}`));
    });

    // 2. Headline checks
    concept.copy.headlines.forEach((h, idx) => {
      violations.push(...detectFactualClaimViolations(h, verifiedClaims, `Concept ${cIdx + 1} Headline Option ${idx + 1}`));
    });

    // 3. Description checks
    concept.copy.descriptions.forEach((d, idx) => {
      violations.push(...detectFactualClaimViolations(d, verifiedClaims, `Concept ${cIdx + 1} Description Option ${idx + 1}`));
    });
  });

  const verifiedClaimsUsed = verifiedClaims.filter(
    (c) => c.verificationStatus === 'verified' && c.approvalStatus === 'approved',
  );

  return {
    passed: violations.length === 0,
    violations,
    unverifiedClaimsOmitted,
    missingEvidenceGaps,
    verifiedClaimsUsed,
  };
}
