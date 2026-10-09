/**
 * Centralized, Scalable Pricing Catalog for ZeperAI Studio
 * 
 * Defines plans, base prices (INR, excluding 18% GST), credit allocations, and tiers.
 * Allows adding new plans or updating existing plans without changing calculation logic.
 */

export interface PricingPlanConfig {
  id: string;
  name: string;
  basePrice: number;        // in INR, excluding 18% GST
  credits: number;
  period: 'pack' | 'month' | 'year' | '7 days';
  tier: 'Free' | 'PayAsYouGo' | 'Pro' | 'Agency';
  tagline: string;
  creditsLabel: string;
  highlight?: boolean;
  badge?: string;
  disabled?: boolean;
  buttonText?: string;
  features: { text: string; muted?: boolean }[];
  aliases: string[];
}

export const PRICING_CATALOG: PricingPlanConfig[] = [
  {
    id: 'free',
    name: 'Free Trial',
    basePrice: 0,
    credits: 10,
    period: '7 days',
    tier: 'Free',
    tagline: 'Explore studio capabilities.',
    creditsLabel: '10 Credits',
    disabled: true,
    buttonText: 'Current Plan',
    features: [
      { text: '10 free credits for 7 days' },
      { text: 'Access to Product Studio' },
      { text: 'Community support' },
      { text: 'Pro studios locked', muted: true },
    ],
    aliases: ['free', 'trial', 'starter']
  },
  {
    id: 'payg',
    name: 'Pay As You Go',
    basePrice: 999,
    credits: 120,
    period: 'pack',
    tier: 'PayAsYouGo',
    tagline: 'Buy as needed. Never expires.',
    creditsLabel: '120 Credits',
    buttonText: 'Buy 120 Credits',
    features: [
      { text: '120 credits top-up pack' },
      { text: 'Credits never expire' },
      { text: 'All Studios unlocked' },
      { text: 'Commercial usage rights' },
    ],
    aliases: ['payg', 'pay-as-you-go', 'pay_as_you_go', 'pack_120']
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    basePrice: 1999,
    credits: 300,
    period: 'month',
    tier: 'Pro',
    tagline: 'All premium studios unlocked.',
    creditsLabel: '300 Credits / mo',
    highlight: true,
    badge: 'Most Popular',
    buttonText: 'Subscribe Now',
    features: [
      { text: '300 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Priority generation speed' },
      { text: 'Commercial usage rights' },
    ],
    aliases: ['pro', 'pro-subscription', 'pro_subscription', 'pro-monthly']
  },
  {
    id: 'agency',
    name: 'Agency Plan',
    basePrice: 4999,
    credits: 1000,
    period: 'month',
    tier: 'Agency',
    tagline: 'High volume for agencies & teams.',
    creditsLabel: '1,000 Credits / mo',
    buttonText: 'Get Agency Plan',
    features: [
      { text: '1,000 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Multi-seat team rights' },
      { text: 'Dedicated priority support' },
    ],
    aliases: ['agency', 'agency-plan', 'agency_plan', 'agency-monthly']
  },
  {
    id: 'local-seo-10',
    name: 'Local SEO Audit Pack (10 Reports)',
    basePrice: 50,
    credits: 10,
    period: 'pack',
    tier: 'PayAsYouGo',
    tagline: 'Instant local SEO audit reports.',
    creditsLabel: '10 Reports',
    buttonText: 'Buy 10 Audits',
    features: [
      { text: '10 full local SEO audit reports' },
      { text: 'Actionable visibility insights' },
    ],
    aliases: ['local-seo-10', 'localseo10', 'localseo-10']
  }
];

/**
 * Dynamically find a plan by its ID or any configured alias (case-insensitive)
 */
export function findPlanById(planId?: string): PricingPlanConfig | undefined {
  if (!planId) return undefined;
  const target = planId.trim().toLowerCase();
  return PRICING_CATALOG.find((p) => 
    p.id.toLowerCase() === target || 
    p.aliases.some((alias) => alias.toLowerCase() === target)
  );
}

/**
 * Dynamically resolves the best matching catalog plan for a given payment amount
 * Works with both base prices and gross post-tax amounts.
 */
export function resolvePlanByAmount(amountRupees: number, gstRatePercent: number = 18): PricingPlanConfig {
  const num = Math.max(0, Number(amountRupees) || 0);

  // Paid plans sorted descending by base price
  const sortedPlans = PRICING_CATALOG
    .filter((p) => p.basePrice > 0)
    .sort((a, b) => b.basePrice - a.basePrice);

  for (const plan of sortedPlans) {
    const grossAmount = plan.basePrice * (1 + gstRatePercent / 100);
    // If payment matches or exceeds base price (or gross amount minus a small tolerance)
    if (num >= plan.basePrice || Math.abs(num - grossAmount) < 1 || Math.abs(num - plan.basePrice) < 1) {
      return plan;
    }
  }

  // Default to Pay As You Go if positive amount, or lowest paid plan
  return findPlanById('payg') || sortedPlans[sortedPlans.length - 1];
}

/**
 * Calculate dynamic credits for a custom top-up amount
 */
export function calculateDynamicCredits(amountRupees: number): number {
  const paygPlan = findPlanById('payg') || { basePrice: 999, credits: 120 };
  const ratePerRupee = paygPlan.credits / paygPlan.basePrice;
  return Math.max(1, Math.round(amountRupees * ratePerRupee));
}
