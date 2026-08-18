import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { supabase } from '../services/supabaseClient';
import { openCheckout } from '../services/razorpayService';

interface PricingModalProps {
  onClose: () => void;
}

interface PricingPlan {
  id: string;
  priceId: string;
  name: string;
  tagline: string;
  price: string;
  rawAmount: number;
  period: string;
  credits: string;
  features: { text: string; muted?: boolean }[];
  highlight: boolean;
  badge?: string;
  disabled?: boolean;
  buttonText: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    priceId: 'free',
    name: 'Free Trial',
    tagline: 'Perfect for exploring our studio capabilities.',
    price: '₹0',
    rawAmount: 0,
    period: '7 days',
    credits: '50 Credits',
    features: [
      { text: '50 free credits for 7 days' },
      { text: 'Exclusive access to Product Studio' },
      { text: 'Community support' },
      { text: 'Other studios locked for free tier', muted: true },
    ],
    highlight: false,
    disabled: true,
    buttonText: 'Current Plan'
  },
  {
    id: 'payg',
    priceId: 'payg',
    name: 'Pay As You Go',
    tagline: 'Buy credits as you need them. Nothing expires.',
    price: '₹999',
    rawAmount: 999,
    period: 'pack',
    credits: '120 Credits',
    features: [
      { text: '120 credits top-up pack' },
      { text: 'Credits never expire' },
      { text: 'All Studios & models unlocked' },
      { text: 'Commercial usage rights' },
    ],
    highlight: false,
    buttonText: 'Buy 120 Credits'
  },
  {
    id: 'pro',
    priceId: 'pro',
    name: 'Pro Subscription',
    tagline: 'All premium studios and features fully unlocked.',
    price: '₹1,999',
    rawAmount: 1999,
    period: 'month',
    credits: '300 Credits / mo',
    features: [
      { text: '300 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Priority Generation Speed' },
      { text: 'Commercial Usage Rights' },
    ],
    highlight: true,
    badge: 'Most Popular',
    buttonText: 'Subscribe Now'
  },
  {
    id: 'agency',
    priceId: 'agency',
    name: 'Agency Plan',
    tagline: 'High volume generation for agencies and teams.',
    price: '₹4,999',
    rawAmount: 4999,
    period: 'month',
    credits: '1,000 Credits / mo',
    features: [
      { text: '1,000 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Multi-seat team rights' },
      { text: 'Dedicated priority support' },
    ],
    highlight: false,
    buttonText: 'Subscribe ₹4,999'
  }
];

interface ImageModelInfo {
  name: string;
  apiModel: string;
  credits: number;
  badge: string;
  description: string;
}

const IMAGE_MODELS: ImageModelInfo[] = [
  {
    name: 'Nano Banana',
    apiModel: 'Gemini 3.1 Flash Image',
    credits: 1,
    badge: 'Standard',
    description: 'Fast, studio-quality generation for everyday marketing and ad creatives.',
  },
  {
    name: 'Nano Banana Pro',
    apiModel: 'Gemini 3 Pro Image',
    credits: 2,
    badge: 'Pro Flagship',
    description: 'Flagship model for hyper-realistic lighting, intricate textures, and text perfection.',
  },
];

