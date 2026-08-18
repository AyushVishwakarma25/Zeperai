import React from 'react';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';
import { Icon } from '../../components/ui/Icon';
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
    creditsLabel: '50 Credits',
    features: [
      { text: '50 free credits for 7 days' },
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
    id: 'nano-banana',
    name: 'Nano Banana',
    apiModel: 'Gemini 3.1 Flash Image',
    credits: 1,
    badge: 'Standard',
    description: 'Fast, high-quality studio generation for everyday marketing and ad creatives.',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    apiModel: 'Gemini 3 Pro Image',
    credits: 2,
    badge: 'Pro Flagship',
    description: 'Flagship model for hyper-realistic lighting, intricate textures, and text perfection.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE]">
      <LandingHeader />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600">
            Choose the plan that fits your brand's growth. No hidden fees.
          </p>
        </div>

        {/* Four plans: Free / Pay As You Go / Pro / Agency */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlight
                  ? 'bg-[#4452FB] border border-[#4452FB] rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-6'
                  : 'bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col group hover:border-[#4452FB]/30'
              }
            >
              {plan.badge && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-[#4452FB] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <p className={`mb-6 text-sm ${plan.highlight ? 'text-blue-100 opacity-90' : 'text-slate-500'}`}>
                {plan.tagline}
              </p>

              <div className="mb-8">
                <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                  {plan.cadence}
                </span>
              </div>

              <div
                className={
                  plan.highlight
                    ? 'bg-white/10 backdrop-blur-md rounded-xl p-3 mb-6 text-center border border-white/20 flex items-center justify-center'
                    : 'bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100 flex items-center justify-center'
                }
              >
                <Icon
                  name={plan.highlight ? 'sparkles' : 'stack'}
                  className={`w-5 h-5 mr-2 ${plan.highlight ? 'text-white' : 'text-[#4452FB]'}`}
                />
                <span className={`font-bold ${plan.highlight ? 'text-white text-lg' : 'text-slate-700'}`}>
                  {plan.creditsLabel}
                </span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 ${feature.muted ? 'text-slate-400' : ''}`}
                  >
                    <Icon
                      name={feature.muted ? 'info' : 'check'}
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        feature.muted ? '' : plan.highlight ? 'text-white' : 'text-green-500'
                      }`}
                    />
                    <span
                      className={
                        feature.muted
                          ? 'text-xs italic'
                          : plan.highlight
                          ? 'text-white text-sm'
                          : 'text-slate-700 text-sm'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className={
                  plan.highlight
                    ? 'w-full py-4 px-4 bg-white text-[#4452FB] hover:bg-blue-50 font-black rounded-xl transition-all shadow-xl'
                    : 'w-full py-4 px-4 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl transition-all shadow-lg shadow-slate-200'
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Model picker: 6 options, credits scale with real generation cost */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Pick your AI model per image (6 Options Offered)</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Choose from 6 flagship AI models across Google, OpenAI, and Banana Vision. Spend fewer credits on drafts, choose Pro models for production assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMAGE_MODELS.map((model) => (
              <div
                key={model.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-[#4452FB]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4452FB] bg-[#4452FB]/10 px-2.5 py-1 rounded-full">
                    {model.badge}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">{model.name}</h4>
                <p className="text-xs text-slate-400 font-semibold mb-3">{model.apiModel}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{model.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 italic">
            * Credits are billed per output image. Multi-pose and bulk generations charge one credit set per image, not per click.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
