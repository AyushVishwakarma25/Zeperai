import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { supabase } from '../services/supabaseClient';

interface PricingModalProps {
  onClose: () => void;
}

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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
  buttonVariant: 'primary' | 'secondary';
  disabled?: boolean;
  buttonText: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    priceId: 'free',
    name: 'Free Trial',
    tagline: 'Perfect for exploring our AI capabilities.',
    price: '₹0',
    rawAmount: 0,
    period: '7 days',
    credits: '50 Credits',
    features: [
      { text: '50 free credits for 7 days' },
      { text: 'Exclusive access to Product Studio' },
      { text: 'Community support' },
      { text: 'Other studios are locked for free tier', muted: true },
    ],
    highlight: false,
    buttonVariant: 'secondary',
    disabled: true,
    buttonText: 'Current Plan'
  },
  {
    id: 'payg',
    priceId: 'payg',
    name: 'Pay As You Go',
    tagline: 'Buy credits as you need them. Nothing expires.',
    price: '₹1',
    rawAmount: 250,
    period: 'credit',
    credits: 'Buy Any Amount',
    features: [
      { text: 'No subscription, no commitment' },
      { text: 'Credits never expire' },
      { text: 'All Studios & all 3 models unlocked' },
      { text: 'Commercial usage rights' },
    ],
    highlight: false,
    buttonVariant: 'secondary',
    buttonText: 'Buy 250 Credits (₹250)'
  },
  {
    id: 'pro',
    priceId: 'pro',
    name: 'Pro',
    tagline: 'All premium studios and features fully unlocked.',
    price: '₹599',
    rawAmount: 599,
    period: 'month',
    credits: '600 Credits / mo',
    features: [
      { text: '600 credits recurrent monthly' },
      { text: 'All Studios & all 3 models unlocked' },
      { text: 'Priority Generation Speed & Resolution' },
      { text: 'Commercial Usage Rights' },
    ],
    highlight: true,
    badge: 'Most Popular',
    buttonVariant: 'primary',
    buttonText: 'Subscribe ₹599'
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
    badge: 'Standard 🍌',
    description: 'Fast, studio-quality generation for everyday marketing and ad creatives.',
  },
  {
    name: 'Nano Banana Pro',
    apiModel: 'Gemini 3 Pro Image',
    credits: 2,
    badge: 'Pro Flagship 🍌',
    description: 'Flagship model for hyper-realistic lighting, intricate textures, and text perfection.',
  },
];

