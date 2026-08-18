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
    tagline: 'Explore studio capabilities.',
    price: '₹0',
    rawAmount: 0,
    period: '7 days',
    credits: '10 Credits',
    features: [
      { text: '10 free credits for 7 days' },
      { text: 'Access to Product Studio' },
      { text: 'Community support' },
      { text: 'Pro studios locked', muted: true },
    ],
    highlight: false,
    disabled: true,
    buttonText: 'Current Plan'
  },
  {
    id: 'payg',
    priceId: 'payg',
    name: 'Pay As You Go',
    tagline: 'Buy as needed. Never expires.',
    price: '₹999',
    rawAmount: 999,
    period: 'pack',
    credits: '120 Credits',
    features: [
      { text: '120 credits top-up pack' },
      { text: 'Credits never expire' },
      { text: 'All Studios unlocked' },
      { text: 'Commercial usage rights' },
    ],
    highlight: false,
    buttonText: 'Buy 120 Credits'
  },
  {
    id: 'pro',
    priceId: 'pro',
    name: 'Pro Subscription',
    tagline: 'All premium studios unlocked.',
    price: '₹1,999',
    rawAmount: 1999,
    period: 'month',
    credits: '300 Credits / mo',
    features: [
      { text: '300 credits recurrent monthly' },
      { text: 'All Studios & models unlocked' },
      { text: 'Priority generation speed' },
      { text: 'Commercial usage rights' },
    ],
    highlight: true,
    badge: 'Most Popular',
    buttonText: 'Subscribe Now'
  },
  {
    id: 'agency',
    priceId: 'agency',
    name: 'Agency Plan',
    tagline: 'High volume for agencies & teams.',
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
    name: 'Nano Banana 2 Lite',
    apiModel: 'Cheapest & Fastest • Default for Free Accounts',
    credits: 1,
    badge: 'Fast & Free',
    description: 'Cheapest and fastest generation for simple backgrounds, basic variations, quick drafts, and high-volume iterations.',
  },
  {
    name: 'Nano Banana 2',
    apiModel: 'Balanced Quality & Speed • Standard for Paid Accounts',
    credits: 1,
    badge: 'Standard Quality',
    description: 'Balanced studio quality, speed, and cost. General-purpose workhorse for product photography, lifestyle scenes, and ads.',
  },
  {
    name: 'Nano Banana Pro',
    apiModel: 'Flagship Photorealism • Pro for Paid Accounts',
    credits: 2,
    badge: 'Pro Flagship',
    description: 'Highest-quality flagship AI for complex compositions, high-end advertising, intricate textures, and text precision.',
  },
];

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [modalTab, setModalTab] = useState<'plans' | 'models'>('plans');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col overflow-hidden relative max-h-[96vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-20"
          aria-label="Close modal"
        >
          <Icon name="close" className="w-4 h-4"/>
        </button>
        
        {/* Modal Main Content Container */}
        <main className="p-3.5 sm:p-5 flex flex-col justify-between overflow-y-auto">
          
          {/* Header & Tab Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#4452FB]/10 text-[#4452FB] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Transparent Pricing
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Choose your Growth Plan
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Scale your ecommerce visual production with instant credits and unlocked AI studios.
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
              <button
                onClick={() => setModalTab('plans')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  modalTab === 'plans'
                    ? 'bg-white text-[#4452FB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plans & Pricing
              </button>
              <button
                onClick={() => setModalTab('models')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  modalTab === 'models'
                    ? 'bg-white text-[#4452FB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>AI Model Rates</span>
                <span className="text-[9px] px-1 py-0.2 bg-[#4452FB]/10 text-[#4452FB] rounded-full font-extrabold">6</span>
              </button>
            </div>
          </div>

          {/* Network and Error/Success Alerts */}
          {!isOnline && (
              <div className="mb-2 bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-xs text-center font-medium">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          {errorMessage && (
              <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs">
                  <Icon name="info" className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-slate-700 text-xs">{errorMessage}</span>
              </div>
          )}

          {successMessage && (
              <div className="mb-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <Icon name="check-circle" className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{successMessage}</span>
              </div>
          )}

          {/* TAB 1: Plans View */}
          {modalTab === 'plans' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              {pricingPlans.map((plan) => {
                const isPro = plan.highlight;
                return (
                  <div
                    key={plan.id}
                    className={
                      isPro
                        ? 'bg-[#4452FB] border border-[#4452FB] rounded-2xl p-3.5 sm:p-4 shadow-xl relative flex flex-col justify-between text-white'
                        : 'bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between hover:border-[#4452FB]/30'
                    }
                  >
                    <div>
                      {plan.badge && (
                        <div className="absolute -top-2.5 right-3 bg-white text-[#4452FB] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs">
                          {plan.badge}
                        </div>
                      )}

                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className={`text-sm font-bold ${isPro ? 'text-white' : 'text-slate-900'}`}>
                          {plan.name}
                        </h3>
                      </div>
                      <p className={`text-[10px] line-clamp-1 mb-2 ${isPro ? 'text-blue-100/90' : 'text-slate-400'}`}>
                        {plan.tagline}
                      </p>

                      <div className="mb-2 flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-black font-mono ${isPro ? 'text-white' : 'text-slate-900'}`}>
                          {plan.price}
                        </span>
                        <span className={`text-[10px] font-semibold ${isPro ? 'text-blue-100' : 'text-slate-400'}`}>
                          / {plan.period}
                        </span>
                      </div>

                      {/* Credits Pill */}
                      <div
                        className={
                          isPro
                            ? 'bg-white/15 backdrop-blur-xs rounded-xl py-1.5 px-2.5 mb-2.5 text-center border border-white/20 flex items-center justify-center gap-1.5'
                            : 'bg-slate-50 rounded-xl py-1.5 px-2.5 mb-2.5 text-center border border-slate-100 flex items-center justify-center gap-1.5'
                        }
                      >
                        <Icon
                          name={isPro ? 'sparkles' : 'stack'}
                          className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-white' : 'text-[#4452FB]'}`}
                        />
                        <span className={`font-bold text-xs ${isPro ? 'text-white' : 'text-slate-800'}`}>
                          {plan.credits}
                        </span>
                      </div>

                      {/* Feature Bullet List */}
                      <ul className="space-y-1.5 mb-3">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className={`flex items-center gap-1.5 ${feature.muted ? 'opacity-50' : ''}`}
                          >
                            <Icon
                              name={feature.muted ? 'info' : 'check'}
                              className={`w-3 h-3 shrink-0 ${
                                feature.muted ? 'text-slate-400' : isPro ? 'text-white' : 'text-emerald-500'
                              }`}
                            />
                            <span
                              className={
                                feature.muted
                                  ? 'text-[10.5px] italic text-slate-400 line-clamp-1'
                                  : isPro
                                  ? 'text-white text-[10.5px] font-medium line-clamp-1'
                                  : 'text-slate-600 text-[10.5px] line-clamp-1'
                              }
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-100/20">
                      <button
                        onClick={() => handleCheckout(plan)}
                        disabled={plan.disabled || (!isOnline && plan.id !== 'free') || loadingPriceId !== null}
                        className={
                          isPro
                            ? 'w-full py-2 px-3 bg-white text-[#4452FB] hover:bg-blue-50 font-bold rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed'
                            : plan.disabled
                            ? 'w-full py-2 px-3 bg-slate-100 text-slate-400 font-semibold rounded-xl text-xs cursor-default flex items-center justify-center'
                            : 'w-full py-2 px-3 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl transition-all shadow-xs text-xs flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed'
                        }
                      >
                        {loadingPriceId === plan.priceId ? (
                          <Spinner />
                        ) : (
                          plan.buttonText
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: AI Model Rates View */}
          {modalTab === 'models' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {IMAGE_MODELS.map((model) => (
                  <div key={model.name} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between hover:border-[#4452FB]/40 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#4452FB] bg-[#4452FB]/10 px-2 py-0.5 rounded-md">
                          {model.badge}
                        </span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mb-0.5">{model.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mb-1.5">{model.apiModel}</div>
                      <p className="text-[10.5px] text-slate-600 leading-snug">{model.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 text-center italic pt-1">
                * Credits are billed per generated image. Multi-pose and batch variations bill according to selected model tier.
              </div>
            </div>
          )}

          {/* Modal Footer Micro-note */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Icon name="shield-check" className="w-3 h-3 text-emerald-500" />
              Secure 256-bit Razorpay Checkout • Instant Credit Allocation
            </span>
            <span className="hidden sm:inline">
              GST invoices with input tax credit auto-generated in account
            </span>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;