const ModelCreditPicker = () => (
  <div className="mt-8 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-xs text-slate-600">
    <div className="text-center mb-5">
      <h4 className="text-base sm:text-lg font-black text-slate-900 mb-1">
        Pick your AI model per image (6 Options Offered)
      </h4>
      <p className="text-xs text-slate-500 max-w-xl mx-auto">
        Choose from 6 flagship AI models across Google, OpenAI, and Banana Vision. Spend fewer credits on drafts, choose Pro models for production assets.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
      {IMAGE_MODELS.map((model) => (
        <div key={model.name} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-[#4452FB]/40 transition-all shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4452FB] bg-[#4452FB]/10 px-2.5 py-0.5 rounded-full">
                {model.badge}
              </span>
              <span className="text-xs font-black text-slate-900">
                {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm mb-0.5">{model.name}</div>
            <div className="text-xs text-slate-400 font-semibold mb-2">{model.apiModel}</div>
            <p className="text-xs text-slate-600 leading-relaxed">{model.description}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 text-[11px] text-slate-400 text-center italic">
      * Credits are billed per output image. Multi-pose and bulk generations charge one credit set per image, not per click.
    </div>
  </div>
);

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCheckout = async (plan: PricingPlan) => {
      if (plan.id === 'free' || plan.disabled) return;
      setErrorMessage(null);
      setSuccessMessage(null);
      if (!isOnline) {
          setErrorMessage("You are offline. Cannot initiate payment.");
          return;
      }
      if (loadingPriceId) return;
      setLoadingPriceId(plan.priceId);
      
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              throw new Error("You must be logged in to purchase credits. Please sign in or register first.");
          }
          const email = user.email || 'customer@zeperai.in';

          await openCheckout({
              planId: plan.id,
              planName: plan.name,
              amount: plan.rawAmount,
              creditsText: plan.credits,
              userEmail: email,
              onSuccess: () => {
                  setSuccessMessage(`Congratulations! Your ${plan.name} has been activated! Reloading...`);
                  setTimeout(() => {
                    onClose();
                    window.location.reload();
                  }, 2000);
              },
              onError: (err) => {
                  setErrorMessage(err.message || "Payment failed or was canceled.");
                  setLoadingPriceId(null);
              },
              onDismiss: () => {
                  setLoadingPriceId(null);
              }
          });
      } catch (e: any) {
          console.error('Checkout error:', e);
          setErrorMessage(e instanceof Error ? e.message : 'Checkout failed');
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col overflow-hidden relative max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-20">
          <Icon name="close" className="w-5 h-5"/>
        </button>
        
        <main className="p-6 sm:p-10 overflow-y-auto">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span className="inline-block bg-[#4452FB]/10 text-[#4452FB] text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
              Choose your Growth Plan
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Choose the plan that fits your brand's growth. No hidden fees.
            </p>
          </div>

          {!isOnline && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs text-center font-medium">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex flex-col gap-1 shadow-xs max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 font-bold">
                      <Icon name="info" className="w-4 h-4 text-red-600 shrink-0" />
                      Checkout Issue Detected
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                      {errorMessage}
                  </p>
              </div>
          )}

          {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs max-w-2xl mx-auto animate-pulse">
                  <Icon name="check-circle" className="w-4.5 h-4.5 text-green-600 shrink-0" />
                  {successMessage}
              </div>
          )}

          {/* Cards styled identically to the landing page */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch mb-8 pt-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={
                  plan.highlight
                    ? 'bg-[#4452FB] border border-[#4452FB] rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col'
                    : 'bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col group hover:border-[#4452FB]/30'
                }
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-white text-[#4452FB] px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-xl whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-4 text-xs ${plan.highlight ? 'text-blue-100 opacity-90' : 'text-slate-500'}`}>
                  {plan.tagline}
                </p>

                <div className="mb-6">
                  <span className={`text-4xl sm:text-5xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs sm:text-sm ml-1 ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                    / {plan.period}
                  </span>
                </div>

                <div
                  className={
                    plan.highlight
                      ? 'bg-white/10 backdrop-blur-md rounded-xl p-3 mb-6 text-center border border-white/20 flex items-center justify-center gap-2'
                      : 'bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100 flex items-center justify-center gap-2'
                  }
                >
                  <Icon
                    name={plan.highlight ? 'sparkles' : 'stack'}
                    className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-white' : 'text-[#4452FB]'}`}
                  />
                  <span className={`font-bold text-xs sm:text-sm ${plan.highlight ? 'text-white' : 'text-slate-700'}`}>
                    {plan.credits}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${feature.muted ? 'opacity-60' : ''}`}
                    >
                      <Icon
                        name={feature.muted ? 'info' : 'check'}
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          feature.muted ? 'text-slate-400' : plan.highlight ? 'text-white' : 'text-green-500'
                        }`}
                      />
                      <span
                        className={
                          feature.muted
                            ? 'text-xs italic text-slate-400'
                            : plan.highlight
                            ? 'text-white text-xs sm:text-sm font-medium'
                            : 'text-slate-700 text-xs sm:text-sm'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={plan.disabled || (!isOnline && plan.id !== 'free') || loadingPriceId !== null}
                  className={
                    plan.highlight
                      ? 'w-full py-3.5 px-4 bg-white text-[#4452FB] hover:bg-blue-50 font-black rounded-xl transition-all shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
                      : 'w-full py-3.5 px-4 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl transition-all shadow-lg shadow-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed'
                  }
                >
                  {loadingPriceId === plan.priceId ? (
                    <Spinner />
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            ))}
          </div>

          <ModelCreditPicker />

        </main>
      </div>
    </div>
  );
};

export default PricingModal;
