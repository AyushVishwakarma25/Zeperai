import React from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import { PricingProductSchema } from '../../components/StructuredData.js';
import { Icon } from '../../components/ui/Icon.js';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// Plans: Free / Pay As You Go / Pro. Three options, no decision fatigue.
// ─────────────────────────────────────────────────────────────

interface PlanFeature {
  text: string;
  muted?: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  creditsLabel: string;
  features: PlanFeature[];
  cta: string;
  highlight?: boolean;
  badge?: string;
}

// 1 credit ≈ ₹1. Real API cost per model is unchanged — only the
// denomination scaled up so plan totals read as generously as competitors'.
const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    tagline: 'Perfect for exploring our studio capabilities.',
    price: '₹0',
    cadence: '/ 7 days',
    creditsLabel: '10 Credits',
    features: [
      { text: '10 free credits for 7 days' },
      { text: 'Exclusive access to Product Studio' },
      { text: 'Community support' },
      { text: 'Other studios locked for free tier', muted: true },
    ],
    cta: 'Try for Free',
  },
  {
    id: 'payg',
    name: 'Pay As You Go',
    tagline: 'Buy credits as you need them. Nothing expires.',
    price: '₹999',
    cadence: '/ pack',
    creditsLabel: '120 Credits',
    features: [
      { text: '120 credits top-up pack' },
      { text: 'Credits never expire' },
      { text: 'All Studios & models unlocked' },
      { text: 'Commercial usage rights' },
    ],
    cta: 'Buy 120 Credits',
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    tagline: 'All premium studios and features fully unlocked.',
    price: '₹1,999',
    cadence: '/ month',
    creditsLabel: '300 Credits / mo',
    features: [
      { text: '300 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Priority Generation Speed & Resolution' },
      { text: 'Commercial Usage Rights' },
    ],
    cta: 'Subscribe Now',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'agency',
    name: 'Agency Plan',
    tagline: 'High volume generation for agencies and enterprise teams.',
    price: '₹4,999',
    cadence: '/ month',
    creditsLabel: '1,000 Credits / mo',
    features: [
      { text: '1,000 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Multi-seat team rights' },
      { text: 'Dedicated priority support' },
    ],
    cta: 'Get Agency Plan',
  },
];

// ─────────────────────────────────────────────────────────────
// Models: choices mapped to real Gemini API image models
// ─────────────────────────────────────────────────────────────

interface ImageModel {
  id: string;
  name: string;
  apiModel: string;
  credits: number;
  badge: string;
  description: string;
}

