
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { supabase } from '../services/supabaseClient';
import { env } from '../utils/env';

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

const pricingPlans = [
  {
    id: 'free',
    priceId: 'free',
    name: 'Free Trial',
    description: 'Perfect for exploring our AI capabilities.',
    price: '₹0',
    period: '7 days',
    credits: '10 Credits',
    features: [
      '10 Credits on signup',
      '7 Days free trial period',
      'Exclusive access to Product Studio',
      'Community support',
      'Other Studios locked (Upgrade to use)',
    ],
    highlight: false,
    buttonVariant: 'secondary' as const,
    disabled: true,
    buttonText: 'Current Plan'
  },
  {
    id: 'pay-as-you-go',
    priceId: 'pay-as-you-go',
    name: 'Pay As You Go Pro',
    description: 'All premium studios and features fully unlocked.',
    price: '₹499',
    period: 'month',
    credits: '100 Credits / month',
    features: [
      '100 Credits instantly every month',
      'Unlock all Pro features & Studios',
      'Unlocks UGC, Fashion, Remix and Festivals',
      'Higher resolution options fully enabled',
      'Priority generation speed & support',
    ],
    highlight: true,
    buttonVariant: 'primary' as const,
    buttonText: 'Subscribe Now'
  }
];

const CreditInfo = () => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full text-sm text-slate-600 flex flex-col justify-center">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm uppercase tracking-wide">
            <Icon name="info" className="w-4 h-4 mr-2 text-primary"/>
            Estimated Costs
        </h4>
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Standard Generation</span> 
                <span className="font-bold text-slate-900">1 Credit</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Batch Processing (per image)</span> 
                <span className="font-bold text-slate-900">1 Credit</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Background Removal Pro</span> 
                <span className="font-bold text-slate-900">2 Credits</span>
            </div>
        </div>
    </div>
);

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
      if (priceId === 'free') return;
      setErrorMessage(null);
      setSuccessMessage(null);
      if (!isOnline) {
          setErrorMessage("You are offline. Cannot initiate payment.");
          return;
      }
      if (loadingPriceId) return;
      setLoadingPriceId(priceId);
      
      try {
          const isScriptLoaded = await loadRazorpayScript();
          if (!isScriptLoaded) {
              throw new Error("Failed to load Razorpay Payment Gateway. Check internet connection.");
          }
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              throw new Error("You must be logged in to purchase credits. Please sign in or register first.");
          }
          const userId = user.id;
          const email = user.email || 'customer@zeperai.in';

          const res = await fetch('/api/razorpay/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ planId: 'pay-as-you-go', userId, amount: 499 })
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
              description: 'Pay As You Go Pro Subscription (100 Credits / mo)',
              order_id: order.id,
              prefill: {
                  email: email,
                  contact: ''
              },
              theme: {
                  color: '#4452FB'
              },
              handler: async function (response: any) {
                  setLoadingPriceId(priceId);
                  try {
                      const verifyRes = await fetch('/api/razorpay/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              razorpay_order_id: response.razorpay_order_id,
                              razorpay_payment_id: response.razorpay_payment_id,
                              razorpay_signature: response.razorpay_signature,
                              userId: userId
                          })
                      });

                      if (!verifyRes.ok) {
                          const verifyErr = await verifyRes.json();
                          throw new Error(verifyErr.error || "Payment verification failed.");
                      }

                      setSuccessMessage("Congratulations! Your Pay As You Go Pro Plan has been activated! Reloading...");
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-10">
          <Icon name="close" className="w-5 h-5"/>
        </button>
        
        <main className="p-6 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <div className="text-center mb-10">
            <span className="inline-block bg-accent-green/10 text-accent-green text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide underline underline-offset-4 decoration-skip-ink-auto">Flexible Credits</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
              Choose your Growth Plan
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
                No monthly subscriptions. Buy credits when you need them or start for free. All Pro features are unlocked with any credit purchase.
            </p>
          </div>

          {!isOnline && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm flex flex-col gap-1.5 shadow-sm max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 font-bold">
                      <Icon name="info" className="w-4 h-4 text-red-600 shrink-0" />
                      Checkout Issue Detected
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                      {errorMessage}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-red-100 flex flex-col gap-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Are you in AI Studio block preview?</span>
                      <span>If you are using the embedded preview tab, security policies (iframe sandbox) block Razorpay's overlay form. Click the <strong className="text-primary">"Open in new tab"</strong> button at the top right of your preview frame or use the <strong>"Share Preview"</strong> live URL to test Razorpay flawlessly!</span>
                  </div>
              </div>
          )}

          {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-3 shadow-sm max-w-2xl mx-auto animate-pulse">
                  <Icon name="check-circle" className="w-5 h-5 text-green-600 shrink-0" />
                  {successMessage}
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-10 max-w-3xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative bg-white p-6 rounded-2xl border ${plan.highlight ? 'border-primary shadow-xl ring-1 ring-primary scale-[1.05] z-10' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'} flex flex-col transition-all duration-200`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-widest whitespace-nowrap">
                    Best Value
                  </div>
                )}
                <div className="mb-5">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{plan.description}</p>
                </div>
                
                <div className="mb-6 flex items-baseline">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 font-medium text-sm ml-1">/ {plan.period}</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100 flex items-center justify-center">
                    <Icon name="sparkles" className="w-5 h-5 mr-3 text-primary animate-pulse" />
                    <span className="text-lg font-black text-slate-800">{plan.credits}</span>
                </div>

                <ul className="space-y-3 text-sm text-slate-600 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="check-circle" className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-slate-400'}`} />
                      <span className={plan.highlight ? 'font-medium text-slate-700' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant} 
                    fullWidth 
                    className={`!py-3 !text-sm font-bold uppercase tracking-wider ${plan.highlight ? 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30' : ''}`}
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={(!isOnline && plan.id !== 'free') || loadingPriceId !== null}
                  >
                    {loadingPriceId === plan.priceId ? <Spinner /> : plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
             <CreditInfo />
          </div>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;
