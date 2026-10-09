import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/ui/Icon.js';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  credits: string;
  description: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '₹0',
    period: '7 days',
    credits: '10 credits',
    description: 'Test all creative studio engines with your first product image.',
    features: [
      '10 free generation credits',
      'Studio, UGC, and Meta formats',
      'Standard generation queue',
      'Full product geometry lock',
    ],
    ctaText: 'Start free trial',
  },
  {
    id: 'payg',
    name: 'Pay As You Go',
    price: '₹999',
    period: 'one-time',
    credits: '120 credits',
    description: 'Credits never expire. Ideal for seasonal drops and periodic refreshes.',
    features: [
      '120 high-resolution credits',
      'Credits never expire',
      'Commercial usage license',
      'Multi-format export (4:5, 9:16, 1:1)',
    ],
    ctaText: 'Buy credit pack',
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    price: '₹1,999',
    period: 'per month',
    credits: '300 credits / mo',
    description: 'Designed for scaling D2C brands testing weekly ad creatives.',
    popular: true,
    features: [
      '300 monthly credits included',
      'Priority rendering queue',
      'Brand Intelligence kit locking',
      'Full commercial IP rights',
      'Dedicated email support',
    ],
    ctaText: 'Start Pro subscription',
  },
  {
    id: 'agency',
    name: 'Agency Scale',
    price: '₹4,999',
    period: 'per month',
    credits: '1,000 credits / mo',
    description: 'High-volume production for multi-brand agencies and large catalogs.',
    features: [
      '1,000 monthly credits included',
      'Multi-brand workspaces',
      'Shopify catalog batch integration',
      'Fastest generation throughput',
      'Dedicated account strategist',
    ],
    ctaText: 'Start Agency plan',
  },
];

export const PricingPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 sm:mb-18">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#0B0B0F] text-[#0B0B0F] font-mono text-[10px] font-bold tracking-widest uppercase mb-3">
            <span>Transparent Pricing</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#0B0B0F] tracking-tight leading-[1.08]">
            Predictable plans. Zero shoot overhead.
          </h2>
          <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-4 leading-relaxed">
            Start free, scale on pay-as-you-go, or subscribe for high-volume weekly ad testing.
          </p>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="self-start md:self-auto text-xs font-mono font-bold text-[#0B0B0F] hover:text-[#3155FF] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View full pricing comparison</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* 4 Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
              tier.popular
                ? 'bg-[#080E2A] text-white border border-[#1C2758] shadow-xl relative'
                : 'bg-white text-[#0B0B0F] border border-[#E8E8E5] shadow-xs hover:border-[#0B0B0F]/30'
            }`}
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between pb-4 border-b mb-5 border-inherit/20">
                <span className="font-satoshi font-bold text-base">
                  {tier.name}
                </span>
                {tier.popular ? (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9BB1FF] bg-[#3155FF]/20 border border-[#3155FF]/40 px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[#6B6B73] uppercase tracking-wider">
                    {tier.credits}
                  </span>
                )}
              </div>

              {/* Price Display */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-editorial text-3xl sm:text-4xl font-normal tracking-tight">
                    {tier.price}
                  </span>
                  <span className={`text-xs font-mono ${tier.popular ? 'text-[#8C9BDB]' : 'text-[#6B6B73]'}`}>
                    / {tier.period}
                  </span>
                </div>
                <p className={`font-dmsans text-xs mt-2 leading-relaxed ${tier.popular ? 'text-[#B3C2FF]' : 'text-[#6B6B73]'}`}>
                  {tier.description}
                </p>
              </div>

              {/* Features List */}
              <div className={`space-y-2.5 pt-5 border-t border-inherit/20 mb-8 text-xs font-dmsans ${tier.popular ? 'text-[#D0DBFF]' : 'text-[#0B0B0F]'}`}>
                {tier.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.popular ? 'text-emerald-400' : 'text-emerald-600'}`}
                    />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div>
              <button
                onClick={() => navigate('/login')}
                className={`w-full h-11 rounded-full font-satoshi font-medium text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                  tier.popular
                    ? 'bg-white hover:bg-slate-100 text-[#080E2A] font-semibold shadow-sm'
                    : 'bg-[#0B0B0F] hover:bg-[#1A1A22] text-white'
                }`}
              >
                {tier.ctaText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