const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'nano-banana-2-lite',
    name: 'Nano Banana 2 Lite',
    apiModel: 'Cheapest & Fastest • Default for Free Accounts',
    credits: 1,
    badge: 'Fast & Free',
    description: 'Cheapest and fastest generation for simple backgrounds, basic variations, quick drafts, and high-volume iterations.',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    apiModel: 'Balanced Quality & Speed • Standard for Paid Accounts',
    credits: 1,
    badge: 'Standard Quality',
    description: 'Balanced studio quality, speed, and cost. General-purpose workhorse for product photography, lifestyle scenes, and ads.',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    apiModel: 'Flagship Photorealism • Pro for Paid Accounts',
    credits: 2,
    badge: 'Pro Flagship',
    description: 'Highest-quality flagship AI for complex compositions, high-end advertising, intricate textures, and text precision.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Pricing | ZeperAi Studio"
        description="Simple, transparent pricing for ZeperAi Studio's AI creative platform. Choose credits or subscriptions that fit your brand's growth, with zero hidden fees."
        canonicalUrl="https://zeperai.in/pricing"
      />
      <PricingProductSchema />
      <div className="min-h-screen bg-stone-50/40 text-zinc-900 font-manrope selection:bg-[#C8CEFE]">
        <LandingHeader />

        <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-3 block">
              Predictable Investment · Zero Hidden Fees
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-zinc-950 font-lora mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Choose the tier that matches your creative velocity. Recharge on-demand or unlock unlimited studio capabilities with zero lock-in.
            </p>
          </div>

          {/* Four plans: 3 Neutral Surfaces + 1 Dark Contrast Recommended Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {PLANS.map((plan) => {
              const isRecommended = Boolean(plan.highlight);
              return (
                <div
                  key={plan.id}
                  className={
                    isRecommended
                      ? 'bg-zinc-950 text-white border border-zinc-800 rounded-3xl p-7 sm:p-8 shadow-xl relative flex flex-col transform md:-translate-y-3 transition-all'
                      : 'bg-white text-zinc-900 border border-stone-200/90 rounded-3xl p-7 sm:p-8 shadow-xs hover:border-stone-300 transition-all flex flex-col'
                  }
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#4452FB] text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                      {plan.badge || 'Recommended'}
                    </div>
                  )}

                  <div className="mb-4">
                    <h2 className={`text-xl font-bold font-manrope tracking-tight mb-1.5 ${isRecommended ? 'text-white' : 'text-zinc-950'}`}>
                      {plan.name}
                    </h2>
                    <p className={`text-xs min-h-[32px] leading-relaxed ${isRecommended ? 'text-zinc-400' : 'text-stone-500'}`}>
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="mb-1 flex items-baseline">
                    <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-manrope ${isRecommended ? 'text-white' : 'text-zinc-950'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ml-1.5 font-normal ${isRecommended ? 'text-zinc-400' : 'text-stone-500'}`}>
                      {plan.cadence}
                    </span>
                  </div>

                  {plan.id !== 'free' ? (
                    <div className={`text-xs font-medium mb-6 ${isRecommended ? 'text-zinc-400' : 'text-stone-500'}`}>
                      + 18% GST (SAC 998313)
                    </div>
                  ) : (
                    <div className="mb-6 h-4" />
                  )}

                  {/* Credits Highlight */}
                  <div
                    className={
                      isRecommended
                        ? 'bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-6 text-center flex items-center justify-center'
                        : 'bg-stone-50 border border-stone-200/80 rounded-xl p-3 mb-6 text-center flex items-center justify-center'
                    }
                  >
                    <span className={`font-bold text-sm tracking-wide ${isRecommended ? 'text-white' : 'text-zinc-800'}`}>
                      {plan.creditsLabel}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8 flex-1 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-3 ${feature.muted ? (isRecommended ? 'text-zinc-400' : 'text-stone-500') : ''}`}
                      >
                        <Icon
                          name={feature.muted ? 'info' : 'check'}
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            feature.muted
                              ? (isRecommended ? 'text-zinc-400' : 'text-stone-500')
                              : isRecommended
                              ? 'text-emerald-400'
                              : 'text-zinc-800'
                          }`}
                        />
                        <span
                          className={
                            feature.muted
                              ? 'text-xs italic'
                              : isRecommended
                              ? 'text-zinc-200 text-sm'
                              : 'text-stone-700 text-sm'
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate('/signup')}
                    className={
                      isRecommended
                        ? 'w-full py-3.5 px-4 bg-[#4452FB] hover:bg-[#3641C9] text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer'
                        : plan.id === 'free'
                        ? 'w-full py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-zinc-900 border border-stone-200 font-bold rounded-xl transition-all text-sm cursor-pointer'
                        : 'w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-xs text-sm cursor-pointer'
                    }
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Model picker & Generation Economics */}
          <div className="mt-24 max-w-6xl mx-auto border-t border-stone-200 pt-16">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2 block">
                ZeperAI Engine Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-normal font-lora text-zinc-950 mb-3">
                Select your generation precision per image
              </h2>
              <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Choose from fine-tuned diffusion models tailored for product photography, lifestyle scenes, and high-impact advertising assets. Spend fewer credits on drafting, upgrade to Pro for production deliverables.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {IMAGE_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs hover:border-stone-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                      {model.badge}
                    </span>
                    <span className="text-sm font-extrabold text-zinc-950 font-manrope">
                      {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-950 text-base mb-1">{model.name}</h3>
                  <p className="text-xs text-stone-500 font-medium mb-3">{model.apiModel}</p>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{model.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-stone-500">
              Credits are billed strictly per generated creative asset. Background removals, variations, and high-res exports are clearly itemized before generation.
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};