const ModelCreditPicker = () => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs text-slate-600 shadow-xs">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Icon name="info" className="w-4 h-4 text-primary shrink-0"/>
                6 AI Model Options (Select per Generation)
            </div>
            <span className="text-[10px] text-slate-400 italic">Save credits on drafts, choose Pro models for production</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {IMAGE_MODELS.map((model) => (
                <div key={model.name} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {model.badge}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                                {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
                            </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{model.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">{model.apiModel}</div>
                        <p className="text-[10px] text-slate-500 leading-tight">{model.description}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-2 text-[10px] text-slate-400 text-center italic">
            * Credits are billed per output image. Multi-pose and bulk generations charge one credit set per image.
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
          const isScriptLoaded = await loadRazorpayScript();
          if (!isScriptLoaded) {
              throw new Error("Failed to load Razorpay Payment Gateway. Check internet connection.");
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !session?.access_token) {
              throw new Error("You must be logged in to purchase credits. Please sign in or register first.");
          }
          const userId = user.id;
          const email = user.email || 'customer@zeperai.in';
          const token = session.access_token;

          const res = await fetch('/api/razorpay/create-order', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                planId: plan.id, 
                userId, 
                amount: plan.rawAmount 
              })
          });

          if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || "Internal Server Error during checkout.");
          }

          const { order, key_id } = await res.json();
          
          if (!key_id) {
             throw new Error("Razorpay Key ID is missing from server response.");
          }

          const options = {
              key: key_id,
              amount: order.amount,
              currency: order.currency,
              name: 'ZeperAI Studio',
              description: `${plan.name} (${plan.credits})`,
              order_id: order.id,
              prefill: {
                  email: email,
                  contact: ''
              },
              theme: {
                  color: '#4452FB'
              },
              handler: async function (response: any) {
                  setLoadingPriceId(plan.priceId);
                  try {
                      const verifyRes = await fetch('/api/razorpay/verify', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                              razorpay_order_id: response.razorpay_order_id,
                              razorpay_payment_id: response.razorpay_payment_id,
                              razorpay_signature: response.razorpay_signature,
                              userId: userId,
                              planId: plan.id,
                              amount: plan.rawAmount
                          })
                      });

                      if (!verifyRes.ok) {
                          const verifyErr = await verifyRes.json();
                          throw new Error(verifyErr.error || "Payment verification failed.");
                      }

                      setSuccessMessage(`Congratulations! Your ${plan.name} has been activated! Reloading...`);
                      setTimeout(() => {
                        onClose();
                        window.location.reload();
                      }, 2500);
                  } catch (err: any) {
                      setErrorMessage(`Signature Verification Error: ${err.message}`);
                  } finally {
                      setLoadingPriceId(null);
                  }
              },
              modal: {
                  ondismiss: function () {
                      setLoadingPriceId(null);
                  }
              }
          };

          const rzp1 = new (window as any).Razorpay(options);
          rzp1.on('payment.failed', function (response: any) {
             setErrorMessage(`Payment Failed: ${response.error.description}`);
             setLoadingPriceId(null);
          });
          rzp1.open();
      } catch (e: any) {
          console.error(e);
          setErrorMessage(e instanceof Error ? e.message : 'Checkout failed');
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-10">
          <Icon name="close" className="w-5 h-5"/>
        </button>
        
        <main className="p-4 sm:p-6 overflow-y-auto">
          <div className="text-center mb-4 sm:mb-5">
            <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1.5 uppercase tracking-wider">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Choose your Growth Plan
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
              Choose the plan that fits your brand's growth. No hidden fees.
            </p>
          </div>

          {!isOnline && (
              <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex flex-col gap-1 shadow-xs max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 font-bold">
                      <Icon name="info" className="w-4 h-4 text-red-600 shrink-0" />
                      Checkout Issue Detected
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                      {errorMessage}
                  </p>
              </div>
          )}

          {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs max-w-2xl mx-auto animate-pulse">
                  <Icon name="check-circle" className="w-4.5 h-4.5 text-green-600 shrink-0" />
                  {successMessage}
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-4">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative bg-white p-4 rounded-xl border ${
                  plan.highlight 
                    ? 'border-primary/80 shadow-md ring-1 ring-primary/40 bg-gradient-to-b from-indigo-50/30 to-white' 
                    : 'border-slate-200 hover:border-slate-300'
                } flex flex-col transition-all duration-200`}
              >
                {plan.badge && (
                  <div className="absolute -top-2.5 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-widest whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-800">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 font-medium text-[10px] ml-0.5">/ {plan.period}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mb-2.5 leading-snug">{plan.tagline}</p>

                <div className="bg-slate-100/80 rounded-lg py-1 px-2.5 mb-2.5 text-center border border-slate-200/60 flex items-center justify-center gap-1.5">
                  <Icon name={plan.highlight ? "sparkles" : "stack"} className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-extrabold text-slate-800">{plan.credits}</span>
                </div>

                <ul className="space-y-1 text-slate-600 mb-3 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={`flex items-center text-[10px] ${feature.muted ? 'text-slate-400' : ''}`}>
                      <Icon name={feature.muted ? "info" : "check-circle"} className={`w-3 h-3 mr-1.5 shrink-0 ${feature.muted ? 'text-slate-400' : plan.highlight ? 'text-primary' : 'text-green-500'}`} />
                      <span className={feature.muted ? 'italic' : plan.highlight ? 'font-medium text-slate-700' : ''}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant} 
                    fullWidth 
                    className={`!py-1.5 !text-[11px] font-bold uppercase tracking-wider ${plan.highlight ? 'shadow-xs hover:shadow-sm' : ''}`}
                    onClick={() => handleCheckout(plan)}
                    disabled={plan.disabled || (!isOnline && plan.id !== 'free') || loadingPriceId !== null}
                  >
                    {loadingPriceId === plan.priceId ? <Spinner /> : plan.buttonText}
                  </Button>
                </div>
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
